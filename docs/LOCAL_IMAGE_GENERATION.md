# Local Image Generation

This document records the current direction for generating battle card covers locally on a MacBook Air M3 with 16 GB memory.

## Decision

The product target is Picture generation card covers.

Canvas card rendering remains a fallback, not the ideal final look. The fallback is still important because the game loop should keep working even when local image generation is too slow, not installed, or out of memory.

比喻：Picture generation 像請畫師重新畫卡面；Canvas 像用設計模板排版。畫師效果更好，但模板比較穩。

The generated card art must preserve the consenting subject's broad likeness while transforming the Source Photo into a fictional game character. It should also reflect Character Spec fields created from photo details, OCR, User-Supplied Context, and optional Capture Context.

Current acceptance gates are defined in [IMAGE_PIPELINE_ACCEPTANCE.md](./IMAGE_PIPELINE_ACCEPTANCE.md). Use that document before approving any generated image or resuming battle/UI work.

## Identity Preservation Target

The current likeness target is not a mild photo filter. A good result may change era, costume, lighting, background, and world style, but the face should still feel like the same person.

Acceptance cues:

- Face shape and jaw impression remain recognizable.
- Eye shape, brow spacing, nose/mouth proportions, and smile/expression character stay close to the source.
- Hair, outfit, and scene can transform when the prompt asks for it, but should not replace the person's core facial identity.
- The output should look like a new character portrait, not only a retouched upload.

比喻：這比較像請同一位演員去演 80 年代街機電影，而不是把原本照片套濾鏡。演員的臉要像，但服裝、場景、燈光可以換。

This means the image-generation research should test two separate routes:

```text
Source Photo as canvas
  -> img2img
  -> stronger source-photo layout preservation, but easier to look like photo retouch

Source Photo as identity reference
  -> FaceID reference-only / txt2img
  -> stronger transformation potential, but identity conditioning must be judged carefully
```

## Hardware Constraint

Current development machine:

- MacBook Air
- Apple M3
- 16 GB memory

Expected practical limits:

- Generate one image at a time.
- Start with 768x1024 or 768x1152.
- Use low step counts first.
- Prefer image-to-image over text-to-image for this project because the Source Photo should guide the card cover.
- Keep Canvas fallback available.

## iOS / Mac Validation Boundary

The first system target is not a full on-device iOS AI stack.

Use this split for MVP validation:

```text
iOS Safari / Mac Browser
  -> photo capture or upload
  -> card preview and game interaction

Mac local server
  -> Node adapter
  -> Card Art Provider adapter
  -> Gemini / Nano Banana API or OpenAI Image API
  -> generated card art
```

The iPhone should first behave like the camera and game controller. The Mac should first behave like the local analysis, prompt, and game-rule workstation. On-device iOS generation with Core ML is a later productization path, not the first MVP path.

## Target Pipeline

```text
Source Photo
  -> OCR / Feature extraction
  -> User-Supplied Context
  -> optional Capture Context
  -> Character Spec
  -> prompt builder
  -> image generation adapter
  -> generated character art
  -> card frame / UI composition
  -> Battle Card
```

The generated image should not be responsible for game rules. Stats, skills, rarity, and battle behavior come from Character Spec, not from judging the generated picture.

## Prompt Inputs

The prompt builder should combine these inputs:

- Identity Preservation: preserve broad likeness, pose impression, hairstyle, clothing cues, and other consent-based visible signals.
- Photo Details: palette, lighting, scene, OCR Text Seed, Visible Semantic Tags, and notable non-sensitive visual details.
- User-Supplied Context: age impression, character background, real-world role, personality, preferences, and optional sensitive creative context.
- Capture Context: approximate time, location type, weather, and environment mood when available.
- Default Generation Template: neutral card-world defaults when optional data is missing.

`OCR Text Seed` means real visible text or symbols in the image. `Visible Semantic Tags` means visible scene/action/state clues such as basketball court, athlete, arcade room, holding a controller, sweaty, tired-looking, or post-game energy. Both can help remake the picture, but they must stay separate because they come from different model jobs.

Visible Semantic Tags must be passed into the picture-generation prompt, not only into stat or skill rules. Otherwise the Battle Card may have game mechanics derived from the photo while the generated art ignores the same photo meaning.

Sensitive creative context must be explicit. The image pipeline must not infer sexuality, politics, religion, health, or other sensitive traits from the image.

### Current Prompt Builder

Current browser prompt version:

```text
card-art-prompt-v2.1
```

This version uses model-friendly prompt blocks instead of one long natural-language instruction. It also avoids asking the image model to draw the final card frame because local SDXL-family models tend to invent borders and unreadable text when prompted with "card" language.

```text
ROLE/PURPOSE
SUBJECT
IDENTITY LOCK
TARGET SUBJECT VISIBLE CUES
CHARACTER SPEC
WORLD CONTEXT FROM PHOTO
SCENE REMAKE
ART DIRECTION
PALETTE
TECHNICAL OUTPUT
COMPOSITION LOCK
OUTFIT/PROP DIRECTION
MODEL GUIDANCE
```

The key split is:

```text
Target Subject cues
  -> personAppearance, clothing, subject-specific state

World Context cues
  -> scene, activity, object, lighting, composition, visualSignal
```

This matters because the generated card should not merge every person in a group photo into one character. The Target Subject becomes the character; the rest of the photo becomes environment, props, crowd, and mood.

Negative prompt v2 explicitly rejects:

```text
text, UI, trading card, card frame, decorative frame, text banner,
extra foreground person, second main character, duplicate person,
different face, face swap, distorted face,
raw camera snapshot, plain photo retouch
```

This improves prompt discipline, but it does not solve model capability limits by itself.

For Gemini / Nano Banana, keep avoid rules inside the positive instruction block. The project adapter sends one combined prompt that says what to create and what failures to avoid, such as "do not include readable text, UI, card frames, duplicate people, or distorted anatomy."

Recommended prompt rule:

```text
Use the source photo as the identity and visual reference.
Preserve broad likeness and recognizable cues of the consenting subject.
Transform the subject into a fictional battle-card character using the Character Spec.
Use user-supplied sensitive context only when explicitly provided.
Do not infer sensitive traits from appearance, location, or OCR text.
Keep readable card text outside the generated image unless explicitly requested.
```

## Recommended Path

### Current Pipeline Recommendation

Use this order for the project:

```text
Canvas fallback
  -> unified Card Art Provider
  -> Gemini / Nano Banana API or OpenAI Image API
  -> source photo + Character Spec prompt
  -> Card Cover returned to the browser
```

If the API is unavailable, too expensive, or the key is missing, fall back to:

```text
Canvas fallback
  -> ComfyUI / SDXL historical adapter baseline
  -> local model research only when explicitly reopened
```

The full model pipeline and source links are recorded in [SYSTEM_PIPELINE.md](./SYSTEM_PIPELINE.md).

### 0. Smoke Test Before Image Generation

Before downloading or tuning models, confirm that the local app can see ComfyUI.

Browser server endpoint:

```text
GET /api/comfy-status
```

CLI:

```bash
npm run comfy:status
```

Expected result when ComfyUI is running:

```json
{
  "ok": true,
  "url": "http://127.0.0.1:8188",
  "devices": []
}
```

This stage does not generate art. It only checks the first plug in the pipeline.

### 0.5 App Adapter Before Model Tuning

The MVP server now exposes:

```text
POST /api/comfy-card-art
```

Request shape:

```json
{
  "imageDataUrl": "data:image/png;base64,...",
  "prompt": "battle card portrait prompt",
  "negativePrompt": "text, logo, watermark",
  "seed": 1234,
  "width": 768,
  "height": 1024
}
```

Server-side flow:

```text
validate request
  -> upload source image to ComfyUI /upload/image
  -> load COMFYUI_WORKFLOW_PATH
  -> replace workflow placeholders
  -> submit /prompt
  -> poll /history/{prompt_id}
  -> fetch /view
  -> return imageDataUrl
```

The saved ComfyUI API workflow must contain at least:

```text
__SOURCE_IMAGE__
__PROMPT__
```

Optional placeholders:

```text
__NEGATIVE_PROMPT__
__SEED__
__WIDTH__
__HEIGHT__
```

The browser can test this route by opening:

```text
http://127.0.0.1:5173/?imageMode=comfy
```

If ComfyUI or the workflow is not available, the app falls back to Canvas output.

Current local installation path:

```text
.local-tools/ComfyUI
.local-tools/comfy-venv
```

Start command:

```bash
npm run comfy:start
```

On this Mac, `npm run comfy:start` launches ComfyUI with `--fp32-vae`. This is a stability setting for Apple MPS; without it, the SDXL Turbo smoke workflow can finish successfully but save a near-black PNG.

First smoke workflow:

```text
docs/comfyui-workflows/sdxl-turbo-img2img-api.json
```

First smoke checkpoint:

```text
.local-tools/ComfyUI/models/checkpoints/sd_xl_turbo_1.0_fp16.safetensors
```

Source:

- https://huggingface.co/stabilityai/sdxl-turbo

License note:

- Hugging Face metadata lists this model as `sai-nc-community`.
- Treat it as a local research/smoke-test model only. Re-check licensing before commercial release or replace it with a production-approved model.

Observed local result on 2026-09-12:

- Machine: MacBook Air M3, 16 GB unified memory.
- ComfyUI: 0.35.0.
- PyTorch: 2.14.0.
- Device: `mps`.
- ComfyUI launch args: `--listen 127.0.0.1 --port 8188 --fp32-vae`.
- Current SDXL Turbo img2img denoise: `0.50`.
- First endpoint generation after loading SDXL Turbo: about 52 seconds.
- Warm endpoint generation with model already loaded: about 20 seconds.
- Output: valid 768x1024 PNG.
- Quality note: this proves the local generation pipeline works. It does not yet prove final card-art quality or likeness preservation.

Tuning note from uploaded basketball-court selfie:

- `denoise 0.42`: best source preservation, but too close to a photo retouch.
- `denoise 0.50`: current MVP default; preserves the indoor court and broad likeness while adding mild illustration treatment.
- `denoise 0.62`: more illustrated, but changed the indoor basketball court into an unrelated beach scene, so it is not acceptable without stronger reference conditioning.

Baseline decision:

- Plain SDXL Turbo img2img is rejected for likeness. It is only a technical adapter smoke test.
- Do not use plain img2img output as the visual quality baseline or as a reference for later card art.
- Future comparisons should be `Source Photo -> identity-conditioned output`, not `Source Photo -> plain img2img -> identity-conditioned output`.

Identity acceptance note:

- Current SDXL Turbo img2img does **not** pass the game's core likeness requirement. It can preserve broad photo layout, hair, clothing, and place, but the generated face can drift too far from the source person.
- Do not spend more time trying to solve likeness only with prompt wording or denoise tuning.
- Current serious workflow target: `docs/comfyui-workflows/sdxl-turbo-faceid-img2img-api.json`, using IP-Adapter FaceID Plus v2 before judging the card-art direction again.

FaceID workflow result on 2026-09-12:

- Technical pipeline: passed.
- Required local components: `ComfyUI_IPAdapter_plus`, CLIP Vision ViT-H, IP-Adapter FaceID Plus v2 SDXL, FaceID Plus v2 SDXL LoRA, InsightFace `buffalo_l`.
- First FaceID generation took about 213 seconds, including one-time InsightFace setup.
- Warm FaceID generations took about 166-180 seconds on this Mac Air.
- Likeness improved over plain SDXL Turbo img2img.
- Visual style is still too photographic for final battle-card art.
- Follow-up testing with `docs/comfyui-workflows/sdxl-turbo-faceid-txt2img-api.json` showed stronger style potential, but it can invent distorted hands, arms, and body structure on close-up selfies. Because face similarity is the top priority and human anatomy must remain believable, the current MVP default is back to FaceID img2img with stronger FaceID weights and moderate denoise.

Current face-first ComfyUI default:

```text
COMFYUI_WORKFLOW_PATH=docs/comfyui-workflows/sdxl-turbo-faceid-img2img-api.json
COMFYUI_DENOISE=0.55
COMFYUI_FACEID_LORA_STRENGTH=0.6
COMFYUI_IPADAPTER_WEIGHT=1.2
COMFYUI_FACEIDV2_WEIGHT=2.6
```

Observed on `IMG_5027.JPG`:

- `FaceID txt2img`: more illustrated, but repeatedly invented extra/twisted hands and unstable body structure.
- `FaceID img2img`, `denoise 0.42`: strongest source structure and likeness, but too close to a photo.
- `FaceID img2img`, `denoise 0.55`: best current balance for face similarity plus believable human structure; still not final card-art stylization.

Humanlike arcade-photo comparison on 2026-09-13:

Test source:

```text
/Users/harrylin/Downloads/Gemini_Generated_Image_iko2o0iko2o0iko2.jpg
```

Outputs:

```text
.local-tools/humanlike-local-compare/arcade-faceid-img2img.png
.local-tools/humanlike-local-compare/arcade-faceid-txt2img.png
.local-tools/humanlike-local-compare/arcade-faceid-img2img-denoise70.png
.local-tools/humanlike-local-compare/arcade-cropped-faceid-img2img-denoise70.png
```

Observed result:

- `FaceID img2img`, `denoise 0.55`: strongest resemblance and source structure, but still looks like an edited photo and preserves too much background context.
- `FaceID txt2img`, `denoise 1`: stronger illustrated style, but still tends to create baked borders/fake text and unreliable hands/body structure.
- `FaceID img2img`, `denoise 0.70`: best local humanlike candidate so far for this arcade source. It is more illustrated and removed background people, while keeping stronger face/body continuity than txt2img. It still fails final quality because background fake text and hand structure remain unreliable.
- Naive subject crop + `FaceID img2img`, `denoise 0.70`: not approved. The output became more illustrated, but likeness weakened and the face was partly occluded. Simple cropping is not enough; subject isolation needs a better crop/mask strategy if used.

Decision:

```text
Current local humanlike direction:
  FaceID img2img around denoise 0.65-0.70
  -> useful short-term baseline
  -> not approved as final quality

Next real upgrade:
  Add pose/depth/anatomy control or a stronger illustration checkpoint/style LoRA.
```

Do not spend another cycle only increasing denoise or rewriting prompts for this workflow. The remaining failures are workflow/model-control limits.

### Gemini / Nano Banana API Pivot on 2026-09-13

Decision:

```text
SDXL Turbo / FaceID remains a historical baseline.
ComfyUI Flux Kontext GGUF is paused because it was too slow on this Mac Air.
MFLUX / MLX is not the MVP main path because local high-quality generation is still too heavy for this hardware.
The next highest-priority image-generation experiment is a cloud Card Art Provider comparison, starting with Google Gemini / Nano Banana API and OpenAI Image API.
```

Why:

- The current SDXL Turbo + FaceID path can improve likeness, but it still behaves like photo retouching or unstable txt2img.
- The game needs `photo + semantic tags + user context -> remade character art`, not a lightly edited photo.
- The ComfyUI GGUF implementation was not acceptable for interaction speed on this machine. A 4-step `880x1184` preview took about 12m34s.
- The Mac Air should spend its budget on local VLM/OCR/prompt/game rules, not on heavy image diffusion.
- Gemini / Nano Banana and OpenAI image editing are better aligned with the current MVP need: high-quality image editing/generation from a reference photo plus text prompt.

Primary research target:

```text
Source Photo
  -> VLM Visible Semantic Tags
  -> Character Spec prompt
  -> /api/card-art
  -> provider: gemini | openai
  -> generated character art layer
```

Required app support:

```text
GEMINI_API_KEY
GEMINI_IMAGE_MODEL=nano-banana-pro-preview
OPENAI_API_KEY
OPENAI_IMAGE_MODEL=gpt-image-1
GET /?imageMode=gemini
GET /?imageMode=openai
POST /api/card-art
POST /api/card-art-compare
```

Default output request:

```text
aspect ratio: 3:4
image size: 1K
```

Acceptance for the first provider smoke test:

- The result must keep recognizable facial identity better than SDXL txt2img.
- The result must remake the scene and role more strongly than SDXL FaceID img2img.
- The result must avoid fake card borders, fake UI panels, and readable nonsense text.
- Human anatomy must remain believable at card scale.
- Latency should be acceptable for a generate-and-review MVP loop.

Implementation note:

```text
The existing VLM, face/identity descriptor, semantic tags, Character Spec, and prompt builder remain valid.
Only the final image-generation adapter changes.
```

比喻：前面的偵查員、編劇、角色設定都不換；只是把最後的畫師從本地模型換成雲端 API。

## Model Capability Boundary

Prompt wording can improve:

- Whether VLM semantics appear in the generated art.
- Whether the model avoids card UI/text inside the image.
- Whether the output prioritizes one Target Subject.
- Whether the result leans more toward illustration than raw photo retouch.

Prompt wording cannot reliably solve:

- Strong facial likeness without identity/reference conditioning.
- Over-photographic output from an unsuitable checkpoint.
- Large style changes while preserving identity if the workflow has weak reference control.
- Stable hands, accessories, or exact clothing under very fast low-step models.

Therefore the current decision remains:

```text
Plain SDXL Turbo img2img
  -> adapter smoke test only

SDXL Turbo + FaceID img2img reference
  -> current identity/anatomy baseline

FaceID reference-only txt2img
  -> style research only until pose/anatomy control is added
```

Review page:

```text
.local-tools/comfy-faceid-review.html
```

Troubleshooting note:

- If the generated image is black, restart ComfyUI with `npm run comfy:start` and confirm `/api/comfy-status` reports `Device: mps` plus `--fp32-vae` in `argv`.
- The browser rejects near-black ComfyUI output and falls back to the local Canvas preview instead of showing a broken card.

### 1. ComfyUI First

ComfyUI is the best first integration target because it can run locally and exposes a local server API. Our Node server can eventually call ComfyUI instead of calling a cloud image API.

Useful local API routes include:

- `/upload/image`
- `/prompt`
- `/history/{prompt_id}`
- `/view`
- `/system_stats`

MVP integration shape:

```text
Photo Character Lab server
  -> upload source image to ComfyUI
  -> submit workflow prompt
  -> poll history
  -> fetch generated image
  -> return imageDataUrl to browser
```

Source:

- https://docs.comfy.org/development/comfyui-server/comms_routes
- https://github.com/Comfy-Org/ComfyUI

### 2. Draw Things for Manual Style Research

Draw Things should be used as a manual research tool before hardwiring a model pipeline.

Use it to test:

- image-to-image strength
- card illustration style
- prompt wording
- LoRA ideas
- whether Mac Air speed is acceptable

It is less ideal as our first programmatic backend, but very useful for finding the visual target.

Source:

- https://drawthings.ai/

### 3. Cloud Card Art Providers

Gemini / Nano Banana and OpenAI are the active quality research lanes because local generation is too heavy for the current Mac Air.

Use it now for:

- source-photo image editing/generation
- stronger portrait likeness than the local SDXL baseline
- faster MVP iteration than local Flux-family model tuning
- keeping Mac resources focused on VLM tags, prompt building, rules, and card UI
- side-by-side provider comparison using the same source photo and prompt

Current MVP route:

```text
POST /api/card-art
POST /api/card-art-compare
```

Current first target:

```text
GEMINI_IMAGE_MODEL=nano-banana-pro-preview
OPENAI_IMAGE_MODEL=gpt-image-1
aspect ratio: 3:4
image size: 1K
```

Sources:

- https://ai.google.dev/gemini-api/docs/image-generation
- https://platform.openai.com/docs/api-reference/images/createEdit

## Candidate Models

### SD1.5 image-to-image

Useful as the lightest local smoke test or fallback path.

Pros:

- Lighter than SDXL or FLUX.
- Many compatible checkpoints and LoRAs exist.
- Good enough to validate `photo -> Character Spec -> card art`.

Cons:

- Lower native image quality.
- Needs style tuning to feel like premium card art.

Use when:

- SDXL-Lightning is too slow or unstable on this Mac.
- We need to prove that the ComfyUI adapter works before tuning quality.

Source:

- https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5

### SDXL-Lightning

Best first serious card-art target if the Mac handles it.

Pros:

- Designed for few-step generation.
- Can generate high-quality 1024px images in a few steps.
- Has ComfyUI checkpoint paths.

Cons:

- Heavier than SD1.5.
- Needs careful workflow settings.

Use when:

- We want the first real local Picture generation card-cover path.
- We can tolerate slower generation than Canvas fallback.

Source:

- https://huggingface.co/ByteDance/SDXL-Lightning

### Stable Diffusion 3.5 Medium

Research candidate, not first MVP default.

Pros:

- Medium-sized modern model.
- Potentially stronger prompt following than older SD models.

Cons:

- License and local performance need project-specific review.
- More integration uncertainty than SD1.5 or SDXL-Lightning.

Source:

- https://huggingface.co/stabilityai/stable-diffusion-3.5-medium

### FLUX.1-schnell

High-quality research candidate, not first Mac Air target.

Pros:

- Strong visual quality.
- Apache 2.0 license.

Cons:

- Large model family; likely heavy for MacBook Air M3 16 GB.
- Better to test after the pipeline is already working.

Source:

- https://huggingface.co/black-forest-labs/FLUX.1-schnell

## First Experiment

The first local experiment should be intentionally small:

1. Install or run ComfyUI.
2. Generate one image manually from a simple workflow.
3. Try image-to-image using one Source Photo.
4. Save the working workflow JSON.
5. Call that workflow from our Node server through `/api/comfy-card-art`.
6. Keep generation settings conservative.

Initial test settings:

- 768x1024
- one image
- SDXL Turbo / Lightning style few-step img2img
- IP-Adapter FaceID reference conditioning when likeness is being judged
- fixed seed for repeatable testing
- no batch generation

Default template when optional context is missing:

```json
{
  "origin": "Localhost Training Gate",
  "timeMood": "present day",
  "placeType": "neutral arena",
  "weatherMood": "clear",
  "visualMood": "premium mobile RPG battle card",
  "mechanicBias": "balanced"
}
```

## Acceptance Criteria

The local image generation path is useful when:

- It can generate one card portrait from a Source Photo.
- The output returns to the browser as a usable image.
- The user can continue using Canvas fallback if generation fails.
- The generated image and Character Spec are saved separately.
- The process does not freeze the whole Mac during normal testing.

## Open Questions

- Should the card cover include readable text in the generated art, or should all text stay in HTML/Canvas UI layers?
- Should ComfyUI run as a required local dependency or an optional adapter?
