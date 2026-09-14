# Card Generation Mechanism

This document defines how a Source Photo becomes a Battle Card.

比喻：照片是食材，VLM 是幫忙描述食材的人，Rule Tables 是食譜，Card Art Provider 是畫師。畫師可以畫得很好看，但不能決定 HP、ATK、DEF 或技能。

## Current Decision

The Card Generation Mechanism is deterministic game logic.

AI models can suggest visible tags or draw art, but game-facing card data must come from project rules.

```text
Source Photo
  -> Photo Analysis
  -> Visible Semantic Tags
  -> VLM Creative Roll
  -> Character Name Seed + User Candidate Choice + System Story Pick
  -> Generation Profile
  -> Card Generation Mechanism
  -> Character Spec
  -> Card Stat Line
  -> Prompt Profile
  -> Card Art Provider
  -> Battle Card
```

## Inputs

- `Photo Analysis`: brightness, contrast, saturation, edge density, center focus, symmetry, palette, text signal, and other non-identifying signals.
- `Visible Semantic Tags`: visible non-sensitive subject and world tags from VLM or manual calibration.
- `VLM Creative Roll`: VLM-generated non-sensitive roleplay candidates and auto fields from expression, pose, scene, OCR, capture context, and event context.
- `Skill Material Profile`: normalized VLM/user/context material allowed to influence skill identity, pattern weighting, names, and display text. It cannot directly create Skill Effect Specs or battle numbers.
- `Character Name Seed`: short user-entered name used as the required card-name core; defaults to `路人`.
- `User Candidate Choice`: one selected candidate from each 4-choice field: `ageImpression`, `values`, and `weakness`. Values candidates carry one narrative sentence, not VLM tags.
- `System Story Pick`: one `storyEvent` candidate selected by seed from VLM-generated fictional origin events.
- `Generation Profile`: user-selected or default card direction, such as combat style, values, capture context, form branch, and image provider.
- `Capture Context`: optional time, place type, and consent-based Location Reference transformed into creative tags.
- `Questionnaire Context`: selected VLM candidates, VLM-auto reviewable fields, optional user-declared fields, and safe defaults.
- `Event Context`: optional season, holiday, festival, or local event motifs derived from capture time/location or user input. It is normalized into an `Event Combat Profile` before it affects rules.
- `Reroll Seed`: deterministic variation seed used to produce another version without changing the source inputs.

Sensitive context can only enter through explicit user-supplied fields. It must not be inferred from the photo.

The current questionnaire schema is implemented in:

```text
src/card-generation/questionnaire-schema.js
```

This schema defines VLM Creative Roll policy, four-option user-choice fields, VLM-auto fields, defaults, Character Spec mapping, prompt hooks, and stat/skill rule hooks.

The first candidate builder is implemented in:

```text
src/card-generation/questionnaire-candidates.js
POST /api/questionnaire-candidates
```

It asks the local VLM for roleplay candidates when available, then normalizes the result through a safe fallback builder. This endpoint does not select for the user and does not write final stats.

## Outputs

- `Character Spec`: canonical fictional character definition.
- `Archetype`: fantasy role, element, accent color, and stat bias.
- `Rarity`: game tier and stat budget modifier.
- `Stats`: internal stats such as power, speed, guard, focus, and luck.
- `Card Stat Line`: visible HP, ATK, DEF, COST, and level.
- `Traits`: short game-facing tags.
- `Skill Kit`: two Active Skills, two Battle Traits, and one Ultimate Skill derived from Character Spec. Details live in [SKILL_SYSTEM.md](./SKILL_SYSTEM.md).
- `Skill Taxonomy`: original project skill kinds, card tab presentation metadata, trigger glow tokens, and animation profiles attached to each Skill Kit entry.
- `Combat Core`: the confirmed v1 player-facing battle identity: `攻擊型`, `防禦型`, or `支援型`. Details live in [SKILL_SYSTEM.md](./SKILL_SYSTEM.md).
- `Progression State`: saved growth data for a Battle Card, including max level 100, XP, skill ranks, blocking branch choices, Evolution Milestones, visual evolution tier, Evolution Art Jobs, generated evolved art, and battle record.
- `Event Combat Profile`: deterministic event/season rule result that can modify stats, traits, archetype bias, skill words, lore, and card-art motifs.
- `Prompt Profile`: controlled card-art prompt hooks for the image provider.

The generated image cannot change these outputs after the fact.

## Rule Stages

1. Normalize allowed inputs.
2. Generate VLM Creative Roll candidates and VLM-auto fields.
3. Lock Character Name Seed, User Candidate Choices, and System Story Pick into Questionnaire Context.
4. Create a deterministic seed from photo hash, profile fields, selected candidates, and reroll count.
5. Choose `Archetype` from Photo Analysis plus explicit profile bias.
6. Choose `Rarity` from visual signal strength plus seeded variation.
7. Create internal stats, then apply profile modifiers, including place, time, season, and public-holiday event modifiers.
8. Derive the visible Card Stat Line from internal stats, rarity, skills, and level.
9. Derive Traits and Skills from the same Character Spec inputs, including `Event Combat Profile`.
10. Apply Skill Taxonomy rules to classify skill kinds, card tabs, trigger glow tokens, and animation profiles.
11. Create initial `Progression State` for the playable Battle Card.
12. Build the Prompt Profile for the selected Character Form Branch.
13. Send Source Photo plus prompt to a Card Art Provider.
14. Assemble the playable Battle Card.
15. On later progression, create blocking Skill Branch choices with `buildSkillBranchOptions()` before creating an Evolution Art Job. The v1 option source rule is D: one `combatVariant` option and one photo/VLM/story `characterHook` option.
16. Build an Evolution Prompt Profile and send it to a Card Art Provider.
17. Save accepted evolved card art as a new art revision before marking Visual Evolution complete.

## Implemented Prompt Hook Stage

The first extracted module is now:

```text
src/card-generation/character-spec.js
```

It owns the implemented stage:

```text
Photo Analysis + Generation Profile + Capture Moment
  -> buildCharacterSpecContexts()
  -> contexts.capture / contexts.questionnaire / contexts.vision / contexts.event
  -> promptProfile
  -> formatPromptHooksForImageModel()
  -> image-provider prompt block
```

Automatic context acquisition now feeds this stage:

```text
JPEG EXIF GPS/time or Browser Geolocation
  -> POST /api/capture-context
  -> Google Geocoding / Google Places when GOOGLE_MAPS_API_KEY exists
  -> internal location-hook fallback when GOOGLE_MAPS_API_KEY is missing
  -> Nager.Date US public holiday lookup using generation-time current date
  -> generationProfile.captureContext + generationProfile.eventContext
```

Automatic context acquisition may set place, time, address reference, Google Maps reference, and event motifs. `captureContext` may use photo/camera time, but the MVP `eventContext` uses the real-world current date and US public holidays. It can feed VLM Creative Roll as context and can feed deterministic Rule Tables through `Event Combat Profile`, but it must not infer sensitive creative context or let AI directly decide stats.

Holiday selection rule:

```text
worldEventMoment.localDate
  -> Nager.Date PublicHolidays/{year}/US
  -> exact date match
  -> if matched: holiday Event Combat Profile
  -> if no match: season-only Event Combat Profile
```

This means the system does not invent a holiday when today is not a US public holiday.

No-key fallback rule: do not create Google Maps URLs from coordinates. The fallback should create prompt-safe atmosphere hooks only, so the user does not need to leave the game flow.

Current interface:

```js
buildCharacterSpecContexts({
  analysis,
  generationProfile,
  captureMoment
});
```

Output:

- `sourceRefs`: photo hash, subject focus, and image-provider location policy.
- `acquisitionMethods`: GPS, address, Google Maps place, and holiday source definitions.
- `contexts.capture`: capture time, timezone, location reference, place type, time mood, and `locationCreativeTags`.
- `contexts.questionnaire`: selected age impression, selected values, selected weakness, selected story event, VLM role motif, personality motif, specialty, combat style, card mood, and signature item.
- `contexts.vision`: Target Subject, visible person cues, world context, Text Seed, semantic tags, palette, and metrics.
- `contexts.event`: local date, season, holiday tags, local event tags, and `eventCreativeTags`.
- `derived.eventCombatProfile`: event/season rule result used by stats, traits, skills, lore, and image prompt motifs.
- `promptProfile`: only the safe hooks allowed to reach Gemini/OpenAI/Comfy.

The existing stats, rarity, traits, legacy two-button `skills`, and combat-role functions still live in `app.js`. The first `Skill Kit` generator now lives in `src/card-generation/skill-kit.js` and writes `skillKit` beside the legacy `skills` adapter. Moving the remaining rule functions behind card-generation modules is a later step.

## Provider Boundary

`Card Art Provider` is a replaceable adapter.

Current providers:

- `gemini`: Google Gemini / Nano Banana image generation.
- `openai`: OpenAI image edit/generation.
- `comfy`: local ComfyUI historical adapter.
- `local`: Canvas fallback inside the browser.

Provider output is judged by image acceptance gates:

- likeness or feature transfer
- visible semantic tag usage
- believable anatomy or branch-specific structure
- no fake card UI or unreadable card text
- speed and cost

Provider output is not allowed to decide stats, skills, rarity, cost, or battle effects.

## Character Spec Contract

The canonical field definition is recorded in [CHARACTER_SPEC.md](./CHARACTER_SPEC.md).

The important split is:

```text
Character Spec
  -> stores allowed source contexts and rule-derived fields

Prompt Profile
  -> contains only the safe hooks allowed to affect image generation
```

Exact location, exact address, raw Google Maps URL, unapproved sensitive context, and hidden identity assumptions should not be sent directly to image providers. Convert them into reviewed creative hooks first.

## Module Plan

Current first module:

```text
src/card-generation/rule-data.js
```

This module contains Rule Tables only: archetypes, rarity, labels, profile modifiers, event/season combat profiles, weakness rules, and occupation rules.

Next modules should be split in this order:

```text
src/card-generation/character-spec.js
  -> done first pass for contexts, acquisition methods, and promptProfile
  -> next pass should absorb archetype, rarity, stats, traits, and remaining legacy skill/card-stat glue

src/card-generation/skill-kit.js
  -> done first pass for Skill Material Profile, 2 active skills, 2 battle traits, 1 ultimate skill, effectSpec validation, and legacy `skills` adapter

src/card-generation/skill-taxonomy.js
  -> done first pass for original skill kind rules, Skill Kit card tabs, trigger glow tokens, and animation profiles

src/card-generation/prompt-profile.js
  -> optional later split if promptProfile grows too large

src/card-art/provider-client.js
  -> browser call to /api/card-art

server-side card-art provider module
  -> gemini/openai/comfy provider adapters behind one interface
```

The interface we want callers to learn should stay small:

```js
generateCharacterSpec({ analysis, generationProfile, reroll })
buildCardArtPrompt({ characterSpec, analysis })
generateCardArt({ provider, sourceImage, promptProfile })
```

This keeps UI, game rules, and image providers from mixing together.
