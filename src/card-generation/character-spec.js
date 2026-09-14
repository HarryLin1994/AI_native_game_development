export const CONTEXT_ACQUISITION_METHODS = Object.freeze({
  preciseGps: Object.freeze({
    primary: "browser_geolocation",
    alternatives: Object.freeze(["photo_exif_gps", "manual_coordinates"]),
    rawFields: Object.freeze(["latitude", "longitude", "accuracyMeters"]),
    promptPolicy: "never_pass_exact_by_default"
  }),
  address: Object.freeze({
    primary: "google_reverse_geocoding",
    alternatives: Object.freeze(["manual_address"]),
    rawFields: Object.freeze(["formattedAddress", "addressComponents"]),
    promptPolicy: "convert_to_coarse_location_hooks"
  }),
  googleMapsPlace: Object.freeze({
    primary: "google_places_nearby_search",
    alternatives: Object.freeze(["google_places_text_search", "google_place_details", "manual_google_maps_url"]),
    rawFields: Object.freeze(["placeId", "displayName", "formattedAddress", "types", "googleMapsUri"]),
    promptPolicy: "convert_to_place_type_and_location_hooks"
  }),
  holiday: Object.freeze({
    primary: "public_holiday_api",
    alternatives: Object.freeze(["google_calendar_holiday_adapter", "manual_event_context", "local_static_date_motifs"]),
    rawFields: Object.freeze(["date", "countryCode", "regionCode", "holidayName", "types"]),
    promptPolicy: "use_reviewable_non_sensitive_event_hooks"
  })
});

export const LOCATION_USE_LEVELS = Object.freeze(["none", "coarse", "place", "exact"]);

export const EVENT_CONTEXT_SOURCES = Object.freeze({
  none: "none",
  runtimeLocalDate: "runtime_local_date",
  manual: "manual_event_context",
  publicHolidayApi: "public_holiday_api",
  googleCalendarHolidayAdapter: "google_calendar_holiday_adapter",
  localStaticDateMotifs: "local_static_date_motifs"
});

const PLACE_TYPE_HOOKS = Object.freeze({
  neutral: ["neutral training gate", "clean character-stage backdrop"],
  indoor: ["indoor venue atmosphere", "controlled interior lighting"],
  street: ["urban street energy", "city movement backdrop"],
  school: ["campus courtyard motif", "study-and-training atmosphere"],
  office: ["modern office command-room motif", "structured tactical workspace"],
  park: ["green park air", "open outdoor calm"],
  beach: ["coastal light", "sea-breeze battle-stage motif"],
  mountain: ["mountain ridge air", "highland endurance motif"],
  transit: ["station transfer flow", "motion-lines travel atmosphere"],
  arcade: ["arcade neon venue", "retro game-floor energy"],
  stadium: ["stadium spotlight", "competitive arena energy"],
  cafe: ["warm cafe corner", "small social venue atmosphere"]
});

const TIME_MOOD_HOOKS = Object.freeze({
  clear: ["clear everyday light"],
  sunny: ["sunlit action glow"],
  rainy: ["rain-slick atmosphere", "soft reflective surfaces"],
  night: ["night-scene contrast", "rim-lit silhouette"],
  dusk: ["dusk gradient sky", "threshold-hour mood"],
  neon: ["neon ambience", "colored arcade rim light"],
  quiet: ["quiet focused mood"],
  chaotic: ["busy energy", "dynamic background rhythm"]
});

const GOOGLE_PLACE_TYPE_HOOKS = Object.freeze({
  amusement_center: ["arcade-like entertainment venue", "game-floor energy"],
  tourist_attraction: ["landmark-adventure atmosphere"],
  restaurant: ["warm restaurant interior"],
  cafe: ["warm cafe corner"],
  park: ["green public park"],
  beach: ["coastal public space"],
  stadium: ["stadium spotlight"],
  school: ["campus atmosphere"],
  university: ["campus atmosphere"],
  office: ["office district workspace"],
  shopping_mall: ["mall concourse glow"],
  train_station: ["station transfer flow"],
  subway_station: ["underground transit energy"],
  airport: ["travel-terminal scale"],
  gym: ["training-room energy"],
  lodging: ["hotel-lobby atmosphere"],
  museum: ["gallery exhibit atmosphere"]
});

const SEASON_HOOKS = Object.freeze({
  spring: ["fresh season color", "light green accent"],
  summer: ["summer brightness", "warm festival energy"],
  autumn: ["autumn palette", "harvest-season warmth"],
  winter: ["winter glow", "cool air contrast"]
});

const SAFE_STATIC_DATE_MOTIFS = Object.freeze({
  "01-01": {
    holidayTags: ["new_year"],
    eventCreativeTags: ["new year countdown glow", "fresh-start motif"]
  },
  "10-31": {
    holidayTags: ["costume_night"],
    eventCreativeTags: ["costume-night playful motif", "spooky arcade accent"]
  },
  "12-31": {
    holidayTags: ["year_end"],
    eventCreativeTags: ["year-end countdown glow", "celebration confetti energy"]
  }
});

const DEFAULT_PROMPT_AVOID_RULES = Object.freeze([
  "do not reveal exact GPS coordinates",
  "do not reveal street address",
  "do not draw a Google Maps UI",
  "do not render readable map labels",
  "do not add unapproved sensitive traits",
  "do not infer politics, religion, sexuality, health, ethnicity, or identity",
  "no card frame, no UI, no stat panel, no readable text"
]);

export function buildCharacterSpecContexts({ analysis = null, generationProfile = {}, captureMoment = null } = {}) {
  const capture = normalizeCaptureContext(generationProfile.captureContext, generationProfile, captureMoment);
  const questionnaire = normalizeQuestionnaireContext(generationProfile);
  const vision = normalizeVisionContext(analysis);
  const event = normalizeEventContext(generationProfile.eventContext, capture);
  const promptProfile = buildPromptProfile({
    capture,
    questionnaire,
    vision,
    event,
    characterFormBranch: generationProfile.characterFormBranch
  });

  return {
    acquisitionMethods: CONTEXT_ACQUISITION_METHODS,
    sourceRefs: {
      sourcePhotoHash: analysis?.hash ?? null,
      sourcePhotoStored: false,
      subjectFocus: vision.targetSubject,
      imageProviderLocationPolicy: "prompt_hooks_only_by_default"
    },
    contexts: {
      capture,
      questionnaire,
      vision,
      event
    },
    promptProfile
  };
}

export function normalizeCaptureContext(input = {}, generationProfile = {}, captureMoment = null) {
  const safeInput = input ?? {};
  const placeType = safeString(safeInput.placeType || generationProfile.placeType || "neutral", 32);
  const timeMood = safeString(safeInput.timeMood || generationProfile.timeMood || "clear", 32);
  const locationReference = normalizeLocationReference(safeInput.locationReference ?? safeInput);
  const capturedAt = safeInput.capturedAt || captureMoment?.capturedAt || null;
  const timezone = safeInput.timezone || captureMoment?.timezone || "unknown";
  const localDate = safeInput.localDate || captureMoment?.localDate || deriveLocalDate(capturedAt);
  const locationGranularity = normalizeLocationGranularity(
    safeInput.locationGranularity || locationReference.locationGranularity || inferLocationGranularity(locationReference)
  );
  const locationUse = normalizeLocationUse(safeInput.locationUse || locationGranularity);
  const locationCreativeTags = uniqueStrings([
    ...normalizeStringList(safeInput.locationCreativeTags),
    ...derivePlaceTypeHooks(placeType),
    ...deriveGooglePlaceHooks(locationReference),
    ...deriveLocationNameHooks(locationReference),
    ...deriveTimeMoodHooks(timeMood)
  ]).slice(0, 12);

  return {
    capturedAt,
    timezone,
    localDate,
    locationUse,
    locationGranularity,
    placeType,
    placeTypeLabel: safeInput.placeTypeLabel || generationProfile.placeTypeLabel || placeType,
    timeMood,
    timeMoodLabel: safeInput.timeMoodLabel || generationProfile.timeMoodLabel || timeMood,
    locationReference,
    locationCreativeTags,
    acquisition: {
      gps: locationReference.acquisition.gpsMethod,
      address: locationReference.acquisition.addressMethod,
      googleMaps: locationReference.acquisition.googleMapsMethod
    },
    acquisitionStatus: copyPlainObject(safeInput.acquisitionStatus),
    promptPolicy: {
      passExactLocationToImageProvider: Boolean(locationReference.allowExactForPrompt),
      defaultImageProviderLocationUse: locationReference.allowExactForPrompt ? locationUse : "coarse",
      protectedRawFields: ["coordinates", "formattedAddress", "googleMapsUrl", "googlePlaceId"]
    }
  };
}

export function normalizeLocationReference(input = {}) {
  const coordinates = normalizeCoordinates(input.coordinates ?? input.gps ?? input);
  const formattedAddress = safeString(input.formattedAddress || input.address || "", 180);
  const googlePlaceId = safeString(input.googlePlaceId || input.placeId || "", 120);
  const googleMapsUrl = sanitizeUrl(input.googleMapsUrl || input.googleMapsUri || input.mapsUrl || "");
  const displayName = safeString(input.displayName || input.placeName || input.name || "", 96);
  const placeTypes = normalizeStringList(input.placeTypes || input.types).slice(0, 8);
  const allowExactForPrompt = input.allowExactForPrompt === true;
  const gpsMethod = coordinates ? safeString(input.gpsMethod || input.acquisitionMethod || "browser_geolocation", 48) : "none";
  const addressMethod = formattedAddress ? safeString(input.addressMethod || "google_reverse_geocoding", 48) : "none";
  const googleMapsMethod =
    googlePlaceId || googleMapsUrl || displayName || placeTypes.length
      ? safeString(input.googleMapsMethod || input.mapsMethod || "google_places_text_search", 48)
      : "none";

  return {
    locationGranularity: normalizeLocationGranularity(input.locationGranularity || inferLocationGranularity({ coordinates, googlePlaceId, googleMapsUrl, displayName })),
    allowExactForPrompt,
    coordinates,
    accuracyMeters: toFiniteNumber(input.accuracyMeters ?? input.accuracy),
    formattedAddress,
    addressComponents: Array.isArray(input.addressComponents) ? input.addressComponents.slice(0, 12).map(copyPlainObject) : [],
    googlePlaceId,
    googleMapsUrl,
    displayName,
    placeTypes,
    acquisition: {
      gpsMethod,
      addressMethod,
      googleMapsMethod
    },
    promptSafeSummary: createPromptSafeLocationSummary({
      displayName,
      formattedAddress,
      placeTypes,
      allowExactForPrompt
    })
  };
}

export function normalizeQuestionnaireContext(generationProfile = {}) {
  const userContext = generationProfile.userSuppliedContext ?? {};
  const selectedCandidates =
    generationProfile.selectedQuestionnaireCandidates ??
    generationProfile.userSelectedVlmCandidates ??
    generationProfile.questionnaireSelections ??
    {};
  const vlmAutoFields = generationProfile.vlmAutoFields ?? {};
  const specialty = uniqueStrings([
    ...readCandidateValues(vlmAutoFields.specialty),
    ...normalizeStringList(userContext.specialty),
    ...normalizeStringList(generationProfile.featureTags),
    ...splitPromptList(generationProfile.features)
  ]).slice(0, 8);
  const storyEvents = uniqueStrings([
    readCandidateValue(selectedCandidates.storyEvent ?? selectedCandidates.storyEvents),
    ...normalizeStringList(userContext.storyEvents),
    generationProfile.backstory
  ]).slice(0, 5);
  const selectedAgeCandidate = selectedCandidates.ageImpression;
  const selectedValueCandidate = selectedCandidates.values ?? selectedCandidates.value;
  const selectedAgeImpression = readCandidateValue(selectedAgeCandidate);
  const selectedValue = readCandidateValue(selectedValueCandidate);
  const selectedValueNarrative = readCandidateNarrative(selectedValueCandidate);
  const selectedWeakness = readCandidateValue(selectedCandidates.weakness);
  const fallbackValues = selectedValue ? [] : normalizeStringList(userContext.values || generationProfile.valueKey || "growth");

  return {
    characterName: safeString(generationProfile.characterName || userContext.characterName || "路人", 24),
    ageImpression: safeString(selectedAgeImpression || generationProfile.ageBand || "young_adult", 32),
    ageLabel: safeString(readCandidateLabel(selectedAgeCandidate) || generationProfile.ageLabel || "young adult", 32),
    realWorldRole: safeString(readCandidateValue(vlmAutoFields.realWorldRole) || generationProfile.occupation || userContext.realWorldRole || "", 80),
    personality: uniqueStrings([
      ...readCandidateValues(vlmAutoFields.personality),
      ...normalizeStringList(userContext.personality)
    ]).slice(0, 6),
    specialty,
    storyEvents,
    values: uniqueStrings([
      selectedValue,
      ...fallbackValues
    ]).slice(0, 4),
    valueLabel: safeString(readCandidateLabel(selectedValueCandidate) || generationProfile.valueLabel || selectedValue || "", 40),
    valueNarrative: safeString(selectedValueNarrative || userContext.valueNarrative || "", 140),
    weakness: safeString(selectedWeakness || generationProfile.weakness || userContext.weakness || "", 80),
    signatureItem: safeString(readCandidateValue(vlmAutoFields.signatureItem) || generationProfile.signatureItem || userContext.signatureItem || "", 48),
    combatStyle: safeString(readCandidateValue(vlmAutoFields.combatStyle) || generationProfile.combatStyle || "auto", 32),
    cardMood: safeString(readCandidateValue(vlmAutoFields.cardMood) || generationProfile.cardMood || "cinematic", 32),
    sensitiveCreativeContext: normalizeStringList(userContext.sensitiveCreativeContext).slice(0, 4),
    sourcePolicy: {
      userSelectedVlmCandidates: ["ageImpression", "values", "weakness"],
      systemSelectedVlmCandidates: ["storyEvent"],
      vlmAutoReviewable: ["realWorldRole", "personality", "specialty", "combatStyle", "signatureItem", "cardMood"],
      userDeclaredOnly: ["sensitiveCreativeContext"],
      modelMaySuggestOnlyIfReviewable: ["non-sensitive visible/context roleplay fields"]
    }
  };
}

export function normalizeVisionContext(analysis = null) {
  const groups = analysis?.visibleSemanticTagGroups ?? {};
  const personAppearance = uniqueStrings([
    ...normalizeStringList(groups.personAppearance),
    ...normalizeStringList(groups.clothing),
    ...normalizeStringList(groups.state)
  ]).slice(0, 12);
  const worldContext = uniqueStrings([
    ...normalizeStringList(groups.scene),
    ...normalizeStringList(groups.activity),
    ...normalizeStringList(groups.object),
    ...normalizeStringList(groups.lighting),
    ...normalizeStringList(groups.composition),
    ...normalizeStringList(groups.visualSignal)
  ]).slice(0, 18);
  const palette = (analysis?.palette?.length ? analysis.palette : analysis?.averageColor ? [analysis.averageColor] : [])
    .slice(0, 5)
    .map((color) => ({
      name: safeString(color.label || "color", 32),
      hex: safeString(color.hex || "", 16),
      weight: toFiniteNumber(color.weight)
    }));

  return {
    targetSubject: safeString(analysis?.subjectFocus || "center_primary_subject", 64),
    personAppearance,
    worldContext,
    textSeed: safeString(analysis?.textSeed || "", 48),
    visibleSemanticTags: normalizeStringList(analysis?.visibleSemanticTags).slice(0, 30),
    visibleSemanticTagGroups: copyTagGroups(groups),
    semanticTagSource: safeString(analysis?.semanticTagSource || "none", 48),
    palette,
    photoMetrics: normalizeMetrics(analysis?.metrics),
    sourcePolicy: {
      visiblePixelsOnly: true,
      noIdentityRecognition: true,
      noSensitiveInference: true
    }
  };
}

export function normalizeEventContext(input = {}, captureContext = {}) {
  const safeInput = input ?? {};
  const localDate = safeString(safeInput.localDate || captureContext.localDate || "", 16);
  const season = safeString(safeInput.season || deriveSeason(localDate, captureContext.locationReference?.coordinates), 16);
  const staticMotifs = getSafeStaticDateMotifs(localDate);
  const holidayTags = uniqueStrings([
    ...normalizeStringList(safeInput.holidayTags),
    ...staticMotifs.holidayTags
  ]).slice(0, 8);
  const localEventTags = normalizeStringList(safeInput.localEventTags).slice(0, 8);
  const eventCreativeTags = uniqueStrings([
    ...normalizeStringList(safeInput.eventCreativeTags),
    ...deriveSeasonHooks(season),
    ...staticMotifs.eventCreativeTags
  ]).slice(0, 12);
  const eventSource = safeString(
    safeInput.eventSource || safeInput.source || (localDate ? EVENT_CONTEXT_SOURCES.runtimeLocalDate : EVENT_CONTEXT_SOURCES.none),
    64
  );

  return {
    localDate,
    season,
    countryCode: safeString(safeInput.countryCode || "", 12),
    regionCode: safeString(safeInput.regionCode || "", 12),
    holidayTags,
    localEventTags,
    eventCreativeTags,
    eventSource,
    publicHolidays: Array.isArray(safeInput.publicHolidays) ? safeInput.publicHolidays.slice(0, 6).map(copyPlainObject) : [],
    acquisition: {
      primaryHolidaySource: CONTEXT_ACQUISITION_METHODS.holiday.primary,
      alternatives: [...CONTEXT_ACQUISITION_METHODS.holiday.alternatives]
    },
    promptPolicy: {
      sensitiveEventsRequireExplicitOptIn: true,
      publicHolidayTagsAreReviewable: true
    }
  };
}

export function buildPromptProfile({ capture, questionnaire, vision, event, characterFormBranch = "humanlike" }) {
  const branchHooks =
    characterFormBranch === "animalized.cat"
      ? [
          "cat protagonist first",
          "transfer source-person cues through accessories, expression, color motifs, outfit motifs, and attitude"
        ]
      : ["preserve source-reference facial likeness", "preserve believable source body proportion"];
  const identityHooks = uniqueStrings([
    ...branchHooks,
    ...vision.personAppearance,
    questionnaire.signatureItem,
    ...questionnaire.specialty
  ]).slice(0, 12);
  const questionnaireHooks = uniqueStrings([
    questionnaire.characterName && `character name ${questionnaire.characterName}`,
    questionnaire.ageLabel && `age direction ${questionnaire.ageLabel}`,
    questionnaire.realWorldRole && `role motif ${questionnaire.realWorldRole}`,
    questionnaire.valueLabel && `value motif ${questionnaire.valueLabel}`,
    questionnaire.valueNarrative && `value narrative ${questionnaire.valueNarrative}`,
    questionnaire.weakness && `tradeoff motif ${questionnaire.weakness}`,
    questionnaire.signatureItem && `signature item ${questionnaire.signatureItem}`
  ]).slice(0, 8);
  const worldHooks = uniqueStrings([
    ...vision.worldContext,
    vision.textSeed && `visible text motif ${vision.textSeed}`
  ]).slice(0, 14);
  const locationHooks = uniqueStrings(capture.locationCreativeTags).slice(0, 12);
  const eventHooks = uniqueStrings([
    ...event.eventCreativeTags,
    ...event.holidayTags.map((tag) => `holiday motif ${tag}`),
    ...event.localEventTags.map((tag) => `local event motif ${tag}`)
  ]).slice(0, 12);
  const storyHooks = uniqueStrings(questionnaire.storyEvents).slice(0, 6);

  return {
    schema: "photo-character-lab.prompt-profile.v1",
    providerInputMode: "source_image_plus_prompt_hooks",
    characterFormBranch,
    identityHooks,
    questionnaireHooks,
    locationHooks,
    eventHooks,
    storyHooks,
    worldHooks,
    avoidRules: [...DEFAULT_PROMPT_AVOID_RULES],
    protectedRawInputs: ["exact coordinates", "formatted address", "raw Google Maps URL", "Google Place ID", "unapproved sensitive context"],
    sourcePolicies: {
      location: capture.promptPolicy,
      event: event.promptPolicy,
      vision: vision.sourcePolicy,
      questionnaire: questionnaire.sourcePolicy
    }
  };
}

export function formatPromptHooksForImageModel(promptProfile) {
  if (!promptProfile) return "";
  return [
    "CHARACTER SPEC PROMPT HOOKS:",
    formatHookLine("IDENTITY / FEATURE HOOKS", promptProfile.identityHooks),
    formatHookLine("CHARACTER SETUP HOOKS", promptProfile.questionnaireHooks),
    formatHookLine("LOCATION ATMOSPHERE HOOKS", promptProfile.locationHooks),
    formatHookLine("EVENT / SEASON HOOKS", promptProfile.eventHooks),
    formatHookLine("SOURCE PHOTO WORLD HOOKS", promptProfile.worldHooks),
    formatHookLine("STORY HOOKS", promptProfile.storyHooks),
    formatHookLine("AVOID / PRIVACY RULES", promptProfile.avoidRules)
  ]
    .filter(Boolean)
    .join("\n");
}

function formatHookLine(label, hooks) {
  const safeHooks = uniqueStrings(hooks).slice(0, 16);
  if (!safeHooks.length) return "";
  return `${label}: ${safeHooks.join("; ")}`;
}

function normalizeCoordinates(input = {}) {
  const latitude = toFiniteNumber(input.latitude ?? input.lat);
  const longitude = toFiniteNumber(input.longitude ?? input.lng ?? input.lon);
  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6))
  };
}

function normalizeLocationGranularity(value) {
  return LOCATION_USE_LEVELS.includes(value) ? value : "none";
}

function normalizeLocationUse(value) {
  return LOCATION_USE_LEVELS.includes(value) ? value : "coarse";
}

function inferLocationGranularity(locationReference) {
  if (locationReference?.coordinates) return "exact";
  if (locationReference?.googlePlaceId || locationReference?.googleMapsUrl || locationReference?.displayName) return "place";
  return "coarse";
}

function derivePlaceTypeHooks(placeType) {
  return PLACE_TYPE_HOOKS[placeType] ?? PLACE_TYPE_HOOKS.neutral;
}

function deriveTimeMoodHooks(timeMood) {
  return TIME_MOOD_HOOKS[timeMood] ?? TIME_MOOD_HOOKS.clear;
}

function deriveGooglePlaceHooks(locationReference) {
  return normalizeStringList(locationReference.placeTypes).flatMap((type) => GOOGLE_PLACE_TYPE_HOOKS[type] ?? []).slice(0, 8);
}

function deriveLocationNameHooks(locationReference) {
  if (!locationReference.promptSafeSummary) return [];
  return [locationReference.promptSafeSummary];
}

function createPromptSafeLocationSummary({ displayName, formattedAddress, placeTypes, allowExactForPrompt }) {
  if (!allowExactForPrompt) {
    const typeHook = normalizeStringList(placeTypes)
      .map((type) => GOOGLE_PLACE_TYPE_HOOKS[type]?.[0])
      .find(Boolean);
    if (typeHook) return typeHook;
    if (displayName) return inferCoarsePlaceSummary(displayName);
    if (formattedAddress) return "coarse real-world location atmosphere";
    return "";
  }
  return safeString(displayName || formattedAddress, 120);
}

function inferCoarsePlaceSummary(value) {
  const text = value.toLowerCase();
  if (text.includes("arcade") || text.includes("game")) return "arcade-like entertainment venue";
  if (text.includes("park")) return "green public park";
  if (text.includes("beach")) return "coastal public space";
  if (text.includes("school") || text.includes("campus") || text.includes("university")) return "campus atmosphere";
  if (text.includes("station") || text.includes("airport")) return "travel hub atmosphere";
  if (text.includes("cafe") || text.includes("coffee")) return "warm cafe corner";
  return "coarse real-world place atmosphere";
}

function deriveSeason(localDate, coordinates) {
  const month = Number(String(localDate).slice(5, 7));
  if (!month) return "";
  const northernHemisphere = !coordinates || coordinates.latitude >= 0;
  if (northernHemisphere) {
    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    if (month >= 9 && month <= 11) return "autumn";
    return "winter";
  }
  if (month >= 3 && month <= 5) return "autumn";
  if (month >= 6 && month <= 8) return "winter";
  if (month >= 9 && month <= 11) return "spring";
  return "summer";
}

function deriveSeasonHooks(season) {
  return SEASON_HOOKS[season] ?? [];
}

function getSafeStaticDateMotifs(localDate) {
  const key = String(localDate).slice(5, 10);
  return SAFE_STATIC_DATE_MOTIFS[key] ?? { holidayTags: [], eventCreativeTags: [] };
}

function deriveLocalDate(capturedAt) {
  if (!capturedAt) return "";
  const date = new Date(capturedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function copyTagGroups(groups) {
  return Object.fromEntries(Object.entries(groups ?? {}).map(([key, value]) => [safeString(key, 40), normalizeStringList(value).slice(0, 12)]));
}

function normalizeMetrics(metrics = {}) {
  return Object.fromEntries(
    Object.entries(metrics ?? {})
      .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
      .map(([key, value]) => [key, Number(value.toFixed(4))])
  );
}

function copyPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => ["string", "number", "boolean"].includes(typeof item) || item === null || Array.isArray(item))
      .map(([key, item]) => [safeString(key, 48), Array.isArray(item) ? normalizeStringList(item).slice(0, 8) : item])
  );
}

function readCandidateValue(value) {
  if (Array.isArray(value)) return readCandidateValue(value[0]);
  if (value && typeof value === "object") return safeString(value.value ?? value.label ?? "", 120);
  return safeString(value, 120);
}

function readCandidateLabel(value) {
  if (Array.isArray(value)) return readCandidateLabel(value[0]);
  if (value && typeof value === "object") return safeString(value.label ?? value.value ?? "", 120);
  return "";
}

function readCandidateNarrative(value) {
  if (Array.isArray(value)) return readCandidateNarrative(value[0]);
  if (value && typeof value === "object") return safeString(value.narrative ?? "", 160);
  return "";
}

function readCandidateValues(value) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return uniqueStrings(values.map(readCandidateValue));
}

function normalizeStringList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return uniqueStrings(value);
  return splitPromptList(value);
}

function splitPromptList(value) {
  if (value === undefined || value === null || value === "") return [];
  return uniqueStrings(
    String(value)
      .split(/[,\n，、/｜|]+/u)
      .map((item) => safeString(item, 80))
      .filter(Boolean)
  );
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values ?? []) {
    const safeValue = safeString(value, 120);
    if (!safeValue || seen.has(safeValue.toLowerCase())) continue;
    seen.add(safeValue.toLowerCase());
    result.push(safeValue);
  }
  return result;
}

function safeString(value, maxLength = 120) {
  return String(value ?? "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/-?\d{1,3}\.\d{3,}/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeUrl(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString().slice(0, 300);
  } catch {
    return "";
  }
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
