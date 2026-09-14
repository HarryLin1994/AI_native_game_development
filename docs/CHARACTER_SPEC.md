# Character Spec

`Character Spec` is the canonical fictional character definition for one generated Battle Card.

比喻：它像角色的身份證加角色設定書。照片、問卷、VLM、地點時間、節慶事件都是材料；Character Spec 是整理後的角色 DNA。卡圖、數值、技能、養成都要讀它，但不能各自亂猜。

## Purpose

`Character Spec` must answer:

- Who is this fictional character?
- What allowed inputs shaped them?
- Which fields affect stats, skills, rarity, and traits?
- Which fields are allowed to influence image generation?
- Which raw inputs should not be stored or sent to image providers?

It is not:

- raw Source Photo storage
- face recognition result
- image-provider prompt only
- battle state or save slot
- AI-decided stat sheet

## Source Contexts

The MVP should build Character Spec from four context groups.

### 1. Capture Context

Capture Context comes from the photo moment.

Allowed fields:

- `capturedAt`: exact or approximate capture timestamp.
- `timezone`: user/device timezone.
- `locationReference`: optional Google Maps reference, place id, coordinates, or maps URL.
- `locationGranularity`: `none`, `coarse`, `place`, or `exact`.
- `placeType`: cafe, arcade, park, school, beach, transit, stadium, home-like, office, etc.
- `locationCreativeTags`: model-safe creative location tags used for rules and prompts.

Important rule:

Exact GPS, exact address, or precise Google Maps URL is privacy-sensitive. It should not be sent to image providers by default. Convert it first into creative tags, such as:

```text
arcade district, neon indoor venue, riverside park, rainy downtown street, beach sunset
```

Use exact location only when the user explicitly allows it for generation.

### Capture Acquisition Methods

The implemented method registry lives in [`src/card-generation/character-spec.js`](../src/card-generation/character-spec.js).

| Data | Primary Method | Fallbacks | Raw Field | Prompt Hook Rule |
|---|---|---|---|---|
| Precise GPS | `browser_geolocation` | `photo_exif_gps`, `manual_coordinates` | `latitude`, `longitude`, `accuracyMeters` | Never pass exact coordinates by default. Convert to `locationCreativeTags`. |
| Address | `google_reverse_geocoding` | `manual_address` | `formattedAddress`, `addressComponents` | Convert to coarse place atmosphere or place type. |
| Google Maps place | `google_places_nearby_search` | `google_places_text_search`, `google_place_details`, `manual_google_maps_url` | `placeId`, `displayName`, `formattedAddress`, `types`, `googleMapsUri` | Convert `types` and safe place summary into location hooks. |
| Holiday / festival | `public_holiday_api` | `google_calendar_holiday_adapter`, `manual_event_context`, `local_static_date_motifs` | `date`, `countryCode`, `regionCode`, `holidayName`, `types` | MVP uses current real-world US date. Use only reviewable, non-sensitive `eventCreativeTags`. |

Concrete sources:

- Browser GPS: `navigator.geolocation.getCurrentPosition()` after browser permission. Source: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
- Address from GPS: Google Geocoding API reverse geocoding with `latlng`. Source: https://developers.google.com/maps/documentation/geocoding/requests-reverse-geocoding
- Google Maps place: Google Places API Nearby Search to resolve the nearest place from GPS, then Place Details/Text Search later if we need richer manual search. Sources: https://developers.google.com/maps/documentation/places/web-service/nearby-search, https://developers.google.com/maps/documentation/places/web-service/text-search and https://developers.google.com/maps/documentation/places/web-service/place-details
- Public holiday source: Nager.Date public holiday endpoint `GET /api/v3/PublicHolidays/{Year}/{CountryCode}`. Current MVP fixes `CountryCode=US` and uses the real-world current browser date for holiday lookup. Source: https://date.nager.at/Api

Current MVP implementation automatically resolves non-questionnaire context:

```text
Uploaded JPEG
  -> try EXIF capturedAt + EXIF GPS
  -> if no EXIF GPS, use Browser Geolocation after permission
  -> POST /api/capture-context
  -> Google reverse geocoding when GOOGLE_MAPS_API_KEY is set
  -> Google Places Nearby Search when GOOGLE_MAPS_API_KEY is set
  -> no Google Maps URL fallback when no Maps key exists
  -> Nager.Date US public holiday lookup using generation-time current date
  -> promptProfile hooks
```

Holiday policy for MVP:

- `captureContext.localDate` may come from EXIF or camera capture time.
- `eventContext.localDate` uses the real-world current browser date at generation time.
- `eventContext.countryCode` is fixed to `US`.
- Old uploaded photos do not pull old holidays into the generated character.

When `GOOGLE_MAPS_API_KEY` is missing, the system must keep generation moving with internal location hooks only. It must not create a Google Maps URL fallback because that pushes the user into extra map operations.

Automatic Context Acquisition must not fill sensitive context, political view, sexuality, religion, health, identity, or similar User-Declared Fields. Non-sensitive character setup fields may come from VLM Creative Roll or VLM-auto reviewable fields.

### 2. Questionnaire Context

Questionnaire Context is the character setup result. It can include User-selected VLM candidates, VLM-auto reviewable fields, explicit user-provided fields, and safe defaults.

Allowed fields:

- `characterName`: user-entered name core for generated Battle Card title, default `路人`; not identity verification.
- `ageImpression`: fictional age band selected from 4 VLM candidates, not detected age.
- `realWorldRole`: visible role motif generated by VLM, not a verified real job.
- `personality`: roleplay personality motif generated from visible energy, not real psychology.
- `specialty`: visible non-sensitive skills, interests, strengths, habits, or talents suggested by VLM.
- `storyEvents`: fictional origin event selected by system seed from 4 VLM candidates.
- `values`: fictional fighting motivation selected from 4 VLM candidates, not real belief detection; each values candidate should include one narrative sentence.
- `weakness`: battle tradeoff selected from 4 VLM candidates, not a real flaw judgment.
- `signatureItem`: visible item, symbol, prop, or motif suggested by VLM/OCR.
- `sensitiveCreativeContext`: only explicit user-provided sensitive context.

Important rule:

Questionnaire fields can affect stats, skills, traits, and card art only after they are selected, reviewed, or normalized into Character Spec. VLM candidates that were not selected must not affect the generated card.

### 3. Vision Context

Vision Context comes from local VLM/OCR/photo analysis.

Allowed fields:

- `targetSubject`: one centered or selected Target Subject.
- `personAppearance`: hair shape, expression cue, pose, accessory, outfit silhouette, face visibility.
- `worldContext`: scene, activity, object, lighting, composition, visual signal.
- `textSeed`: visible text or manually entered text.
- `palette`: dominant colors.
- `photoMetrics`: brightness, contrast, saturation, edge density, center focus, symmetry.
- `visibleSemanticTags`: approved or reviewable tags.

Important rule:

Vision Context can describe visible pixels only. It must not infer identity, age, gender, ethnicity, sexuality, politics, religion, health, wealth, or personality truth.

### 4. Event Context

Event Context comes from capture time and location.

Allowed fields:

- `localDate`: date in the capture timezone.
- `season`: spring, summer, autumn, winter, rainy season, dry season, etc.
- `holidayTags`: public holiday or festival tags.
- `localEventTags`: public local event tags when known and allowed.
- `eventCreativeTags`: model-safe creative motifs, such as lantern festival, summer fireworks, harvest moon, year-end market.
- `eventSource`: user-provided, calendar adapter, or manual.

Important rule:

Event Context should be reviewable. Political, religious, health, tragedy, disaster, protest, or other sensitive event context should not be applied automatically. Use it only when the user explicitly chooses it.

Event Context affects character generation through deterministic rule tables, not through free AI judgment. The MVP normalizes season and public holiday tags into an `Event Combat Profile`, which can affect:

- card-art motif and lighting
- stat modifiers
- archetype bias
- traits
- skill words and skill text
- lore

## Proposed Schema

```json
{
  "schema": "photo-character-lab.character.v1",
  "id": "preview-123",
  "source": "real_photo_local_analysis",
  "identityPolicy": "no_identity_recognition",
  "sourceRefs": {
    "sourcePhotoHash": "hash-for-reroll-and-dedupe",
    "sourcePhotoStored": false,
    "subjectFocus": "center_primary_subject",
    "imageProviderLocationPolicy": "prompt_hooks_only_by_default"
  },
  "acquisitionMethods": {
    "preciseGps": {
      "primary": "browser_geolocation",
      "promptPolicy": "never_pass_exact_by_default"
    },
    "address": {
      "primary": "google_reverse_geocoding",
      "promptPolicy": "convert_to_coarse_location_hooks"
    },
    "googleMapsPlace": {
      "primary": "google_places_nearby_search",
      "promptPolicy": "convert_to_place_type_and_location_hooks"
    },
    "holiday": {
      "primary": "public_holiday_api",
      "promptPolicy": "use_reviewable_non_sensitive_event_hooks"
    }
  },
  "consent": {
    "photoUse": true,
    "locationUse": "coarse",
    "sensitiveContextUse": "explicit_only",
    "imageProviderUse": "allowed"
  },
  "sourceRefs": {
    "sourcePhotoHash": "hash-for-reroll-and-dedupe",
    "sourcePhotoStored": false,
    "subjectFocus": "center_primary_subject"
  },
  "contexts": {
    "capture": {
      "capturedAt": "2026-09-13T12:00:00-07:00",
      "timezone": "America/Los_Angeles",
      "locationGranularity": "coarse",
      "placeType": "arcade",
      "locationCreativeTags": ["neon indoor venue", "arcade district"]
    },
    "questionnaire": {
      "characterName": "昶志",
      "ageImpression": "young_adult",
      "realWorldRole": "designer",
      "personality": ["playful", "focused"],
      "specialty": ["rhythm games", "visual design"],
      "storyEvents": ["won a local arcade challenge"],
      "values": ["growth"],
      "weakness": "overthinks under pressure",
      "signatureItem": "headphones"
    },
    "vision": {
      "targetSubject": "center_primary_subject",
      "personAppearance": ["curly hair", "headband", "open-mouth expression"],
      "worldContext": ["arcade room", "neon signs", "holding controller"],
      "textSeed": "ARCADE",
      "visibleSemanticTags": ["retro arcade", "party energy"]
    },
    "event": {
      "season": "autumn",
      "holidayTags": ["new_year_s_day"],
      "localEventTags": [],
      "eventCreativeTags": ["new year countdown glow", "fresh-start motif"]
    }
  },
  "derived": {
    "characterFormBranch": "humanlike",
    "eventCombatProfile": {
      "key": "winter.new_year",
      "label": "新年覺醒",
      "season": "winter",
      "eventKey": "new_year",
      "statMods": {
        "guard": 2,
        "focus": 2,
        "luck": 4,
        "speed": 2
      },
      "trait": "新年覺醒",
      "skillWord": "新星"
    },
    "archetype": "volt",
    "element": "Voltage",
    "rarity": "SR",
    "stats": {
      "power": 58,
      "speed": 82,
      "guard": 44,
      "focus": 65,
      "luck": 61
    },
    "cardStatLine": {
      "hp": 4965,
      "atk": 3968,
      "def": 2350,
      "cost": 8,
      "level": 1
    },
    "traits": ["Voltage", "高速輪廓", "霓虹訊號"],
    "skills": [
      {
        "name": "連閃式",
        "type": "strike",
        "power": 61
      }
    ],
    "combatRole": {
      "role": "Tempo Duelist",
      "primaryStat": "speed"
    }
  },
  "promptProfile": {
    "identityHooks": ["face shape", "headband", "headphones"],
    "locationHooks": ["neon indoor venue"],
    "eventHooks": [],
    "storyHooks": ["local arcade challenge"],
    "avoidRules": ["no text", "no UI", "no card frame"]
  }
}
```

## Field Responsibility

| Field Group | Affects Rules | Affects Image | Must Be User-Provided | Can Be Model-Suggested |
|---|---:|---:|---:|---:|
| Photo metrics | yes | yes | no | yes |
| Visible Semantic Tags | yes | yes | no | yes, reviewable |
| Age Impression | yes | yes | yes | no |
| Real-World Role | yes | yes | yes | no |
| Personality | yes | yes | yes | no |
| Specialty | yes | yes | yes | no |
| Story Events | yes | yes | yes | no |
| Location Reference | maybe | maybe | yes for exact | no hidden exact inference |
| Location Creative Tags | yes | yes | no | yes, reviewable |
| Event Context | yes, through Event Combat Profile | yes | no, unless sensitive | yes, reviewable |
| Sensitive Creative Context | maybe | maybe | yes | no |

## Prompt Policy

Everything in `promptProfile` may be passed to Card Art Providers.

Raw private fields should not be passed by default:

- exact coordinates
- home address
- raw Google Maps URL
- unapproved sensitive context
- hidden identity assumptions

Use transformed prompt hooks instead:

```text
exact coordinates -> coastal night market atmosphere
office address -> modern office interior
Google Maps place -> arcade district neon ambience
holiday date -> lantern festival motif + deterministic Event Combat Profile
```

## Implemented Module Interface

The current code implements the first Character Spec context module:

```text
src/card-generation/character-spec.js
```

Interface:

```js
buildCharacterSpecContexts({
  analysis,
  generationProfile,
  captureMoment
});

formatPromptHooksForImageModel(promptProfile);
```

It returns:

```js
{
  acquisitionMethods,
  sourceRefs,
  contexts: {
    capture,
    questionnaire,
    vision,
    event
  },
  promptProfile
}
```

`app.js` now calls this before image generation. The card-art prompt receives a block shaped like:

```text
CHARACTER SPEC PROMPT HOOKS:
IDENTITY / FEATURE HOOKS: ...
CHARACTER SETUP HOOKS: ...
LOCATION ATMOSPHERE HOOKS: ...
EVENT / SEASON HOOKS: ...
SOURCE PHOTO WORLD HOOKS: ...
STORY HOOKS: ...
AVOID / PRIVACY RULES: ...
```

比喻：`contexts` 是倉庫裡的原料架，`promptProfile` 是交給畫師的料理單。畫師只拿料理單，不直接拿精確 GPS 或地址。

## Future Module Interface Target

The `character-spec` module should eventually expose one deep interface:

```js
generateCharacterSpec({
  analysis,
  questionnaireContext,
  captureContext,
  eventContext,
  reroll
});
```

It should return:

```js
{
  characterSpec,
  cardStatLine,
  promptProfile
}
```

The caller should not need to know which rule tables were used internally.
