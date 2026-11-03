# Reference Asset Manifest

This manifest tracks visual references copied into `godot/art/reference/`.

Reference images are for visual study only unless a later license/provenance note explicitly marks
them as production-safe. Do not ship copied reference images as game assets.

## UI References

| File | Source | Intended use | Status |
|---|---|---|---|
| `../reference/ui/battle-card-dokkan-style-filled-reference.png` | User-provided image on 2026-09-14, originally stored in `~/Downloads/8b2029d2-fcdc-47e3-bcf5-578854376989.png` | Primary filled Battle Card v1 visual target: title, rarity, attribute badge, character-art scale, stat plates, Lv row, stacked skill panels, description panel | Primary reference only |
| `../reference/ui/battle-card-dokkan-style-blank-template.png` | User-provided image on 2026-09-14, originally stored in `~/Downloads/1c4ea71e-ed87-499f-a2c4-e52ef69536b2.png` | Primary blank Battle Card v1 layout/chrome reference for rebuilding Godot/Blender layers | Primary reference only |
| `../reference/ui/character-library-gacha-card-list.webp` | User-provided reference image originally stored in `~/Downloads/what-are-some-of-the-rarest-cards-you-have-v0-3kvninhgqiz31.jpg.webp` | Character library density, rarity/stat layout study | Reference only |
| `../reference/ui/character-detail-gacha-card.jpeg` | User-provided reference image originally stored in `~/Downloads/5d84582338827b247e016ec8aa.png.jpeg` | Character detail page, large art and stat hierarchy study | Reference only |

## Style References

| File | Source | Intended use | Status |
|---|---|---|---|
| `../reference/style/neon-arcade-hero-v5.png` | Local generated comparison output from `.local-tools/style-comparison-v5/` | High-energy character/card mood reference | Reference only |
| `../reference/style/designer-toy-sticker-v5.png` | Local generated comparison output from `.local-tools/style-comparison-v5/` | Simplified silhouette and sticker-read reference | Reference only |
| `../reference/style/american-flat-cartoon-v5.png` | Local generated comparison output from `.local-tools/style-comparison-v5/` | Flat color and readable shape reference | Reference only |
| `../reference/style/cat-main-avatar-v5.png` | Local generated comparison output from `.local-tools/style-comparison-v5/` | Animalized avatar branch reference | Reference only |

## Production Rule

Assets in `reference/` can guide Godot and Blender work, but production files should be rebuilt or
generated into `source/` and `exports/` with their own license/provenance records.
