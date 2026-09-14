# Photo Character Lab MVP

本地可跑的簡版 MVP：用真實照片生成戰鬥卡牌封面、角色數值與技能。

目前圖像路線：

- 本機預覽：不需要 API Key，所有圖片處理都在瀏覽器用 Canvas 完成。
- Google Gemini / Nano Banana API：目前最高優先生圖方向。走統一 `Card Art Provider` 介面。
- OpenAI 圖片 API：可用同一個 `Card Art Provider` 介面做 A/B test，比較 likeness、語意轉換、速度與成本。
- ComfyUI 本機 AI 生圖：保留為 adapter baseline 與歷史測試路線。SDXL Turbo / FaceID 已降為歷史 baseline；ComfyUI GGUF / Flux Kontext 因這台 Mac Air 上速度太慢，暫停。

## Run

### Mac 雙擊啟動

For true AI mode, create `.env.local` with:

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_TIMEOUT_MS=120000
GEMINI_API_KEY=your_api_key_here
GEMINI_IMAGE_MODEL=nano-banana-pro-preview
GEMINI_IMAGE_TIMEOUT_MS=120000
GEMINI_IMAGE_ASPECT_RATIO=3:4
GEMINI_IMAGE_SIZE=1K
GEMINI_IMAGE_MIME_TYPE=image/jpeg
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_MAPS_TIMEOUT_MS=8000
HOLIDAY_API_BASE_URL=https://date.nager.at/api/v3
HOLIDAY_API_TIMEOUT_MS=8000
COMFYUI_URL=http://127.0.0.1:8188
COMFYUI_TIMEOUT_MS=3000
COMFYUI_WORKFLOW_PATH=/absolute/path/to/comfyui-api-workflow.json
COMFYUI_GENERATION_TIMEOUT_MS=120000
COMFYUI_POLL_INTERVAL_MS=1000
VISION_VLM_URL=http://127.0.0.1:11434
VISION_VLM_MODEL=gemma3:4b
VISION_VLM_TIMEOUT_MS=90000
```

Double-click:

```text
start-mac.command
```

Then open:

```text
http://127.0.0.1:5173
```

## Godot Client Workspace

The Godot client shell is under:

```text
godot/project.godot
```

Open it with:

```bash
godot --editor godot/project.godot
```

The local MCP setup for Godot and Blender is recorded in [docs/GODOT_BLENDER_MCP_SETUP.md](docs/GODOT_BLENDER_MCP_SETUP.md).

### Terminal

```bash
npm run dev
```

Open `http://127.0.0.1:5173`.

### Character Form Branch Testing

The MVP can route prompt generation by character form branch without changing the UI surface:

```text
http://127.0.0.1:5173/?form=humanlike
http://127.0.0.1:5173/?form=animalized.cat
http://127.0.0.1:5173/?imageMode=gemini
http://127.0.0.1:5173/?imageMode=openai
```

Current branches:

- `humanlike`: preserve face likeness, source body proportion, and human anatomy.
- `animalized.cat`: generate a cat protagonist that transfers the person's visible cues through accessories, expression, outfit motifs, props, and scene energy.

This currently changes prompt construction and Character Spec metadata. Dedicated ComfyUI workflow routing per branch is the next step.

### Start Local ComfyUI

The local ComfyUI clone is installed under `.local-tools/ComfyUI` and ignored by git.

```bash
npm run comfy:start
```

On this Mac, the script starts ComfyUI with `--fp32-vae` to avoid near-black SDXL Turbo outputs on Apple MPS.

Current image-generation priority is recorded in [docs/LOCAL_IMAGE_GENERATION.md](docs/LOCAL_IMAGE_GENERATION.md). As of the latest direction, ComfyUI remains useful for adapter checks, but the active quality route has moved to cloud provider comparison with Gemini / Nano Banana and OpenAI because local Flux-family generation was not fast enough on this Mac Air.

Then check:

```bash
npm run comfy:status
```

Run an endpoint generation smoke test:

```bash
MVP_URL=http://127.0.0.1:5174 npm run comfy:generate-smoke -- /path/to/source-image.jpg
```

The smoke output is written to:

```text
.local-tools/comfy-smoke-output.png
```

### Cloud Card Art Providers

Gemini / Nano Banana and OpenAI are the current cloud image-generation lanes.

Enable it with:

```text
GEMINI_API_KEY=your_api_key_here
GEMINI_IMAGE_MODEL=nano-banana-pro-preview
OPENAI_API_KEY=your_api_key_here
OPENAI_IMAGE_MODEL=gpt-image-1
```

Then open:

```text
http://127.0.0.1:5173/?imageMode=gemini
http://127.0.0.1:5173/?imageMode=openai
```

Pipeline:

```text
Browser photo
  -> automatic Capture/Event Context
  -> VLM semantic tags and Character Spec
  -> POST /api/card-art
  -> Gemini Image API or OpenAI Image API
  -> browser receives generated character art
  -> app renders card frame, stats, and text
```

Automatic Capture/Event Context:

```text
Uploaded JPEG EXIF GPS/time or Browser Geolocation
  -> POST /api/capture-context
  -> Google reverse geocoding and Places Nearby Search when GOOGLE_MAPS_API_KEY is set
  -> internal location-hook fallback when no Maps key exists
  -> Nager.Date US public holiday lookup using generation-time current date
  -> Character Spec prompt hooks
```

Character setup fields now use VLM Creative Roll plus reviewable VLM-auto fields. The automatic context resolver can feed safe place/time/event context into the roll and deterministic rule tables. For the current MVP, holiday context is US-only and based on the real-world current date, not old photo EXIF dates. It does not infer sensitive creative context, and AI providers do not directly decide final game stats.
When `GOOGLE_MAPS_API_KEY` is missing, the fallback does not create a Google Maps URL from coordinates; it keeps the user inside the game flow.

Unified request shape:

```json
{
  "provider": "gemini",
  "imageDataUrl": "data:image/png;base64,...",
  "prompt": "card art prompt",
  "negativePrompt": "text, UI, card frame"
}
```

Provider comparison endpoint:

```text
POST /api/card-art-compare
providers: ["gemini", "openai"]
```

Default output request:

```text
aspect ratio: 3:4
image size: 1K
```

If a provider fails or the key is missing, the app falls back to the local Canvas preview.

## ComfyUI Smoke Test

Start ComfyUI locally, then run:

```bash
npm run comfy:status
```

Or with the MVP server running:

```bash
curl http://127.0.0.1:5173/api/comfy-status
```

This only checks whether the local ComfyUI server is reachable. It does not generate an image yet.

## Local VLM Semantic Tags

The MVP has a local VLM adapter for generating `Visible Semantic Tags` from the uploaded photo:

```text
Browser photo
  -> browser creates center subject crop
  -> POST /api/vision-tags automatically after upload/capture
  -> subject focus: center primary subject
  -> Ollama /api/chat
  -> JSON semantic tag groups
  -> browser fills VLM semantic candidates
```

The same local VLM runtime now also has a character setup candidate endpoint:

```text
Browser photo + analysis + capture/event context
  -> POST /api/questionnaire-candidates
  -> VLM Creative Roll
  -> 4 user-choice candidates each for ageImpression, values, weakness
  -> 4 system-story candidates for storyEvent
  -> future modal lets the user choose ageImpression, values, weakness
  -> system seed chooses one storyEvent
  -> VLM-auto fields for role, personality, specialty, combatStyle, signatureItem, cardMood
```

If the VLM is unavailable, `/api/questionnaire-candidates` returns deterministic safe fallback candidates so the game flow can continue. The fallback is for development continuity; the target product behavior is still VLM-first.

After upload/capture, the MVP asks for a short character name. Empty input defaults to `路人`, and generated card names must include that name.

Default configuration:

```text
VISION_VLM_URL=http://127.0.0.1:11434
VISION_VLM_MODEL=gemma3:4b
```

Install and start the local VLM runtime:

```bash
brew install ollama
OLLAMA_FLASH_ATTENTION=1 OLLAMA_KV_CACHE_TYPE=q8_0 ollama serve
ollama pull gemma3:4b
```

Check status:

```bash
curl http://127.0.0.1:5174/api/vision-tags-status
```

Why this exists: the user should not hand-write most semantic tags. Ollama gives the MVP a local HTTP model runtime so uploaded photos can stay on this Mac while the app extracts visible person appearance, scene, clothing, object, activity, lighting, composition, and visual-signal tags for the card prompt pipeline.

For multi-person photos, the current MVP sends a center subject crop plus the full image to the VLM. The crop is used for the card character's appearance, clothing, and subject-specific state. The full image is still used for world context, so other people can influence crowd, teammate, audience, group-scene, prop, lighting, and background tags without becoming the character's hair, expression, outfit, or accessories.

If Ollama is not running or the model is missing, the app shows a clear error. Manual calibration tags remain available so the prompt pipeline can still be tested.

## ComfyUI Local Generation

The project now has a local ComfyUI adapter:

```text
Browser photo
  -> POST /api/comfy-card-art
  -> ComfyUI /upload/image
  -> ComfyUI /prompt
  -> ComfyUI /history/{prompt_id}
  -> ComfyUI /view
  -> browser receives imageDataUrl
```

To enable it:

1. Start ComfyUI.
2. Download the model named by the workflow.
3. Use one of the research workflows under `docs/comfyui-workflows/`, or export a new API workflow JSON.
4. Set `COMFYUI_WORKFLOW_PATH` in `.env.local`.
5. Open the MVP with `?imageMode=comfy`, for example:

```text
http://127.0.0.1:5173/?imageMode=comfy
```

The workflow JSON should use these placeholders:

```text
__SOURCE_IMAGE__
__PROMPT__
__NEGATIVE_PROMPT__
__SEED__
__WIDTH__
__HEIGHT__
```

`__SOURCE_IMAGE__` and `__PROMPT__` are required. The other placeholders are optional.

If ComfyUI is not running, the workflow is missing, generation fails, or ComfyUI returns a near-black image, the browser falls back to the local Canvas card preview.

Historical first smoke workflow:

```text
docs/comfyui-workflows/sdxl-turbo-img2img-api.json
```

It expects this checkpoint in ComfyUI:

```text
.local-tools/ComfyUI/models/checkpoints/sd_xl_turbo_1.0_fp16.safetensors
```

SDXL Turbo is retained as a local research/smoke-test baseline. Current quality research has moved to the unified cloud provider path because SDXL Turbo / FaceID did not satisfy the project's likeness-plus-remake goal, and local Flux-family generation was too slow on this Mac Air. Re-check every model license before any commercial release.

Observed on this Mac Air:

```text
ComfyUI 0.35.0
PyTorch 2.14.0
Device: mps
First SDXL Turbo endpoint generation: about 52s
Warm endpoint generation: about 20s
Current img2img denoise: 0.50
Output: 768x1024 PNG
```

## Current Scope

- Browser-only image upload and camera capture.
- iOS and Mac validation through the browser, with Mac acting as the local AI workstation.
- Canvas-based visual feature extraction: dominant colors, brightness, contrast, saturation, edge density, center focus, symmetry, and optional OCR text seed.
- VLM semantic tag candidate endpoint at `/api/vision-tags`, using local Ollama when available.
- Unified card-art endpoint at `/api/card-art`, supporting `gemini`, `openai`, and `comfy`.
- Provider comparison endpoint at `/api/card-art-compare`, supporting explicit A/B runs such as `["gemini", "openai"]`.
- Hidden/default generation profile for the current card-first UI.
- Deterministic character spec generation from image features.
- True AI retouched portrait through the local Node proxy when `OPENAI_API_KEY` is configured.
- ComfyUI status check endpoint at `/api/comfy-status`.
- ComfyUI card-art endpoint at `/api/comfy-card-art`, gated by `COMFYUI_WORKFLOW_PATH`.
- FaceID-conditioned ComfyUI workflows under `docs/comfyui-workflows/` for historical likeness tests.
- ComfyUI-GGUF installed under `.local-tools/ComfyUI/custom_nodes/ComfyUI-GGUF` as a paused research path; the GGUF model files were removed after the speed test.
- Local Canvas preview fallback when AI is not configured.
- Battle card cover generated locally with Canvas.
- Local character library saved in `localStorage`.
- Turn-based battle loop with XP, wins, losses, and level ups.

## Not Yet Included

- Real OCR engine.
- Person identity recognition.
- Server-authoritative battle validation.
- Account system and multiplayer matchmaking.
- Real OCR engine integration.
- A committed production image-generation workflow and approved downloaded image-generation models.
- On-device iOS image generation.

The MVP intentionally avoids identity recognition. Later phases should use consent-based, privacy-first analysis and only store required non-sensitive features unless a player explicitly chooses otherwise.
