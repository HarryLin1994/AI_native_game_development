# Card Face Template Adaptation

This document records the selected card-face reference and the required project-specific changes.

## Decision

Use the two user-provided `Dokkan-like explosive battle card` images as the primary Battle Card v1
reference set:

```text
godot/art/reference/ui/battle-card-dokkan-style-filled-reference.png
godot/art/reference/ui/battle-card-dokkan-style-blank-template.png
```

Both images are `1024 x 1536 px`, a `2:3` tall card ratio. The filled reference is the visual
target. The blank template is the layout/chrome guide.

LadyLuck's `RPG Card Template - Persona Style` remains a secondary reference only:

```text
https://ladyluck.itch.io/rpg-card-template-persona-style
```

The project keeps the selected card direction `爆裂戰鬥卡框`, but the primary visual language is
now:

- full-bleed high-energy character art in the upper area
- jagged top-left nameplate with electric cyan/magenta accents
- top-right rarity badge and right-side attribute badge
- neon black/blue/magenta/gold beveled frame
- large slanted HP / ATK / DEF / AGI stat plates
- Lv row with current level, max level, and progress bar
- stacked skill panels with icon, skill name, and qualitative effect text
- bottom one-line character description panel

## Rarity Frame Rule

The outer card frame is rarity-driven. The frame shape stays consistent across the Battle Card v1
family, but the metal/neon accent colors change by rarity:

| Rarity | Frame treatment |
|---|---|
| `N` | bronze / copper |
| `R` | silver |
| `SR` | gold |
| `SSR` | purple |
| `UR` | current cyan / magenta / gold explosive template colors |

This is implemented in Godot as a rarity palette on `godot/scripts/card_art_lab.gd`. The top-right
rarity badge uses the same palette as the outer frame.

## Local Source

```text
godot/art/reference/ui/battle-card-dokkan-style-filled-reference.png
godot/art/reference/ui/battle-card-dokkan-style-blank-template.png
godot/art/source/card-frame/persona-template/persona_cardSD.psd
```

The user-provided PNG files are references unless later replaced by a layered source file or marked
production-safe. Functional text and stat values must be rebuilt in Godot, not shipped as baked
text from the reference images.

The project card ruler is now:

```text
1024 x 1536 px card body, 2:3 reference ratio
1120 x 1632 px exported frame/effect overlay, including 48 px bleed on each side
```

The final Godot card face must be rebuilt for this size instead of scaling the old Persona PSD or
directly flattening the PNG reference.

## Required Modifications

Battle Card v1 uses this information order:

```text
1. top-left card name in a jagged title plate
2. top-right rarity badge
3. right-side attribute badge
4. large character art window
5. HP / ATK / DEF / AGI numeric stat plates with filled bars
6. Lv current/max row plus progress bar
7. stacked skill slots
8. bottom character description
```

The template adaptation must add our own value bars:

```text
18200 HP  [filled bar]
15680 ATK [filled bar]
10420 DEF [filled bar]
22850 AGI [filled bar]
```

Rules:

- HP/ATK/DEF/AGI labels and numbers are native Godot text.
- Filled bars are native Godot UI or exported reusable bar layers, not baked per-card raster text.
- AGI is shown because it is battle-order-critical.
- `Lv. current / max` is native Godot text, with the max level controlled by rarity/evolution rules.
- Skill slots show skill name plus qualitative effect text only.
- Hidden combat formulas stay in rule data, not on the card face.
- Character description is one short line.

## V1 Layer Plan

For Godot/Blender implementation, split the card face into reusable layers:

| Layer | Type | Notes |
|---|---|---|
| `card_body_base` | Godot draw layer | 1024x1536 body, transparent-safe |
| `outer_burst_bleed` | exported PNG/WebP or shader/effect | 1120x1632 effect canvas |
| `title_plate` | Godot/Blender layer | jagged cyan/magenta nameplate |
| `rarity_badge` | Godot/Blender layer | top-right rarity badge, e.g. UR |
| `attribute_badge` | Godot/Blender layer | right-side attribute badge, e.g. AGI |
| `character_art_window` | Godot draw layer | large upper art area |
| `rarity_accent` | Godot color/style layer | N bronze, R silver, SR gold, SSR purple, UR cyan/magenta/gold |
| `stat_plate_background` | Godot Control/style | one slanted plate style for HP/ATK/DEF/AGI |
| `stat_bar_fill` | Godot Control/style | filled width driven by stat percentage |
| `level_panel` | Godot Control/style | Lv current/max plus progress bar |
| `skill_slot_panel` | Godot Control/style | stacked slots with icon/name/effect |
| `description_panel` | Godot Control/style | one-line description area |

## Current Status

- User-provided Dokkan-like filled reference and blank template are placed in
  `godot/art/reference/ui/`.
- Source PSD downloaded and placed in `godot/art/source/card-frame/persona-template/`.
- Provenance recorded in `godot/art/manifest/third-party-asset-provenance.md`.
- Blender exports `godot/art/exports/card-frame/burst_frame_overlay.png` from
  `tools/blender_generate_burst_card_frame.py`.
- Godot renders `godot/scenes/battle_card_face_lab.tscn` with local assets, native value bars,
  skill slots, and description text.
