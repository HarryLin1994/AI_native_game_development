# Third-Party Asset Provenance

This file records downloaded third-party art sources that are now part of the local asset
workspace. Keep this record beside the source files because exported card art may later derive
from these references.

## RazielNozac - Editable Reference Poses Pack

Source page:

```text
https://razielnozac.itch.io/reference-poses
```

Downloaded files:

| File | Project path | SHA-256 |
|---|---|---|
| `referencepose.zip` | `godot/art/_downloads/razielnozac-reference-poses/referencepose.zip` | `c5914b58397ae42c63cd87f80098107fa5a4ffbca9637f17bdf7c6f8de83c392` |
| `reference_face_64x64.rar` | `godot/art/_downloads/razielnozac-reference-poses/reference_face_64x64.rar` | `916fdedada1426d740f807be055890a4c3489109daa4b7ace6300ecc94ced52f` |
| `anime_style_head.rar` | `godot/art/_downloads/razielnozac-reference-poses/anime_style_head.rar` | `fdb5bfc38f670cc5d06de60b7cb8b3f819aeb642e74b7528bf74cb864ecb786e` |

Organized paths:

```text
godot/art/reference/pose/razielnozac-reference-poses/
godot/art/source/pose-catalog/razielnozac-reference-poses/raw/
godot/art/source/pose-catalog/*.png
```

License notes from the downloaded files:

- `referencepose/license.txt`: free use in any type of project, including commercial; may be
  used, modified, and distributed; attribution is optional.
- `reference_face_64x64/license.txt` and `anime_style_head/license.txt`: CC0; free for
  non-commercial and commercial projects; attribution optional.

Use policy for this project:

- Allowed as local source references for pose-catalog planning.
- Do not send the original pose PNGs directly to the image model until they are redrawn as
  gender-neutral mannequin/skeleton guides.
- Do not let the image model copy the pixel-art style, low resolution, baked colors, or sex-coded
  anatomy.
- Use the selected pose id and text cue only for body/action silhouette and camera rhythm for now.
- `src/card-generation/pose-reference.js` currently exposes a text-only catalog of body profile,
  occupation group, and evolution-stage pose candidates. These candidates may refer to pose
  families inspired by the source pack, but the original PNGs remain locked as
  `source_asset_requires_anatomy_neutralization`.
- The pose catalog does not decide battle stats or character identity.

Selected source pose files:

| Pose ID | Local file | Raw source |
|---|---|---|
| `power_charge_front_01` | `godot/art/source/pose-catalog/power_charge_front_01.png` | `raw/referencepose/png 256x288/body2 21.png` |
| `speed_lunge_diagonal_01` | `godot/art/source/pose-catalog/speed_lunge_diagonal_01.png` | `raw/referencepose/png 256x288/body2 41.png` |
| `guard_ready_front_01` | `godot/art/source/pose-catalog/guard_ready_front_01.png` | `raw/referencepose/png 256x288/body2 2.png` |
| `caster_focus_three_quarter_01` | `godot/art/source/pose-catalog/caster_focus_three_quarter_01.png` | `raw/referencepose/png 256x288/body2 39.png` |
| `playful_tilt_mascot_01` | `godot/art/source/pose-catalog/playful_tilt_mascot_01.png` | `raw/referencepose/png 256x288/body2 36.png` |
| `neutral_hero_center_01` | `godot/art/source/pose-catalog/neutral_hero_center_01.png` | `raw/referencepose/png 256x288/body2 7.png` |

Known limitation:

The pack is stronger for character display poses than explosive combat motion, and several poses
have visibly sex-coded body proportions. The v1 `speed_lunge_diagonal_01` is a usable diagonal
action stand-in, but a later asset pass should replace it with a stronger running/lunge silhouette
if we find a cohesive pack. Before any pose PNG is used as an image input to Gemini/OpenAI, it
should be neutralized into a mannequin/skeleton guide with no chest, waist, hip, or shoulder body
shape signal.

## LadyLuck - RPG Card Template - Persona Style

Source page:

```text
https://ladyluck.itch.io/rpg-card-template-persona-style
```

Downloaded file:

| File | Project path | SHA-256 |
|---|---|---|
| `persona_cardSD.psd` | `godot/art/_downloads/ladyluck-persona-card-template/persona_cardSD.psd` | `3b599d96e61e03a7418a0ab0a77be63a7144c862d8734c346f82c7093477890f` |

Organized source path:

```text
godot/art/source/card-frame/persona-template/persona_cardSD.psd
```

Source page notes:

- Free version: `320x480`.
- Paid HD version: `960x1440` and not downloaded.
- Character art is illustrative and not included.
- Page text says the file is fully customizable and can be used for commercial and personal
  projects.
- Page comments report PSD compatibility issues in some editors; Photopea may open it when other
  tools fail.

Use policy for this project:

- Treat the PSD as a visual/source template, not as a runtime card frame.
- Rebuild the card face in Godot/Blender at the project card ruler `1024x1536`.
- Keep dynamic text, numbers, skill descriptions, and HP/ATK/DEF/AGI value bars native in Godot.
- Do not bake final card stats or labels into raster art.
