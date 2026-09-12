# Art Direction

This document records the current visual targets for generated character art.

Current purpose:

```text
Source Photo
  -> identity and semantic reference
  -> Character Form Branch
  -> generated solo character portrait art layer
  -> app-rendered card frame, stats, rarity, and text
```

The generated image should be a clean portrait layer. It should not include card UI, fake text, baked borders, stat panels, or nameplates.

## Form Branch vs Art Style

Keep these separate:

```text
Character Form Branch = what the subject becomes
Art Style = how that subject is drawn
```

Examples:

- `humanlike` + `neon-arcade-hero`
- `animalized.cat` + `american-flat-cartoon`
- `animalized.dog` + `designer-toy-sticker`
- `objectified` + `neon-arcade-hero`

This matters because future branches such as dog, robot, weapon, vehicle, or magical relic should not require rewriting the whole art system.

## Hard Gates

These gates apply before style preference.

### 1. Solo Subject Gate

Pass criteria:

- Exactly one foreground subject.
- Background people from the source photo must not become a second main character.
- Background details can become scenery, crowd mood, props, arcade cabinets, lighting, or visual motifs.

### 2. Anatomy Gate

Pass criteria for human or humanlike characters:

- One head.
- Two arms.
- Two hands.
- Two legs when visible.
- Normal shoulder and neck connection.
- Five fingers per visible hand.
- No extra limbs, duplicated hands, fused fingers, impossible joints, or broken wrists.

Pass criteria for animal or mascot characters:

- The body must still be readable and physically coherent.
- A cat character should have one head, two ears, one tail, two front paws, and two hind legs, unless it is clearly designed as a two-arm/two-leg mascot.
- No extra paws, extra tails, multiplied fingers, or unclear limb bundles.

### 3. Source Proportion Lock

The output should use the Source Photo as the proportion reference.

For human or humanlike versions:

- Similar face length/width impression.
- Similar eye spacing and brow-to-eye distance.
- Similar nose/mouth placement impression.
- Similar jaw/chin impression.
- Believable head size relative to torso.
- Natural shoulder width, neck length, arm length, and hand scale.

For strongly stylized versions, proportions may be simplified, but they still need to feel intentionally designed rather than anatomically broken.

比喻：可以把真人演員換成卡通演員，但不能把骨架畫壞。頭、肩、手、臉部比例要像是同一個角色被重新設計，而不是隨機拼裝。

## Character Form Branch Targets

These are not approved final art directions yet. They are comparison targets for local ComfyUI testing.

### A. Humanlike

Intent:

- The Target Subject remains a human or humanlike character.
- This is the default MVP branch.

Transfer rules:

- Preserve facial likeness.
- Preserve source body proportion and believable anatomy.
- Preserve clothing, accessories, expression character, props, and scene signals when useful.

Risk:

- Can become too photographic if img2img is too strong.
- Can distort limbs if txt2img has no pose/anatomy control.

### B. Animalized Cat

Intent:

- The main subject becomes a cat character.
- The cat inherits the person's recognizable styling and attitude.

Important definition:

```text
The subject is a cat first.
It is not a human with cat ears.
```

Transferred identity cues can include:

- Hair tuft shape based on the person.
- Headband.
- Headphones.
- Clothing color or stripe pattern.
- Expression character.
- Signature prop, such as a controller.
- Scene energy, such as arcade lighting.

Risk:

- Direct face likeness becomes less important than transferred identity cues.
- The model may still draw a human if the prompt says "person" too strongly.

### C. Animalized Dog

Intent:

- The main subject becomes a dog character.
- The dog inherits the person's recognizable styling and attitude.

Transferred identity cues can include:

- Hair/fur shape inspired by the person.
- Headwear, eyewear, headphones, jewelry, or signature accessory.
- Clothing color or stripe pattern.
- Expression character.
- Signature prop.
- Scene energy.

Risk:

- Dog breed choice can dominate identity cues if not controlled.
- The model may create a pet beside a human instead of one dog protagonist.

### D. Objectified

Intent:

- The main subject becomes a non-living character, artifact, robot, mascot object, weapon, relic, vehicle, or animated item.
- The object inherits the person's motifs, palette, accessories, prop language, and attitude.

Transferred identity cues can include:

- Color palette from clothing or scene.
- Accessory motifs such as headband, headphones, glasses, necklace, hat, or controller.
- Silhouette cues translated into object shape.
- Expression character translated through object face, posture, pose, or energy effects.
- Text Seed and Visible Semantic Tags as symbols or motifs.

Risk:

- Can lose too much likeness if transfer rules are weak.
- Can become product mockup or random object if the subject role is unclear.

## Current Art Style Targets

These styles can be combined with different Character Form Branches.

### 1. American Flat Cartoon

Intent:

- A playful Western flat-cartoon portrait direction.
- Useful if the game should feel approachable, weird, expressive, and easy to read.

Visual rules:

- Simple geometric shapes.
- Thick clean black outlines.
- Flat color fills.
- Minimal shadows.
- Bright, high-saturation palette.
- Playful expression.

Risk:

- Face likeness can become too abstract.
- The model may invent fake signs or text in arcade backgrounds.

### 2. Neon Arcade Hero

Intent:

- Mainline candidate for battle-card art.
- Stronger energy, better room for effects, rarity glow, and future battle UI.

Visual rules:

- Cel-shaded comic/anime-game illustration.
- Saturated magenta, cyan, yellow, and dark arcade contrast.
- Face remains the focal point.
- Retro arcade environment becomes background energy, not foreground clutter.

Risk:

- Current FaceID txt2img workflow can duplicate the subject or create a second hero.
- Needs subject isolation, crop, mask, or pose control before approval.

### 3. Designer Toy Sticker

Intent:

- A compact collectible mascot direction for mobile-game readability.
- Useful if the game should lean cute, toyetic, and sticker-like.

Visual rules:

- Simplified big-head proportions.
- Clean vector-like edges.
- Glossy toy-like shading.
- Compact silhouette.
- Bold accent colors.

Risk:

- Can over-simplify identity.
- Current workflow tends to add borders, shelves, fake labels, or extra characters.

## Current Test Result

The style-comparison helper is:

```bash
npm run comfy:style-compare -- /path/to/source-image.jpg
```

Current test source:

```text
/Users/harrylin/Downloads/Gemini_Generated_Image_iko2o0iko2o0iko2.jpg
```

Current workflow under test:

```text
docs/comfyui-workflows/sdxl-turbo-faceid-txt2img-api.json
```

Current interpretation:

- Style variation works technically.
- The outputs are not approved.
- Main failures: duplicate foreground subjects, baked borders/fake text, weak cat-main transformation, and hand/limb structure issues.
- Prompt wording helps but is not enough. The next serious workflow likely needs subject crop/masking and pose/anatomy control.
