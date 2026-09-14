# Skill System

This document records confirmed design decisions for generated character skills and battle identity.

比喻：`Combat Core` 像籃球位置，玩家先知道這個角色大方向是進攻、防守或輔助；`Combat Variant` 像同一位置裡的打法差異，例如快攻、單打、擋拆。

## Working Method

Each open design question must be handled in this format:

```text
Question
  -> options
  -> recommended answer
  -> implementation method
  -> confirmed answer
```

Only confirmed answers should be treated as product rules. Unconfirmed options are discussion material.

## Design Goal

The Skill System should make generated characters feel surprising but still readable in battle.

The intended flow is:

```text
Source Photo + VLM tags + User choices + Capture/Event context
  -> Character Identity
  -> Combat Core
  -> Combat Variant
  -> Skill Kit
  -> Progression Hooks
  -> Battle Feedback
```

AI models may suggest visible material, but battle-facing skill rules should come from deterministic rule tables and effect specs.

## Confirmed Decisions

### 1. Combat Core v1

Confirmed answer:

```text
Combat Core v1 = 攻擊型 / 防禦型 / 支援型
```

Player-facing labels:

| Core key | Player label | Meaning |
|---|---|---|
| `attack` | `攻擊型` | Wins by damage pressure, bursts, combos, or tempo. |
| `defense` | `防禦型` | Wins by survival, shields, counters, mitigation, or control. |
| `support` | `支援型` | Wins by buffs, healing, utility, disruption, or unusual comeback tools. |

Current working variants:

| Combat Core | Working variants |
|---|---|
| `攻擊型` | `爆發`, `連擊` |
| `防禦型` | `守護`, `控制` |
| `支援型` | `奇策`, `補助` |

Implementation method:

```js
{
  combatCore: "attack",
  combatCoreLabel: "攻擊型",
  combatVariant: "burst",
  combatVariantLabel: "爆發"
}
```

The card UI should primarily show the Combat Core. The Combat Variant can influence skill names, skill effects, battle animations, and upgrade branches.

### 2. Skill Kit v1

Confirmed answer:

```text
Each generated Battle Card has:
  - 2 Active Skills
  - 2 Battle Traits
  - 1 Ultimate Skill
```

Player-facing structure:

| Slot | Player meaning | Battle behavior |
|---|---|---|
| `activeSkills[0]` | Main usable move | A reliable move that expresses the character's core play pattern. |
| `activeSkills[1]` | Secondary usable move | A tactical move that gives choice, setup, recovery, or a variant expression. |
| `battleTraits[0]` | Identity trait | Always-on or battle-start behavior connected to who this character is. |
| `battleTraits[1]` | Conditional trait | Triggered behavior connected to weakness, story, event, location, or comeback moments. |
| `ultimateSkill` | Signature finisher | High-impact move that needs charge, condition, or timing. |

Implementation target:

```js
{
  skillKit: {
    activeSkills: [activeSkillA, activeSkillB],
    battleTraits: [battleTraitA, battleTraitB],
    ultimateSkill
  }
}
```

Every Skill Kit entry must include at least one `identityHook` so the system can explain why the skill belongs to this character.

Example:

```js
{
  id: "sunlit_fast_break",
  slot: "active",
  name: "陽光快攻",
  identityHooks: [
    { source: "visibleSemanticTag", value: "basketball court" },
    { source: "characterNameSeed", value: "昶志" },
    { source: "combatCore", value: "攻擊型" }
  ],
  effectSpec: [
    { op: "damage", target: "enemy", scale: "atk", ratio: 1.2 },
    { op: "gainUltimateCharge", target: "self", amount: 12 }
  ]
}
```

This means the game can show the player:

```text
這招來自：籃球場 + 攻擊型 + 昶志的角色名
```

### 3. Ultimate Activation v1

Confirmed answer:

```text
Ultimate Skill activation = Ultimate Charge + Ultimate Condition
```

The Ultimate Skill should not be usable just because a fixed cooldown is ready. It needs:

1. Enough `ultimateCharge`.
2. A character-specific `ultimateCondition` that comes from the Character Spec.

Implementation target:

```js
{
  ultimateSkill: {
    name: "終場逆轉快攻",
    chargeCost: 100,
    chargeRules: [
      { event: "dealDamage", amount: 12 },
      { event: "takeDamage", amount: 8 },
      { event: "triggerBattleTrait", amount: 15 }
    ],
    condition: {
      op: "any",
      rules: [
        { op: "hpBelow", target: "self", percent: 45 },
        { op: "usedActiveSkillCount", count: 2 },
        { op: "hasTagTrigger", tag: "basketball court" }
      ]
    },
    identityHooks: [
      { source: "visibleSemanticTag", value: "basketball court" },
      { source: "weakness", value: "容易逞強" },
      { source: "combatVariant", value: "連擊" }
    ],
    effectSpec: [
      { op: "damage", target: "enemy", scale: "atk", ratio: 2.2 },
      { op: "buff", target: "self", stat: "speed", amount: 12, turns: 1 }
    ]
  }
}
```

Design rule:

```text
Ultimate Charge makes the player anticipate the big moment.
Ultimate Condition makes the big moment feel like this character's story.
```

Examples:

| Character signal | Possible Ultimate Condition |
|---|---|
| `攻擊型` + `連擊` | after using two Active Skills |
| `攻擊型` + `爆發` | after dealing enough total damage |
| `防禦型` + `守護` | after gaining or losing shield |
| `防禦型` + `控制` | when the enemy is debuffed |
| `支援型` + `奇策` | after a random or reversal trait triggers |
| `支援型` + `補助` | when self or ally is below an HP threshold |
| weakness: overconfidence | when self HP is below a threshold |
| event: New Year | after reaching full charge for the first time |
| visible tag: arcade | after combo or streak count reaches a threshold |

### 4. Skill Effect Spec v1

Confirmed answer:

```text
All Skill Kit entries must be represented as data and resolved by one Skill Effect Interpreter.
```

This applies to:

- Active Skills
- Battle Traits
- Ultimate Skills

Display text can be expressive, but the battle result must come from `effectSpec`.

Implementation target:

```js
{
  id: "neon_combo_drive",
  slot: "active",
  name: "霓虹連段",
  activation: {
    type: "manual",
    cooldown: 2
  },
  identityHooks: [
    { source: "visibleSemanticTag", value: "arcade" },
    { source: "signatureItem", value: "controller" },
    { source: "combatCore", value: "攻擊型" }
  ],
  effectSpec: [
    { op: "damage", target: "enemy", scale: "atk", ratio: 1.05 },
    { op: "gainUltimateCharge", target: "self", amount: 14 }
  ],
  displayText: "以街機節奏打出連段，命中後累積大招能量。"
}
```

Allowed v1 operation vocabulary:

| Operation | Meaning |
|---|---|
| `damage` | Deal damage to a target. |
| `shield` | Add shield to a target. |
| `heal` | Restore HP. |
| `buff` | Add temporary positive stat modifier. |
| `debuff` | Add temporary negative stat modifier. |
| `gainUltimateCharge` | Add Ultimate Charge. |
| `cooldownChange` | Increase or reduce skill cooldown. |
| `triggerOnBattleStart` | Register a battle-start trigger. |
| `triggerOnHpBelow` | Register an HP-threshold trigger. |
| `checkUltimateCondition` | Check whether an Ultimate Condition is currently true. |

The operation vocabulary should stay small until the MVP battle loop is stable.

### 5. VLM Skill Influence v1

Confirmed answer:

```text
VLM influence = material-level + naming-level only.
```

This combines:

- Option A: VLM provides visible material.
- Option C: VLM may suggest skill names and narrative phrasing.

VLM must not directly decide executable battle effects.

Allowed VLM influence:

| Area | Allowed |
|---|---|
| `skillMaterialProfile.visibleTags` | yes |
| `skillMaterialProfile.sceneMotifs` | yes |
| `skillMaterialProfile.actionCues` | yes |
| `skillMaterialProfile.propCues` | yes |
| `skillMaterialProfile.moodCues` | yes |
| `skillMaterialProfile.namingCandidates` | yes |
| `identityHooks` | yes, after normalization |
| `displayText` | yes, after validation |

Forbidden VLM influence:

| Area | Forbidden |
|---|---|
| `effectSpec.op` | VLM cannot create operations. |
| `effectSpec.ratio` / `amount` | VLM cannot set battle numbers. |
| `target` | VLM cannot choose arbitrary target rules. |
| `cooldown` / `chargeCost` | VLM cannot set costs. |
| `ultimateCondition` | VLM cannot directly write conditions. It can supply material that maps to rule-table conditions. |
| rarity, HP, ATK, DEF, COST | VLM cannot assign card power. |

Implementation target:

```js
const skillMaterialProfile = buildSkillMaterialProfile({
  characterSpec,
  visionContext,
  questionnaireContext,
  captureContext,
  eventContext
});

const skillKit = generateSkillKit({
  characterSpec,
  cardStats,
  combatCore,
  combatVariant,
  skillMaterialProfile,
  rng
});
```

`skillMaterialProfile` shape:

```js
{
  visibleTags: ["arcade", "neon sign", "controller"],
  actionCues: ["standing forward", "playful expression"],
  propCues: ["controller"],
  sceneMotifs: ["retro arcade", "neon room"],
  moodCues: ["energetic", "competitive"],
  namingCandidates: ["霓虹連段", "投幣衝刺", "清台時刻"],
  rejectedSensitiveCues: [],
  sourceTrace: [
    { source: "visibleSemanticTag", value: "arcade" },
    { source: "visibleSemanticTag", value: "controller" }
  ]
}
```

Selection algorithm:

```text
1. Normalize VLM output into Skill Material Profile.
2. Remove sensitive, identity-like, or unsupported cues.
3. Score skill patterns from deterministic rule tables.
4. Use seeded RNG to choose among top legal patterns.
5. Bind visible/user/context sources into identityHooks.
6. Use namingCandidates only for name/displayText.
7. Build effectSpec from rule-table operations.
8. Validate Skill Kit before saving.
```

Pattern scoring v1:

| Signal source | Influence |
|---|---:|
| Combat Core match | +50 |
| Combat Variant match | +35 |
| User value / weakness / story hook | +25 |
| Visible Semantic Tag match | +15 |
| Signature item match | +15 |
| Event Combat Profile match | +10 |
| Capture/place/time motif match | +8 |
| VLM naming candidate only | +0 to battle effect, naming only |

The score chooses among existing rule patterns. It does not change battle math directly.

Example:

```text
VLM says: arcade, neon sign, controller, playful expression.
Rules map:
  arcade/controller -> combo, cooldown, ultimate charge naming pool
  neon -> visual/name motif only
  playful expression -> trick/support naming pool only
Combat Core says: 攻擊型
Combat Variant says: 連擊
Result:
  name may become 霓虹連段
  effectSpec comes from 攻擊型/連擊 pattern table
```

### 6. Progression Feedback v1

Confirmed answer:

```text
Progression feedback = stats growth + skill strengthening + skill branch evolution + visual evolution.
```

This is the full direction. A progression MVP is only accepted as "runnable" when it can complete the actual visual image-generation path for an evolved card.

Local frames, auras, badges, and UI overlays are still useful, but they are fallback or supporting presentation. They do not count as completed Visual Evolution by themselves.

Confirmed level model:

```text
Level Cap = 100
Evolution Milestones = Lv.16 / Lv.36 / Lv.70 / Lv.100
```

Milestone table:

| Level | Milestone | Branch focus | Visual tier |
|---:|---|---|---:|
| 16 | 一階進化 | first Active Skill branch | 2 |
| 36 | 二階進化 | second Active Skill branch | 3 |
| 70 | 覺醒 | Battle Trait / Ultimate direction | 4 |
| 100 | 完成體 | final Ultimate route and final art revision | 5 |

Reaching a milestone records a pending evolution milestone. It does not auto-pick a branch.

Player-facing feedback:

| Feedback type | What the player sees | Rule source |
|---|---|---|
| Stats growth | HP/ATK/DEF/COST/Level update | level curve + rarity + Combat Core |
| Skill strengthening | skill effect numbers improve | Skill Rank rule table |
| Skill branch evolution | skill chooses an upgrade route | Skill Branch rule table |
| Visual evolution | newly generated evolved card art, plus frame/aura/badge changes | Visual Evolution profile + Card Art Provider |

Minimum runnable data model:

```js
{
  progression: {
    schemaVersion: 1,
    maxLevel: 100,
    level: 1,
    xp: 0,
    xpToNext: 100,
    skillRanks: {
      active0: 1,
      active1: 1,
      trait0: 1,
      trait1: 1,
      ultimate: 1
    },
    selectedBranches: {
      active0: null,
      active1: null,
      trait0: null,
      trait1: null,
      ultimate: null
    },
    selectedBranchDetails: {},
    visualEvolution: {
      tier: 1,
      frameKey: "base",
      auraKey: "none",
      badgeKeys: [],
      artRevision: 0,
      promptHooks: [],
      imageStatus: "base",
      currentArtUrl: null,
      evolutionArtJobs: []
    },
    pendingChoices: [],
    progressionLock: null,
    pendingEvolutionArt: null,
    pendingEvolutionMilestones: [],
    completedEvolutionMilestones: [],
    completedEvolutionSteps: [],
    failedEvolutionSteps: [],
    visualHistory: [
      {
        tier: 1,
        artRevision: 0,
        artUrl: null,
        provider: null,
        acceptedAt: null
      }
    ],
    progressionTransactions: [
      {
        id: "prog_tx_001",
        status: "complete",
        createdAt: "2026-09-13T00:00:00.000Z",
        reason: "initial_card_generation"
      }
    ],
    battleRecord: {
      wins: 0,
      losses: 0,
      battles: 0
    }
  }
}
```

Minimum runnable loop:

```text
Battle result or training action
  -> gain XP
  -> applyProgression()
  -> level up if XP threshold reached
  -> stop at Level Cap 100
  -> record pending Evolution Milestone if Lv.16 / Lv.36 / Lv.70 / Lv.100 is reached
  -> recalculate Card Stat Line
  -> increase Skill Rank if level rule unlocks it
  -> create Pending Branch Choice if branch level is reached
  -> player chooses Skill Branch
  -> apply branch effects to future stats/skills/prompt hooks
  -> update Visual Evolution profile
  -> create Evolution Art Job
  -> call Card Art Provider for evolved card art
  -> validate generated evolved card art
  -> accept and save evolved art result
  -> save Battle Card progression
  -> refresh card detail UI
```

Implementation target:

```js
applyProgression({
  battleCard,
  xpGained,
  reason,
  rng
});
```

Return shape:

```js
{
  battleCard,
  rewards: [
    { type: "levelUp", from: 1, to: 2 },
    { type: "statGrowth", stat: "atk", amount: 12 },
    { type: "skillRankUp", slot: "active0", from: 1, to: 2 },
    { type: "visualEvolutionUnlocked", tier: 2, frameKey: "bronze_glow" }
  ],
  pendingChoices: [
    {
      type: "skillBranch",
      slot: "active0",
      choiceId: "branch_active0_lv3",
      required: true,
      options: ["burst_route", "combo_route"]
    }
  ],
  progressionLock: {
    reason: "pending_branch_choice",
    choiceId: "branch_active0_lv3"
  }
}
```

Confirmed branch-choice rule:

```text
Skill Branch choices are blocking player choices.
```

No auto-pick, no hidden random branch. If branch-choice UI is not implemented, the level-up/evolution transaction remains pending and the card is not considered fully progressed.

Confirmed branch-choice UI:

```text
Branch Choice UI v1 = A / blocking modal
```

When a selected Battle Card has a required pending Skill Branch choice, the app opens a modal with the two generated options. The player must choose before starting another battle with that card. The implemented browser UI lives in [`app.js`](../app.js) and [`index.html`](../index.html).

While a card has `progressionLock.reason = "pending_branch_choice"`:

- The card can still be viewed.
- The player can inspect the pending branch options.
- The card should not start new XP-granting training or battle.
- Derived stats/skills should show a "pending" preview, not final values.
- Visual Evolution image generation should not start until the branch is chosen, because the branch affects prompt hooks and card identity.

Branch choice transaction:

```text
chooseSkillBranch({ battleCard, choiceId, branchId })
  -> validate branch option exists
  -> apply selectedBranches[slot] = branchId
  -> save selectedBranchDetails[slot] for prompt hooks and previews
  -> patch Skill Kit future scaling rules
  -> patch Visual Evolution prompt hooks
  -> clear pending branch choice
  -> create Evolution Art Job if visual tier unlocked
  -> save progression transaction
```

Stat growth rules:

```text
base stats from Character Spec
  + rarity growth budget
  + Combat Core growth bias
  + level curve
  + selected branch modifiers
```

Skill strengthening rules:

```text
Skill Rank increases only through level or explicit training rewards.
Skill Rank modifies existing effectSpec fields through rule tables.
It should not replace the skill with an unrelated move.
```

Example:

```js
{
  slot: "active0",
  rank: 2,
  effectPatch: [
    { path: "effectSpec[0].ratio", add: 0.12 },
    { path: "effectSpec[1].amount", add: 4 }
  ]
}
```

Skill branch rules:

```text
Branch evolution must preserve identityHooks.
The branch changes how the same character idea grows.
```

Example:

```text
霓虹連段
  -> burst_route: fewer hits, higher burst damage
  -> combo_route: more charge gain, lower cooldown
```

Skill branch option generation:

```js
buildSkillBranchOptions({
  battleCard,
  slot,
  skill,
  combatCore,
  combatVariant,
  skillMaterialProfile,
  progression
});
```

Confirmed answer for option sources:

```text
Branch option source v1 = D

For each pending Skill Branch choice:
  - option 1 comes from the current Combat Variant
  - option 2 comes from a character-specific hook from photo / VLM / story material
```

Each option must include:

```js
{
  source: "characterHook",
  sourceLabel: "照片語意",
  sourceHook: { source: "visibleSemanticTag", value: "arcade" },
  branchId: "combo_route",
  label: "連擊進化",
  shortText: "降低冷卻並提高大招充能。",
  identityHooks: [
    { source: "combatVariant", value: "連擊" },
    { source: "visibleSemanticTag", value: "arcade" }
  ],
  effectPreview: [
    { path: "active0.effectSpec[1].amount", add: 5 },
    { path: "active0.activation.cooldown", add: -1 }
  ],
  statBiasPreview: { speed: 6, atk: 2 },
  visualPromptHooks: ["rapid combo pose", "neon motion streaks"],
  tradeoffPreview: "爆發倍率低於另一分支，但更快累積大招。"
}
```

Option rules:

- Present 2 options per branch choice in MVP.
- One option must come from the current `Combat Variant`.
- One option must come from a character-specific hook, such as visible tag, weakness, story event, signature item, or event context.
- Both options must preserve the original skill identity hooks.
- Both options must show effect preview, stat bias preview, visual prompt hooks, and tradeoff preview.
- The final branch is saved; it is not recalculated on reload.
- The implemented module is [`src/progression/skill-branch-options.js`](../src/progression/skill-branch-options.js).
- Current level-up integration creates pending branch choices when Evolution Milestones are reached; branch-choice UI and final effect application are later steps.

Visual evolution rules:

```text
Visual Evolution requires actual image generation:
  source art + Character Spec + Progression State + selected Skill Branches
    -> Evolution Prompt Profile
    -> Card Art Provider
    -> evolved card art result
    -> visual acceptance check
    -> saved art revision
```

Evolution Prompt Profile inputs:

- original Source Photo or previous accepted card art
- Character Spec
- Skill Material Profile
- Combat Core / Combat Variant
- selected Skill Branches
- level and rarity
- visual evolution tier
- event/capture context prompt-safe hooks
- anatomy/identity/form-branch constraints from the art pipeline

Evolution Prompt Profile example:

```js
{
  evolutionTier: 2,
  artRevision: 1,
  branchHooks: ["combo evolution", "neon motion streaks"],
  skillHooks: ["霓虹連段", "大招充能", "controller motif"],
  visualLocks: [
    "preserve recognizable source-photo facial cues",
    "preserve character form branch",
    "plausible human anatomy"
  ],
  visualChanges: [
    "stronger aura",
    "upgraded outfit accents",
    "motion-focused evolved card composition"
  ],
  avoid: [
    "new unrelated face",
    "extra limbs",
    "fake card text",
    "changed identity hooks"
  ]
}
```

Evolution Art Job:

```js
{
  id: "evo_art_001",
  status: "queued",
  provider: "gemini",
  sourceArtRevision: 0,
  targetArtRevision: 1,
  evolutionTier: 2,
  promptProfile: evolutionPromptProfile,
  result: null,
  attempts: []
}
```

Accepted statuses:

```text
queued -> generating -> needs_review -> accepted
queued -> generating -> failed -> retryable
```

If image generation fails, the card remains in `pendingEvolutionArt`. The old card art can remain visible for continuity, but the evolution is not complete until an evolved image is accepted.

Validation:

- Progression State must have a `schemaVersion`.
- Derived stats must be recalculated from base data, not hand-edited and saved as truth.
- Skill Rank cannot create unsupported `effectSpec` operations.
- Skill Branch must keep original identity hooks or add compatible hooks.
- Visual Evolution cannot change HP/ATK/DEF by itself.
- Visual Evolution must create and track an Evolution Art Job when an evolution tier changes.
- Evolved card art must pass the same art acceptance gates as the normal card-art pipeline, plus branch readability.
- Local UI overlays do not count as completed Visual Evolution without accepted generated art.

## Identity Binding Contract

This is how the system makes skills deeply connected to the generated character.

Every Skill Kit entry must bind the character's source information in three places:

1. `identityHooks`: machine-readable source trace.
2. `name` and `displayText`: player-facing expression.
3. `effectSpec`, `activation`, or `condition`: actual battle behavior.

Minimum hook rule:

| Skill slot | Minimum identity hooks | Required hook type |
|---|---:|---|
| Active Skill 1 | 2 | At least one visible/user/context source. |
| Active Skill 2 | 2 | At least one visible/user/context source. |
| Battle Trait 1 | 2 | Must connect to Combat Core, signature item, or visible trait. |
| Battle Trait 2 | 2 | Must connect to weakness, story event, event context, or comeback state. |
| Ultimate Skill | 3 | Must connect to Combat Core/Variant plus at least two character-specific sources. |

Allowed hook sources:

```text
sourcePhotoCue
visibleSemanticTag
visiblePersonDescription
worldContext
textSeed
characterNameSeed
userChoice
weakness
values
storyEvent
signatureItem
captureContext
eventContext
combatCore
combatVariant
```

No hook, no skill. A generated skill should fail validation if it cannot explain why it belongs to that character.

Example character sources:

```js
{
  characterNameSeed: "昶志",
  visibleSemanticTags: ["arcade", "neon sign", "controller"],
  signatureItem: "controller",
  values: "挑戰",
  weakness: "容易逞強",
  combatCore: "攻擊型",
  combatVariant: "連擊",
  eventContext: "New Year"
}
```

Possible Skill Kit:

| Slot | Name | Identity connection | Battle expression |
|---|---|---|---|
| Active 1 | `霓虹連段` | arcade + controller + 攻擊型 | damage + gain charge |
| Active 2 | `投幣衝刺` | arcade + 挑戰 + 連擊 | lower cooldown + small damage |
| Battle Trait 1 | `玩家直覺` | controller + visible pose | battle-start speed buff |
| Battle Trait 2 | `逞強續局` | weakness + comeback state | HP below threshold grants shield/charge |
| Ultimate | `跨年清台` | New Year + arcade + 連擊 + 昶志 | charge-gated finisher with combo condition |

## How The System Achieves Character-Deep Skills

The system must not ask the image model or VLM to directly invent final battle rules. It should generate skills through a controlled rule pipeline:

```text
Character Spec
  -> Skill Identity Sources
  -> Skill Material Profile
  -> Combat Core + Combat Variant
  -> Skill Pattern Selection
  -> Identity Binding
  -> Skill Naming
  -> Effect Spec Assembly
  -> Skill Validation
  -> Balance Pass
  -> Skill Kit
  -> Progression State
```

### 1. Skill Identity Sources

Allowed sources:

- Source Photo cues: visible pose, expression, outfit, prop, palette, and composition.
- Visible Semantic Tags: scene/action/object tags from VLM.
- User choices: age impression, values, weakness, character name, role, specialty, story direction.
- Capture Context: place type, time mood, and prompt-safe location creative tags.
- Event Context: season, US public holiday profile, and event combat profile.
- Combat Core and Combat Variant.
- Signature item and story event.

Each skill should keep an `identityHooks` array so future UI can explain the connection.

### 2. Skill Material Profile

Skill Material Profile is the safe bridge between VLM creativity and deterministic battle rules.

It can carry:

- What was visibly present.
- What action or scene motifs are usable.
- What phrases may inspire names.
- Which cues were rejected.
- Which source each cue came from.

It cannot carry:

- Final battle effects.
- Damage numbers.
- Targeting rules.
- Cost/cooldown/charge numbers.
- Sensitive or identity-like guesses.

### 3. Combat Core Chooses The Job

Combat Core controls what the Skill Kit is trying to do:

| Combat Core | Skill Kit job |
|---|---|
| `攻擊型` | damage pressure, combo, burst, or fast tempo |
| `防禦型` | survival, shield, counter, mitigation, or control |
| `支援型` | buff, heal, utility, disruption, or comeback setup |

### 4. Combat Variant Chooses The Flavor

Combat Variant decides which patterns are more likely:

| Core | Variant | Pattern examples |
|---|---|---|
| `攻擊型` | `爆發` | high ratio damage, self-risk bonus, one-turn spike |
| `攻擊型` | `連擊` | repeat hit, cooldown reduction, ultimate charge gain |
| `防禦型` | `守護` | shield, damage reduction, protection trigger |
| `防禦型` | `控制` | delay, weaken, lock, counter-control |
| `支援型` | `奇策` | random controlled bonus, steal buff, reverse state |
| `支援型` | `補助` | heal, buff, cleanse, team sustain |

### 5. Skill Pattern Selection

The generator selects one pattern for each slot:

```text
activeSkills[0] -> core pattern
activeSkills[1] -> variant or utility pattern
battleTraits[0] -> identity/passive pattern
battleTraits[1] -> weakness/event/story trigger pattern
ultimateSkill -> signature high-impact pattern
```

This prevents five unrelated skills from appearing on one card.

### 7. Identity Binding

After selecting a pattern, the generator binds concrete character sources into the skill.

The binding affects:

- Skill name.
- Display text.
- Battle condition.
- Effect choice.
- Scaling stat.
- Ultimate charge behavior.
- Future VFX/SFX tags.

Example:

```text
visible tag: basketball court
  -> name word: 快攻 / 終場 / 切入
  -> effect bias: speed scaling, combo, charge gain
  -> ultimate condition: used two Active Skills or reached combo threshold

weakness:容易逞強
  -> trait trigger: self HP below threshold
  -> tradeoff: higher damage but lower guard this turn
```

### 8. Effect Spec Assembly

Every skill must become effect data, not only display text.

```js
{
  op: "damage",
  target: "enemy",
  scale: "atk",
  ratio: 1.2
}
```

MVP effect operations should start small:

```text
damage
shield
heal
buff
debuff
gainUltimateCharge
cooldownChange
triggerOnBattleStart
triggerOnHpBelow
checkUltimateCondition
```

### 9. Skill Validation

Before a Skill Kit can be saved, it must pass validation:

- Exactly 2 Active Skills, 2 Battle Traits, and 1 Ultimate Skill.
- Every entry has `identityHooks`.
- Every entry has an executable `effectSpec`, trigger spec, condition spec, or charge rule.
- Every `op` is in the allowed operation vocabulary.
- Ultimate Skill has both Ultimate Charge and Ultimate Condition.
- The total power budget does not exceed the card's rarity and level budget.
- Display text must not describe an effect that is missing from `effectSpec`.
- VLM naming candidates must not introduce battle effects that are absent from `effectSpec`.

### 10. Balance Pass

After effects are assembled, a balance pass should normalize power:

- Active Skills should be useful every battle.
- Battle Traits should create identity but not decide the whole match alone.
- Ultimate Skill should feel stronger than Active Skills but require charge and condition.
- Ultimate Condition should be readable enough that the player understands how to unlock the moment.
- Weakness should create a real tradeoff when it is used as a power source.

### 11. Module Shape

Future implementation should hide this behind one small interface:

```js
generateSkillKit({
  characterSpec,
  cardStats,
  combatCore,
  combatVariant,
  skillMaterialProfile,
  rng
});
```

The implementation can contain rule tables, pattern selection, naming, effect assembly, and balance checks. Callers should not need to know those details.

Planned modules:

```text
src/card-generation/skill-rule-data.js
  -> Combat Core/Variant pattern tables, name fragments, operation budgets

src/card-generation/skill-material.js
  -> buildSkillMaterialProfile(), VLM cue normalization, naming candidate filtering

src/card-generation/skill-kit.js
  -> generateSkillKit(), identity binding, validation, balance pass

src/progression/progression-state.js
  -> createInitialProgressionState(), applyProgression(), chooseSkillBranch(), validateProgressionState()

src/progression/skill-branch-options.js
  -> buildSkillBranchOptions(), inferCombatIdentity(), selectCharacterBranchHook()

src/progression/progression-rule-data.js
  -> XP curve, stat growth curve, skill rank patches, branch unlocks, visual tier rules

src/progression/evolution-art.js
  -> buildEvolutionPromptProfile(), createEvolutionArtJob(), acceptEvolutionArtResult()

src/battle/effect-interpreter.js
  -> resolveEffectSpec(), validateEffectSpec(), trigger handling
```

The current `createSkills()` in `app.js` is a temporary legacy generator and should be replaced or wrapped by `generateSkillKit()` when implementation starts.

## Open Questions

These questions are not confirmed yet.

1. How much surprise should the system allow in each generated character?
2. How long should a typical battle last?
3. Should weakness or cost always produce a real battle tradeoff?

## References

- MDA Framework: mechanics should create player-facing dynamics and emotional experience.
- Self-Determination Theory: long-term engagement benefits from autonomy, competence, and relatedness.
- Magic player psychographics: different players enjoy spectacle, expression, and mastery in different proportions.
- Octalysis: progression, ownership, unpredictability, and feedback loops can increase motivation when used intentionally.
- Personalized / procedural game content research: generated content should be constrained by player models and rule systems, not raw randomness.
