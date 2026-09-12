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

## MVP Question Set

First implementation should only add a small advanced section, not the full long form.

Add these fields first:

1. 照片人物同意
2. 背景故事一句話
3. 最重視什麼
4. 弱點或代價
5. 招牌物品
6. 場所類型
7. 時間 / 氣氛

Do not add sensitive creative context to the UI until consent copy and storage behavior are clearer.

## Open Questions

- Should sensitive creative context be allowed in the first local MVP UI, or only documented for now?
- Should capture time/location come from device APIs later, or stay manual in MVP?
- Should Character Spec store exact user text, normalized tags, or both?
- Should users be able to edit the generated Character Spec before making the card art?
