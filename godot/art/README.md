# Godot Art Workspace

Local, Godot-ready card art assets live here.

Planned source layout:

```text
reference/
  external screenshots or local visual references
source/
  Blender, Inkscape, or layered source files
exports/
  normalized PNG/WebP/GLB assets imported by Godot
manifest/
  asset manifests and provenance notes
```

Incoming asset placement:

```text
reference/ui/
  UI screenshots and layout references. Reference only; do not ship directly.

reference/style/
  Style boards, generated comparison images, and visual direction samples. Reference only.

reference/pose/
  Original downloaded pose packs and pose screenshots. Reference only.

source/card-frame/
  Editable card-frame source files, such as .blend, .psd, .kra, .afdesign, or layered SVG.

source/character/
  Editable character-art source files and approved generation references.

source/generated-card-art/
  Latest and named outputs from Card Art Provider experiments.

source/icons/
  Editable icon and badge sources.

source/pose-catalog/
  Source pose references and pose-catalog metadata used by the prompt builder.

exports/card-frame/
  Godot-ready card-frame PNG/WebP layers.

exports/character/
  Godot-ready character art, normalized to the current art-window target when possible.

exports/icons/
  Godot-ready icons, badges, and attribute symbols.
```

Use `reference/` for inspiration and visual matching. Use `source/` for editable originals. Use
`exports/` for files Godot scenes should load directly. Every asset that might ship needs a
manifest note with source URL/tool, license, and approval state.

Current local third-party sources:

```text
reference/pose/razielnozac-reference-poses/
  Original downloaded RazielNozac pose archives.

source/pose-catalog/razielnozac-reference-poses/raw/
  Extracted raw pose, face, and head reference files.

source/pose-catalog/
  Six selected RazielNozac source pose PNG files. These are locked as source references only;
  src/card-generation/pose-reference.js currently uses a v2 text-only pose catalog until neutral
  mannequin/skeleton guides exist.

source/card-frame/persona-template/persona_cardSD.psd
  LadyLuck Persona-style card template source/reference. This is now secondary to the
  user-provided Dokkan-like card references.

reference/ui/battle-card-dokkan-style-filled-reference.png
  User-provided filled visual target for Battle Card v1. Reference only; rebuild runtime text,
  numbers, bars, and frame components in Godot/Blender.

reference/ui/battle-card-dokkan-style-blank-template.png
  User-provided blank layout/chrome reference for Battle Card v1. Reference only unless later
  replaced by a layered production-safe source.
```

Detailed provenance lives in:

```text
manifest/third-party-asset-provenance.md
manifest/generated-assets.md
```

The chosen v1 card direction is `爆裂戰鬥卡框`: character-forward, thick frame, rarity glow,
attribute badge, readable skill tabs, and strong ultimate-border animation support.

## Card Size Spec

Battle Card v1 uses a `2:3` outer card ratio, matching the user-provided Dokkan-like template
references.

Godot reference card size:

```text
1024 x 1536 px
```

This size is the design ruler for the Godot UI and local card-frame assets. Runtime screens can
scale it down or up, but frame parts, preview exports, and layout measurements should start from
this reference size unless a later spec changes it.

### Character Art Window

Battle Card v1 uses a large character-forward art window.

Reference art window size:

```text
960 x 820 px
```

Reference art window position:

```text
x = 32 px
y = 24 px
```

This is the visible character showcase area inside the `1024 x 1536 px` card. It should keep the
generated character art dominant. The top-left title plate, top-right rarity badge, and right-side
attribute badge overlay this zone, so prompt composition should keep the character face/torso clear
of those UI badges when possible. The `x/y` position is measured from the card's top-left corner,
like placing a photo inside a physical card frame.

### Bottom Info Area

Battle Card v1 uses a five-layer battle information area below the character art window.

Reference bottom info order, from top to bottom:

```text
1. HP / ATK / DEF / AGI value bars
2. Lv current/max and progress bar
3. skill slot 1
4. skill slot 2
5. character description
```

The character art window ends around `y = 844 px`. With the bottom frame reserved, the current safe
content band below the art is about `652 px` tall, from `y = 844 px` to `y = 1496 px`. This order
makes combat readability the first priority: value bars first, level state second, skill slots
third, character description last.

Reference bottom info row heights:

```text
HP / ATK / DEF / AGI value bars: 130 px  (y = 844..974)
Lv current/max and progress bar:  96 px  (y = 982..1078)
skill slot 1:                    140 px  (y = 1090..1230)
skill slot 2:                    140 px  (y = 1246..1386)
character description:            96 px  (y = 1400..1496)
```

The value-bar row uses four short horizontal bars: one each for HP, ATK, DEF, and AGI. Each bar
shows a large numeric value, the stat label, and a filled bar. AGI is the agility stat and will be
used later to decide combat order. AGI is derived from internal `speed` plus rarity bonus and level
bonus; it is not a separate AI-written number. V1 formula: `AGI = speed + rarity.bonus +
floor((level - 1) / 8)`.

Example value-bar display:

```text
18200 HP  [filled bar]
15680 ATK [filled bar]
10420 DEF [filled bar]
22850 AGI [filled bar]
```

Battle Card v1 uses two stacked skill slots. Each skill slot should show an icon, skill name, and
a qualitative effect description, not raw numeric formulas. Exact modifiers stay in the hidden
combat rule data.

Example skill display:

```text
影子步伐
人物速度變快，更容易搶到有利位置。

怒吼狂奔
人物血量增加，但也更容易受傷。
```

Skill text limit:

```text
skill name + one qualitative description line per skill slot
```

Character description text limit:

```text
one short line
```

Example character description:

```text
夜色中行動敏捷的街頭守護者。
```

### Main Frame Thickness

Battle Card v1 uses a thick battle-frame band.

Reference main outer frame thickness:

```text
32 px
```

This is the main card-frame body thickness inside the `1024 x 1536 px` card. Extra rarity glow,
sparks, or ultimate-border effects should be specified as separate effect layers in a later step.

### Outer Effect Bleed

Battle Card v1 allows outer glow and burst effects to extend past the card body.

Maximum effect bleed:

```text
48 px per side
```

When exporting a transparent full-effect layer, use this canvas:

```text
1120 x 1632 px
```

The `1024 x 1536 px` card body stays the playable card size. The larger `1120 x 1632 px` canvas is
only for glow, sparks, rarity aura, or selected-card effects that need breathing room outside the
physical card edge.
