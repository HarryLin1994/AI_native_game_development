# Free Burst Card Material Candidates

Goal: find free, legally usable materials that can support a `爆裂戰鬥卡框` direction similar in energy
to mobile anime battle-card games, without copying Dokkan Battle, Dragon Ball, or any protected UI/IP.

## Style Review Status

Current review decision:

- Most previously listed free packs are rejected for the current card-face milestone because their
  visual language is inconsistent with the target `爆裂戰鬥卡框`.
- `Kenney UI Pack Sci-Fi` remains a useful near-match for sharp panel/HUD pieces.
- `Editable Reference Poses Pack` by RazielNozac is accepted, downloaded, extracted, and connected
  to the v1 pose catalog.
- `RPG Card Template - Persona Style` by LadyLuck is accepted as a card-face source/reference. We
  will rebuild the final Godot/Blender card face ourselves with HP/ATK/DEF/AGI value bars.

## Candidate Status

| Candidate | Source | License | Current status | Use in our card | Target folder |
|---|---|---|---|---|---|
| Kenney UI Pack Sci-Fi | https://kenney.nl/assets/ui-pack-sci-fi | CC0 | Keep as near-match | Metallic HUD shapes, sharp panels, tech accents | `source/card-frame/`, then `exports/card-frame/` |
| Editable Reference Poses Pack | https://razielnozac.itch.io/reference-poses | Downloaded license allows commercial use, modification, and redistribution; RAR add-ons state CC0 | Accepted and locally usable | Pose catalog for Gemini/OpenAI character-art prompting | `reference/pose/`, `source/pose-catalog/` |
| RPG Card Template - Persona Style | https://ladyluck.itch.io/rpg-card-template-persona-style | Page says customizable and usable for commercial and personal projects | Accepted as source/reference; free SD PSD downloaded | Persona-style battle-card source to rebuild into our 1024x1536 Godot card face with value bars | `source/card-frame/persona-template/` |
| Kenney Particle Pack | https://kenney.nl/assets/particle-pack | CC0 | Rejected for current style | Was considered for starbursts and glow masks | None unless direction changes |
| Kenney Smoke Particles | https://kenney.nl/assets/smoke-particles | CC0 | Rejected for current style | Was considered for smoke/impact overlays | None unless direction changes |
| OpenGameArt Energy Sprite Sheets | https://opengameart.org/content/energy-sprite-sheets | CC0 | Rejected for current style | Was considered for power-up aura | None unless direction changes |
| OpenGameArt Auras | https://opengameart.org/content/auras | CC0 | Rejected for current style | Was considered for rarity aura | None unless direction changes |
| OpenGameArt Lots of game effects | https://opengameart.org/content/lots-of-game-effects | CC0 | Rejected for current style | Was considered for fire/blast effects | None unless direction changes |
| Kenney UI Pack RPG Expansion | https://kenney.nl/assets/ui-pack-rpg-expansion | CC0 | Rejected for current style | Was considered for stat panel and skill slots | None unless direction changes |
| Kenney Game Icons + Expansion | https://kenney.nl/assets/game-icons and https://kenney.nl/assets/game-icons-expansion | CC0 | Rejected for current style | Was considered for placeholder icons | None unless direction changes |
| OpenGameArt Portrait Frame Pack | https://opengameart.org/content/portrait-frame-pack | CC0 | Rejected for current style | Was considered for frame ornaments | None unless direction changes |
| OpenGameArt BBS Item Frames | https://opengameart.org/content/bbs-item-frames | CC0 | Rejected for current style | Was considered for rarity frame pieces | None unless direction changes |
| Mechanized Magic: Ultimate UI Pack | https://opengameart.org/content/mechanized-magic-ultimate-ui-pack | CC0 | Rejected for current style | Was considered for HUD icons | None unless direction changes |
| Cardback Bundle | https://chaakravue.itch.io/cardback-bundle | CC0 | Rejected for current style | Was considered for card-back texture | None unless direction changes |

## Use Notes

- Treat kept candidates as building blocks, not a final art direction.
- Prefer style-coherent packs over mixing many free packs.
- Keep text, numbers, and skill descriptions native in Godot.
- Composite and recolor effects in Blender/Godot so the final card reads as our own `爆裂戰鬥卡框`.
- Any non-CC0 asset must get a separate manifest row before entering `exports/`.
