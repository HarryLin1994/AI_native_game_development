# Character Background Questions

This document is the first draft of the questions used to turn a Source Photo plus player input into a Character Spec.

The form should feel like creating a game character, not filling out a personal-data survey.

比喻：這些問題像 RPG 創角時選職業、背景、天賦，不是查戶口。玩家給得越多，角色越有特色；不給也要能用預設模板生成。

## Goals

- Help the AI card art preserve the subject's broad likeness.
- Turn photo details and player answers into Character Spec fields.
- Make background details affect stats, skills, traits, rarity flavor, and progression hooks.
- Keep sensitive information optional, explicit, and consent-based.
- Provide defaults when players skip optional questions.

## Current MVP Decision

The canonical current questionnaire schema is implemented in:

```text
src/card-generation/questionnaire-schema.js
```

比喻：這個 schema 像角色創建器的規格表。UI 之後可以照著它長出來；卡牌規則也可以照著它解釋「為什麼這張卡得到這些數值與技能」。

Current product decisions:

- 問卷不要求玩家手動填完 10 個欄位；VLM 先依照片、中心人物、場景、OCR、Capture Context、Event Context 產生角色創作方向。
- 拍照或上傳後先跳出角色名字輸入；空白時使用 `路人`。卡牌生成名字必須包含這個名字，例如 `潮流昶志`、`陽光球員昶志`。
- User 未來只需要在逐步彈窗中選擇少數關鍵欄位：`ageImpression`、`values`、`weakness`。
- 其他欄位先由 VLM 自動產生並可 review / edit：`realWorldRole`、`personality`、`specialty`、`combatStyle`、`signatureItem`、`cardMood`。
- `ageImpression`、`values`、`weakness` 是從表情、姿態、場景氛圍產生的角色候選，不是真人年齡、真人價值觀或真人缺點判斷。
- `values` 候選要顯示一句角色敘事，不顯示 VLM tags。
- `storyEvent` 由 VLM 根據照片場景、道具、OCR、地點/時間/節日 context 生成 4 個虛構起源事件，再由系統用 seed 隨機選一個。
- Capture / Event Context 已自動取得，不再放進問卷。
- Sensitive Creative Context 暫不進 MVP UI，只保留為 future-only。
- VLM 可以帶來遊戲隨機性，但不能直接決定最終 stats、skills、rarity 或 COST。
- 每個 free text 欄位都必須經過 rule table / capped mapping，不能直接變成任意 stat boost。
- `cardMood` 只影響美術，不影響角色強度。

Current field order:

| Field | Priority | Required | Default | Model suggestion | Main effect |
|---|---|---:|---|---|---|
| `ageImpression` | Core | no | `young_adult` | 4 VLM candidates from expression/pose/scene | growth flavor, small stat flavor, trait/skill word |
| `realWorldRole` | Core | no | empty | VLM auto role motif from visible context | occupation trait, stat mods, skill word, role motif |
| `personality` | Core | no | empty | VLM auto roleplay motif from expression/pose/scene | small capped battle tendency, personality motif |
| `specialty` | Core | no | empty | VLM auto visible non-sensitive tags | feature hooks, traits, small stat keywords |
| `combatStyle` | Core | no | `auto` | VLM auto suggestion, rule-normalized | primary stat, Combat Role, first skill template |
| `values` | Core | no | `growth` | 4 VLM candidates with one-sentence narrative | skill family, archetype bias, support/offense/defense flavor |
| `weakness` | Recommended | no | empty | 4 VLM battle tradeoff candidates from expression/pose | tradeoff, counterplay, risk/reward |
| `signatureItem` | Recommended | no | role artifact | VLM auto visible/OCR-supported prop | prop hook, passive/skill naming |
| `storyEvent` | Optional | no | empty | 4 VLM fictional origin events, system seed picks 1 | lore, title flavor, future quest hook |
| `cardMood` | Visual | no | `cinematic` | VLM auto visual mood | image prompt and presentation only |

Excluded from the current questionnaire:

- `captureContext`: automatic via EXIF GPS/time, browser GPS, Google Maps, and public holiday lookup.
- `sensitiveCreativeContext`: future-only until consent copy, storage policy, and safe mechanics are designed.
- Any detected age, gender, ethnicity, sexuality, politics, religion, health, or identity claim.

## Generation Control Model

The project should separate four jobs:

- User: declares personal, background, consent, and preference fields.
- OCR / Vision models: suggest visible, non-sensitive signals from the Source Photo.
- Rule / Algorithm layer: turns allowed inputs into Character Spec, stats, skills, traits, and mechanics.
- Picture generation model: renders card art from the Source Photo and Character Spec.

比喻：User 是角色本人或編劇，OCR / Vision 是偵查員，Rule layer 是裁判，Picture generation 是畫師。偵查員不能改比分，畫師不能偷改角色技能。

## VLM Creative Roll Model

Current setup uses a `VLM Creative Roll` before the Character Spec is locked.

```text
Source Photo + VLM Vision Context + Capture/Event Context
  -> VLM creates creative candidates
  -> User chooses from 4 options for selected fields
  -> System picks one story event candidate by seed
  -> Character Spec locks the selected fields
  -> Rule Tables generate stats, skills, traits, prompt hooks
```

比喻：VLM 像 DM 幫玩家丟出 4 個角色靈感，玩家選一個，裁判再照規則算角色能力。沒有被選到的靈感不會偷偷影響角色。

User-choice fields for the future step-by-step modal:

- `ageImpression`: 4 fictional age-direction candidates from expression, pose, and scene energy. Not real age detection.
- `values`: 4 roleplay value candidates from expression, pose, and scene mood. Each option shows one short narrative sentence, not VLM tags. Not real belief detection.
- `weakness`: 4 battle tradeoff candidates from expression, pose, and visible tension. Not real flaw detection.

System-choice field:

- `storyEvent`: 4 fictional origin events from scene, props, OCR, capture location, time, season, and public event context. The system selects one by seed so it feels game-like but remains reproducible.

VLM-auto fields:

- `realWorldRole`: role motif from visible context, such as arcade challenger, street runner, studio creator, or festival wanderer. Not real job detection.
- `personality`: roleplay personality motif from expression, pose, and scene energy. Not real psychology.
- `specialty`: visible non-sensitive skill/theme tags from props, action, outfit, scene, or OCR.
- `combatStyle`: VLM suggestion normalized by rules into `striker`, `duelist`, `guardian`, `controller`, or `trickster`.
- `signatureItem`: visible or OCR-supported item/prop.
- `cardMood`: visual mood from lighting, palette, composition, and scene.

VLM Creative Roll guardrails:

- VLM candidates must be stored as candidates first; only the user's selected candidate becomes Character Spec input.
- `storyEvent` is the exception: it is selected by system seed, not by User.
- VLM cannot output final `HP / ATK / DEF / COST`, rarity, or raw stat boosts.
- VLM cannot infer real age, identity, gender, ethnicity, sexuality, politics, religion, health, wealth, or private beliefs.
- VLM output must include a short explanation of which visible/capture/event signals produced the candidate.
- If the VLM fails, the Default Generation Template creates safe neutral candidates.

Core guardrails:

- AI models may suggest, but the Rule / Algorithm layer decides game mechanics.
- Sensitive facts can only be User-Declared Fields.
- VLM-generated fields must be visible, non-sensitive, reviewable, and rule-normalized before they become important.
- User-choice fields must be selected from candidates before they affect Character Spec.
- Rule-Derived Fields must be deterministic for the same allowed inputs and generator version.
- If an optional field is missing, use the Default Generation Template.
- Do not let free-text answers become arbitrary stat boosts without capped mapping rules.
- Card Stat Line must come from allowed inputs plus rule tables, not from raw AI guesses.

## Question Mapping Contract

Every question that survives into the product must have a clear `Question Mapping`.

Required mapping for each question:

- Player-facing question text.
- Whether the answer is required, recommended, optional, or future-only.
- Source of truth: User-Declared Field, VLM-generated reviewable field, User-selected VLM candidate, Rule-Derived Field, or Default Generation Template.
- Whether OCR / Vision can suggest a value.
- Which `Character Spec` field it writes to.
- Which card-art prompt hooks it creates.
- Which stat, trait, skill, progression, or battle hooks it may affect.
- Player-facing explanation text for why the card received that result.

比喻：每題都要像電線一樣接到一個插座。沒有接到卡面、數值、技能、養成或說明的題目，就先不要放進 MVP。

## Field Source Matrix

| Field | Meaning | Source of truth | Can model suggest it? | Can it affect mechanics? | First rule |
|---|---|---|---|---|---|
| Consent | Permission to use the Source Photo and related context | User only | No | Controls whether generation can run | If `no`, stop generation |
| Character Name Seed | Required name core for generated card title | User or default `路人` | No | Name/title only | Generated Battle Card name must include this text |
| Age Impression | Fictional age direction for the character | User-selected VLM candidate | Yes, 4 roleplay candidates from expression/pose/scene | Yes | Applies small growth/stat flavor rules; never real age detection |
| Real-World Role | Visible role motif, hobby, or background archetype | VLM-generated, reviewable | Yes, from visible scene/prop/OCR context | Yes | Maps to role motif, trait, artifact, and skill word; not real job detection |
| Personality | Roleplay personality motif | VLM-generated, reviewable | Yes, from expression/pose/scene energy | Yes | Small capped modifiers and skill-family flavor; not real psychology |
| Specialty | Visible skill/theme cue | VLM-generated, reviewable | Yes, from visible non-sensitive photo details | Yes | Small capped modifiers and prompt details |
| Combat Style | Battle behavior | VLM-generated, rule-normalized | Yes, from pose/action/scene | Yes | Rules normalize into supported combat roles |
| Card Mood | Visual art direction | VLM-generated or default, reviewable | Yes, from lighting/palette/composition | Mostly visual | Affects prompt and presentation, not raw power |
| Story Event | One-line fictional origin | System-selected VLM candidate | Yes, 4 fictional events from scene/capture/event context | Yes | System seed picks one; adds trait flavor, skill naming, and dialogue hooks |
| Values | What the fictional character fights for | User-selected VLM candidate | Yes, 4 roleplay candidates with one-sentence narrative | Yes | Maps to support, attack, defense, control, or growth bias; not real belief detection |
| Weakness / Cost | Character battle tradeoff | User-selected VLM candidate | Yes, 4 tradeoff candidates from expression/pose | Yes | Must be a capped tradeoff, not a stereotype or punishment |
| Signature Item | Iconic item or prop | VLM-generated, reviewable | Yes, if visible in photo or OCR | Yes | Becomes art prop, trait, passive name, or skill flavor |
| Place Type | Coarse scene or origin place | Automatic Capture Context | Yes, as non-sensitive scene label | Yes | Adds element bias, origin title, or stage flavor |
| Time / Mood | Coarse time, lighting, or atmosphere | Automatic Capture Context | Yes, as mood label only | Yes | Adds visual mood, element bias, or first-turn flavor |
| Sensitive Creative Context | Sexual orientation, politics, religion, health, or similar personal context | User only with explicit consent | Never | Later, maybe | Not in first MVP UI |

## Anti-Runaway Rules

These rules prevent AI from taking over the design.

1. **Models cannot write final stats directly.**
   - Bad: AI returns `"power": 999`.
   - Good: AI suggests `"visibleTraits": ["運動感"]`; rules apply `power +4`, capped at 99.

2. **Models cannot invent sensitive personal facts.**
   - Bad: AI says the subject has a political view from clothing or location.
   - Good: User explicitly provides a political background as optional roleplay context.

3. **Free text must map through controlled categories.**
   - Bad: Any dramatic backstory gives huge attack bonus.
   - Good: Backstory keywords map to small capped motifs like `guardian`, `researcher`, `wanderer`, `performer`.

4. **Image generation cannot change the Character Spec.**
   - Bad: Generated image looks fiery, so the card becomes Fire after generation.
   - Good: Character Spec says `Element = Ember`; image prompt follows it.

5. **Missing data uses defaults.**
   - Bad: No location means generation fails.
   - Good: No location uses `neutral arena`.

6. **Every rule must be explainable to the player.**
   - Bad: "AI decided your character is weak."
   - Good: "你選擇了守護，加上室內冷靜氛圍，所以防禦與專注提高。"

## Draft Rule Mapping

First-pass rule mapping should be simple and capped:

```text
allowed inputs
  -> normalized tags
  -> rule categories
  -> capped stat modifiers
  -> traits / skills / art prompt
```

Suggested caps:

- One field can modify a stat by at most `+4` to `+8` in MVP.
- Total profile modifiers should keep every stat inside `8..99`.
- Weakness should always be a tradeoff, not a pure penalty.
- Rarity should not be based on judging the real person.

Example:

```text
User says:
  values = knowledge
  weakness = overthinking
  signature item = laptop
  place type = street
  time mood = neon night

Rules derive:
  traits = ["解析職能", "霓虹夜行", "資料核心"]
  stat mods = focus +6, speed +3, guard -2
  skill flavor = signal burst / analysis lock
  art prompt = neon street, laptop-like tactical artifact
```

## Card Stat Line

The Battle Card needs visible battle values because this is a battle game, not only an image generator.

First visible stats:

- `HP`: how much damage the character can take.
- `ATK`: how hard the character hits.
- `DEF`: how much damage the character resists.
- `COST`: how expensive or powerful the card is for future team-building rules.
- `Level`: current growth stage.

Internal stats can remain richer:

- `power`
- `speed`
- `guard`
- `focus`
- `luck`

比喻：`HP / ATK / DEF / COST` 是卡面上玩家一眼看到的儀表板；`power / speed / guard / focus / luck` 是引擎裡的零件，負責讓技能和戰鬥有更多變化。

First derivation rule:

```text
Photo Signal + VLM-auto fields + User-selected VLM candidates + optional User-Declared Fields
  -> internal stats
  -> visible Card Stat Line
  -> skills and traits
```

Draft visible stat mapping:

- `HP` comes mostly from `guard`, `focus`, level, and defensive values.
- `ATK` comes mostly from `power`, `speed`, focus, and offensive values.
- `DEF` comes mostly from `guard`, focus, and defensive traits.
- `COST` comes from rarity, total stat budget, level cap, and skill complexity.
- `Level` starts at 1 and changes through progression.

Guardrails:

- `COST` should not imply a person's real-world value.
- Rarity and stats must not be framed as judging the real person.
- AI image output cannot retroactively change stats.
- Every visible stat should be explainable from the accepted inputs.

## Detailed Question Blueprint

This is the working blueprint for the first questionnaire. It is not final UI copy yet.

| Question area | MVP priority | Source of truth | Model role | Character Spec output | Card / battle output |
|---|---|---|---|---|---|
| Consent | Required | User only | None | `consent` | Gates generation and storage |
| Age Impression | Basic | User-selected VLM candidate | Generate 4 candidates from expression/pose/scene | `generationProfile.ageImpression` | Growth flavor, small stat flavor, level cap flavor |
| Real-World Role | Basic | VLM-generated reviewable field | Generate visible role motif, not real job | `generationProfile.realWorldRole` | Archetype, trait names, one skill word, art motif |
| Personality | Basic | VLM-generated reviewable field | Generate roleplay personality motif, not real psychology | `generationProfile.personality` | Small capped battle tendency, personality motif |
| Specialty | Basic | VLM-generated reviewable field | Suggest visible non-sensitive details | `generationProfile.specialty` | Prompt details, small stat modifiers, trait tags |
| Combat Style | Basic | VLM-generated, rule-normalized | Suggest from pose/action/scene | `generationProfile.combatStyle` | Primary internal stat, Combat Role, first skill template |
| Card Mood | Basic | VLM-generated reviewable field or default | Suggest from lighting/palette/composition | `generationProfile.cardMood` | Card art style, frame mood, visual effects |
| Story Event | Recommended | System-selected VLM candidate | Generate 4 fictional origin events and pick 1 by seed | `userSuppliedContext.storyEvents` | Title, trait flavor, skill name, future dialogue hook |
| Values | Recommended | User-selected VLM candidate | Generate 4 roleplay values | `userSuppliedContext.values` | Skill family, support/offense/defense/control/growth bias |
| Weakness / Cost | Recommended | User-selected VLM candidate | Generate 4 battle tradeoffs | `userSuppliedContext.weakness` | Tradeoff, cooldown, risk/reward, counterplay |
| Signature Item | Recommended | VLM-generated reviewable field | Suggest only if visible or OCR-supported | `userSuppliedContext.signatureItem` | Visual prop, passive skill name, card icon |
| Place Type | Automatic | EXIF/GPS/Google Maps/VLM-confirmed scene context | Suggest non-sensitive scene label | `captureContext.placeType` | Element bias, origin title, stage flavor |
| Time / Mood | Automatic | EXIF/runtime capture time and lighting context | Suggest lighting/mood label | `captureContext.timeMood` | Visual atmosphere, element bias, first-turn flavor |
| Sensitive Creative Context | Future-only | User only with explicit consent | Never infer | `sensitiveCreativeContext` | Later: motifs, team synergy, narrative unlocks |

First UX rule:

- The setup screen should show VLM-generated character direction first, then ask only for key choices.
- Current MVP uses a name popup after photo intake; empty input becomes `路人`.
- Future Character Roll should be a step-by-step modal sequence: 年齡印象 -> 價值觀 -> 弱點 / 代價.
- The 3 user-choice fields should appear as four-option pickers, not free-text fields.
- Values options should show one narrative sentence per option, not VLM tag lists.
- Story Event should not be a user-choice modal step; the system randomly selects one seeded event.
- VLM-auto fields should appear as reviewable chips or compact rows, with edit later if needed.
- Capture / Event Context should stay automatic and should not become a manual location/time form.
- Sensitive Creative Context should stay out of the first UI until consent and storage rules are designed.
- Model suggestions must not be hidden decisions; the UI should show why they were generated.

比喻：問卷像角色創建器的「命運抽籤 + 確認」。系統先抽出 4 個有趣方向，玩家挑年齡、價值觀、弱點；故事事件像遊戲抽到的起源，不需要玩家自己選。

## First Stat And Skill Imagination

These are design hooks, not final balance formulas.

| Input | Normalized direction | Internal stat bias | Visible stat effect | Skill / trait imagination |
|---|---|---|---|---|
| 攻擊壓制 | `striker` | `power`, `speed` | Higher `ATK`, higher `COST` if skill is strong | Burst attack, combo finisher |
| 速度連擊 | `duelist` | `speed`, `luck` | Medium `ATK`, lower `DEF`, extra action chance | Multi-hit, dodge, quick draw |
| 防禦守護 | `guardian` | `guard`, `focus` | Higher `HP` and `DEF` | Shield, taunt, ally protection |
| 控制干擾 | `controller` | `focus`, `speed` | Medium stats, higher skill complexity | Delay, lock, debuff, prediction |
| 幸運奇襲 | `trickster` | `luck`, `speed` | Swingy `ATK`, lower consistency | Crit, steal tempo, random bonus |
| 自動判定 | `balanced` or rule-derived | Based on accepted photo/user tags | Balanced line | Rules choose one safe template |

Values can steer skill family:

| Value | Rule direction | Possible mechanics |
|---|---|---|
| 友情 | Support | Heal ally, shared shield, team combo |
| 自由 | Mobility | Dodge, reposition, escape debuff |
| 秩序 | Control | Stun, lock, cleanse chaos effects |
| 勝利 | Offense | Execute, bonus damage after setup |
| 知識 | Analysis | Reveal intent, weaken enemy, improve accuracy |
| 守護 | Defense | Barrier, counter, damage reduction |
| growth / default | Progression | Extra XP, stable balanced stats |

Weakness should create a playable tradeoff:

- `過度分析`: higher focus, but first attack may be slower.
- `容易衝動`: higher opening ATK, but lower DEF for one turn.
- `害怕失去隊友`: stronger support when ally is damaged, but weaker alone.
- `消耗很大`: powerful skill with cooldown or higher COST.

比喻：弱點不是扣分，而是角色的「打法代價」。像重裝戰士很硬但慢，刺客很快但脆，這樣戰鬥才有選擇。

## Form Structure

### Step 0: Consent

Required before using a real photo.

Questions:

1. 這張照片中的主要人物是你本人嗎？
   - `self`
   - `someone_else_with_consent`

2. 你是否同意把這張照片用於本機角色生成與卡牌圖生成？
   - `yes`
   - `no`

Rule:

- If consent is `no`, do not generate.
- If the subject is someone else, the user must confirm that the subject agreed.
- Consent should cover Source Photo, User-Supplied Context, and optional Capture Context separately later.

### Step 1: VLM Character Roll

After photo upload, the VLM creates the first draft of character direction.

Auto-generated review fields:

- `realWorldRole`: visible role motif, such as arcade challenger, campus explorer, street athlete, studio creator.
- `personality`: roleplay personality motif, such as playful, calm, ambitious, mysterious.
- `specialty`: visible skill/theme tags from scene, prop, action, outfit, or OCR.
- `combatStyle`: rule-normalized battle style suggestion.
- `signatureItem`: visible or OCR-supported prop.
- `cardMood`: art mood from lighting, palette, composition, and scene.

Rules:

- These are VLM-sourced roleplay/game motifs, not factual claims about the person.
- User can review them, but the first MVP does not need a long manual edit form.
- The Rule layer normalizes them before mechanics use them.

### Step 2: User Choice

The user chooses one option from 4 VLM candidates for the fields that define character flavor and battle tradeoff. In the current MVP, only the character name popup is implemented; this step becomes a modal flow later.

Choice groups:

1. 年齡印象
   - 4 fictional roleplay age directions from expression, pose, and scene.
   - This is not real age detection.

2. 價值觀
   - 4 fictional values or fighting motivations from expression and scene mood.
   - Each option should show one short narrative sentence.
   - Do not show VLM tags here.
   - This is not real belief detection.

3. 弱點 / 代價
   - 4 battle tradeoff options from expression, pose, visible tension, and role motif.
   - This must become risk/reward design, not a punishment.

Rule:

- Unselected candidates are discarded and must not affect stats or prompts.
- If the user skips a group, choose the safest default candidate generated from the Default Generation Template.

System random group:

- 故事事件
  - VLM creates 4 fictional origin events from scene, prop, OCR, capture location, time, season, and public event context.
  - The system selects one by seed; this selected event becomes lore, skill naming, prompt hook, and later progression hook.

### Step 3: Optional Sensitive Creative Context

This section must be clearly marked as optional.

Questions:

1. 是否要加入自願提供的身份、價值觀或敏感背景？
   - 不加入
   - 加入，但只用於角色故事
   - 加入，並允許影響技能與機制

2. 你想加入哪些自願背景？
   - Free text
   - Examples: 性向、政治取向、宗教背景、族群文化、健康經驗、人生經歷

Rules:

- Never infer sensitive context from the Source Photo, OCR, location, time, clothes, face, or pose.
- Sensitive context can only come from the subject or with explicit consent from the subject.
- Sensitive context should not become a weakness, joke, punishment, or stereotype.
- If used mechanically, it should become values, motifs, support style, resistance, team synergy, or narrative unlocks.

比喻：敏感背景只能是玩家自己寫進角色設定書的章節，不能是系統偷看照片後亂猜的註解。

### Step 4: Capture Context

Capture Context is no longer a questionnaire section in the current MVP.

Current rule:

- Uploaded JPEG can provide EXIF capture time and GPS.
- If EXIF GPS is missing, Browser Geolocation can provide GPS after consent.
- Server resolves address, Google place, place type, and public holiday context automatically.
- Missing Google Maps data falls back to internal location hooks, not a Google Maps URL.
- User-facing review UI can come later, but the first questionnaire should not ask users to manually classify location/time.

Capture Context should create flavor and mechanics, not tracking.

## Default Generation Template

Use this when optional fields are skipped or VLM candidate generation fails:

```json
{
  "origin": "Localhost Training Gate",
  "timeMood": "present day",
  "placeType": "neutral arena",
  "weatherMood": "clear",
  "values": ["growth"],
  "ageImpression": "young_adult",
  "weakness": "steady but predictable",
  "storyEvent": "entered a quiet training gate and awakened a balanced card form",
  "storyTone": "rising challenger",
  "mechanicBias": "balanced"
}
```

## Mapping to Character Spec

Example structure:

```json
{
  "consent": {
    "subject": "self",
    "photoUse": true,
    "sensitiveContextUse": "none",
    "captureContextUse": "coarse"
  },
  "generationProfile": {
    "ageImpression": "young_adult",
    "realWorldRole": "engineer",
    "visibleTraits": ["眼鏡", "冷靜", "黑外套"],
    "combatStyle": "controller",
    "cardMood": "neon"
  },
  "userSuppliedContext": {
    "backstory": "城市裡的資料分析師，使用光線與符號作戰。",
    "values": ["knowledge", "protection"],
    "weakness": "過度分析",
    "signatureItem": "筆電"
  },
  "sensitiveCreativeContext": {
    "mode": "none",
    "text": ""
  },
  "captureContext": "automatic_context"
}
```

## Mapping to Game Mechanics

The first rules can stay simple:

- User-selected Age Impression candidate affects stat modifiers and growth flavor.
- VLM-generated Real-World Role motif affects trait, artifact, and one skill word.
- VLM-generated Personality and Specialty tags affect small stat bonuses and card art prompt details.
- VLM-generated Combat Style is normalized by rules and decides primary stat and battle role.
- VLM-generated Card Mood affects image prompt and UI presentation only.
- User-selected Story Event and Values candidates affect trait names, skill flavor, and future dialogue options.
- User-selected Weakness candidate becomes a battle tradeoff, not a punishment tied to sensitive identity.
- VLM-generated Signature Item can become a visual prop or passive skill name.
- Capture Context can affect element bias, origin title, stage modifier, or skill flavor.

Example:

```text
night + street + neon
  -> element bias: Voltage / Umbra
  -> trait: Neon Drifter
  -> skill flavor: afterimage, ambush, signal burst
  -> battle modifier: first-turn speed bonus
```

## Future Product Imagination

The questionnaire should eventually become a guided character-generation flow, not a static form.

### Phase 1: Local MVP

- User uploads a Source Photo.
- VLM creates auto fields and 4 candidate choices for key roleplay fields.
- User selects from the 4-choice groups; skipped groups use safe defaults.
- Rules create a deterministic Character Spec from selected candidates, VLM-auto fields, and capture/event context.
- Card Stat Line, Traits, Skills, and Card Cover are generated from that Character Spec.
- Save only what is needed for the Battle Card; source-photo retention needs explicit opt-in.

### Phase 2: Confirmed Model Suggestions

- OCR / Vision suggests visible traits, colors, OCR text, place type, lighting mood, and roleplay candidates.
- User confirms, selects, or edits those suggestions before they affect mechanics.
- The UI shows a short explanation such as: `你確認了「霓虹夜晚」與「筆電」，因此角色獲得資料/電系傾向。`

### Phase 3: Card Art Adapter

- Character Spec becomes the single source for card art prompt generation.
- Source Photo guides likeness and pose.
- User-selected candidates and VLM-auto fields guide costume, element, aura, background, props, and mood.
- Generated art cannot change stats after the fact.

### Phase 4: Progression And Memory

- Walking, conversations, battle results, or repeated captures can add XP and unlock memories.
- Values and weaknesses can decide progression quests.
- Capture Context can become a "memory stamp", such as `Night Street Origin`, without needing exact GPS.

### Phase 5: Battle System Integration

- Each Battle Card has active skills, passive traits, `HP / ATK / DEF / COST / Level`, and internal stats.
- Future deck or team rules can use `COST` to prevent one team from stacking only high-power cards.
- Card effects should be data-driven so the battle engine resolves them in a consistent order.
- UI should support Hearthstone-like card movement later: hover lift, drag, target glow, snapback, impact flash, and damage numbers.

## MVP Question Set

First implementation should not add a full long form.

First pass implementation status: the fields were prototyped, then moved out of the main generator UI after review. The main screen should stay card-first. The next setup flow should show VLM-generated fields and 4-choice candidate groups instead of asking the player to manually fill everything.

Current setup fields:

1. 角色名字：拍照或上傳後跳窗輸入；空白預設 `路人`；生成卡名必須包含這個名字。
2. 年齡印象：VLM 產生 4 個候選，未來彈窗讓 User 選 1 個。
3. 價值觀：VLM 產生 4 個候選，每個候選一句角色敘事，未來彈窗讓 User 選 1 個。
4. 弱點或代價：VLM 產生 4 個候選，未來彈窗讓 User 選 1 個。
5. 故事事件：VLM 產生 4 個候選，系統 seed 隨機選 1 個。
6. 身份 / 背景：VLM 自動生成，可 review。
7. 性格：VLM 自動生成，可 review。
8. 專長 / 特色：VLM 自動生成，可 review。
9. 戰鬥風格：VLM 自動生成後由規則正規化，可 review。
10. 招牌物品：VLM 自動生成，可 review。
11. 卡面氣質：VLM 自動生成，可 review；只影響美術。

Consent should be handled at game entry / onboarding, not inside the card generator screen.

Do not add sensitive creative context to the UI until consent copy, storage behavior, and the separate setup flow are clearer.

## Open Questions

- Should sensitive creative context be allowed in the first local MVP UI, or only documented for now?
- Should Character Spec store exact user text, normalized tags, or both?
- Should users be able to edit the generated Character Spec before making the card art?
- Should the four VLM candidates be deterministic from seed for replay/debug, or should each reroll request create fresh candidates?
