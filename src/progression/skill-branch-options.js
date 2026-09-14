import { PROGRESSION_SKILL_SLOTS } from "./progression-rule-data.js";

export const BRANCH_OPTION_SOURCES = Object.freeze({
  COMBAT_VARIANT: "combatVariant",
  CHARACTER_HOOK: "characterHook"
});

const COMBAT_CORES = Object.freeze({
  attack: {
    key: "attack",
    label: "攻擊型",
    defaultVariant: "burst",
    variants: Object.freeze({
      burst: { key: "burst", label: "爆發" },
      combo: { key: "combo", label: "連擊" }
    })
  },
  defense: {
    key: "defense",
    label: "防禦型",
    defaultVariant: "guard",
    variants: Object.freeze({
      guard: { key: "guard", label: "守護" },
      control: { key: "control", label: "控制" }
    })
  },
  support: {
    key: "support",
    label: "支援型",
    defaultVariant: "trick",
    variants: Object.freeze({
      trick: { key: "trick", label: "奇策" },
      assist: { key: "assist", label: "補助" }
    })
  }
});

const LEGACY_COMBAT_STYLE_TO_IDENTITY = Object.freeze({
  striker: { combatCore: "attack", combatVariant: "burst" },
  duelist: { combatCore: "attack", combatVariant: "combo" },
  guardian: { combatCore: "defense", combatVariant: "guard" },
  controller: { combatCore: "defense", combatVariant: "control" },
  trickster: { combatCore: "support", combatVariant: "trick" }
});

const VARIANT_BRANCH_TEMPLATES = Object.freeze({
  burst: {
    label: "爆發進化",
    shortText: "提高單次技能打點，讓角色在關鍵回合打出更明顯的壓制。",
    statBiasPreview: Object.freeze({ atk: 4, power: 4 }),
    visualPromptHooks: Object.freeze(["burst impact pose", "single-hit power aura"]),
    tradeoffPreview: "穩定性較低，通常會用較長冷卻或較慢充能作為代價。"
  },
  combo: {
    label: "連擊進化",
    shortText: "提高連段、冷卻循環或大招充能，讓角色更常做出連續操作。",
    statBiasPreview: Object.freeze({ atk: 2, speed: 5 }),
    visualPromptHooks: Object.freeze(["rapid combo motion", "afterimage streaks"]),
    tradeoffPreview: "單次爆發較低，但更容易累積大招或維持節奏。"
  },
  guard: {
    label: "守護進化",
    shortText: "強化護盾、防禦與承傷節奏，讓角色在長戰中更穩。",
    statBiasPreview: Object.freeze({ def: 4, guard: 5 }),
    visualPromptHooks: Object.freeze(["protective shield aura", "solid defensive stance"]),
    tradeoffPreview: "輸出成長較慢，但能換取更高容錯。"
  },
  control: {
    label: "控制進化",
    shortText: "強化干擾、弱化或節奏控制，讓敵人更難順利出招。",
    statBiasPreview: Object.freeze({ focus: 5, def: 2 }),
    visualPromptHooks: Object.freeze(["control glyphs", "tactical pressure field"]),
    tradeoffPreview: "直接傷害較低，但能換取更好的戰術主導權。"
  },
  trick: {
    label: "奇策進化",
    shortText: "強化逆轉、機率或特殊觸發，讓角色在意外時刻翻盤。",
    statBiasPreview: Object.freeze({ luck: 5, focus: 2 }),
    visualPromptHooks: Object.freeze(["trickster spark", "unexpected reversal motif"]),
    tradeoffPreview: "效果波動較高，但成功時回饋感更強。"
  },
  assist: {
    label: "補助進化",
    shortText: "強化治療、增益或續戰能力，讓角色更擅長支撐戰局。",
    statBiasPreview: Object.freeze({ guard: 3, focus: 4 }),
    visualPromptHooks: Object.freeze(["support aura", "restorative light motif"]),
    tradeoffPreview: "主動壓制力較低，但能換取更高續航與隊伍價值。"
  }
});

const SLOT_PATHS = Object.freeze({
  active0: "skillKit.activeSkills[0]",
  active1: "skillKit.activeSkills[1]",
  trait0: "skillKit.battleTraits[0]",
  trait1: "skillKit.battleTraits[1]",
  ultimate: "skillKit.ultimateSkill"
});

const SLOT_LABELS = Object.freeze({
  active0: "主動技能一",
  active1: "主動技能二",
  trait0: "戰鬥特性一",
  trait1: "戰鬥特性二",
  ultimate: "大招"
});

const CHARACTER_HOOK_SOURCE_LABELS = Object.freeze({
  visibleSemanticTag: "照片語意",
  actionCue: "動作線索",
  propCue: "物件線索",
  sceneMotif: "場景線索",
  moodCue: "氣質線索",
  storyEvent: "故事事件",
  signatureItem: "招牌物品",
  eventContext: "節慶事件",
  captureContext: "拍攝情境",
  weakness: "弱點代價",
  values: "價值觀",
  sourcePhotoCue: "照片特徵",
  characterNameSeed: "角色名字"
});

export function buildSkillBranchOptions({
  battleCard = {},
  slot = "active0",
  skill = null,
  combatCore = null,
  combatVariant = null,
  skillMaterialProfile = {},
  milestone = null
} = {}) {
  const normalizedSlot = normalizeSlot(slot);
  const combatIdentity = inferCombatIdentity({ battleCard, combatCore, combatVariant });
  const targetSkill = skill ?? getSkillForSlot(battleCard, normalizedSlot);
  const characterHook = selectCharacterBranchHook({ battleCard, skillMaterialProfile });

  return [
    buildCombatVariantBranchOption({
      slot: normalizedSlot,
      skill: targetSkill,
      combatIdentity,
      milestone
    }),
    buildCharacterHookBranchOption({
      slot: normalizedSlot,
      skill: targetSkill,
      combatIdentity,
      characterHook,
      milestone
    })
  ];
}

export function inferCombatIdentity({ battleCard = {}, combatCore = null, combatVariant = null } = {}) {
  const spec = battleCard.characterSpec ?? {};
  const generationProfile = spec.generationProfile ?? {};
  const explicitCore = normalizeCombatCore(
    combatCore ??
      generationProfile.combatCore ??
      battleCard.combatCore ??
      spec.combatCore
  );
  const legacyIdentity = LEGACY_COMBAT_STYLE_TO_IDENTITY[generationProfile.combatStyle] ?? null;
  const statIdentity = inferIdentityFromStats(battleCard.stats ?? spec.stats ?? {});
  const coreKey = explicitCore ?? legacyIdentity?.combatCore ?? statIdentity.combatCore;
  const core = COMBAT_CORES[coreKey] ?? COMBAT_CORES.attack;
  const variantKey = normalizeCombatVariant(
    combatVariant ??
      generationProfile.combatVariant ??
      battleCard.combatVariant ??
      spec.combatVariant ??
      legacyIdentity?.combatVariant ??
      statIdentity.combatVariant,
    core.key
  );
  const variant = core.variants[variantKey] ?? core.variants[core.defaultVariant];

  return {
    combatCore: core.key,
    combatCoreLabel: core.label,
    combatVariant: variant.key,
    combatVariantLabel: variant.label
  };
}

export function selectCharacterBranchHook({ battleCard = {}, skillMaterialProfile = {} } = {}) {
  const spec = battleCard.characterSpec ?? {};
  const generationProfile = spec.generationProfile ?? {};
  const promptProfile = spec.promptProfile ?? {};
  const photoSemantics = spec.photoSemantics ?? {};
  const contexts = spec.contexts ?? {};
  const eventContext = contexts.event ?? {};
  const captureContext = contexts.capture ?? {};
  const userContext = spec.userSuppliedContext ?? {};
  const candidates = [
    ...itemsToHooks(skillMaterialProfile.visibleTags, "visibleSemanticTag"),
    ...itemsToHooks(skillMaterialProfile.actionCues, "actionCue"),
    ...itemsToHooks(skillMaterialProfile.propCues, "propCue"),
    ...itemsToHooks(skillMaterialProfile.sceneMotifs, "sceneMotif"),
    ...itemsToHooks(skillMaterialProfile.moodCues, "moodCue"),
    ...itemsToHooks(photoSemantics.visibleSemanticTags, "visibleSemanticTag"),
    ...itemsToHooks(promptProfile.identityHooks, "sourcePhotoCue"),
    ...itemsToHooks(promptProfile.worldHooks, "sceneMotif"),
    ...itemsToHooks(promptProfile.storyHooks, "storyEvent"),
    ...itemsToHooks(userContext.storyEvents, "storyEvent"),
    valueToHook(generationProfile.backstory, "storyEvent"),
    valueToHook(generationProfile.signatureItem, "signatureItem"),
    valueToHook(generationProfile.weakness, "weakness"),
    valueToHook(generationProfile.valueLabel, "values"),
    valueToHook(spec.eventCombatProfile?.label ?? generationProfile.eventCombatProfile?.label, "eventContext"),
    ...itemsToHooks(eventContext.holidayTags, "eventContext"),
    ...itemsToHooks(eventContext.eventCreativeTags, "eventContext"),
    ...itemsToHooks(captureContext.locationCreativeTags, "captureContext"),
    valueToHook(spec.characterName ?? generationProfile.characterName ?? battleCard.name, "characterNameSeed")
  ];
  const seen = new Set();

  for (const candidate of candidates.filter(Boolean)) {
    const value = safeString(candidate.value);
    const source = safeString(candidate.source);
    const key = `${source}:${value.toLowerCase()}`;
    if (!value || seen.has(key) || isRejectedHook(value)) continue;
    seen.add(key);
    return {
      source,
      sourceLabel: CHARACTER_HOOK_SOURCE_LABELS[source] ?? "角色線索",
      value
    };
  }

  return {
    source: "sourcePhotoCue",
    sourceLabel: CHARACTER_HOOK_SOURCE_LABELS.sourcePhotoCue,
    value: "中心人物特徵"
  };
}

function buildCombatVariantBranchOption({ slot, skill, combatIdentity, milestone }) {
  const template = VARIANT_BRANCH_TEMPLATES[combatIdentity.combatVariant] ?? VARIANT_BRANCH_TEMPLATES.burst;
  const slotPath = SLOT_PATHS[slot];
  const slotLabel = SLOT_LABELS[slot];
  const branchId = `${slot}_${combatIdentity.combatVariant}_${hashish(`${slot}:${combatIdentity.combatVariant}:${milestone?.key ?? ""}`)}`;
  const skillName = safeString(skill?.name, slotLabel);

  return {
    source: BRANCH_OPTION_SOURCES.COMBAT_VARIANT,
    sourceLabel: "戰鬥變體",
    sourceHook: {
      source: "combatVariant",
      key: combatIdentity.combatVariant,
      value: combatIdentity.combatVariantLabel
    },
    milestoneKey: milestone?.key ?? null,
    slot,
    branchId,
    label: template.label,
    shortText: `${skillName}走向${combatIdentity.combatVariantLabel}打法。${template.shortText}`,
    identityHooks: uniqueHooks([
      ...(Array.isArray(skill?.identityHooks) ? skill.identityHooks : []),
      { source: "combatCore", value: combatIdentity.combatCoreLabel },
      { source: "combatVariant", value: combatIdentity.combatVariantLabel }
    ]),
    effectPreview: buildVariantEffectPreview({ slot, slotPath, variant: combatIdentity.combatVariant }),
    statBiasPreview: { ...template.statBiasPreview },
    visualPromptHooks: [
      `${combatIdentity.combatVariantLabel} evolution`,
      ...template.visualPromptHooks
    ],
    tradeoffPreview: template.tradeoffPreview
  };
}

function buildCharacterHookBranchOption({ slot, skill, combatIdentity, characterHook, milestone }) {
  const slotPath = SLOT_PATHS[slot];
  const slotLabel = SLOT_LABELS[slot];
  const hookValue = safeString(characterHook.value, "角色線索");
  const branchId = `${slot}_hook_${hashish(`${slot}:${characterHook.source}:${hookValue}:${milestone?.key ?? ""}`)}`;
  const skillName = safeString(skill?.name, slotLabel);

  return {
    source: BRANCH_OPTION_SOURCES.CHARACTER_HOOK,
    sourceLabel: characterHook.sourceLabel,
    sourceHook: {
      source: characterHook.source,
      value: hookValue
    },
    milestoneKey: milestone?.key ?? null,
    slot,
    branchId,
    label: `${clipLabel(hookValue)}專精`,
    shortText: `${skillName}改走角色特色路線，把「${hookValue}」轉成分支核心。`,
    identityHooks: uniqueHooks([
      ...(Array.isArray(skill?.identityHooks) ? skill.identityHooks : []),
      { source: "combatCore", value: combatIdentity.combatCoreLabel },
      { source: characterHook.source, value: hookValue }
    ]),
    effectPreview: buildCharacterHookEffectPreview({ slot, slotPath, hook: characterHook }),
    statBiasPreview: buildCharacterHookStatBias(characterHook),
    visualPromptHooks: [
      `character-specific evolution based on ${hookValue}`,
      `${characterHook.source} hook: ${hookValue}`
    ],
    tradeoffPreview: "比戰鬥變體路線更吃角色條件，泛用性較低，但角色辨識度更高。"
  };
}

function buildVariantEffectPreview({ slot, slotPath, variant }) {
  if (slot === "ultimate") {
    const ultimatePreviews = {
      burst: [
        { path: `${slotPath}.effectSpec.damage.ratio`, add: 0.22 },
        { path: `${slotPath}.chargeRules.gain`, add: -4 }
      ],
      combo: [
        { path: `${slotPath}.condition.comboCount`, add: -1 },
        { path: `${slotPath}.effectSpec.gainUltimateCharge.amount`, add: 8 }
      ],
      guard: [
        { path: `${slotPath}.effectSpec.shield.amount`, add: 18 },
        { path: `${slotPath}.condition.hpThreshold`, add: 5 }
      ],
      control: [
        { path: `${slotPath}.effectSpec.debuff.amount`, add: 8 },
        { path: `${slotPath}.condition.enemyDebuffed`, set: true }
      ],
      trick: [
        { path: `${slotPath}.effectSpec.reversalBonus`, add: 1 },
        { path: `${slotPath}.condition.comebackWindow`, set: true }
      ],
      assist: [
        { path: `${slotPath}.effectSpec.heal.amount`, add: 16 },
        { path: `${slotPath}.effectSpec.buff.turns`, add: 1 }
      ]
    };
    return ultimatePreviews[variant] ?? ultimatePreviews.burst;
  }

  if (slot.startsWith("trait")) {
    const traitPreviews = {
      burst: [{ path: `${slotPath}.trigger.onDealDamage.bonusAtk`, add: 4 }],
      combo: [{ path: `${slotPath}.trigger.onActiveSkillUsed.ultimateCharge`, add: 6 }],
      guard: [{ path: `${slotPath}.trigger.onTakeDamage.shield`, add: 12 }],
      control: [{ path: `${slotPath}.trigger.onEnemyAction.debuff`, add: 5 }],
      trick: [{ path: `${slotPath}.trigger.onLowHp.reversalChance`, add: 8 }],
      assist: [{ path: `${slotPath}.trigger.onTurnStart.healOrBuff`, add: 8 }]
    };
    return traitPreviews[variant] ?? traitPreviews.burst;
  }

  const activePreviews = {
    burst: [
      { path: `${slotPath}.effectSpec.damage.ratio`, add: 0.16 },
      { path: `${slotPath}.activation.cooldown`, add: 1 }
    ],
    combo: [
      { path: `${slotPath}.effectSpec.gainUltimateCharge.amount`, add: 6 },
      { path: `${slotPath}.activation.cooldown`, add: -1 }
    ],
    guard: [
      { path: `${slotPath}.effectSpec.shield.amount`, add: 14 },
      { path: `${slotPath}.effectSpec.damage.ratio`, add: -0.04 }
    ],
    control: [
      { path: `${slotPath}.effectSpec.debuff.amount`, add: 6 },
      { path: `${slotPath}.effectSpec.damage.ratio`, add: -0.04 }
    ],
    trick: [
      { path: `${slotPath}.effectSpec.conditionalBonus`, add: 1 },
      { path: `${slotPath}.effectSpec.gainUltimateCharge.amount`, add: 4 }
    ],
    assist: [
      { path: `${slotPath}.effectSpec.healOrBuff.amount`, add: 10 },
      { path: `${slotPath}.effectSpec.damage.ratio`, add: -0.05 }
    ]
  };
  return activePreviews[variant] ?? activePreviews.burst;
}

function buildCharacterHookEffectPreview({ slot, slotPath, hook }) {
  const hookPatch = { source: hook.source, value: hook.value };
  if (slot === "ultimate") {
    return [
      { path: `${slotPath}.identityHooks`, add: hookPatch },
      { path: `${slotPath}.condition.identityHook`, set: hookPatch },
      { path: `${slotPath}.effectSpec.identityScaling`, add: 1 }
    ];
  }
  if (slot.startsWith("trait")) {
    return [
      { path: `${slotPath}.identityHooks`, add: hookPatch },
      { path: `${slotPath}.trigger.identityHook`, set: hookPatch }
    ];
  }
  return [
    { path: `${slotPath}.identityHooks`, add: hookPatch },
    { path: `${slotPath}.effectSpec.identityScaling`, add: 1 },
    { path: `${slotPath}.effectSpec.gainUltimateCharge.amount`, add: 3 }
  ];
}

function buildCharacterHookStatBias(hook) {
  const value = safeString(hook.value).toLowerCase();
  if (containsAny(value, ["basketball", "sport", "ball", "run", "jump", "運動", "球", "跑"])) {
    return { power: 3, speed: 4, atk: 2 };
  }
  if (containsAny(value, ["arcade", "neon", "game", "controller", "街機", "霓虹", "遊戲"])) {
    return { speed: 3, focus: 3, luck: 2 };
  }
  if (containsAny(value, ["sun", "outdoor", "park", "晴", "陽光", "戶外", "公園"])) {
    return { speed: 2, luck: 3, atk: 1 };
  }
  if (containsAny(value, ["glasses", "book", "office", "study", "眼鏡", "書", "辦公", "學"])) {
    return { focus: 4, def: 1 };
  }
  if (hook.source === "weakness") return { focus: 3, guard: 2 };
  if (hook.source === "eventContext") return { luck: 3, focus: 2 };
  if (hook.source === "signatureItem" || hook.source === "propCue") return { focus: 3, luck: 2 };
  if (hook.source === "storyEvent") return { focus: 2, luck: 3 };
  return { focus: 2, luck: 2 };
}

function getSkillForSlot(battleCard, slot) {
  const skillKit = battleCard.skillKit ?? {};
  if (slot === "active0") return skillKit.activeSkills?.[0] ?? battleCard.skills?.[0] ?? null;
  if (slot === "active1") return skillKit.activeSkills?.[1] ?? battleCard.skills?.[1] ?? null;
  if (slot === "trait0") return skillKit.battleTraits?.[0] ?? null;
  if (slot === "trait1") return skillKit.battleTraits?.[1] ?? null;
  if (slot === "ultimate") return skillKit.ultimateSkill ?? null;
  return null;
}

function normalizeSlot(slot) {
  const value = safeString(slot);
  if (!PROGRESSION_SKILL_SLOTS.includes(value)) {
    throw new Error(`Invalid progression slot: ${value}`);
  }
  return value;
}

function normalizeCombatCore(value) {
  const normalized = safeString(value).toLowerCase();
  if (!normalized) return null;
  if (COMBAT_CORES[normalized]) return normalized;
  const labelMatch = Object.values(COMBAT_CORES).find((core) => core.label === value);
  return labelMatch?.key ?? null;
}

function normalizeCombatVariant(value, coreKey) {
  const normalized = safeString(value).toLowerCase();
  const core = COMBAT_CORES[coreKey] ?? COMBAT_CORES.attack;
  if (core.variants[normalized]) return normalized;
  const labelMatch = Object.values(core.variants).find((variant) => variant.label === value);
  if (labelMatch) return labelMatch.key;

  for (const candidateCore of Object.values(COMBAT_CORES)) {
    const variantMatch = Object.values(candidateCore.variants).find((variant) => {
      return variant.key === normalized || variant.label === value;
    });
    if (variantMatch) return variantMatch.key;
  }

  return core.defaultVariant;
}

function inferIdentityFromStats(stats) {
  const entries = Object.entries(stats)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const top = entries[0]?.[0] ?? "power";
  if (top === "guard") return { combatCore: "defense", combatVariant: "guard" };
  if (top === "focus") return { combatCore: "defense", combatVariant: "control" };
  if (top === "luck") return { combatCore: "support", combatVariant: "trick" };
  if (top === "speed") return { combatCore: "attack", combatVariant: "combo" };
  return { combatCore: "attack", combatVariant: "burst" };
}

function itemsToHooks(items, source) {
  if (!Array.isArray(items)) return [];
  return items.map((value) => valueToHook(value, source)).filter(Boolean);
}

function valueToHook(value, source) {
  const normalized = safeString(value);
  if (!normalized) return null;
  return { source, value: normalized };
}

function isRejectedHook(value) {
  const normalized = safeString(value).toLowerCase();
  return !normalized ||
    normalized === "auto" ||
    normalized === "none" ||
    normalized === "unknown" ||
    normalized === "未指定" ||
    normalized === "未知" ||
    normalized === "路人";
}

function uniqueHooks(hooks) {
  const seen = new Set();
  return hooks
    .map((hook) => ({
      source: safeString(hook?.source),
      value: safeString(hook?.value)
    }))
    .filter((hook) => {
      if (!hook.source || !hook.value) return false;
      const key = `${hook.source}:${hook.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function clipLabel(value) {
  const normalized = safeString(value, "角色線索");
  return normalized.length > 8 ? `${normalized.slice(0, 8)}` : normalized;
}

function containsAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function hashish(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
