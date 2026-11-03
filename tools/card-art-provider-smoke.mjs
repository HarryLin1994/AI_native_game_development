import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env");

const sourcePath = process.argv[2];
const provider = process.env.CARD_ART_PROVIDER ?? "gemini";
const targetUrl = normalizeBaseUrl(process.env.MVP_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5173}`);
const outputPath = process.env.CARD_ART_OUTPUT ?? ".local-tools/card-art-provider-smoke.png";
const negativePrompt =
  process.env.CARD_ART_NEGATIVE_PROMPT ||
  [
    "text, letters, caption, logo, watermark, signature, readable signage",
    "card frame, trading card, card border, UI border, stat panel, nameplate, label, title text",
    "extra foreground person, second main character, duplicate person, crowd in foreground",
    "different person, unrecognizable face, distorted face, asymmetrical eyes",
    "bad anatomy, deformed hands, mutated fingers, extra hand, extra arm, extra fingers, missing fingers",
    "twisted arm, broken wrist, dislocated shoulder, unnatural neck, warped torso, cropped head",
    "low quality, blurry face, raw camera snapshot, plain photo retouch"
  ].join(", ");

if (!sourcePath) {
  console.error("Usage: node tools/card-art-provider-smoke.mjs /path/to/source-image");
  process.exit(1);
}

const absoluteSourcePath = resolve(sourcePath);
if (!existsSync(absoluteSourcePath)) {
  console.error(`Source image not found: ${absoluteSourcePath}`);
  process.exit(1);
}

const imageDataUrl = toDataUrl(absoluteSourcePath);
const visionResult = await getVisionTags(imageDataUrl);
const prompt = buildPrompt(visionResult);

const response = await fetch(`${targetUrl}/api/card-art`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    provider,
    imageDataUrl,
    prompt,
    negativePrompt,
    aspectRatio: process.env.CARD_ART_ASPECT_RATIO ?? process.env.GEMINI_IMAGE_ASPECT_RATIO ?? "3:4",
    imageSize: process.env.CARD_ART_IMAGE_SIZE ?? process.env.GEMINI_IMAGE_SIZE ?? "1K",
    size: process.env.CARD_ART_OPENAI_SIZE ?? "1024x1536",
    quality: process.env.CARD_ART_OPENAI_QUALITY ?? "medium",
    inputFidelity: process.env.CARD_ART_OPENAI_INPUT_FIDELITY ?? "high",
    seed: Number(process.env.CARD_ART_SEED ?? 2026091401),
    width: Number(process.env.CARD_ART_WIDTH ?? 768),
    height: Number(process.env.CARD_ART_HEIGHT ?? 1024),
    denoise: Number(process.env.CARD_ART_DENOISE ?? process.env.COMFYUI_DENOISE ?? 0.55)
  }),
  signal: AbortSignal.timeout(Number(process.env.CARD_ART_TIMEOUT_MS ?? 180000))
});

const payload = await response.json().catch(() => ({}));
if (!response.ok || !payload.imageDataUrl) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        status: response.status,
        targetUrl,
        provider,
        source: basename(absoluteSourcePath),
        details: payload
      },
      null,
      2
    )
  );
  process.exit(1);
}

const match = /^data:image\/(png|jpeg|jpg|webp);base64,([\s\S]+)$/i.exec(payload.imageDataUrl);
if (!match) {
  console.error("Response imageDataUrl is not a supported image data URL.");
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, Buffer.from(match[2], "base64"));
writeFileSync(`${outputPath}.vlm.json`, JSON.stringify(visionResult, null, 2));
console.log(
  JSON.stringify(
    {
      ok: true,
      targetUrl,
      source: basename(absoluteSourcePath),
      outputPath,
      provider: payload.provider,
      upstreamProvider: payload.upstreamProvider ?? null,
      model: payload.model ?? null,
      vlmProvider: visionResult.provider ?? null,
      vlmModel: visionResult.model ?? null,
      vlmTags: Array.isArray(visionResult.tags) ? visionResult.tags.slice(0, 12) : [],
      promptId: payload.promptId ?? null,
      interactionId: payload.interactionId ?? null
    },
    null,
    2
  )
);

function toDataUrl(filePath) {
  const extension = extname(filePath).toLowerCase();
  const mimeByExtension = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp"
  };
  const mime = mimeByExtension[extension];
  if (!mime) {
    throw new Error(`Unsupported image extension: ${extension}`);
  }
  return `data:${mime};base64,${readFileSync(filePath).toString("base64")}`;
}

async function getVisionTags(imageDataUrl) {
  if (process.env.CARD_ART_USE_VLM === "0") {
    return {
      ok: false,
      provider: "disabled",
      model: null,
      warning: "CARD_ART_USE_VLM=0; this is not a complete core gameplay generation path.",
      tags: [],
      groups: {}
    };
  }

  const response = await fetch(`${targetUrl}/api/vision-tags`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      imageDataUrl,
      subjectFocus: {
        kind: "center_primary_subject",
        instruction: "Analyze only visible, non-sensitive cues useful for character generation: appearance, pose, clothing, objects, scene, lighting, and composition."
      }
    }),
    signal: AbortSignal.timeout(Number(process.env.CARD_ART_VLM_TIMEOUT_MS ?? 120000))
  });
  const payload = await response.json().catch(() => ({}));
  if (response.ok && payload.ok) {
    return payload;
  }

  if (process.env.CARD_ART_ALLOW_VLM_FALLBACK === "1") {
    return {
      ok: false,
      provider: "vlm_failed_allowed_fallback",
      model: payload.model ?? null,
      warning: "VLM failed and CARD_ART_ALLOW_VLM_FALLBACK=1 was set. This output is not a complete core gameplay generation path.",
      error: payload.error ?? `http_${response.status}`,
      message: payload.message ?? "VLM request failed.",
      tags: [],
      groups: {}
    };
  }

  console.error(
    JSON.stringify(
      {
        ok: false,
        stage: "vision-tags",
        status: response.status,
        targetUrl,
        details: payload
      },
      null,
      2
    )
  );
  process.exit(1);
}

function buildPrompt(visionResult) {
  const basePrompt =
    process.env.CARD_ART_PROMPT ||
    [
      "card-art-prompt-v2.7-vlm-first-battle-card-portrait-layer",
      "CHARACTER FORM BRANCH: humanlike",
      "ROLE/PURPOSE: production character portrait art layer for a high-energy battle-card game; the card frame, rarity badge, stats, skill boxes, and all text are rendered separately by Godot.",
      "SOURCE PIPELINE LOCK: use the VLM visible semantic tags below as the primary non-sensitive source-photo reading. Do not invent unrelated clothing, scene, pose, or objects that contradict those tags.",
      "SUBJECT: one target subject only, the same consenting person from the source photo, remade as a stylish battle-card hero.",
      "IDENTITY LOCK: preserve recognizable visible cues from the source photo and VLM tags: face shape impression, sunglasses/eyewear if present, hair impression, outfit colors, accessory impression, pose attitude, and scene energy.",
      "POSE INTENT: derive the initial pose from VLM activity/composition/personAppearance tags; keep believable anatomy and natural hand structure.",
      "SCENE REMAKE: use VLM scene, lighting, and visual-signal tags as inspiration, not as a literal photo trace; transform the subject into a new illustrated character portrait with energetic battle-card lighting.",
      "ART DIRECTION: high-contrast anime-real mobile RPG illustration, sharp focal face, clean readable silhouette, saturated cyan/magenta/gold rim light, polished card-game character art, dramatic but not cluttered.",
      "TECHNICAL OUTPUT: full-bleed portrait art layer, no card border, no UI, no text, no readable signage, no stat panel, no logo, no watermark.",
      "COMPOSITION LOCK: exactly one foreground character, centered face and upper body, leave room around the head and shoulders for a later Godot card frame crop.",
      "MODEL GUIDANCE: prioritize likeness, VLM-confirmed visual cues, believable human anatomy, clean hands, and a premium battle-card art finish; avoid plain photo retouching."
    ].join("\n");

  return [basePrompt, formatVisionPromptBlock(visionResult)].filter(Boolean).join("\n\n");
}

function formatVisionPromptBlock(visionResult) {
  const groups = visionResult?.groups ?? {};
  const lines = ["VLM VISIBLE SEMANTIC TAGS:"];
  for (const [key, values] of Object.entries(groups)) {
    if (!Array.isArray(values) || values.length === 0) continue;
    lines.push(`${key}: ${values.slice(0, 8).join(", ")}`);
  }
  if (lines.length === 1 && Array.isArray(visionResult?.tags) && visionResult.tags.length) {
    lines.push(`tags: ${visionResult.tags.slice(0, 16).join(", ")}`);
  }
  if (lines.length === 1) return "";
  return lines.join("\n");
}

function normalizeBaseUrl(value) {
  return String(value).replace(/\/+$/u, "");
}

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = value.replace(/^["']|["']$/gu, "");
  }
}
