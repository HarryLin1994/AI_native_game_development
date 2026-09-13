import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env");

const sourcePath = process.argv[2];
const targetUrl = normalizeBaseUrl(process.env.MVP_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5173}`);
const outputPath = process.env.COMFY_SMOKE_OUTPUT ?? ".local-tools/comfy-smoke-output.png";
const prompt = process.env.COMFY_SMOKE_PROMPT || [
  "card-art-prompt-v2.4-form-branches",
  "CHARACTER FORM BRANCH: humanlike",
  "ROLE/PURPOSE: production character portrait art layer for game UI composition; the card frame and text will be rendered separately by the app",
  "SUBJECT: one target subject only, the same consenting person from the source photo, remade as an arcade game character challenger",
  "ANATOMY LOCK: preserve the source photo's believable human pose structure; natural hand placement, natural wrist angles, normal shoulder and neck connection, no extra limbs, no duplicated hands",
  "SOURCE PROPORTION LOCK: preserve believable head size relative to torso, shoulder width, neck length, arm scale, hand scale, and face proportion map from the source photo",
  "IDENTITY LOCK: preserve recognizable facial likeness from the source reference: face shape, jaw impression, eye and brow spacing, nose and mouth proportions, expression character",
  "TARGET SUBJECT VISIBLE CUES: appearance [visible face, playful expression, curly medium-brown hair, white headband, headphones around neck]; clothing [striped sleeveless jersey, retro sporty outfit]; props [handheld game controller]",
  "WORLD CONTEXT FROM PHOTO: scene [1980s arcade room, neon room]; objects [arcade machines, neon cabinet shapes]; lighting [dark indoor room with saturated neon lighting]; visual signal [retro party energy]",
  "SCENE REMAKE: use the world context as inspiration, not as a literal photo trace; transform the subject into a new humanlike arcade challenger portrait",
  "ART DIRECTION: neon arcade game-character portrait, high-contrast anime-real illustration, heroic upper-body crop, clean readable silhouette, sharp focal face, controlled detail density, dramatic rim light",
  "TECHNICAL OUTPUT: full-bleed 768x1024 portrait art layer, no card frame, no UI, no text, no stat panel, no logo, no watermark",
  "COMPOSITION LOCK: single foreground character, centered face and torso, dynamic but readable pose, background supports the subject, do not draw a trading card, do not draw a card border, no extra foreground people",
  "MODEL GUIDANCE: prioritize face likeness and believable human anatomy over style change; keep face recognizable; avoid over-transforming the body"
].join("\n");
const negativePrompt =
  process.env.COMFY_SMOKE_NEGATIVE_PROMPT ||
  "text, letters, caption, logo, watermark, signature, card frame, trading card, card border, decorative frame, tarot frame, ornate border, UI border, stat panel, nameplate, label, title text, text banner, gibberish text, extra foreground person, second main character, duplicate person, crowd in foreground, different face, face swap, identity document, distorted face, asymmetrical eyes, bad anatomy, deformed hands, mutated fingers, extra hand, extra arm, extra fingers, missing fingers, twisted arm, broken wrist, dislocated shoulder, unnatural neck, warped torso, cropped head, low quality, blurry face, raw camera snapshot, plain photo retouch, landscape-only image";

if (!sourcePath) {
  console.error("Usage: node tools/comfy-card-art-smoke.mjs /path/to/source-image");
  process.exit(1);
}

const absoluteSourcePath = resolve(sourcePath);
if (!existsSync(absoluteSourcePath)) {
  console.error(`Source image not found: ${absoluteSourcePath}`);
  process.exit(1);
}

const sourceImageDataUrl = toDataUrl(absoluteSourcePath);
const response = await fetch(`${targetUrl}/api/comfy-card-art`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    imageDataUrl: sourceImageDataUrl,
    prompt,
    negativePrompt,
    seed: Number(process.env.COMFY_SMOKE_SEED ?? 20260912),
    width: Number(process.env.COMFY_SMOKE_WIDTH ?? 768),
    height: Number(process.env.COMFY_SMOKE_HEIGHT ?? 1024),
    denoise: Number(process.env.COMFY_SMOKE_DENOISE ?? process.env.COMFYUI_DENOISE ?? 0.45),
    loraStrength: Number(process.env.COMFY_SMOKE_LORA_STRENGTH ?? 0.6),
    ipadapterWeight: Number(process.env.COMFY_SMOKE_IPADAPTER_WEIGHT ?? 1),
    faceidv2Weight: Number(process.env.COMFY_SMOKE_FACEIDV2_WEIGHT ?? 2)
  }),
  signal: AbortSignal.timeout(Number(process.env.COMFY_SMOKE_TIMEOUT_MS ?? process.env.COMFYUI_GENERATION_TIMEOUT_MS ?? 180000))
});

const payload = await response.json().catch(() => ({}));
if (!response.ok || !payload.imageDataUrl) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        status: response.status,
        targetUrl,
        source: basename(absoluteSourcePath),
        details: payload
      },
      null,
      2
    )
  );
  process.exit(1);
}

const match = /^data:image\/(?:png|jpeg|jpg|webp);base64,([\s\S]+)$/i.exec(payload.imageDataUrl);
if (!match) {
  console.error("Response imageDataUrl is not a supported image data URL.");
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, Buffer.from(match[1], "base64"));
console.log(
  JSON.stringify(
    {
      ok: true,
      targetUrl,
      source: basename(absoluteSourcePath),
      outputPath,
      provider: payload.provider,
      promptId: payload.promptId,
      sourceDebug: payload.source?.debugPath ?? null,
      workflow: payload.workflow,
      output: payload.output
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
