# System Pipeline

This document defines the top-level system pipeline for the local MVP.

Use this document before splitting code modules, adding AI adapters, changing storage, or expanding the questionnaire.

比喻：這份文件是整間工廠的產線圖。每一站要知道自己吃什麼材料、吐出什麼半成品、不能偷做哪一站的工作。

## Pipeline Principles

1. `Character Spec` is the core game object.
   - It is more important than the generated image because battle, progression, save/load, and card art all depend on it.

2. AI models observe, suggest, or render. Rules decide mechanics.
   - OCR / Vision can suggest `Photo Signal` and non-sensitive `Model-Suggested Fields`.
   - Picture generation can produce card art.
   - `Rule / Algorithm layer` decides `HP`, `ATK`, `DEF`, `COST`, traits, skills, rarity, and progression hooks.

3. Consent comes before model use and storage.
   - Source Photo, User-Supplied Context, Sensitive Creative Context, and Capture Context should each have clear consent behavior.

4. Every stage must have a stable input and output.
   - A stage should be replaceable later without rewriting the whole app.

5. The MVP must keep a fallback path.
   - If local picture generation is too slow, Canvas card cover generation should still let the game pipeline run.

6. Godot is a future game runtime and asset validation target, not the first AI-pipeline test bench.
   - The browser MVP should prove `photo -> Character Spec -> Card Cover` first.
   - Godot can later own card motion, battle scenes, particles, audio, input, export, and in-engine asset validation.

## Current Validation Focus

The current project focus is the image pipeline and effect review only:

```text
Source Photo
  -> Photo Signal
  -> OCR Text Seed
  -> Visible Semantic Tags
  -> Character Spec / Prompt Profile
  -> identity-preserving picture generation
  -> Effect Review
```

Use [IMAGE_PIPELINE_ACCEPTANCE.md](./IMAGE_PIPELINE_ACCEPTANCE.md) as the active acceptance standard.

Paused until one generated visual target is approved:

- Enemy data.
- Battle simulator tuning.
- XP, leveling, and progression.
- Deck balance.
- Final card UI animation.

## Target Runtime Boundary

The current validation target includes both iOS and Mac, but they should not run the same workload.

```text
iPhone / iPad / Mac Browser
  -> camera, upload, preview, card interaction, battle UI validation

Mac local server
  -> Node app adapter
  -> Card Art Provider adapter
  -> Gemini / Nano Banana API, OpenAI Image API, or Canvas fallback
  -> generated Card Cover response
```

For the MVP, iOS is the capture and interaction client. The Mac is the local AI workstation.

Do not plan the first iOS build around running SDXL, FaceID, MFLUX, or ComfyUI on-device. Later product paths can include a Godot iOS client, a native Swift client, a React Native wrapper, cloud generation, or small Core ML models, but those should come after the local browser pipeline proves the card-generation loop.

## Top-Level Flow

```text
User / Photo Subject
  -> Consent Gate

Source Photo
  -> Photo Intake
  -> Photo Signal Analyzer
  -> OCR / Text Seed Adapter
  -> Model Suggestion Review

VLM Creative Roll + Character Setup Review
  -> Character Name Seed + user-selected candidates + system story pick + VLM-auto fields
  -> Generation Profile

Photo Analysis + Generation Profile + Capture Context + Reroll Seed
  -> Normalizer
  -> Character Spec Builder
  -> Character Form Branch Router
  -> Rule / Algorithm Layer
  -> Card Stat Line
  -> Traits
  -> Skills
  -> Prompt Profile

Source Photo + Character Spec + Prompt Profile
  -> Card Art Adapter
  -> Card Cover

Character Spec + Card Cover + Progression Defaults
  -> Battle Card Assembler
  -> Character Library / Save System
  -> Progression System
  -> Battle Simulator
```

Short version:

```text
Photo + Answers
  -> Character Spec
  -> Card Cover + Card Stats + Skills
  -> Saved Battle Card
  -> Progression + Battle
```

## Character Form Branches

`Character Form Branch` is the pipeline decision for what the Target Subject becomes before art style is applied.

This is not a Git branch and not a model name. It is a product/domain branch that should appear in `Character Spec` and `Prompt Profile`.

比喻：這像先決定角色是「真人英雄、貓英雄、狗英雄、機器英雄、寶物英雄」，再決定要用哪種畫風。畫風像衣服，形態分支像骨架。

Initial branches:

| Branch | Meaning | Likeness strategy | Likely workflow |
|---|---|---|---|
| `humanlike` | Target Subject remains human or humanlike | Preserve face, source body proportion, clothing/accessory cues, pose impression | FaceID + subject crop/mask + pose/depth/anatomy control |
| `animalized.cat` | Target Subject becomes a cat protagonist | Transfer hair tuft, expression, accessories, clothing motif, prop, color, attitude | VLM feature extraction + animal character prompt; weaker or no FaceID |
| `animalized.dog` | Target Subject becomes a dog protagonist | Transfer expression, accessories, color palette, outfit motif, prop, attitude | Same branch family as cat with species-specific anatomy gate |
| `objectified` | Target Subject becomes a non-living character, artifact, robot, mascot object, weapon, relic, vehicle, or animated item | Transfer motifs, palette, silhouette cues, accessories, symbols, props, and personality cues | Feature-to-design prompt; no FaceID unless a human face is intentionally retained |

Rules:

- `Character Form Branch` should be chosen explicitly by the user or by a safe default, not guessed from appearance.
- `humanlike` is the default branch for the MVP unless the user selects another form.
- Animalized and objectified branches must not claim direct face likeness. Their likeness is feature-transfer likeness.
- Each branch needs its own hard anatomy or structure gate.
- Art style targets, such as American flat cartoon or neon arcade hero, are separate from form branches.

## Stage Table

| Stage | Type | Input | Output | MVP implementation | Must not do |
|---|---|---|---|---|---|
| Consent Gate | UI + rule | User choice | Consent decision | Game entry / onboarding gate later; generator assumes it is already granted | Infer consent from upload |
| Photo Intake | UI/browser | File upload or camera frame | Source Photo | Browser upload/camera | Decide character stats |
| Photo Signal Analyzer | Local algorithm/model | Source Photo | Photo Analysis | Canvas metrics and palette | Identify the real person |
| OCR / Text Seed Adapter | Model or fallback | Source Photo, manual text | Text Seed, OCR suggestions | Manual text first, local OCR later | Treat OCR as legal truth |
| Model Suggestion Review | UI | Suggested visible tags | Confirmed suggestions | Editable chips later | Hide model assumptions |
| Character Setup Review | UI + VLM | Character Name Seed, VLM Creative Roll, player candidate choices, system story pick, reviewable auto fields | Generation Profile and Questionnaire Context | Name popup now; four-option candidate modal later | Ask users to fill a long form or hide model assumptions |
| Normalizer | Rule module | Selected candidates, VLM-auto fields, optional user declarations | Normalized tags | Trim, cap, map to known categories | Let free text directly boost stats |
| Character Spec Builder | Rule module | Photo Analysis, Generation Profile, normalized tags, reroll seed | Character Spec | Deterministic local rules | Call image generation |
| Character Form Branch Router | Rule module | Character Spec, Generation Profile, approved form option | Character Form Branch and branch constraints | Deterministic branch choice; current branches are `humanlike`, `animalized`, and `objectified` | Hide branch choice inside a free-form prompt |
| Rule / Algorithm Layer | Rule module | Character Spec, progression | Card Stat Line, traits, skills, rarity | Capped formulas | Let AI write final numbers |
| Card Art Prompt Builder | Rule module | Character Spec, Character Form Branch, Source Photo policy | Prompt Profile | Deterministic prompt text per branch | Add unapproved sensitive context |
| Card Art Adapter | Adapter | Source Photo, Prompt Profile, form branch, mode | Card Cover or fallback result | Canvas now, local picture generation later | Change stats after seeing image |
| Battle Card Assembler | Rule module | Character Spec, Card Cover, progression defaults | Battle Card | Create playable saved object | Require raw Source Photo for battle |
| Character Library / Save System | Storage adapter | Battle Card | Saved Battle Card list | localStorage for MVP | Store Source Photo by default |
| Progression System | Rule module | Battle Card, activity, battle result | Updated progression | XP, level, wins, losses | Mutate original generation inputs silently |
| Battle Simulator | Rule module | Battle Card, enemy, action | Battle State | Local CPU Battle Test | Read photo, camera, storage, or UI directly |

## Model Stack For Local MVP

This section records the recommended model/tool choice for each model-capable stage on the MacBook Air M3 / 16 GB machine.

The project should not install every model at once. Each model must sit behind an adapter so it can be swapped later.

比喻：模型不是直接焊死在工廠裡的大機器，而是插在插座上的工具。插座先設計好，工具可以慢慢換。

### Recommended Stack

| Pipeline stage | First MVP choice | How to use it | Next upgrade | Why |
|---|---|---|---|---|
| Photo Signal Analyzer | Current browser Canvas analysis | Compute brightness, contrast, saturation, palette, edge density, center focus, symmetry | Add Transformers.js zero-shot image classification or a small VLM | Deterministic, no install, low risk |
| OCR / Text Seed Adapter | Manual Text Seed first | Let user type visible text or symbols from the photo | PaddleOCR PP-OCRv6 or PP-OCRv5 mobile on CPU | OCR is useful, but not required before Character Spec rules work |
| Vision Suggestions | Local Ollama VLM adapter | Generate visible, non-sensitive semantic tags from center subject crop plus full image context | FastVLM 0.5B/1.5B or Qwen2.5-VL-3B if Ollama quality/speed is not enough | The user should not hand-write most semantic tags, but VLM output must remain reviewable |
| Text Normalizer | Deterministic rule tables | Map free text to known categories and capped tags | Optional small local LLM through Ollama for draft suggestions only | Rules must remain explainable and testable |
| Character Spec Builder | No AI model | Deterministic JavaScript rule module | Versioned rule tables | This is the game's core rule system |
| Rule / Algorithm Layer | No AI model | Formula + capped modifiers + skill templates | Data-driven skill effect interpreter | AI must not write final stats |
| Card Art Prompt Builder | No AI model | Build prompts from Character Spec and approved inputs | Prompt templates by card mood and archetype | Keeps visual generation controlled |
| Card Art Adapter | Canvas fallback plus cloud provider adapter | Current local render keeps the full game loop working; Gemini / Nano Banana and OpenAI test high-quality picture generation through one provider interface | Cloud adapter hardening, retry/queue, cost controls, or a later local model if hardware improves | Best next serious image generation path after local Flux-family generation was too slow |
| Stronger Identity Preservation | Current research target | Use the source photo as a consent-based reference and feed VLM identity cues into the prompt, while keeping source photo out of saved battle state by default | Research FaceID/InstantID only after consent/license/privacy review | Stronger identity tools are powerful but higher privacy/license risk |
| Battle Simulator | No AI model | Local deterministic CPU battle | Data-driven effects and seeded RNG | Battle must be reproducible |

### OCR Adapter Plan

First implementation:

```text
User types Text Seed manually
  -> Normalizer
  -> Character Spec
```

Next implementation:

```text
Source Photo
  -> /api/ocr
  -> PaddleOCR local Python worker
  -> OCR suggestions with text, confidence, and bounding boxes
  -> User confirms useful text chips
  -> Confirmed Text Seed
```

Recommended OCR model path:

- Start with PaddleOCR because it supports modern OCR pipelines and Chinese / English scenarios.
- Try PP-OCRv6 default first.
- If memory or speed is bad on this Mac, fall back to PP-OCRv5 mobile models.
- Run with `device="cpu"` first; do not assume Apple GPU support for this adapter.

Adapter interface:

```ts
extractTextSeed(sourcePhoto): Promise<OcrSuggestion[]>
```

Output shape:

```json
[
  {
    "text": "A12",
    "confidence": 0.82,
    "box": [[12, 40], [140, 40], [140, 68], [12, 68]],
    "source": "paddleocr"
  }
]
```

Rules:

- OCR output is a suggestion, not truth.
- OCR text can influence motifs, title fragments, symbols, and skill names.
- OCR text must not become legal identity, real name, or sensitive context.

### Vision Suggestion Plan

First implementation:

```text
Source Photo
  -> browser Canvas metrics
  -> optional user-confirmed Visible Semantic Tags
  -> Photo Analysis
```

Next implementation:

```text
Source Photo
  -> allowed candidate labels
  -> local vision model
  -> visible non-sensitive semantic suggestions
  -> user confirmation
```

Recommended local candidates:

- `@huggingface/transformers` / Transformers.js for a browser/static-script path when we want JavaScript-first local inference.
- Ollama local vision model adapter for the first MVP endpoint because it has a simple local HTTP API and keeps model downloads/runtime outside the browser.
- FastVLM 0.5B or 1.5B when we want Apple Silicon-oriented VLM experiments.
- Qwen2.5-VL-3B when we need stronger image understanding and structured visible-tag suggestions.

Visible semantic tags are different from OCR Text Seed:

```text
OCR Text Seed:
  -> actual visible text or symbols, such as jersey text, sign text, labels, badges

Visible Semantic Tags:
  -> visible scene/action/state clues, such as basketball court, athlete, arcade room, holding a controller, sweaty, tired, post-game energy
```

Target MVP behavior:

```text
Source Photo
  -> local VLM adapter (`POST /api/vision-tags`)
  -> VLM-suggested Visible Semantic Tags
  -> user review / correction
  -> grouped prompt-facing tags
  -> Character Spec + Card Art Prompt Profile
```

Current adapter:

```text
Browser imageDataUrl
  -> browser center subject crop
  -> Photo Character Lab server
  -> subject focus: center_primary_subject
  -> Ollama `/api/chat`
     image 1: Target Subject Crop
     image 2: Full Source Photo
  -> configured vision model, default `gemma3:4b`
  -> JSON semantic tag groups, including Visible Person Description
```

Multi-person rule:

```text
Target Subject
  -> center crop around the centered / largest / clearest foreground subject
  -> personAppearance, clothing, and subject-specific state

World Context
  -> full source photo around the Target Subject
  -> scene, activity, object, lighting, composition, visualSignal
  -> other people may appear only as broad context, such as background people, crowd, teammate, or audience
```

This prevents a group photo from merging every person's hair, clothing, expression, and accessories into one fictional character while still preserving useful background and social context.

If Ollama or the configured model is unavailable, the endpoint returns a clear unavailable status instead of inventing tags.

Current browser review behavior:

```text
VLM suggestions or manual calibration tags
  -> grouped into personAppearance/scene/activity/object/state/clothing/lighting/composition/visualSignal
  -> stored on Photo Analysis
  -> stored on Character Spec as photoSemantics
  -> passed into Card Art Prompt Profile
```

The manual field is not the desired final interaction. It remains as a calibration and correction surface so the local VLM can be judged and repaired by the player.

Allowed model prompts should be constrained:

```text
Return only visible, non-sensitive creative tags from this image.
If two images are supplied, image 1 is the Target Subject Crop and image 2 is the Full Source Photo.
Use personAppearance, clothing, and subject-specific state only from the Target Subject Crop.
Use scene, activity, object, lighting, composition, and visualSignal for the whole World Context from the Full Source Photo.
Do not mix non-target people's hair, outfit, face, expression, or accessories into the Target Subject.
Allowed categories: visible person appearance, color, lighting, clothing cue, pose cue, scene type, object cue, activity cue, visible physical state cue, composition.
Never infer identity, age, gender, ethnicity, sexuality, politics, religion, health, personality, wealth, or social status.
For visible person appearance, use only grounded cues such as visible face, hair shape, expression cue, pose, accessory, outfit silhouette, or subject crop.
Use visible state words only when they are grounded in the image, such as sweaty, tired-looking, celebrating, running, sitting, holding a ball, holding a controller.
Return JSON only.
```

Output shape:

```json
{
  "personAppearance": ["visible face", "curly hair", "open-mouth expression"],
  "scene": ["indoor", "basketball court"],
  "activity": ["athlete", "post-game energy"],
  "object": ["basketball"],
  "state": ["sweaty", "tired-looking"],
  "clothing": ["sportswear"],
  "lighting": ["cool lighting"],
  "composition": ["centered pose"],
  "visualSignal": ["blue palette"]
}
```

Rules:

- The model can choose only from allowed categories.
- Suggestions must be editable chips in the UI.
- Unconfirmed suggestions cannot affect stats, skills, rarity, or prompt.
- Visible state tags should be framed as creative visual cues, not factual claims about health or emotion.

### Text Normalizer And Optional Local LLM

The first MVP should use deterministic rules.

Example:

```text
使用者輸入: "資料分析師，喜歡研究，弱點是想太多"
  -> normalized tags: ["researcher", "knowledge", "overthinking"]
  -> rule categories: focus bias, control skill, slower first attack tradeoff
```

Optional later adapter:

```text
User free text
  -> local LLM draft categorizer
  -> JSON suggestion
  -> deterministic validator
  -> normalized tags
```

Recommended local text model path:

- Use Ollama only after the deterministic normalizer is working.
- Candidate model: Qwen3-4B or another small local instruct model that can return JSON.
- The LLM may draft categories, but the validator must reject unknown tags.

Adapter interface:

```ts
suggestNormalizedTags(userText, allowedTags): Promise<NormalizerSuggestion>
```

Rule:

- The local LLM can reduce typing friction, but it cannot create new stat categories or final stat values.

### Card Art Adapter Plan

First implementation:

```text
Character Spec + Source Photo
  -> Canvas fallback card cover
```

First serious local picture-generation implementation:

```text
Photo Character Lab server
  -> upload source image to ComfyUI `/upload/image`
  -> submit saved workflow to ComfyUI `/prompt`
  -> poll `/history/{prompt_id}`
  -> fetch generated image through `/view`
  -> return Card Cover data URL to browser
```

Recommended first ComfyUI workflow after the baseline smoke test:

```text
Source Photo
  -> IP-Adapter FaceID reference conditioning
  -> fast SDXL workflow from blank latent
  -> Character Spec prompt
  -> generated portrait
  -> project card frame / UI composition
```

Use img2img only when preserving the original photo layout matters. For the core card-art target, the Source Photo should primarily act as the consenting subject's identity reference. This better matches the desired result: a new fictional scene and costume while the person's facial identity remains recognizable.

Initial settings:

- One image at a time.
- 768x1024 or 768x1152.
- Fixed seed while debugging.
- SDXL Turbo / Lightning style few-step generation before heavier models.
- Canvas fallback on timeout, validation error, or memory failure.
- Keep readable card text outside the generated image; UI renders stats and text.

Why this path:

- ComfyUI has a local HTTP workflow API that our Node server can call.
- SDXL Turbo and SDXL-Lightning style workflows are designed for fast few-step generation.
- IP-Adapter FaceID lets the consenting source photo act as an identity reference alongside the text prompt.
- The workflow is easier to inspect and tune than hiding everything behind custom Python early.

Current smoke test:

```text
Photo Character Lab server
  -> GET /api/comfy-status
  -> ComfyUI /system_stats
  -> report local ComfyUI availability
```

CLI:

```bash
npm run comfy:status
```

This only proves that ComfyUI is reachable. It does not upload a Source Photo or generate card art yet.

Current adapter implementation:

```text
Browser
  -> POST /api/comfy-card-art
  -> Photo Character Lab server validates Source Photo + Prompt Profile
  -> upload Source Photo to ComfyUI `/upload/image`
  -> fill saved workflow placeholders
  -> submit workflow to ComfyUI `/prompt`
  -> poll ComfyUI `/history/{prompt_id}`
  -> fetch first generated image through `/view`
  -> return `imageDataUrl`
```

Configuration:

```text
COMFYUI_URL=http://127.0.0.1:8188
COMFYUI_WORKFLOW_PATH=/absolute/path/to/comfyui-api-workflow.json
COMFYUI_GENERATION_TIMEOUT_MS=240000
COMFYUI_POLL_INTERVAL_MS=1000
COMFYUI_DENOISE=1
COMFYUI_FACEID_LORA_STRENGTH=0.6
COMFYUI_IPADAPTER_WEIGHT=1
COMFYUI_FACEIDV2_WEIGHT=2
```

Workflow placeholder contract:

```text
__SOURCE_IMAGE__       required; replaced with the uploaded ComfyUI input image name
__PROMPT__             required; replaced with Card Art Prompt Builder output
__NEGATIVE_PROMPT__    optional
__SEED__               optional
__WIDTH__              optional
__HEIGHT__             optional
__DENOISE__            optional; img2img source-photo strength balance or txt2img full denoise
__LORA_STRENGTH__      optional; FaceID LoRA strength
__IPADAPTER_WEIGHT__   optional; reference-image conditioning strength
__FACEIDV2_WEIGHT__    optional; FaceID v2 identity embedding strength
```

This still does not prove image quality. It only proves our app can hand work to a local picture-generation adapter once ComfyUI, the model files, and a working API workflow exist.

Observed local smoke result on 2026-09-12:

```text
MacBook Air M3 / 16 GB
  -> ComfyUI 0.35.0
  -> PyTorch 2.14.0
  -> Device mps
  -> SDXL Turbo img2img workflow
  -> /api/comfy-card-art
  -> valid 768x1024 PNG
```

Timing:

```text
First generation after model load: about 52 seconds
Warm generation: about 20 seconds
```

Current interpretation:

- Technical adapter pipeline is proven.
- Visual quality is not approved.
- Strong likeness preservation is not approved.
- Current next image step is the IP-Adapter FaceID reference-only txt2img workflow, not UI redesign.

Research-only image paths:

- Draw Things: best for manual style testing on Mac before code integration.
- Gemini / Nano Banana API and OpenAI Image API: active quality lanes for source-photo-to-character-art generation.
- MFLUX: paused Mac-native MLX research path; revisit only if hardware or model speed improves.
- FLUX.1-schnell / newer FLUX-family models: strong quality, but test only through a controlled local adapter after the pipeline is stable.
- InstantID or other FaceID-style workflows: only after explicit consent, license review, and a privacy decision because these are identity-preserving face workflows.

### Card Art Prompt Profile

The prompt builder should output structured prompt data, not one opaque string.

```json
{
  "subject": "consenting subject from source photo",
  "identityPreservation": "preserve broad likeness and visible cues",
  "characterRole": "neon data guardian",
  "visualMood": "premium mobile RPG battle card",
  "element": "Voltage",
  "props": ["laptop-like tactical artifact"],
  "scene": "neon street training gate",
  "negative": ["text", "logo", "watermark", "extra people", "identity document"],
  "sensitivePolicy": "use only explicit user-supplied sensitive context"
}
```

Prompt rules:

- `Character Spec` is the source of truth.
- Source Photo guides broad likeness and visual cues.
- User-selected VLM candidates and VLM-auto fields guide costume, props, aura, background, and mood.
- Generated image output cannot modify stats or skills.
- Do not put final `HP / ATK / DEF / COST` text inside the generated image; render it in UI for legibility and localization.

### Model Source Notes

Model choices must be rechecked before installation because model files, licenses, and Mac support can change.

Current source links:

- PaddleOCR usage and PP-OCR versions: https://www.paddleocr.ai/main/en/version3.x/pipeline_usage/OCR.html
- PP-OCRv5 model details: https://github.com/PaddlePaddle/PaddleOCR/blob/main/docs/version3.x/algorithm/PP-OCRv5/PP-OCRv5.en.md
- Transformers.js local/browser ML: https://huggingface.co/docs/transformers.js/en/index
- Hugging Face zero-shot image classification: https://huggingface.co/docs/transformers/main/tasks/zero_shot_image_classification
- FastVLM Apple Silicon notes: https://github.com/apple/ml-fastVLM
- Qwen2.5-VL-3B model card: https://huggingface.co/Qwen/Qwen2.5-VL-3B-Instruct
- Ollama local generate API: https://docs.ollama.com/api/generate
- ComfyUI server routes: https://docs.comfy.org/development/comfyui-server/comms_routes
- SDXL-Lightning model card: https://huggingface.co/ByteDance/SDXL-Lightning
- IP-Adapter project: https://github.com/tencent-ailab/IP-Adapter
- ComfyUI IPAdapter reference node: https://github.com/comfyorg/comfyui-ipadapter
- Gemini image generation: https://ai.google.dev/gemini-api/docs/image-generation
- OpenAI image edits: https://platform.openai.com/docs/api-reference/images/createEdit
- MFLUX Mac-native generation: https://github.com/mflux-community/mflux
- Draw Things local Mac/iOS image generation: https://drawthings.ai/
- FLUX.1-schnell model card: https://huggingface.co/black-forest-labs/FLUX.1-schnell
- InstantID identity-preserving research path: https://github.com/instantX-research/InstantID

## Suggested Module Interfaces

These interfaces describe seams, not final file names.

```ts
collectConsent(formState): ConsentDecision
prepareSourcePhoto(fileOrFrame): Promise<SourcePhoto>
analyzePhoto(sourcePhoto, textSeed): Promise<PhotoAnalysis>
collectGenerationProfile(formState, confirmedSuggestions): GenerationProfile
normalizeGenerationInputs(input): NormalizedGenerationInput
buildCharacterSpec(input): CharacterSpec
deriveBattleCardRules(characterSpec, progression): CardRuleOutput
buildCardArtPrompt(characterSpec, visualPolicy): PromptProfile
generateCardCover(input): Promise<CardCoverResult>
assembleBattleCard(input): BattleCard
saveBattleCard(card): SavedBattleCard
startBattle(playerCard): BattleState
resolveBattleAction(state, action): BattleState
```

The deepest first module should be `buildCharacterSpec`.

Reason:

- It hides the most project-specific logic.
- It can be tested without DOM, camera, canvas, network, image generation, localStorage, or battle UI.
- If this module is stable, every later feature can depend on one consistent character definition.

比喻：`buildCharacterSpec` 像料理的主配方。照片、問卷、OCR 都是食材；卡圖、戰鬥、養成都是用這份配方做出的不同料理。

## Data Ownership And Storage

Default saved data for MVP:

- `Character Spec`
- `Card Cover`
- `Card Stat Line`
- Traits and Skills
- Progression state: level, XP, wins, losses
- Generator version or rules version

Memory-only by default:

- Raw Source Photo
- Raw camera frame
- Raw OCR image data
- Unconfirmed model suggestions

Store only with explicit opt-in:

- Raw Source Photo
- Exact capture location
- Sensitive Creative Context
- Long user-entered personal background text

Never infer or store:

- Real identity claim
- Detected age
- Detected gender
- Detected ethnicity
- Detected sexual orientation
- Detected politics
- Detected religion
- Detected health status

## Model Responsibilities

OCR model:

- Reads visible text-like content when available.
- Produces Text Seed suggestions.
- Should not claim the text is a legal name or verified identity.

Vision / Feature extraction model:

- Produces non-identifying Photo Signal.
- May suggest visible, non-sensitive tags such as colors, clothing cues, scene type, light mood, or composition.
- Produces `Visible Semantic Tags` such as basketball court, athlete, arcade room, holding a controller, sweaty, tired-looking, or post-game energy when a local vision model is available.
- Feeds both the Rule / Algorithm layer and Card Art Prompt Builder. If these tags only affect stats but not the image prompt, the card art will not express the game's photo-to-character promise.
- Must not infer sensitive identity or personal truth.

Picture generation model:

- Uses Source Photo identity reference, Character Spec, Photo Signal, and Visible Semantic Tags to generate a Card Cover.
- Preserves broad likeness as a creative goal.
- Must not create or change stats, skills, rarity, or progression.

Rule / Algorithm layer:

- Owns all final game-facing decisions.
- Converts allowed inputs into deterministic `Character Spec`, stats, traits, skills, rarity, and explanations.
- Must be versioned so generated cards can be understood later.

## First MVP Implementation Order

1. Confirm this pipeline document.
2. Add the first questionnaire fields from `CHARACTER_QUESTIONS.md`. Prototyped, then moved out of the main generator UI in favor of a card-first screen.
3. Make the current app produce and show the fuller `Character Spec`. First context pass done: `src/card-generation/character-spec.js` now normalizes Capture / Questionnaire / Vision / Event Context and builds image prompt hooks.
4. Add visible `HP / ATK / DEF / COST / Level` to the generated card and saved card list. First pass done.
5. Add explainable rule output: why the card got its element, stats, traits, and skills.
6. Correct save behavior so raw Source Photo is not required for saved Battle Cards.
7. Extract `buildCharacterSpec` from `app.js` into its own module. First pass done for context normalization and prompt hooks; rules for archetype, rarity, stats, traits, and skills still need extraction.
8. Add a Card Art Adapter seam with Canvas fallback first.
9. Research or connect a local picture generation adapter after the gameplay pipeline is stable.
10. Expand Battle Simulator rules after cards have stable stats and skills.

## Current MVP Gap Map

| Target pipeline capability | Current state | Next correction |
|---|---|---|
| Source Photo upload/camera | Exists | Keep |
| Consent Gate | Removed from generator screen | Add game-entry consent/onboarding later |
| Photo Signal Analyzer | Exists as local canvas analysis | Keep and isolate later |
| OCR adapter | Not real yet | Manual Text Seed first, local OCR later |
| Automatic Capture/Event Context | Browser/EXIF GPS, server `/api/capture-context`, Google Maps adapters when keyed, internal no-key location-hook fallback, and Nager.Date holiday lookup exist | Add first-entry consent/onboarding UI and API-key status display |
| Questionnaire | Hidden defaults in generator screen; still user-declared by policy | Add separate setup/review UX and model-suggested editable chips later |
| Character Spec | First context module exists in `src/card-generation/character-spec.js`; `app.js` now stores `contexts`, `promptProfile`, `sourceRefs`, and acquisition methods on each spec | Extract remaining archetype, rarity, stats, traits, and skills from `app.js` |
| Rule / Algorithm layer | Exists inside character generation functions | Separate from UI and image generation |
| Card Stat Line | First visible HP/ATK/DEF/COST/Level exists | Tune formulas and connect more directly to battle balance |
| Card Cover | Canvas exists, unified `/api/card-art` provider adapter exists for Gemini/OpenAI/Comfy, `/api/card-art-compare` exists for explicit A/B runs, ComfyUI status smoke test exists, SDXL Turbo img2img smoke workflow generated a valid PNG, and IP-Adapter FaceID workflow generated valid PNGs with better likeness but too-photographic style | Compare Gemini and OpenAI outputs against the same prompt and image acceptance gates |
| Save System | localStorage exists | Stop requiring raw Source Photo by default |
| Progression | XP/level/win/loss exists | Connect growth rules to Character Spec |
| Battle Simulator | Exists as local CPU battle | Make it depend only on Battle Card |

## Open Decisions

- Which local OCR adapter should be used first.
- Whether Capture Context starts as manual-only or uses device APIs later.
- Whether users can edit the generated Character Spec before card art generation.
- Exact stat formulas for `HP / ATK / DEF / COST`.
- Exact skill schema and effect-resolution order.
- Whether progression lives inside `Battle Card` or a separate progression record later.
- Whether raw Source Photo can ever be stored, and what opt-in text is required.
- Which local picture generation adapter becomes the first real target after Canvas fallback.
- When to create the Godot project shell after the browser AI pipeline is stable.
