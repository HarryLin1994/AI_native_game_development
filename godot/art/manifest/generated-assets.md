# Generated and Local Test Asset Provenance

This file tracks local test inputs and generated outputs that may feed the card-art workflow.

## 2026-09-14 IMG_5027 Test Run

Source input:

| File | Source | Use policy |
|---|---|---|
| `godot/art/source/source-photo-test/user-img-5027.jpg` | User-provided local photo, originally `~/Downloads/IMG_5027.JPG` | Local development source photo only. Do not treat as a shippable production asset without explicit approval. |

Generated character art:

| File | Tool/provider | Source input | Notes |
|---|---|---|---|
| `godot/art/source/generated-card-art/latest.jpg` | `/api/card-art`, Gemini `nano-banana-pro-preview` | `user-img-5027.jpg` | Current latest provider output used by the Godot card lab. |
| `godot/art/source/generated-card-art/img5027-gemini-portrait.jpg` | `/api/card-art`, Gemini `nano-banana-pro-preview` | `user-img-5027.jpg` | Named copy of the same generated portrait for review. |

Godot card composites:

| File | Tool | Source art | Notes |
|---|---|---|---|
| `godot/art/exports/card-face/card_art_lab_latest.png` | `res://tools/render_card_face.gd` | `generated-card-art/latest.jpg` | Latest Battle Card v1 render, can be overwritten by later runs. |
| `godot/art/exports/card-face/card_face_img5027_gemini_ur.png` | `res://tools/render_card_face.gd` | `generated-card-art/latest.jpg` | Named UR card-face output for this test run. |

Prompt/version note:

```text
card-art-prompt-v2.6-battle-card-portrait-layer
```
