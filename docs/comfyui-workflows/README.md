# ComfyUI Workflow Contract

This folder is for exported ComfyUI API workflow JSON files used by the local MVP.

Do not commit large model files here. Keep only small workflow JSON files and notes.

## Required Setup

Set this in `.env.local`:

```text
COMFYUI_WORKFLOW_PATH=/absolute/path/to/comfyui-api-workflow.json
```

Then open the browser MVP with:

```text
http://127.0.0.1:5173/?imageMode=comfy
```

## Placeholder Contract

The Node adapter replaces these placeholders before submitting the workflow to ComfyUI:

```text
__SOURCE_IMAGE__       uploaded input image name; required
__PROMPT__             Character Spec prompt; required
__NEGATIVE_PROMPT__    negative prompt; optional
__SEED__               numeric seed; optional
__WIDTH__              numeric output width; optional
__HEIGHT__             numeric output height; optional
__DENOISE__            img2img source-photo strength balance or txt2img full denoise; optional
__LORA_STRENGTH__      FaceID LoRA strength; optional
__IPADAPTER_WEIGHT__   reference-image conditioning strength; optional
__FACEIDV2_WEIGHT__    FaceID v2 identity embedding strength; optional
```

The workflow should output at least one image through a normal ComfyUI save or preview image node.

## Current Target

The lightest SDXL smoke workflow already proved that the app can talk to ComfyUI. The next serious quality target is Flux Kontext GGUF:

```text
Source Photo
  -> VLM Visible Semantic Tags
  -> Character Spec prompt
  -> Flux Kontext image-to-image workflow
  -> card portrait output
```

Keep HP, ATK, DEF, COST, skill names, and readable card text outside the generated image. The game UI renders those values after the image returns.

Required model research target:

```text
.local-tools/ComfyUI/custom_nodes/ComfyUI-GGUF
.local-tools/ComfyUI/models/unet/flux1-kontext-dev-Q4_K_M.gguf
.local-tools/ComfyUI/models/text_encoders/t5-v1_1-xxl-encoder-Q4_K_M.gguf
.local-tools/ComfyUI/models/text_encoders/clip_l.safetensors
.local-tools/ComfyUI/models/vae/ae.safetensors
```

Download caution:

```text
Do not download the full Flux Kontext GGUF set unless the machine has enough free disk.
The Q4_K_M experiment needs about 10.4 GB before runtime cache/swap.
```

## Included Workflow

The first committed workflow is:

```text
sdxl-turbo-img2img-api.json
```

It uses:

```text
LoadImage
  -> ImageScale 768x1024 center crop
  -> VAEEncode
  -> KSampler
  -> VAEDecode
  -> SaveImage
```

Required checkpoint:

```text
.local-tools/ComfyUI/models/checkpoints/sd_xl_turbo_1.0_fp16.safetensors
```

Mac launch note:

```bash
npm run comfy:start
```

The project launch script includes `--fp32-vae` because this smoke workflow can produce near-black PNGs on Apple MPS when the VAE runs in lower precision.

Model source:

- https://huggingface.co/stabilityai/sdxl-turbo

License note:

- Hugging Face metadata lists SDXL Turbo as `sai-nc-community`.
- Use this workflow for local research and smoke testing. Re-check licensing before commercial release.

This is a smoke-test workflow, not final art direction. It proves that a source photo and Character Spec prompt can produce a new local AI portrait. Likeness control should improve later with IP-Adapter or another approved reference-conditioning workflow.

## Observed Smoke Result

On 2026-09-12, this workflow produced a valid 768x1024 PNG through `/api/comfy-card-art`.

Observed timing on MacBook Air M3 / 16 GB:

```text
First generation after model load: about 52 seconds
Warm generation: about 20 seconds
Warm generation with fp32 VAE: about 43 seconds
Current img2img denoise: 0.50
```

Observed tuning result:

```text
0.42 preserves source strongly but looks too photographic.
0.50 is the current MVP default.
0.62 creates more style but can replace the real location with unrelated scenery.
```

Acceptance status:

```text
Technical pipeline: passed
Final card-art quality: not approved yet
Final likeness preservation: failed for current SDXL Turbo img2img workflow; treat it as rejected
Black-image guard: browser falls back to Canvas if ComfyUI returns a near-black image
```

Do not treat this workflow as the production likeness path or visual baseline. It is now only the adapter smoke test. Likeness evaluation should compare the source photo directly against FaceID or other identity-conditioned outputs.

## FaceID Test Workflow

The next local likeness workflow is:

```text
sdxl-turbo-faceid-img2img-api.json
```

It adds:

```text
LoadImage
  -> ImageScale 768x1024 center crop
  -> VAEEncode
  -> ImageScale 768x768 center crop for FaceID reference
  -> IPAdapterUnifiedLoaderFaceID
  -> IPAdapterFaceID
  -> KSampler
  -> VAEDecode
  -> SaveImage
```

Required local files:

```text
.local-tools/ComfyUI/custom_nodes/ComfyUI_IPAdapter_plus
.local-tools/ComfyUI/models/clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors
.local-tools/ComfyUI/models/ipadapter/ip-adapter-faceid-plusv2_sdxl.bin
.local-tools/ComfyUI/models/loras/ip-adapter-faceid-plusv2_sdxl_lora.safetensors
```

Default tuning values:

```text
COMFYUI_DENOISE=0.55
COMFYUI_FACEID_LORA_STRENGTH=0.6
COMFYUI_IPADAPTER_WEIGHT=1.2
COMFYUI_FACEIDV2_WEIGHT=2.6
```

This workflow is still a local research workflow. It must be judged by native-size visual inspection against the source image before it is treated as the project direction.

Observed result on 2026-09-12:

```text
Technical pipeline: passed
First FaceID run: about 213 seconds, including one-time InsightFace buffalo_l setup
Warm FaceID run: about 166-180 seconds
Likeness: improved over plain SDXL Turbo img2img
Art direction: not approved; still too photographic for battle-card art
Square reference preprocessing: added 768x768 reference image to avoid implicit CLIP Vision center-crop warnings
```

Current interpretation:

```text
Use this workflow only as a historical identity-preservation and believable-anatomy baseline.
Do not treat SDXL Turbo FaceID output as final card art.
Current quality research has moved to Flux Kontext GGUF rather than continued SDXL prompt tuning.
```

## FaceID Reference-Only Txt2Img Workflow

This style-research workflow is:

```text
sdxl-turbo-faceid-txt2img-api.json
```

It uses the Source Photo only as a FaceID reference:

```text
LoadImage
  -> ImageScale 768x768 center crop for FaceID reference
  -> IPAdapterUnifiedLoaderFaceID
  -> IPAdapterFaceID

EmptyLatentImage 768x1024
  -> KSampler
  -> VAEDecode
  -> SaveImage
```

Default tuning values:

```text
COMFYUI_DENOISE=1
COMFYUI_FACEID_LORA_STRENGTH=0.6
COMFYUI_IPADAPTER_WEIGHT=1
COMFYUI_FACEIDV2_WEIGHT=2
```

Why this workflow exists:

```text
The prior FaceID img2img workflow preserved the uploaded photo too strongly and looked like a photo retouch.
The user-approved likeness target allows a new era, costume, background, and card-art scene as long as the facial identity remains recognizable.
This workflow tests whether reference-only FaceID can keep the face while allowing a stronger transformation.
```

Current caution:

```text
On close-up selfies with hands near the face, this workflow can invent distorted hands, duplicated arms, or unstable body structure.
Do not use it as the MVP default until pose/anatomy control is added.
```

Acceptance status:

```text
Technical pipeline: passed
Final card-art quality: not approved
Final likeness preservation: not approved
Reason: more style potential than FaceID img2img, but hands/body structure remain unreliable.
```
