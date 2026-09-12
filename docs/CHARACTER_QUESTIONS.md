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

## Generation Control Model

The project should separate four jobs:

- User: declares personal, background, consent, and preference fields.
- OCR / Vision models: suggest visible, non-sensitive signals from the Source Photo.
- Rule / Algorithm layer: turns allowed inputs into Character Spec, stats, skills, traits, and mechanics.
- Picture generation model: renders card art from the Source Photo and Character Spec.

比喻：User 是角色本人或編劇，OCR / Vision 是偵查員，Rule layer 是裁判，Picture generation 是畫師。偵查員不能改比分，畫師不能偷改角色技能。

Core guardrails:

- AI models may suggest, but the Rule / Algorithm layer decides game mechanics.
- Sensitive facts can only be User-Declared Fields.
- Model-Suggested Fields must be visible, non-sensitive, and user-editable before they become important.
- Rule-Derived Fields must be deterministic for the same allowed inputs and generator version.
- If an optional field is missing, use the Default Generation Template.
- Do not let free-text answers become arbitrary stat boosts without capped mapping rules.
- Card Stat Line must come from allowed inputs plus rule tables, not from raw AI guesses.

## Question Mapping Contract

Every question that survives into the product must have a clear `Question Mapping`.

Required mapping for each question:

- Player-facing question text.
- Whether the answer is required, recommended, optional, or future-only.
- Source of truth: User-Declared Field, confirmed Model-Suggested Field, Rule-Derived Field, or Default Generation Template.
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
| Age Impression | Fictional age direction for the character | User | No for MVP | Yes | Applies small growth/stat flavor rules |
| Real-World Role | Declared job, identity, hobby, or role motif | User | No, unless user asks for suggestions | Yes | Maps to role motif, trait, artifact, and skill word |
| Visible Traits | Appearance or vibe cues such as glasses, short hair, black jacket, calm | User-confirmed | Yes, from visible non-sensitive photo details | Yes | Small capped modifiers and prompt details |
| Combat Style | Desired battle behavior | User or `auto` | No | Yes | If `auto`, rules derive from Photo Signal |
| Card Mood | Visual art direction | User or default | No | Mostly visual | Affects prompt and presentation, not raw power |
| Background Story | One-line fictional origin | User or generated default | Yes, if user asks for a draft | Yes | Adds trait flavor, skill naming, and dialogue hooks |
| Values | What the character cares about | User or default | No | Yes | Maps to support, attack, defense, control, or growth bias |
| Weakness / Cost | Character tradeoff | User or generated neutral default | Yes, if user asks for a draft | Yes | Must be a capped tradeoff, not a stereotype or punishment |
| Signature Item | Iconic item or prop | User-confirmed | Yes, if visible in photo or OCR | Yes | Becomes art prop, trait, passive name, or skill flavor |
| Place Type | Coarse scene or origin place | User or optional photo scene suggestion | Yes, as non-sensitive scene label | Yes | Adds element bias, origin title, or stage flavor |
| Time / Mood | Coarse time, lighting, or atmosphere | User or optional photo lighting suggestion | Yes, as mood label only | Yes | Adds visual mood, element bias, or first-turn flavor |
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
Photo Signal + User-Declared Fields + confirmed Model-Suggested Fields
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
| Age Impression | Basic | User | None in MVP | `generationProfile.ageImpression` | Growth flavor, small stat flavor, level cap flavor |
| Real-World Role | Basic | User | May suggest examples only if asked | `generationProfile.realWorldRole` | Archetype, trait names, one skill word, art motif |
| Visible Traits | Basic | User-confirmed | Suggest visible non-sensitive details | `generationProfile.visibleTraits` | Prompt details, small stat modifiers, trait tags |
| Combat Style | Basic | User or `auto` rules | None | `generationProfile.combatStyle` | Primary internal stat, Combat Role, first skill template |
| Card Mood | Basic | User or default | None | `generationProfile.cardMood` | Card art style, frame mood, visual effects |
| Background Story | Recommended | User or default draft | Draft only when user asks | `userSuppliedContext.backstory` | Title, trait flavor, skill name, future dialogue hook |
| Values | Recommended | User or default | None | `userSuppliedContext.values` | Skill family, support/offense/defense/control/growth bias |
| Weakness / Cost | Recommended | User or neutral default | Draft only when user asks | `userSuppliedContext.weakness` | Tradeoff, cooldown, risk/reward, counterplay |
| Signature Item | Recommended | User-confirmed | Suggest only if visible or OCR-supported | `userSuppliedContext.signatureItem` | Visual prop, passive skill name, card icon |
| Place Type | Optional | User or confirmed scene suggestion | Suggest non-sensitive scene label | `captureContext.placeType` | Element bias, origin title, stage flavor |
| Time / Mood | Optional | User or confirmed lighting suggestion | Suggest lighting/mood label | `captureContext.timeMood` | Visual atmosphere, element bias, first-turn flavor |
| Sensitive Creative Context | Future-only | User only with explicit consent | Never infer | `sensitiveCreativeContext` | Later: motifs, team synergy, narrative unlocks |

First UX rule:

- Basic questions should fit on one clear screen after photo upload.
- Recommended questions can be shown as an "advanced flavor" section.
- Optional Capture Context should be manual and coarse in MVP.
- Sensitive Creative Context should stay out of the first UI until consent and storage rules are designed.
- Model suggestions should appear as editable chips, not hidden decisions.

比喻：問卷像角色創建器的「快速模式 + 進階模式」。快速模式能立刻開卡；進階模式讓角色更有故事，但不能卡住玩家。

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

### Step 1: Core Character Direction

These should appear in the basic MVP form.

Questions:

1. 你想讓這個角色的年齡印象偏向？
   - 少年
   - 青年
   - 成年
   - 資深
   - 傳奇

2. 這個角色在現實中的身份或背景是什麼？
   - Free text
   - Examples: 工程師、學生、設計師、運動員、創作者、研究者

3. 這個角色最明顯的外觀或氣質特徵是什麼？
   - Free text tags
   - Examples: 眼鏡、短髮、黑外套、冷靜、運動感、神秘

4. 你希望這個角色的戰鬥風格是？
   - 自動判定
   - 攻擊壓制
   - 速度連擊
   - 防禦守護
   - 控制干擾
   - 幸運奇襲

5. 你希望卡面氣質偏向？
   - 電影感
   - 霓虹科技
   - 祕法幻想
   - 街頭英雄
   - 史詩王者

### Step 2: Story Flavor

These are recommended, but skippable.

Questions:

1. 這個角色的背景故事一句話是什麼？
   - Free text
   - Example: 曾經是城市裡的資料分析師，現在用光線與符號作戰。

2. 這個角色最重視什麼？
   - 友情
   - 自由
   - 秩序
   - 勝利
   - 知識
   - 守護
   - 自訂

3. 這個角色的弱點或代價是什麼？
   - Free text
   - Example: 過度分析、容易衝動、害怕失去隊友

4. 這個角色的招牌物品是什麼？
   - Free text
   - Example: 耳機、筆電、護身符、相機、球鞋、舊外套

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

This should be optional and coarse by default.

Questions:

1. 是否要使用拍攝時間作為角色生成材料？
   - 不使用
   - 使用概略時間

2. 是否要使用拍攝地點作為角色生成材料？
   - 不使用
   - 使用場所類型
   - 使用概略地區

3. 場所類型是？
   - 室內
   - 街道
   - 學校
   - 辦公室
   - 公園
   - 海邊
   - 山區
   - 交通場所
   - 自訂

4. 天氣或氛圍是？
   - 晴朗
   - 雨天
   - 夜晚
   - 黃昏
   - 霓虹
   - 安靜
   - 混亂
   - 自訂

Rules:

- Default should not require exact GPS.
- Exact location should not be needed for MVP.
- Capture Context should create flavor and mechanics, not tracking.

## Default Generation Template

Use this when optional fields are skipped:

```json
{
  "origin": "Localhost Training Gate",
  "timeMood": "present day",
  "placeType": "neutral arena",
  "weatherMood": "clear",
  "values": ["growth"],
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
  "captureContext": {
    "timeMood": "night",
    "placeType": "street",
    "weatherMood": "neon"
  }
}
```

## Mapping to Game Mechanics

The first rules can stay simple:

- Age Impression affects stat modifiers and growth flavor.
- Real-World Role affects trait, artifact, and one skill word.
- Visible Traits affect small stat bonuses and card art prompt details.
- Combat Style decides primary stat and battle role.
- Card Mood affects image prompt and UI presentation.
- Backstory and values affect trait names, skill flavor, and future dialogue options.
- Weakness can become a tradeoff, but not a punishment tied to sensitive identity.
- Signature Item can become a visual prop or passive skill name.
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
- User answers the basic and recommended questions manually.
- Rules create a deterministic Character Spec.
- Card Stat Line, Traits, Skills, and Card Cover are generated from that Character Spec.
- Save only what is needed for the Battle Card; source-photo retention needs explicit opt-in.

### Phase 2: Confirmed Model Suggestions

- OCR / Vision suggests visible traits, colors, OCR text, place type, and lighting mood.
- User confirms or edits those suggestions before they affect mechanics.
- The UI shows a short explanation such as: `你確認了「霓虹夜晚」與「筆電」，因此角色獲得資料/電系傾向。`

### Phase 3: Card Art Adapter

- Character Spec becomes the single source for card art prompt generation.
- Source Photo guides likeness and pose.
- User answers guide costume, element, aura, background, props, and mood.
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

First implementation should only add a small advanced section, not the full long form.

First pass implementation status: the fields were prototyped, then moved out of the main generator UI after review. The main screen should stay card-first. For now these fields exist as hidden/default generation inputs until a separate setup or review flow is designed.

Prototype/default fields:

1. 背景故事一句話
2. 最重視什麼
3. 弱點或代價
4. 招牌物品
5. 場所類型
6. 時間 / 氣氛

Consent should be handled at game entry / onboarding, not inside the card generator screen.

Do not add sensitive creative context to the UI until consent copy, storage behavior, and the separate setup flow are clearer.

## Open Questions

- Should sensitive creative context be allowed in the first local MVP UI, or only documented for now?
- Should capture time/location come from device APIs later, or stay manual in MVP?
- Should Character Spec store exact user text, normalized tags, or both?
- Should users be able to edit the generated Character Spec before making the card art?
