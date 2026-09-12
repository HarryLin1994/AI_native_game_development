# Local Image Generation

This document records the current direction for generating battle card covers locally on a MacBook Air M3 with 16 GB memory.

## Decision

The product target is Picture generation card covers.

Canvas card rendering remains a fallback, not the ideal final look. The fallback is still important because the game loop should keep working even when local image generation is too slow, not installed, or out of memory.

比喻：Picture generation 像請畫師重新畫卡面；Canvas 像用設計模板排版。畫師效果更好，但模板比較穩。

The generated card art must preserve the consenting subject's broad likeness while transforming the Source Photo into a fictional game character. It should also reflect Character Spec fields created from photo details, OCR, User-Supplied Context, and optional Capture Context.

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

## Target Pipeline

```text
Source Photo
  -> OCR / Feature extraction
  -> User-Supplied Context
  -> optional Capture Context
  -> Character Spec
  -> prompt builder
  -> local image generation adapter
  -> generated character art
  -> card frame / UI composition
  -> Battle Card
```

The generated image should not be responsible for game rules. Stats, skills, rarity, and battle behavior come from Character Spec, not from judging the generated picture.

## Prompt Inputs

The prompt builder should combine these inputs:

- Identity Preservation: preserve broad likeness, pose impression, hairstyle, clothing cues, and other consent-based visible signals.
- Photo Details: palette, lighting, scene, OCR Text Seed, and notable non-sensitive visual details.
- User-Supplied Context: age impression, character background, real-world role, personality, preferences, and optional sensitive creative context.
- Capture Context: approximate time, location type, weather, and environment mood when available.
- Default Generation Template: neutral card-world defaults when optional data is missing.

Sensitive creative context must be explicit. The image pipeline must not infer sexuality, politics, religion, health, or other sensitive traits from the image.

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

### 3. MFLUX as Apple Silicon Native Option

MFLUX is interesting because it is built around Apple MLX and targets local generation on Mac. It can be a second research lane if ComfyUI is too heavy or if we want a more Mac-native pipeline.

Use it later for:

- Apple Silicon optimized generation
- command-line experiments
- quantized models
- image-to-image workflows

Source:

- https://github.com/mflux-community/mflux

## Candidate Models

### SD1.5 image-to-image

Best for the first local proof of concept.

Pros:

- Lighter than SDXL or FLUX.
- Many compatible checkpoints and LoRAs exist.
- Good enough to validate `photo -> Character Spec -> card art`.

Cons:

- Lower native image quality.
- Needs style tuning to feel like premium card art.

Use when:

- We want the first working local image generation pipeline.

Source:

- https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5

### SDXL-Lightning

Best next step after SD1.5 if the Mac handles it.

Pros:

- Designed for few-step generation.
- Can generate high-quality 1024px images in a few steps.
- Has ComfyUI checkpoint paths.

Cons:

- Heavier than SD1.5.
- Needs careful workflow settings.

Use when:

- We want a stronger card illustration result and can tolerate slower generation.

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
5. Call that workflow from our Node server.
6. Keep generation settings conservative.

Initial test settings:

- 768x1024
- one image
- SD1.5 img2img or SDXL-Lightning 4-step
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
- Should we start with SD1.5 for reliability or SDXL-Lightning for visual quality?
- Should ComfyUI run as a required local dependency or an optional adapter?
