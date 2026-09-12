import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env");

const sourcePath = process.argv[2];
const targetUrl = normalizeBaseUrl(process.env.MVP_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5173}`);
const outputDir = process.env.COMFY_STYLE_OUTPUT_DIR ?? ".local-tools/style-comparison";

if (!sourcePath) {
  console.error("Usage: node tools/comfy-style-comparison.mjs /path/to/source-image");
  process.exit(1);
}

const absoluteSourcePath = resolve(sourcePath);
if (!existsSync(absoluteSourcePath)) {
  console.error(`Source image not found: ${absoluteSourcePath}`);
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });

const sourceImageDataUrl = toDataUrl(absoluteSourcePath);
const baseNegativePrompt = [
  "text, letters, readable sign text, caption, logo, watermark, signature",
  "trading card, card frame, card border, decorative frame, UI border, stat panel, nameplate, label, title text",
  "extra foreground person, second main character, duplicate person, crowd in foreground",
  "bad anatomy, deformed hands, mutated fingers, extra hand, extra arm, extra leg, extra fingers, missing fingers",
  "fifteen fingers, too many fingers, six fingers, seven fingers, fused fingers, broken fingers, duplicated hands, duplicated arms",
  "twisted arm, broken wrist, dislocated shoulder, unnatural neck, warped torso, cropped head, impossible joints",
  "raw camera snapshot, plain photo retouch, low quality, blurry face, landscape-only image"
];

const humanlikeNegativePrompt = [
  "different face, wrong identity, face swap, distorted face, asymmetrical eyes, broken likeness"
];

const animalizedCatNegativePrompt = [
  "human body, human with cat ears, cat ears on human, person standing beside cat, pet beside person, extra cat, extra tail, extra paws"
];

const commonPrompt = [
  "ROLE/PURPOSE: preview character portrait art layer for a game character form-branch and style comparison; all frames, stats, rarity, and text will be rendered separately by the app.",
  "SOURCE PHOTO ROLE: use the source photo as visual and semantic reference according to the selected Character Form Branch; do not simply retouch the photo.",
  "VISIBLE SEMANTIC TAGS: 1980s arcade room, neon shapes without readable text, game cabinets, striped sleeveless jersey, handheld game controller, party energy, saturated retro colors, dark indoor background with bright arcade lighting.",
  "COMPOSITION: centered upper-body portrait, face is the sharp focal point, exactly one foreground character, no second person, no duplicate person, background is environment only.",
  "TECHNICAL OUTPUT: full-bleed 768x1024 portrait illustration layer, no border, no frame, no UI, no text, no logo, no watermark."
].join("\n");

const humanlikeBranchPrompt = [
  "CHARACTER FORM BRANCH: humanlike.",
  "SUBJECT: solo target subject only, the same person from the source photo remade as a fictional arcade-game character.",
  "IDENTITY LOCK: preserve recognizable facial likeness from the reference: face shape, jaw impression, eye and brow spacing, nose and mouth proportions, playful tongue-out expression, curly medium-brown hair, white headband, headphones around neck.",
  "ANATOMY GATE: one head, two arms, two hands, two legs when visible, normal shoulders and neck, five fingers per visible hand. No extra limbs, no duplicated hands, no fused fingers, no impossible joints.",
  "BODY PROPORTION LOCK: use the source photo as the proportion reference for the target subject: believable head size relative to torso, natural shoulder width, natural neck length, arms and hands scaled like a real person, no oversized or undersized limbs unless the selected style explicitly simplifies them while staying anatomically readable.",
  "FACE PROPORTION LOCK: preserve the source face proportion map: similar face length and width impression, eye spacing, brow-to-eye distance, nose length and width impression, mouth placement, jaw/chin impression, and expression character. Do not replace the face with a generic stranger."
].join("\n");

const animalizedCatBranchPrompt = [
  "CHARACTER FORM BRANCH: animalized.cat.",
  "SUBJECT: one solo cat protagonist created from the source person's visual cues. The subject is a cat first, not a human with cat ears.",
  "FEATURE TRANSFER LOCK: transfer the person's identity cues onto the cat: curly medium-brown hair tuft, white headband, headphones around neck, striped sleeveless jersey pattern, playful tongue-out attitude, handheld game controller prop, retro arcade energy.",
  "CAT ANATOMY GATE: one cat head, two ears, one tail, two front paws, and two hind legs, or a clearly readable two-arm two-leg mascot body. No extra paws, no extra tails, no human fingers multiplied on paws.",
  "CAT PROPORTION LOCK: use believable cat or mascot proportions. The source photo informs accessories, attitude, color, and prop design, not a human face pasted onto a cat."
].join("\n");

const styleVariants = [
  {
    id: "american-flat-cartoon",
    title: "American Flat Cartoon",
    formBranch: "humanlike",
    branchPrompt: humanlikeBranchPrompt,
    negativePrompt: humanlikeNegativePrompt,
    prompt: [
      "STYLE TARGET: original American flat fantasy cartoon character design.",
      "ART DIRECTION: simple geometric shapes, thick clean black outlines, flat color fills, minimal shadows, playful exaggerated expression, rounded readable silhouette, bright candy-color palette.",
      "TRANSFORMATION: convert the arcade photo into a whimsical cartoon adventurer while keeping the subject's hair, headband, headphones, jersey stripes, controller, and face-expression cues recognizable.",
      "GAME-SCALE READ: face, headband, headphones, striped jersey, and controller must read clearly at card thumbnail size."
    ].join("\n")
  },
  {
    id: "cat-main-avatar",
    title: "Cat Main Avatar",
    formBranch: "animalized.cat",
    branchPrompt: animalizedCatBranchPrompt,
    negativePrompt: animalizedCatNegativePrompt,
    prompt: [
      "STYLE TARGET: a cat is the main character, designed from the person's identity cues.",
      "ART DIRECTION: clean stylized animal character illustration, soft rounded cat body, expressive cat face, lively eyes, playful arcade mascot finish, readable silhouette.",
      "BOUNDARY: the output must be a cat character first, not a human with cat ears; preserve the person's recognizable styling and attitude through accessories, expression, hair tuft, clothing pattern, and prop."
    ].join("\n")
  },
  {
    id: "neon-arcade-hero",
    title: "Neon Arcade Hero",
    formBranch: "humanlike",
    branchPrompt: humanlikeBranchPrompt,
    negativePrompt: humanlikeNegativePrompt,
    prompt: [
      "STYLE TARGET: high-energy neon arcade hero portrait.",
      "ART DIRECTION: cel-shaded comic/anime game illustration, strong rim light, saturated magenta-cyan-yellow accents, crisp facial focus, dramatic arcade glow, energetic but readable pose.",
      "TRANSFORMATION: remake the subject as an arcade challenger hero holding a controller, with neon cabinet shapes and retro lighting behind them, while preserving facial identity and the source-photo character cues.",
      "GAME-SCALE READ: heroic face, headband, headphones, jersey stripes, and controller must remain clear under future card UI."
    ].join("\n")
  },
  {
    id: "designer-toy-sticker",
    title: "Designer Toy Sticker",
    formBranch: "humanlike",
    branchPrompt: humanlikeBranchPrompt,
    negativePrompt: humanlikeNegativePrompt,
    prompt: [
      "STYLE TARGET: collectible designer-toy style character portrait for a mobile game.",
      "ART DIRECTION: simplified big-head proportions, clean vector-like edges, glossy toy-like shading, compact silhouette, bold accent colors, charming collectible mascot energy.",
      "TRANSFORMATION: turn the subject into a toyetic arcade mascot with recognizable hair, headband, headphones, striped jersey, controller, and playful tongue-out expression.",
      "GAME-SCALE READ: strong silhouette and iconic personal accessories should be readable even as a small card portrait."
    ].join("\n")
  }
];

const variants = selectVariants(process.env.COMFY_STYLE_VARIANTS);

for (const [index, variant] of variants.entries()) {
  const seed = Number(process.env.COMFY_STYLE_SEED ?? 2026091201) + index;
  const outputPath = join(outputDir, `${variant.id}.png`);
  const prompt = [
    `card-art-style-comparison-${variant.id}`,
    commonPrompt,
    variant.branchPrompt,
    variant.prompt,
    "MODEL GUIDANCE: follow the selected Character Form Branch first, then the selected art style; avoid plain photo retouching; render only the solo character portrait scene, never a poster, never a framed collectible, never interface art."
  ].join("\n");
  const negativePrompt = [...baseNegativePrompt, ...(variant.negativePrompt ?? [])].join(", ");

  console.log(JSON.stringify({ started: variant.id, title: variant.title, formBranch: variant.formBranch, seed, outputPath }));
  const response = await fetch(`${targetUrl}/api/comfy-card-art`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      imageDataUrl: sourceImageDataUrl,
      prompt,
      negativePrompt,
      seed,
      width: Number(process.env.COMFY_STYLE_WIDTH ?? 768),
      height: Number(process.env.COMFY_STYLE_HEIGHT ?? 1024),
      denoise: Number(process.env.COMFY_STYLE_DENOISE ?? 1),
      loraStrength: Number(process.env.COMFY_STYLE_LORA_STRENGTH ?? 0.6),
      ipadapterWeight: Number(process.env.COMFY_STYLE_IPADAPTER_WEIGHT ?? 1.05),
      faceidv2Weight: Number(process.env.COMFY_STYLE_FACEIDV2_WEIGHT ?? 2.25)
    }),
    signal: AbortSignal.timeout(Number(process.env.COMFY_STYLE_TIMEOUT_MS ?? 300000))
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
          variant: variant.id,
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
    console.error(`Response imageDataUrl is not a supported image data URL for ${variant.id}.`);
    process.exit(1);
  }

  writeFileSync(outputPath, Buffer.from(match[1], "base64"));
  console.log(
    JSON.stringify(
      {
        ok: true,
        variant: variant.id,
        title: variant.title,
        formBranch: variant.formBranch,
        outputPath,
        provider: payload.provider,
        promptId: payload.promptId,
        workflow: payload.workflow,
        output: payload.output
      },
      null,
      2
    )
  );
}

function selectVariants(rawValue) {
  if (!rawValue) return styleVariants;
  const ids = new Set(rawValue.split(",").map((value) => value.trim()).filter(Boolean));
  const selected = styleVariants.filter((variant) => ids.has(variant.id));
  if (selected.length === 0) {
    throw new Error(`No matching variants for COMFY_STYLE_VARIANTS=${rawValue}`);
  }
  return selected;
}

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
