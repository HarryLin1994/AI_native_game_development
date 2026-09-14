import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, isAbsolute, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildQuestionnaireCandidatePrompt,
  createFallbackQuestionnaireCandidates,
  normalizeQuestionnaireCandidatePayload,
  questionnaireCandidateJsonSchema
} from "./src/card-generation/questionnaire-candidates.js";

const root = fileURLToPath(new URL(".", import.meta.url));
loadEnvFile(join(root, ".env.local"));
loadEnvFile(join(root, ".env"));
const port = Number(process.env.PORT ?? 5173);
const host = process.env.HOST ?? "127.0.0.1";
const imageModel = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
const openAiImageTimeoutMs = Number(process.env.OPENAI_IMAGE_TIMEOUT_MS ?? 120000);
const geminiImageModel = process.env.GEMINI_IMAGE_MODEL ?? "nano-banana-pro-preview";
const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "";
const geminiImageUrl = normalizeBaseUrl(process.env.GEMINI_IMAGE_URL ?? "https://generativelanguage.googleapis.com/v1beta/interactions");
const geminiImageTimeoutMs = Number(process.env.GEMINI_IMAGE_TIMEOUT_MS ?? 120000);
const geminiImageAspectRatio = process.env.GEMINI_IMAGE_ASPECT_RATIO ?? "3:4";
const geminiImageSize = process.env.GEMINI_IMAGE_SIZE ?? "1K";
const geminiImageMimeType = process.env.GEMINI_IMAGE_MIME_TYPE ?? "image/jpeg";
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_API_KEY ?? "";
const googleMapsTimeoutMs = Number(process.env.GOOGLE_MAPS_TIMEOUT_MS ?? 8000);
const holidayApiBaseUrl = normalizeBaseUrl(process.env.HOLIDAY_API_BASE_URL ?? "https://date.nager.at/api/v3");
const holidayApiTimeoutMs = Number(process.env.HOLIDAY_API_TIMEOUT_MS ?? 8000);
const comfyUrl = normalizeBaseUrl(process.env.COMFYUI_URL ?? "http://127.0.0.1:8188");
const comfyTimeoutMs = Number(process.env.COMFYUI_TIMEOUT_MS ?? 3000);
const comfyWorkflowPath = resolveOptionalPath(process.env.COMFYUI_WORKFLOW_PATH);
const comfyGenerationTimeoutMs = Number(process.env.COMFYUI_GENERATION_TIMEOUT_MS ?? 120000);
const comfyPollIntervalMs = Number(process.env.COMFYUI_POLL_INTERVAL_MS ?? 1000);
const visionVlmUrl = normalizeBaseUrl(process.env.VISION_VLM_URL ?? "http://127.0.0.1:11434");
const visionVlmModel = process.env.VISION_VLM_MODEL ?? "gemma3:4b";
const visionVlmTimeoutMs = Number(process.env.VISION_VLM_TIMEOUT_MS ?? 90000);
const debugSourceDirectory = join(root, ".local-tools", "debug-sources");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/api/comfy-status") {
      await handleComfyStatus(res);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/vision-tags-status") {
      await handleVisionTagsStatus(res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/comfy-card-art") {
      await handleComfyCardArt(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/vision-tags") {
      await handleVisionTags(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/questionnaire-candidates") {
      await handleQuestionnaireCandidates(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/capture-context") {
      await handleCaptureContext(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/card-art") {
      await handleCardArt(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/card-art-compare") {
      await handleCardArtCompare(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/gemini-card-art") {
      await handleGeminiCardArt(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/ai-retouch") {
      await handleAiRetouch(req, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "method_not_allowed" });
      return;
    }

    await serveStatic(url.pathname, res, req.method === "HEAD");
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "server_error", message: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`Photo Character Lab running at http://${host}:${port}`);
});

async function handleComfyStatus(res) {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${comfyUrl}/system_stats`, {
      signal: AbortSignal.timeout(comfyTimeoutMs)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      sendJson(res, 502, {
        ok: false,
        error: "comfyui_bad_response",
        url: comfyUrl,
        status: response.status,
        details: payload
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      url: comfyUrl,
      latencyMs: Date.now() - startedAt,
      system: payload.system ?? null,
      devices: summarizeComfyDevices(payload.devices),
      workflow: summarizeComfyWorkflow()
    });
  } catch (error) {
    sendJson(res, 503, {
      ok: false,
      error: "comfyui_unavailable",
      url: comfyUrl,
      message: error.message,
      hint: "Start ComfyUI on 127.0.0.1:8188 or set COMFYUI_URL in .env.local.",
      workflow: summarizeComfyWorkflow()
    });
  }
}

async function handleComfyCardArt(req, res) {
  if (!comfyWorkflowPath) {
    sendJson(res, 501, {
      error: "missing_comfy_workflow",
      message: "COMFYUI_WORKFLOW_PATH is not set. Export an API workflow JSON from ComfyUI and set the path in .env.local.",
      expectedPlaceholders: comfyPlaceholderContract()
    });
    return;
  }

  const body = await readJsonBody(req, 16 * 1024 * 1024);
  const image = parseDataUrl(body.imageDataUrl);
  const prompt = String(body.prompt ?? "").slice(0, 5000);
  if (!image || !prompt) {
    sendJson(res, 400, { error: "bad_request", message: "imageDataUrl and prompt are required." });
    return;
  }

  try {
    const result = await generateComfyCardArt({
      image,
      prompt,
      negativePrompt:
        String(body.negativePrompt ?? "").slice(0, 1600) ||
        "text, logo, watermark, extra people, identity document, low quality, distorted face, cropped head",
      seed: Number.isFinite(Number(body.seed)) ? Number(body.seed) : randomSeed(),
      width: Number.isFinite(Number(body.width)) ? Number(body.width) : 768,
      height: Number.isFinite(Number(body.height)) ? Number(body.height) : 1024,
      denoise: readNumber(body.denoise, Number(process.env.COMFYUI_DENOISE ?? 0.45)),
      loraStrength: readNumber(body.loraStrength, Number(process.env.COMFYUI_FACEID_LORA_STRENGTH ?? 0.6)),
      ipadapterWeight: readNumber(body.ipadapterWeight, Number(process.env.COMFYUI_IPADAPTER_WEIGHT ?? 1)),
      faceidv2Weight: readNumber(body.faceidv2Weight, Number(process.env.COMFYUI_FACEIDV2_WEIGHT ?? 2))
    });
    sendJson(res, 200, result);
  } catch (error) {
    const status = error.statusCode ?? 502;
    sendJson(res, status, {
      error: error.code ?? "comfyui_generation_failed",
      message: error.message,
      url: comfyUrl,
      workflow: summarizeComfyWorkflow(),
      details: error.details ?? null
    });
  }
}

async function handleVisionTagsStatus(res) {
  try {
    const response = await fetch(`${visionVlmUrl}/api/tags`, {
      signal: AbortSignal.timeout(Math.min(visionVlmTimeoutMs, 5000))
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      sendJson(res, 502, {
        ok: false,
        error: "vision_vlm_bad_response",
        url: visionVlmUrl,
        model: visionVlmModel,
        status: response.status,
        details: payload
      });
      return;
    }

    const models = Array.isArray(payload.models) ? payload.models : [];
    const modelAvailable = models.some((model) => model?.name === visionVlmModel);
    sendJson(res, 200, {
      ok: true,
      url: visionVlmUrl,
      model: visionVlmModel,
      modelAvailable,
      models: models.map((model) => model?.name).filter(Boolean).slice(0, 20)
    });
  } catch (error) {
    sendJson(res, 503, {
      ok: false,
      error: "vision_vlm_unavailable",
      url: visionVlmUrl,
      model: visionVlmModel,
      message: error.message,
      hint: `Start Ollama and pull the configured vision model, for example: ollama pull ${visionVlmModel}`
    });
  }
}

async function handleVisionTags(req, res) {
  const body = await readJsonBody(req, 12 * 1024 * 1024);
  const image = parseDataUrl(body.imageDataUrl);
  if (!image) {
    sendJson(res, 400, { error: "bad_request", message: "imageDataUrl is required." });
    return;
  }
  const subjectImage = parseDataUrl(body.subjectImageDataUrl) ?? image;
  const hasSubjectCrop = Boolean(body.subjectImageDataUrl && subjectImage !== image);

  try {
    const startedAt = Date.now();
    const subjectFocus = normalizeSubjectFocus(body.subjectFocus);
    const response = await fetch(`${visionVlmUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: visionVlmModel,
        stream: false,
        format: visionTagJsonSchema(),
        messages: [
          {
            role: "user",
            content: buildVisionTagPrompt(subjectFocus, hasSubjectCrop),
            images: hasSubjectCrop
              ? [subjectImage.buffer.toString("base64"), image.buffer.toString("base64")]
              : [image.buffer.toString("base64")]
          }
        ],
        options: {
          temperature: 0,
          num_predict: 900
        }
      }),
      signal: AbortSignal.timeout(visionVlmTimeoutMs)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw createHttpError(response.status, "vision_vlm_failed", "Local VLM tag generation failed.", payload);
    }

    const content = payload.message?.content ?? payload.response ?? "";
    const suggestions = normalizeVisionTagPayload(parseLooseJson(content));
    sendJson(res, 200, {
      ok: true,
      provider: "ollama",
      model: visionVlmModel,
      subjectFocus,
      subjectImageMode: hasSubjectCrop ? "center_crop_plus_full_image" : "full_image_only",
      latencyMs: Date.now() - startedAt,
      tags: suggestions.tags,
      groups: suggestions.groups,
      raw: {
        content
      }
    });
  } catch (error) {
    sendJson(res, error.statusCode ?? 503, {
      ok: false,
      error: error.code ?? "vision_vlm_unavailable",
      message: error.message,
      url: visionVlmUrl,
      model: visionVlmModel,
      hint: "Install/start Ollama and pull the configured vision model, then try VLM analysis again.",
      details: error.details ?? null
    });
  }
}

async function handleQuestionnaireCandidates(req, res) {
  const body = await readJsonBody(req, 12 * 1024 * 1024);
  const image = parseDataUrl(body.imageDataUrl);
  const subjectImage = parseDataUrl(body.subjectImageDataUrl) ?? image;
  const hasSubjectCrop = Boolean(body.subjectImageDataUrl && subjectImage && subjectImage !== image);
  const seed = Number.isFinite(Number(body.seed)) ? Number(body.seed) : randomSeed();
  const context = {
    analysis: body.analysis ?? {},
    captureContext: body.captureContext ?? {},
    eventContext: body.eventContext ?? {},
    seed
  };

  if (!image) {
    sendJson(res, 200, {
      ok: true,
      provider: "fallback_candidate_builder",
      model: null,
      warning: "imageDataUrl missing; returned deterministic safe fallback candidates.",
      ...createFallbackQuestionnaireCandidates(context)
    });
    return;
  }

  try {
    const startedAt = Date.now();
    const subjectFocus = normalizeSubjectFocus(body.subjectFocus);
    const response = await fetch(`${visionVlmUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: visionVlmModel,
        stream: false,
        format: questionnaireCandidateJsonSchema(),
        messages: [
          {
            role: "user",
            content: buildQuestionnaireCandidatePrompt({
              subjectFocus,
              hasSubjectCrop,
              analysis: context.analysis,
              captureContext: context.captureContext,
              eventContext: context.eventContext
            }),
            images: hasSubjectCrop
              ? [subjectImage.buffer.toString("base64"), image.buffer.toString("base64")]
              : [image.buffer.toString("base64")]
          }
        ],
        options: {
          temperature: 0.65,
          top_p: 0.9,
          seed,
          num_predict: 1400
        }
      }),
      signal: AbortSignal.timeout(visionVlmTimeoutMs)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw createHttpError(response.status, "questionnaire_candidates_vlm_failed", "Local VLM candidate generation failed.", payload);
    }

    const content = payload.message?.content ?? payload.response ?? "";
    const candidates = normalizeQuestionnaireCandidatePayload(parseLooseJson(content), context);
    sendJson(res, 200, {
      ok: true,
      provider: "ollama",
      model: visionVlmModel,
      subjectFocus,
      subjectImageMode: hasSubjectCrop ? "center_crop_plus_full_image" : "full_image_only",
      latencyMs: Date.now() - startedAt,
      seed,
      ...candidates,
      raw: {
        content
      }
    });
  } catch (error) {
    sendJson(res, 200, {
      ok: true,
      provider: "fallback_candidate_builder",
      model: visionVlmModel,
      seed,
      warning: "Local VLM candidate generation failed; returned deterministic safe fallback candidates.",
      error: error.code ?? "questionnaire_candidates_vlm_unavailable",
      message: error.message,
      details: error.details ?? null,
      ...createFallbackQuestionnaireCandidates(context)
    });
  }
}

async function handleCaptureContext(req, res) {
  const body = await readJsonBody(req, 64 * 1024);
  try {
    const result = await resolveAutomaticCaptureContext(body);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, {
      ok: false,
      error: error.code ?? "capture_context_failed",
      message: error.message,
      details: error.details ?? null
    });
  }
}

async function resolveAutomaticCaptureContext(body) {
  const runtimeMoment = createServerCaptureMoment();
  const captureMoment = normalizeCaptureMoment(body.captureMoment, runtimeMoment);
  const worldEventMoment = normalizeCaptureMoment(body.worldEventMoment, runtimeMoment);
  const location = normalizeRequestLocation(body.location);
  const geocoding = location?.coordinates && googleMapsApiKey ? await reverseGeocodeLocation(location.coordinates) : missingGoogleMapsResult("geocoding");
  const nearbyPlace = location?.coordinates && googleMapsApiKey ? await findNearbyGooglePlace(location.coordinates) : missingGoogleMapsResult("places");
  const holidayRegion = normalizeHolidayRegion(body.holidayRegion);
  const countryCode = holidayRegion.countryCode;
  const regionCode = holidayRegion.regionCode;
  const holidays = await resolveHolidayContext(worldEventMoment.localDate, countryCode, regionCode);
  const googlePlace = nearbyPlace.place ?? null;
  const placeTypes = mergeContextStrings([...(googlePlace?.types ?? []), ...geocoding.types], 12);
  const placeType = inferGamePlaceType(placeTypes, googlePlace?.displayName?.text || googlePlace?.displayName || geocoding.formattedAddress);
  const timeMood = inferTimeMoodFromMoment(captureMoment.capturedAt);
  const locationReference = buildResolvedLocationReference({
    location,
    geocoding,
    googlePlace,
    placeTypes
  });

  return {
    ok: true,
    provider: "automatic_capture_context",
    captureContext: {
      capturedAt: captureMoment.capturedAt,
      localDate: captureMoment.localDate,
      timezone: captureMoment.timezone,
      locationUse: location ? "exact" : "none",
      locationGranularity: location ? "exact" : "none",
      placeType,
      timeMood,
      locationReference,
      locationCreativeTags: buildServerLocationCreativeTags(placeType, timeMood, placeTypes),
      acquisitionStatus: {
        location: location?.acquisitionMethod ?? "none",
        geocoding: geocoding.status,
        googleMaps: nearbyPlace.status
      }
    },
    eventContext: {
      localDate: worldEventMoment.localDate,
      timezone: worldEventMoment.timezone,
      countryCode,
      regionCode,
      eventDatePolicy: "current_real_world_us",
      eventDateSource: "browser_runtime_current_date",
      captureLocalDate: captureMoment.localDate,
      eventSource: holidays.status === "ok" ? "public_holiday_api" : "local_static_date_motifs",
      holidayTags: holidays.holidayTags,
      localEventTags: [],
      eventCreativeTags: holidays.eventCreativeTags,
      publicHolidays: holidays.publicHolidays
    },
    acquisitionStatus: {
      location: location?.acquisitionMethod ?? "none",
      geocoding: geocoding.status,
      googleMaps: nearbyPlace.status,
      holidays: holidays.status,
      source: body.sourceMetadata?.source ?? body.reason ?? "runtime"
    },
    sourceMetadata: {
      source: String(body.sourceMetadata?.source ?? body.reason ?? "runtime").slice(0, 48),
      exifPresent: Boolean(body.sourceMetadata?.exifPresent),
      fileName: String(body.sourceMetadata?.fileName ?? "").slice(0, 120)
    }
  };
}

async function reverseGeocodeLocation(coordinates) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${coordinates.latitude},${coordinates.longitude}`);
  url.searchParams.set("key", googleMapsApiKey);
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(googleMapsTimeoutMs)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== "OK") {
      return {
        status: payload.status ? `google_geocoding_${payload.status.toLowerCase()}` : "google_geocoding_error",
        formattedAddress: "",
        addressComponents: [],
        countryCode: "",
        regionCode: "",
        types: [],
        details: payload.error_message ?? null
      };
    }
    const first = payload.results?.[0] ?? {};
    const components = Array.isArray(first.address_components) ? first.address_components : [];
    return {
      status: "ok",
      formattedAddress: String(first.formatted_address ?? "").slice(0, 220),
      googlePlaceId: String(first.place_id ?? "").slice(0, 120),
      addressComponents: components.map(normalizeGoogleAddressComponent).filter(Boolean),
      countryCode: readAddressComponentShortName(components, "country"),
      regionCode: readAddressComponentShortName(components, "administrative_area_level_1"),
      types: normalizeStringListForServer(first.types, 12)
    };
  } catch (error) {
    return {
      status: "google_geocoding_unavailable",
      formattedAddress: "",
      addressComponents: [],
      countryCode: "",
      regionCode: "",
      types: [],
      details: error.message
    };
  }
}

async function findNearbyGooglePlace(coordinates) {
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": googleMapsApiKey,
        "x-goog-fieldmask": "places.id,places.displayName,places.formattedAddress,places.types,places.googleMapsUri,places.location"
      },
      body: JSON.stringify({
        rankPreference: "DISTANCE",
        maxResultCount: 1,
        locationRestriction: {
          circle: {
            center: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude
            },
            radius: 120
          }
        }
      }),
      signal: AbortSignal.timeout(googleMapsTimeoutMs)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        status: "google_places_error",
        place: null,
        details: payload
      };
    }
    const place = payload.places?.[0] ?? null;
    return {
      status: place ? "ok" : "no_nearby_place",
      place,
      details: null
    };
  } catch (error) {
    return {
      status: "google_places_unavailable",
      place: null,
      details: error.message
    };
  }
}

async function resolveHolidayContext(localDate, countryCode, regionCode) {
  if (!localDate || !countryCode) {
    return {
      status: "missing_country_or_date",
      holidayTags: [],
      eventCreativeTags: [],
      publicHolidays: []
    };
  }
  const year = String(localDate).slice(0, 4);
  try {
    const response = await fetch(`${holidayApiBaseUrl}/PublicHolidays/${year}/${countryCode}`, {
      signal: AbortSignal.timeout(holidayApiTimeoutMs)
    });
    const payload = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(payload)) {
      return {
        status: "holiday_api_error",
        holidayTags: [],
        eventCreativeTags: [],
        publicHolidays: []
      };
    }
    const publicHolidays = payload
      .filter((holiday) => holiday.date === localDate)
      .filter((holiday) => holiday.counties == null || !regionCode || holiday.counties.some((county) => String(county).endsWith(`-${regionCode}`)))
      .slice(0, 4)
      .map((holiday) => ({
        date: holiday.date,
        localName: String(holiday.localName ?? "").slice(0, 80),
        name: String(holiday.name ?? "").slice(0, 80),
        countryCode: holiday.countryCode,
        types: normalizeStringListForServer(holiday.types, 6)
      }));
    return {
      status: "ok",
      holidayTags: mergeContextStrings(publicHolidays.map((holiday) => holiday.name || holiday.localName).map(createHolidayTag), 8),
      eventCreativeTags: mergeContextStrings(publicHolidays.flatMap(createHolidayCreativeTags), 12),
      publicHolidays
    };
  } catch (error) {
    return {
      status: "holiday_api_unavailable",
      holidayTags: [],
      eventCreativeTags: [],
      publicHolidays: [],
      details: error.message
    };
  }
}

function buildResolvedLocationReference({ location, geocoding, googlePlace, placeTypes }) {
  const displayName = googlePlace?.displayName?.text ?? googlePlace?.displayName ?? "";
  return {
    coordinates: location?.coordinates ?? null,
    accuracyMeters: location?.accuracyMeters ?? null,
    gpsMethod: location?.acquisitionMethod ?? "none",
    acquisitionMethod: location?.acquisitionMethod ?? "none",
    addressMethod: geocoding.status === "ok" ? "google_reverse_geocoding" : "none",
    googleMapsMethod: googlePlace ? "google_places_nearby_search" : "none",
    formattedAddress: geocoding.formattedAddress || googlePlace?.formattedAddress || "",
    addressComponents: geocoding.addressComponents ?? [],
    googlePlaceId: googlePlace?.id ?? geocoding.googlePlaceId ?? "",
    googleMapsUrl: googlePlace?.googleMapsUri ?? "",
    displayName: String(displayName).slice(0, 96),
    placeTypes,
    allowExactForPrompt: false
  };
}

function normalizeRequestLocation(value) {
  if (!value || typeof value !== "object") return null;
  const rawCoordinates = value.coordinates ?? value;
  const latitude = Number(rawCoordinates.latitude ?? rawCoordinates.lat);
  const longitude = Number(rawCoordinates.longitude ?? rawCoordinates.lng ?? rawCoordinates.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return {
    coordinates: {
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6))
    },
    accuracyMeters: Number.isFinite(Number(value.accuracyMeters)) ? Math.round(Number(value.accuracyMeters)) : null,
    acquisitionMethod: normalizeAcquisitionMethod(value.acquisitionMethod)
  };
}

function normalizeCaptureMoment(input, fallback) {
  const capturedAt = normalizeIsoLikeDate(input?.capturedAt) || fallback.capturedAt;
  const localDate = normalizeLocalDate(input?.localDate) || normalizeLocalDate(capturedAt) || fallback.localDate;
  return {
    capturedAt,
    localDate,
    timezone: String(input?.timezone || fallback.timezone || "unknown").slice(0, 64)
  };
}

function normalizeHolidayRegion(input = {}) {
  const rawCountry = String(input?.countryCode || process.env.HOLIDAY_COUNTRY_CODE || "US")
    .trim()
    .toUpperCase();
  const countryCode = /^[A-Z]{2}$/u.test(rawCountry) ? rawCountry : "US";
  const rawRegion = String(input?.regionCode || process.env.HOLIDAY_REGION_CODE || "")
    .trim()
    .toUpperCase();
  return {
    countryCode,
    regionCode: /^[A-Z0-9-]{1,12}$/u.test(rawRegion) ? rawRegion : ""
  };
}

function createServerCaptureMoment() {
  const now = new Date();
  return {
    capturedAt: now.toISOString(),
    localDate: now.toISOString().slice(0, 10),
    timezone: "server"
  };
}

function normalizeIsoLikeDate(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}T/u.test(text)) return text.slice(0, 32);
  return "";
}

function normalizeLocalDate(value) {
  const text = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/u.exec(text);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

function normalizeAcquisitionMethod(value) {
  const method = String(value ?? "").trim();
  if (["photo_exif_gps", "browser_geolocation", "manual_coordinates"].includes(method)) return method;
  return "browser_geolocation";
}

function missingGoogleMapsResult(kind) {
  return kind === "geocoding"
    ? {
        status: googleMapsApiKey ? "not_requested" : "missing_google_maps_api_key",
        formattedAddress: "",
        addressComponents: [],
        countryCode: "",
        regionCode: "",
        types: []
      }
    : {
        status: googleMapsApiKey ? "not_requested" : "missing_google_maps_api_key",
        place: null,
        details: null
      };
}

function normalizeGoogleAddressComponent(component) {
  if (!component) return null;
  return {
    longName: String(component.long_name ?? "").slice(0, 120),
    shortName: String(component.short_name ?? "").slice(0, 32),
    types: normalizeStringListForServer(component.types, 8)
  };
}

function readAddressComponentShortName(components, type) {
  const match = components.find((component) => Array.isArray(component.types) && component.types.includes(type));
  return String(match?.short_name ?? "").slice(0, 12);
}

function inferGamePlaceType(types, label = "") {
  const text = `${types.join(" ")} ${label}`.toLowerCase();
  if (/(amusement|arcade|game|bowling|casino|night_club|movie_theater|entertainment)/u.test(text)) return "arcade";
  if (/(cafe|coffee|bakery|restaurant|bar)/u.test(text)) return "cafe";
  if (/(stadium|sports|gym|fitness|athletic|arena)/u.test(text)) return "stadium";
  if (/(park|garden|campground|zoo)/u.test(text)) return "park";
  if (/(beach|harbor|marina|pier)/u.test(text)) return "beach";
  if (/(mountain|trail|natural_feature|hiking)/u.test(text)) return "mountain";
  if (/(school|university|library)/u.test(text)) return "school";
  if (/(office|finance|corporate|coworking)/u.test(text)) return "office";
  if (/(train|subway|airport|bus_station|transit|parking)/u.test(text)) return "transit";
  if (/(street|route|intersection|premise|store|shopping_mall)/u.test(text)) return "street";
  if (/(indoor|lodging|museum|gallery)/u.test(text)) return "indoor";
  return "neutral";
}

function inferTimeMoodFromMoment(capturedAt) {
  const match = /T(\d{2}):/u.exec(String(capturedAt ?? ""));
  const hour = match ? Number(match[1]) : Number.NaN;
  if (!Number.isFinite(hour)) return "clear";
  if (hour >= 20 || hour < 5) return "night";
  if (hour >= 17 && hour < 20) return "dusk";
  if (hour >= 10 && hour < 16) return "sunny";
  return "clear";
}

function buildServerLocationCreativeTags(placeType, timeMood, placeTypes) {
  const tags = [];
  const placeTagMap = {
    arcade: ["arcade neon venue", "interactive game-floor energy"],
    cafe: ["warm cafe corner", "small venue atmosphere"],
    stadium: ["competitive arena energy", "stadium spotlight"],
    park: ["green public park", "open outdoor calm"],
    beach: ["coastal public space", "sea-breeze atmosphere"],
    mountain: ["highland endurance atmosphere"],
    school: ["campus atmosphere"],
    office: ["modern command-room workspace"],
    transit: ["station transfer flow"],
    street: ["urban street energy"],
    indoor: ["indoor venue atmosphere"],
    neutral: ["neutral training gate"]
  };
  const timeTagMap = {
    sunny: ["sunlit action glow"],
    night: ["night-scene contrast"],
    dusk: ["dusk threshold mood"],
    clear: ["clear everyday light"]
  };
  tags.push(...(placeTagMap[placeType] ?? placeTagMap.neutral));
  tags.push(...(timeTagMap[timeMood] ?? []));
  tags.push(...placeTypes.slice(0, 4).map((type) => `${type.replace(/_/gu, " ")} atmosphere`));
  return mergeContextStrings(tags, 12);
}

function createHolidayTag(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "")
    .slice(0, 40);
}

function createHolidayCreativeTags(holiday) {
  const name = `${holiday.name} ${holiday.localName}`.toLowerCase();
  if (/new year/u.test(name)) return ["new year countdown glow", "fresh-start motif"];
  if (/christmas/u.test(name)) return ["winter festival lights", "gift-season warmth"];
  if (/independence|national/u.test(name)) return ["public celebration energy", "festival color accents"];
  if (/thanksgiving|harvest/u.test(name)) return ["harvest-season warmth", "gathering motif"];
  if (/labor|labour/u.test(name)) return ["city holiday calm", "workshop rest-day motif"];
  if (/memorial|remembrance/u.test(name)) return ["quiet commemorative atmosphere"];
  return holiday.name || holiday.localName ? [`${String(holiday.name || holiday.localName).slice(0, 40)} motif`] : [];
}

function deriveCountryCodeFromTimezone(timezone) {
  const value = String(timezone ?? "");
  if (value.startsWith("America/")) return "US";
  if (value === "Asia/Taipei") return "TW";
  if (value === "Asia/Tokyo") return "JP";
  if (value === "Asia/Seoul") return "KR";
  if (value === "Europe/London") return "GB";
  if (value.startsWith("Europe/")) return "DE";
  if (value.startsWith("Australia/")) return "AU";
  return "";
}

function normalizeStringListForServer(value, limit) {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,，、;\n]/u) : [];
  return mergeContextStrings(
    raw
      .map((item) => String(item ?? "").trim().replace(/\s+/gu, " ").slice(0, 64))
      .filter(Boolean),
    limit
  );
}

function mergeContextStrings(values, limit) {
  const seen = new Set();
  const result = [];
  for (const value of values ?? []) {
    const text = String(value ?? "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

async function handleCardArt(req, res) {
  const body = await readJsonBody(req, 16 * 1024 * 1024);
  const request = readCardArtRequest(body, "gemini");
  if (!request.image || !request.prompt) {
    sendJson(res, 400, { error: "bad_request", message: "imageDataUrl and prompt are required." });
    return;
  }

  try {
    const result = await generateCardArt(request.provider, request);
    sendJson(res, 200, result);
  } catch (error) {
    sendProviderError(res, error, request.provider);
  }
}

async function handleCardArtCompare(req, res) {
  const body = await readJsonBody(req, 16 * 1024 * 1024);
  const baseRequest = readCardArtRequest(body, "gemini");
  if (!baseRequest.image || !baseRequest.prompt) {
    sendJson(res, 400, { error: "bad_request", message: "imageDataUrl and prompt are required." });
    return;
  }

  const providers = normalizeProviderList(body.providers);
  if (!providers.length) {
    sendJson(res, 400, { error: "bad_request", message: "providers must include gemini, openai, or comfy." });
    return;
  }

  const startedAt = Date.now();
  const candidates = await Promise.all(
    providers.map(async (provider) => {
      try {
        return await generateCardArt(provider, { ...baseRequest, provider });
      } catch (error) {
        return {
          ok: false,
          provider,
          error: error.code ?? "card_art_provider_failed",
          message: error.message,
          details: error.details ?? null
        };
      }
    })
  );

  sendJson(res, 200, {
    ok: candidates.some((candidate) => candidate.ok !== false && candidate.imageDataUrl),
    providers,
    latencyMs: Date.now() - startedAt,
    candidates
  });
}

async function handleGeminiCardArt(req, res) {
  const body = await readJsonBody(req, 16 * 1024 * 1024);
  const request = readCardArtRequest({ ...body, provider: "gemini" }, "gemini");
  if (!request.image || !request.prompt) {
    sendJson(res, 400, { error: "bad_request", message: "imageDataUrl and prompt are required." });
    return;
  }

  try {
    const result = await generateGeminiCardArt(request);
    sendJson(res, 200, result);
  } catch (error) {
    sendProviderError(res, error, "gemini");
  }
}

async function handleAiRetouch(req, res) {
  const body = await readJsonBody(req, 12 * 1024 * 1024);
  const request = readCardArtRequest({ ...body, provider: "openai" }, "openai");
  if (!request.image || !request.prompt) {
    sendJson(res, 400, { error: "bad_request", message: "imageDataUrl and prompt are required." });
    return;
  }

  try {
    const result = await generateOpenAiCardArt(request);
    sendJson(res, 200, result);
  } catch (error) {
    sendProviderError(res, error, "openai");
  }
}

function readCardArtRequest(body, defaultProvider = "gemini") {
  return {
    provider: normalizeCardArtProvider(body.provider ?? defaultProvider),
    image: parseDataUrl(body.imageDataUrl),
    prompt: String(body.prompt ?? "").slice(0, 12000),
    negativePrompt: String(body.negativePrompt ?? "").slice(0, 2400),
    aspectRatio: String(body.aspectRatio ?? geminiImageAspectRatio).slice(0, 12),
    imageSize: String(body.imageSize ?? geminiImageSize).slice(0, 12),
    size: String(body.size ?? "1024x1536").slice(0, 24),
    quality: String(body.quality ?? "medium").slice(0, 24),
    inputFidelity: String(body.inputFidelity ?? "high").slice(0, 24),
    seed: Number.isFinite(Number(body.seed)) ? Number(body.seed) : randomSeed(),
    width: Number.isFinite(Number(body.width)) ? Number(body.width) : 768,
    height: Number.isFinite(Number(body.height)) ? Number(body.height) : 1024,
    denoise: readNumber(body.denoise, Number(process.env.COMFYUI_DENOISE ?? 0.45)),
    loraStrength: readNumber(body.loraStrength, Number(process.env.COMFYUI_FACEID_LORA_STRENGTH ?? 0.6)),
    ipadapterWeight: readNumber(body.ipadapterWeight, Number(process.env.COMFYUI_IPADAPTER_WEIGHT ?? 1)),
    faceidv2Weight: readNumber(body.faceidv2Weight, Number(process.env.COMFYUI_FACEIDV2_WEIGHT ?? 2))
  };
}

function normalizeCardArtProvider(value) {
  const provider = String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9_-]+/gu, "");
  if (["gemini", "google", "nanobanana", "nano_banana"].includes(provider)) return "gemini";
  if (["openai", "ai", "gptimage", "gpt_image"].includes(provider)) return "openai";
  if (["comfy", "comfyui"].includes(provider)) return "comfy";
  return provider || "gemini";
}

function normalizeProviderList(value) {
  const rawList = Array.isArray(value) ? value : String(value ?? "").split(",");
  const providers = [];
  for (const item of rawList) {
    const provider = normalizeCardArtProvider(item);
    if (!["gemini", "openai", "comfy"].includes(provider)) continue;
    if (!providers.includes(provider)) providers.push(provider);
    if (providers.length >= 3) break;
  }
  return providers;
}

async function generateCardArt(provider, request) {
  const normalizedProvider = normalizeCardArtProvider(provider);
  const startedAt = Date.now();
  let result;
  if (normalizedProvider === "gemini") {
    result = await generateGeminiCardArt(request);
  } else if (normalizedProvider === "openai") {
    result = await generateOpenAiCardArt(request);
  } else if (normalizedProvider === "comfy") {
    result = await generateComfyCardArt(request);
  } else {
    throw createHttpError(400, "unsupported_card_art_provider", `Unsupported card art provider: ${provider}`);
  }
  return {
    ok: true,
    latencyMs: Date.now() - startedAt,
    ...result
  };
}

async function generateGeminiCardArt(request) {
  if (!geminiApiKey) {
    throw createHttpError(501, "missing_api_key", "GEMINI_API_KEY is not set. Set it in .env.local or Terminal before starting the server.");
  }

  const requestBody = {
    model: geminiImageModel,
    input: [
      {
        type: "text",
        text: buildProviderCardArtPrompt(request.prompt, request.negativePrompt)
      },
      {
        type: "image",
        mime_type: request.image.mime,
        data: request.image.buffer.toString("base64")
      }
    ],
    response_format: {
      type: "image",
      mime_type: geminiImageMimeType,
      aspect_ratio: request.aspectRatio,
      image_size: request.imageSize
    }
  };

  const response = await fetch(geminiImageUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": geminiApiKey
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(geminiImageTimeoutMs)
  });

  const result = parseJsonText(await response.text());
  if (!response.ok) {
    throw createHttpError(response.status, "gemini_error", "Gemini image generation failed.", result);
  }

  const outputImage = extractGeminiOutputImage(result);
  if (!outputImage?.data) {
    throw createHttpError(502, "missing_image", "Gemini image API did not return an image payload.", summarizeGeminiResponse(result));
  }

  const mimeType = outputImage.mimeType ?? "image/png";
  const data = normalizeBase64ImageData(outputImage.data);
  return {
    imageDataUrl: data.startsWith("data:") ? data : `data:${mimeType};base64,${data}`,
    provider: "gemini",
    upstreamProvider: "google-gemini",
    model: geminiImageModel,
    interactionId: result.id ?? result.interaction?.id ?? null,
    sourceField: outputImage.sourceField ?? null
  };
}

async function generateOpenAiCardArt(request) {
  if (!process.env.OPENAI_API_KEY) {
    throw createHttpError(501, "missing_api_key", "OPENAI_API_KEY is not set. Set it in .env.local or Terminal before starting the server.");
  }

  const form = new FormData();
  form.append("model", imageModel);
  form.append("image", new Blob([request.image.buffer], { type: request.image.mime }), "source.png");
  form.append("prompt", buildProviderCardArtPrompt(request.prompt, request.negativePrompt));
  form.append("size", request.size);
  form.append("quality", request.quality);
  form.append("input_fidelity", request.inputFidelity);

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: form,
    signal: AbortSignal.timeout(openAiImageTimeoutMs)
  });

  const result = parseJsonText(await response.text());
  if (!response.ok) {
    throw createHttpError(response.status, "openai_error", "OpenAI image generation failed.", result);
  }

  const first = result.data?.[0];
  if (first?.b64_json) {
    return {
      imageDataUrl: `data:image/png;base64,${first.b64_json}`,
      provider: "openai",
      model: imageModel,
      revisedPrompt: first.revised_prompt ?? null
    };
  }

  if (first?.url) {
    const imageResponse = await fetch(first.url, {
      signal: AbortSignal.timeout(Math.min(openAiImageTimeoutMs, 30000))
    });
    if (!imageResponse.ok) {
      throw createHttpError(502, "image_url_fetch_failed", "OpenAI returned an image URL that could not be fetched.", {
        status: imageResponse.status
      });
    }
    const contentType = imageResponse.headers.get("content-type") ?? "image/png";
    const arrayBuffer = await imageResponse.arrayBuffer();
    return {
      imageDataUrl: `data:${contentType};base64,${Buffer.from(arrayBuffer).toString("base64")}`,
      provider: "openai",
      model: imageModel,
      revisedPrompt: first.revised_prompt ?? null
    };
  }

  throw createHttpError(502, "missing_image", "OpenAI image API did not return an image payload.", result);
}

async function generateComfyCardArt(request) {
  if (!comfyWorkflowPath) {
    throw createHttpError(501, "missing_comfy_workflow", "COMFYUI_WORKFLOW_PATH is not set. Export an API workflow JSON from ComfyUI and set the path in .env.local.", {
      expectedPlaceholders: comfyPlaceholderContract()
    });
  }

  const workflowTemplate = readComfyWorkflowTemplate();
  const sourceDebug = await saveDebugSourceImage(request.image);
  const upload = await uploadComfySourceImage(request.image);
  const workflow = fillComfyWorkflowTemplate(workflowTemplate, {
    sourceImage: upload.name,
    prompt: request.prompt,
    negativePrompt:
      request.negativePrompt ||
      "text, logo, watermark, extra people, identity document, low quality, distorted face, cropped head",
    seed: request.seed,
    width: request.width,
    height: request.height,
    denoise: request.denoise,
    loraStrength: request.loraStrength,
    ipadapterWeight: request.ipadapterWeight,
    faceidv2Weight: request.faceidv2Weight
  });
  const promptResult = await submitComfyPrompt(workflow);
  const output = await waitForComfyOutput(promptResult.promptId);
  const imageDataUrl = await fetchComfyImageAsDataUrl(output.image);

  return {
    imageDataUrl,
    provider: "comfy",
    upstreamProvider: "comfyui",
    model: "comfyui",
    promptId: promptResult.promptId,
    workflow: summarizeComfyWorkflow(),
    source: {
      mime: request.image.mime,
      bytes: request.image.buffer.length,
      debugPath: sourceDebug.relativePath,
      comfyInput: upload.name
    },
    output: {
      filename: output.image.filename,
      subfolder: output.image.subfolder ?? "",
      type: output.image.type ?? "output"
    }
  };
}

function sendProviderError(res, error, provider) {
  sendJson(res, error.statusCode ?? 502, {
    ok: false,
    provider,
    error: error.code ?? "card_art_provider_failed",
    message: error.message,
    details: error.details ?? null
  });
}

async function serveStatic(pathname, res, headOnly) {
  const cleanPath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const relativePath = cleanPath === "/" ? "index.html" : cleanPath.replace(/^[/\\]/, "");
  const filePath = join(root, relativePath);
  if (!filePath.startsWith(root)) {
    sendJson(res, 403, { error: "forbidden" });
    return;
  }

  try {
    const data = await readFile(filePath);
    res.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-store"
    });
    if (!headOnly) res.end(data);
    else res.end();
  } catch {
    sendJson(res, 404, { error: "not_found" });
  }
}

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Request body too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function parseDataUrl(value) {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([\s\S]+)$/i.exec(String(value ?? ""));
  if (!match) return null;
  return {
    mime: match[1] === "image/jpg" ? "image/jpeg" : match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function buildProviderCardArtPrompt(prompt, negativePrompt) {
  return [
    "Create one finished character portrait image for a battle-card game.",
    "Use the attached source photo as the consenting subject and visual reference.",
    "Preserve recognizable likeness or transferred visible cues according to the prompt branch.",
    "Follow the project prompt below exactly. Do not add UI, card frame, readable text, labels, logos, watermarks, or stat panels.",
    "The game app will render HP, ATK, DEF, COST, card frame, and text separately after this image returns.",
    "Project prompt:",
    prompt,
    negativePrompt ? `Avoid these failures: ${negativePrompt}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}

function extractGeminiOutputImage(payload) {
  const directCandidates = [
    ["output_image", payload?.output_image],
    ["outputImage", payload?.outputImage],
    ["interaction.output_image", payload?.interaction?.output_image],
    ["interaction.outputImage", payload?.interaction?.outputImage]
  ];
  for (const [sourceField, value] of directCandidates) {
    const image = normalizeGeminiImageBlock(value, sourceField);
    if (image) return image;
  }
  return findGeminiImageBlock(payload);
}

function findGeminiImageBlock(value, path = "response", seen = new Set()) {
  if (!value || typeof value !== "object") return null;
  if (seen.has(value)) return null;
  seen.add(value);

  const normalized = normalizeGeminiImageBlock(value, path);
  if (normalized) return normalized;

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const image = findGeminiImageBlock(value[index], `${path}[${index}]`, seen);
      if (image) return image;
    }
    return null;
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === "input" || key === "request" || key === "prompt") continue;
    const image = findGeminiImageBlock(child, `${path}.${key}`, seen);
    if (image) return image;
  }
  return null;
}

function normalizeGeminiImageBlock(value, sourceField) {
  if (!value || typeof value !== "object") return null;
  const data =
    value.data ??
    value.b64_json ??
    value.base64 ??
    value.bytesBase64Encoded ??
    value.inline_data?.data ??
    value.inlineData?.data;
  if (!data || typeof data !== "string") return null;
  const type = value.type ?? value.mime_type ?? value.mimeType ?? value.inline_data?.mime_type ?? value.inlineData?.mimeType;
  if (type && !/image\//iu.test(String(type)) && !/image/iu.test(String(value.type ?? ""))) return null;
  return {
    data,
    mimeType: value.mime_type ?? value.mimeType ?? value.inline_data?.mime_type ?? value.inlineData?.mimeType ?? "image/png",
    sourceField
  };
}

function normalizeBase64ImageData(data) {
  const value = String(data).trim();
  const match = /^data:image\/[^;]+;base64,([\s\S]+)$/iu.exec(value);
  return match ? match[1] : value;
}

function summarizeGeminiResponse(payload) {
  if (!payload || typeof payload !== "object") return payload;
  return {
    id: payload.id ?? payload.interaction?.id ?? null,
    keys: Object.keys(payload).slice(0, 24),
    raw: payload.raw ? String(payload.raw).slice(0, 800) : undefined
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function summarizeComfyDevices(devices) {
  if (!Array.isArray(devices)) return [];
  return devices.map((device) => ({
    name: device.name ?? "unknown",
    type: device.type ?? "unknown",
    vramTotal: device.vram_total ?? null,
    vramFree: device.vram_free ?? null,
    torchVramTotal: device.torch_vram_total ?? null,
    torchVramFree: device.torch_vram_free ?? null
  }));
}

function summarizeComfyWorkflow() {
  return {
    configured: Boolean(comfyWorkflowPath),
    path: comfyWorkflowPath ? basename(comfyWorkflowPath) : null,
    timeoutMs: comfyGenerationTimeoutMs
  };
}

function comfyPlaceholderContract() {
  return {
    required: ["__SOURCE_IMAGE__", "__PROMPT__"],
    optional: [
      "__NEGATIVE_PROMPT__",
      "__SEED__",
      "__WIDTH__",
      "__HEIGHT__",
      "__DENOISE__",
      "__LORA_STRENGTH__",
      "__IPADAPTER_WEIGHT__",
      "__FACEIDV2_WEIGHT__"
    ]
  };
}

function readComfyWorkflowTemplate() {
  if (!existsSync(comfyWorkflowPath)) {
    throw createHttpError(500, "comfy_workflow_not_found", `Workflow file not found: ${comfyWorkflowPath}`);
  }

  try {
    return JSON.parse(readFileSync(comfyWorkflowPath, "utf8"));
  } catch (error) {
    throw createHttpError(500, "invalid_comfy_workflow", `Workflow file is not valid JSON: ${error.message}`);
  }
}

async function saveDebugSourceImage(image) {
  await mkdir(debugSourceDirectory, { recursive: true });
  const extension = image.mime === "image/jpeg" ? "jpg" : image.mime.split("/")[1] ?? "png";
  const filename = `comfy-source-${Date.now()}-${randomUUID()}.${extension}`;
  const absolutePath = join(debugSourceDirectory, filename);
  await writeFile(absolutePath, image.buffer);
  return {
    absolutePath,
    relativePath: `.local-tools/debug-sources/${filename}`
  };
}

async function uploadComfySourceImage(image) {
  const form = new FormData();
  const extension = image.mime === "image/jpeg" ? "jpg" : image.mime.split("/")[1] ?? "png";
  const filename = `photo-character-lab-${Date.now()}-${randomUUID()}.${extension}`;
  form.append("image", new Blob([image.buffer], { type: image.mime }), filename);
  form.append("type", "input");
  form.append("overwrite", "true");

  const response = await fetch(`${comfyUrl}/upload/image`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(Math.max(comfyTimeoutMs, 15000))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.name) {
    throw createHttpError(502, "comfy_upload_failed", "ComfyUI image upload failed.", {
      status: response.status,
      response: payload
    });
  }
  return payload;
}

async function submitComfyPrompt(workflow) {
  const response = await fetch(`${comfyUrl}/prompt`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: randomUUID(),
      prompt: workflow
    }),
    signal: AbortSignal.timeout(Math.max(comfyTimeoutMs, 15000))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.prompt_id) {
    throw createHttpError(502, "comfy_prompt_failed", "ComfyUI prompt submission failed.", {
      status: response.status,
      response: payload
    });
  }
  return { promptId: payload.prompt_id };
}

async function waitForComfyOutput(promptId) {
  const deadline = Date.now() + comfyGenerationTimeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(`${comfyUrl}/history/${encodeURIComponent(promptId)}`, {
      signal: AbortSignal.timeout(Math.max(comfyTimeoutMs, 15000))
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw createHttpError(502, "comfy_history_failed", "ComfyUI history lookup failed.", {
        status: response.status,
        response: payload
      });
    }

    const item = payload[promptId];
    if (item?.status?.status_str === "error") {
      throw createHttpError(502, "comfy_prompt_error", "ComfyUI reported a workflow error.", item.status);
    }

    const image = findComfyOutputImage(item?.outputs);
    if (image) return { history: item, image };

    if (item?.status?.completed) {
      throw createHttpError(502, "comfy_missing_output_image", "ComfyUI finished but did not return an output image.", item);
    }

    await sleep(comfyPollIntervalMs);
  }

  throw createHttpError(504, "comfy_generation_timeout", "ComfyUI generation timed out before returning an image.");
}

async function fetchComfyImageAsDataUrl(image) {
  const params = new URLSearchParams({
    filename: image.filename,
    type: image.type ?? "output"
  });
  if (image.subfolder) params.set("subfolder", image.subfolder);

  const response = await fetch(`${comfyUrl}/view?${params.toString()}`, {
    signal: AbortSignal.timeout(Math.max(comfyTimeoutMs, 15000))
  });
  if (!response.ok) {
    throw createHttpError(502, "comfy_view_failed", "ComfyUI output image fetch failed.", {
      status: response.status
    });
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  const arrayBuffer = await response.arrayBuffer();
  return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
}

function fillComfyWorkflowTemplate(value, replacements) {
  if (Array.isArray(value)) {
    return value.map((item) => fillComfyWorkflowTemplate(item, replacements));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, fillComfyWorkflowTemplate(item, replacements)])
    );
  }
  if (typeof value !== "string") return value;

  const numericPlaceholders = {
    __SEED__: replacements.seed,
    __WIDTH__: replacements.width,
    __HEIGHT__: replacements.height,
    __DENOISE__: replacements.denoise,
    __LORA_STRENGTH__: replacements.loraStrength,
    __IPADAPTER_WEIGHT__: replacements.ipadapterWeight,
    __FACEIDV2_WEIGHT__: replacements.faceidv2Weight
  };
  if (Object.hasOwn(numericPlaceholders, value)) {
    return numericPlaceholders[value];
  }

  return value
    .replaceAll("__SOURCE_IMAGE__", replacements.sourceImage)
    .replaceAll("__PROMPT__", replacements.prompt)
    .replaceAll("__NEGATIVE_PROMPT__", replacements.negativePrompt)
    .replaceAll("__SEED__", String(replacements.seed))
    .replaceAll("__WIDTH__", String(replacements.width))
    .replaceAll("__HEIGHT__", String(replacements.height));
}

function findComfyOutputImage(outputs) {
  if (!outputs || typeof outputs !== "object") return null;
  for (const output of Object.values(outputs)) {
    if (!Array.isArray(output?.images)) continue;
    const image = output.images.find((candidate) => candidate?.filename);
    if (image) return image;
  }
  return null;
}

function buildVisionTagPrompt(subjectFocus = "center_primary_subject", hasSubjectCrop = false) {
  const imageModeRule = hasSubjectCrop
    ? "Input image rule: image 1 is the Target Subject Crop. Image 2 is the Full Source Photo. Use image 1 only for personAppearance, clothing, and subject-specific state. Use image 2 for World Context categories: scene, activity, object, lighting, composition, and visualSignal."
    : "Input image rule: one full image is provided. Select the Target Subject from the full image using the subject focus rule.";
  return [
    "You are the local VLM semantic tagger for a photo-to-game-card pipeline.",
    "Return only JSON. Do not include markdown, comments, or prose.",
    "Task: describe only visible, non-sensitive creative tags from the image.",
    imageModeRule,
    `Target Subject rule: describe one Target Subject only for personAppearance, clothing, and subject-specific state. Current subject focus: ${describeSubjectFocus(subjectFocus)}.`,
    "Default Target Subject priority: choose the centered, largest, clearest foreground person. If multiple people are visible, choose the person closest to the image center; if tied, choose the largest/clearest foreground person.",
    "World Context rule: scene, activity, object, lighting, composition, and visualSignal can describe the whole photo around the Target Subject, including background, props, environment, crowd presence, and visible action.",
    "Do not mix non-target people into personAppearance, clothing, or state. For non-target people, use only broad context tags such as background people, crowd, teammate, audience, group scene, or busy room when visible.",
    "For clothing, include only items clearly worn by the Target Subject. In crowded images, prefer head/torso clothing and accessories attached to the Target Subject; omit shoes, pants, jackets, or outfits that may belong to background people.",
    "If the Target Subject Crop contains partial people at the edge or people behind the foreground subject, ignore those people for personAppearance, clothing, and state.",
    "Allowed categories: personAppearance, scene, activity, object, state, clothing, lighting, composition, visualSignal.",
    "personAppearance is required when the Target Subject is visible. Use visible cues only from the Target Subject: hair shape, expression cue, pose, accessory, outfit silhouette, face visibility, or subject crop.",
    "Every tag must be grounded in visible pixels from the provided image. Do not copy category examples or instruction words unless the cue is clearly visible in the image.",
    "Never infer identity, age, gender, ethnicity, sexuality, politics, religion, health, personality, wealth, social status, or real name.",
    "Do not describe protected traits. Do not guess real age or gender. Prefer neutral words like person, subject, visible face, short hair, long hair, open-mouth expression, standing pose.",
    "Use state tags only when visually grounded, such as sweaty, tired-looking, celebrating, running, sitting, holding a ball, holding a controller.",
    "If uncertain, return fewer tags.",
    "JSON shape:",
    "{\"personAppearance\":[],\"scene\":[],\"activity\":[],\"object\":[],\"state\":[],\"clothing\":[],\"lighting\":[],\"composition\":[],\"visualSignal\":[]}"
  ].join("\n");
}

function normalizeSubjectFocus(value) {
  const normalized = String(value ?? "center_primary_subject")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9_-]+/gu, "_")
    .slice(0, 48);
  if (!normalized) return "center_primary_subject";
  if (["center", "center_subject", "center_primary", "center_primary_subject"].includes(normalized)) {
    return "center_primary_subject";
  }
  if (["largest", "largest_subject", "largest_foreground_subject"].includes(normalized)) {
    return "largest_foreground_subject";
  }
  return normalized;
}

function describeSubjectFocus(subjectFocus) {
  if (subjectFocus === "largest_foreground_subject") return "largest/clearest foreground subject";
  if (subjectFocus === "center_primary_subject") return "centered primary subject";
  return subjectFocus.replace(/_/gu, " ");
}

function visionTagJsonSchema() {
  const arraySchema = {
    type: "array",
    items: {
      type: "string"
    }
  };
  return {
    type: "object",
    properties: {
      personAppearance: arraySchema,
      scene: arraySchema,
      activity: arraySchema,
      object: arraySchema,
      state: arraySchema,
      clothing: arraySchema,
      lighting: arraySchema,
      composition: arraySchema,
      visualSignal: arraySchema
    },
    required: ["personAppearance", "scene", "activity", "object", "state", "clothing", "lighting", "composition", "visualSignal"]
  };
}

function parseLooseJson(value) {
  const text = String(value ?? "").trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const match = /\{[\s\S]*\}/u.exec(text);
    if (!match) return {};
    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}

function normalizeVisionTagPayload(payload) {
  const allowedKeys = ["personAppearance", "scene", "activity", "object", "state", "clothing", "lighting", "composition", "visualSignal"];
  const groups = Object.fromEntries(allowedKeys.map((key) => [key, []]));
  const tags = [];
  for (const key of allowedKeys) {
    const values = normalizeTagList(payload?.[key]);
    if (!values.length) continue;
    for (const value of values) {
      const category = chooseVisionTagCategory(value, key);
      groups[category].push(value);
    }
  }
  const filteredGroups = {};
  for (const key of allowedKeys) {
    const values = mergeUniqueStrings(groups[key], 8);
    if (!values.length) continue;
    filteredGroups[key] = values;
    tags.push(...values);
  }
  return {
    groups: filteredGroups,
    tags: mergeUniqueStrings(tags, 24)
  };
}

function chooseVisionTagCategory(tag, fallbackKey) {
  const lower = String(tag ?? "").toLocaleLowerCase();
  if (/(sweaty|tired|exhausted|celebrating|out of breath|氣喘|流汗|疲憊|慶祝)/u.test(lower)) return "state";
  if (/(wearing headphones|wearing glasses|wearing sunglasses|wearing headband|wearing cap|wearing hat|headphones on|戴耳機|戴眼鏡|戴墨鏡|戴頭帶|戴帽)/u.test(lower)) return "personAppearance";
  if (/(playing|dancing|holding|running|training|post-game|跳舞|跑步|訓練|打球|拿著)/u.test(lower)) return "activity";
  if (/(night club|nightclub|club room|club scene)/u.test(lower)) return "scene";
  if (/(game console|game machine|game machines|controller|microphone|poster|sign|pac-man|pacman|galaga|disco ball|phone|camera|laptop|book|headphones|手把|麥克風|海報|招牌|手機|相機|筆電|書|耳機)/u.test(lower)) return "object";
  const categoryPatterns = [
    {
      key: "personAppearance",
      patterns: [
        "visible face",
        "face visible",
        "face",
        "hair",
        "hairstyle",
        "curly",
        "short hair",
        "long hair",
        "bangs",
        "beard",
        "mustache",
        "glasses",
        "sunglasses",
        "smile",
        "smiling",
        "open mouth",
        "tongue",
        "expression",
        "pose",
        "standing",
        "sitting",
        "upper-body",
        "full-body",
        "headband",
        "visor",
        "cap",
        "hat",
        "accessory",
        "subject crop",
        "臉",
        "可見臉",
        "頭髮",
        "髮型",
        "捲髮",
        "短髮",
        "長髮",
        "瀏海",
        "鬍子",
        "眼鏡",
        "墨鏡",
        "微笑",
        "張嘴",
        "吐舌",
        "表情",
        "姿勢",
        "站姿",
        "坐姿",
        "半身",
        "全身",
        "頭帶",
        "帽子",
        "配件"
      ]
    },
    {
      key: "scene",
      patterns: ["basketball court", "court", "gym", "arcade", "street", "beach", "park", "office", "school", "indoor", "outdoor", "disco", "room", "籃球場", "球場", "健身房", "街機", "街道", "海邊", "公園", "辦公室", "學校", "室內", "戶外"]
    },
    {
      key: "activity",
      patterns: ["athlete", "player", "basketball", "running", "dancing", "post-game", "training", "playing", "holding", "運動", "球員", "籃球", "跑步", "跳舞", "比賽", "訓練", "賽後", "打球"]
    },
    {
      key: "object",
      patterns: ["ball", "controller", "phone", "camera", "microphone", "laptop", "book", "badge", "headphones", "poster", "sign", "console", "pac-man", "galaga", "球", "手把", "手機", "相機", "麥克風", "筆電", "書", "徽章", "耳機"]
    },
    {
      key: "state",
      patterns: ["sweaty", "tired", "exhausted", "celebrating", "post-game energy", "out of breath", "氣喘", "喘", "流汗", "疲憊", "興奮", "慶祝", "賽後能量"]
    },
    {
      key: "clothing",
      patterns: ["jersey", "sportswear", "hoodie", "jacket", "suit", "uniform", "dress", "windbreaker", "tank top", "pants", "jeans", "sneakers", "vest", "球衣", "運動服", "帽t", "外套", "西裝", "制服", "洋裝"]
    },
    {
      key: "lighting",
      patterns: ["neon", "sunny", "night", "rainy", "backlit", "low light", "bright light", "dim lighting", "霓虹", "晴朗", "夜晚", "雨天", "背光", "低光", "亮光"]
    },
    {
      key: "composition",
      patterns: ["centered", "close-up", "upper-body", "full-body", "balanced composition", "中心", "特寫", "半身", "全身", "平衡構圖"]
    },
    {
      key: "visualSignal",
      patterns: ["palette", "contrast", "color", "motion detail", "green environment", "warm", "cool", "vivid", "dramatic", "retro", "高對比", "色彩", "動勢", "暖色", "冷色", "鮮明"]
    }
  ];

  for (const category of categoryPatterns) {
    if (category.patterns.some((pattern) => lower.includes(pattern))) return category.key;
  }

  return fallbackKey;
}

function normalizeTagList(value) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,，、;\n]/u) : [];
  return mergeUniqueStrings(
    values
      .map((item) =>
        String(item ?? "")
          .trim()
          .replace(/\s+/gu, " ")
          .replace(/^["']|["']$/gu, "")
          .slice(0, 32)
      )
      .filter(Boolean),
    6
  );
}

function mergeUniqueStrings(values, limit) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length >= limit) break;
  }
  return result;
}

function randomSeed() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function readNumber(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  if (Number.isFinite(fallback)) return fallback;
  return 0;
}

function createHttpError(statusCode, code, message, details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function normalizeBaseUrl(value) {
  return String(value).replace(/\/+$/u, "");
}

function resolveOptionalPath(value) {
  if (!value) return "";
  return isAbsolute(value) ? value : resolve(root, value);
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
