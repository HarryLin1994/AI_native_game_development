export const SKILL_MATERIAL_PROFILE_VERSION = "skill-material-v1";
export const SKILL_KIT_VERSION = "skill-kit-v1";

export const ALLOWED_EFFECT_OPS = Object.freeze([
  "damage",
  "shield",
  "heal",
  "buff",
  "debuff",
  "gainUltimateCharge",
  "cooldownChange",
  "triggerOnBattleStart",
  "triggerOnHpBelow",
  "checkUltimateCondition"
]);

const COMBAT_CORES = Object.freeze({
  attack: {
    key: "attack",
    label: "攻擊型",
    defaultVariant: "burst",
    primaryScale: "atk",
    activeWord: "強襲",
    traitWord: "壓制",
    ultimateWord: "決勝",
    variants: Object.freeze({
      burst: { key: "burst", label: "爆發", word: "爆裂" },
      combo: { key: "combo", label: "連擊", word: "連段" }
    })
  },
  defense: {
    key: "defense",
    label: "防禦型",
    defaultVariant: "guard",
    primaryScale: "def",
    activeWord: "護陣",
    traitWord: "守勢",
    ultimateWord: "鐵壁",
    variants: Object.freeze({
      guard: { key: "guard", label: "守護", word: "守護" },
      control: { key: "control", label: "控制", word: "封鎖" }
    })
  },
  support: {
    key: "support",
    label: "支援型",
    defaultVariant: "trick",
    primaryScale: "focus",
    activeWord: "援護",
    traitWord: "調度",
    ultimateWord: "逆轉",
    variants: Object.freeze({
      trick: { key: "trick", label: "奇策", word: "奇策" },
      assist: { key: "assist", label: "補助", word: "補助" }
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

const SKILL_SOURCE_LABELS = Object.freeze({
  sourcePhotoCue: "照片特徵",
  visibleSemanticTag: "照片語意",
  visiblePersonDescription: "人物外觀",
  worldContext: "世界情境",
  textSeed: "文字種子",
  characterNameSeed: "角色名字",
  userChoice: "玩家選擇",
  weakness: "弱點",
  values: "價值觀",
  storyEvent: "故事事件",
  signatureItem: "招牌物品",
  captureContext: "拍攝情境",
  eventContext: "節慶事件",
  combatCore: "戰鬥核心",
  combatVariant: "戰鬥變體"
});

const SENSITIVE_CUE_PATTERN =
  /(政治|政黨|宗教|信仰|性向|同性戀|異性戀|跨性別|族裔|種族|疾病|診斷|憂鬱|焦慮|自閉|過動|politic|party|religion|sexual|gay|lesbian|transgender|ethnicity|race|medical|illness|disease|diagnos|depress|anxiety|autism|adhd)/iu;

const REJECTED_CUE_PATTERN = /^(auto|none|unknown|undefined|null|未指定|未知|路人)$/iu;

export function buildSkillMaterialProfile({ characterSpec = {}, analysis = null, generationProfile = {} } = {}) {
  const buckets = {
    visibleTags: [],
    actionCues: [],
    propCues: [],
    sceneMotifs: [],
    moodCues: [],
    namingCandidates: []
  };
  const sourceTrace = [];
  const rejectedSensitiveCues = [];
  const contexts = characterSpec.contexts ?? {};
  const vision = contexts.vision ?? {};
  const questionnaire = contexts.questionnaire ?? {};
  const capture = contexts.capture ?? {};
  const event = contexts.event ?? {};
  const promptProfile = characterSpec.promptProfile ?? {};
  const analysisGroups = analysis?.visibleSemanticTagGroups ?? {};
  const visionGroups = vision.semanticTagGroups ?? vision.visibleSemanticTagGroups ?? {};
  const photoSemantics = characterSpec.photoSemantics ?? {};

  addCues(buckets, sourceTrace, rejectedSensitiveCues, "visibleTags", "visibleSemanticTag", [
    analysis?.visibleSemanticTags,
    photoSemantics.visibleSemanticTags,
    vision.visibleSemanticTags,
    analysisGroups.personAppearance,
    visionGroups.personAppearance,
    analysisGroups.clothing,
    visionGroups.clothing
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "actionCues", "visibleSemanticTag", [
    analysisGroups.activity,
    visionGroups.activity,
    analysisGroups.state,
    visionGroups.state,
    analysisGroups.composition,
    visionGroups.composition
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "propCues", "visibleSemanticTag", [
    analysisGroups.object,
    visionGroups.object
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "propCues", "signatureItem", [
    questionnaire.signatureItem,
    generationProfile.signatureItem
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "sceneMotifs", "worldContext", [
    analysisGroups.scene,
    visionGroups.scene,
    promptProfile.worldHooks
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "sceneMotifs", "captureContext", [
    capture.locationCreativeTags,
    generationProfile.placeTypeLabel
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "sceneMotifs", "eventContext", [
    event.eventCreativeTags,
    event.holidayTags,
    generationProfile.eventCombatProfile?.promptHook,
    generationProfile.eventCombatProfile?.label
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "moodCues", "visibleSemanticTag", [
    analysisGroups.lighting,
    visionGroups.lighting,
    analysisGroups.visualSignal,
    visionGroups.visualSignal
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "moodCues", "captureContext", [
    generationProfile.timeMoodLabel,
    capture.timeMoodLabel
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "moodCues", "userChoice", [
    generationProfile.cardMood,
    questionnaire.cardMood
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "namingCandidates", "textSeed", [
    analysis?.textSeed,
    photoSemantics.textSeed
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "namingCandidates", "values", [
    generationProfile.valueLabel,
    questionnaire.valueLabel
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "namingCandidates", "weakness", [
    generationProfile.weakness,
    questionnaire.weakness
  ]);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "namingCandidates", "storyEvent", [
    generationProfile.backstory,
    questionnaire.storyEvents,
    promptProfile.storyHooks
  ]);

  const derivedNames = [
    ...buckets.visibleTags,
    ...buckets.actionCues,
    ...buckets.propCues,
    ...buckets.sceneMotifs,
    generationProfile.eventCombatProfile?.skillWord
  ]
    .map((cue) => cueToNameWord(cue))
    .filter(Boolean);
  addCues(buckets, sourceTrace, rejectedSensitiveCues, "namingCandidates", "sourcePhotoCue", derivedNames);

  return {
    profileVersion: SKILL_MATERIAL_PROFILE_VERSION,
    visibleTags: buckets.visibleTags.slice(0, 14),
    actionCues: buckets.actionCues.slice(0, 10),
    propCues: buckets.propCues.slice(0, 8),
    sceneMotifs: buckets.sceneMotifs.slice(0, 10),
    moodCues: buckets.moodCues.slice(0, 10),
    namingCandidates: buckets.namingCandidates.slice(0, 12),
    rejectedSensitiveCues: uniqueStrings(rejectedSensitiveCues).slice(0, 12),
    sourceTrace: uniqueTrace(sourceTrace).slice(0, 32)
  };
}

export function generateSkillKit({
  characterSpec = {},
  cardStats = {},
  cardStatLine = {},
  archetype = {},
  traits = [],
  generationProfile = {},
  skillMaterialProfile = null,
  rng = Math.random
} = {}) {
  const material = skillMaterialProfile ?? buildSkillMaterialProfile({ characterSpec, generationProfile });
  const combatIdentity = resolveCombatIdentity({ characterSpec, generationProfile, stats: cardStats });
  const nameMaterial = buildNameMaterial({ material, archetype, generationProfile });
  const activeSkills = [
    buildPrimaryActiveSkill({ combatIdentity, material, nameMaterial, cardStats, cardStatLine, generationProfile, rng }),
    buildSecondaryActiveSkill({ combatIdentity, material, nameMaterial, cardStats, cardStatLine, generationProfile, rng })
  ];
  const battleTraits = [
    buildIdentityBattleTrait({ combatIdentity, material, nameMaterial, generationProfile, traits, rng }),
    buildComebackBattleTrait({ combatIdentity, material, nameMaterial, generationProfile, rng })
  ];
  const ultimateSkill = buildUltimateSkill({
    combatIdentity,
    material,
    nameMaterial,
    generationProfile,
    rng
  });
  const skillKit = {
    version: SKILL_KIT_VERSION,
    combatIdentity,
    materialProfileVersion: material.profileVersion,
    activeSkills,
    battleTraits,
    ultimateSkill
  };

  return {
    ...skillKit,
    validation: validateSkillKit(skillKit)
  };
}

export function createLegacySkillsFromSkillKit(skillKit) {
  return (skillKit?.activeSkills ?? []).slice(0, 2).map((skill) => ({
    name: skill.name,
    type: skill.legacyBattle?.type ?? inferLegacySkillType(skill),
    power: skill.legacyBattle?.power ?? estimateLegacyPower(skill),
    text: skill.displayText
  }));
}

export function validateSkillKit(skillKit) {
  const errors = [];
  const activeSkills = skillKit?.activeSkills ?? [];
  const battleTraits = skillKit?.battleTraits ?? [];
  const ultimateSkill = skillKit?.ultimateSkill ?? null;

  if (activeSkills.length !== 2) errors.push("skillKit must include exactly 2 active skills.");
  if (battleTraits.length !== 2) errors.push("skillKit must include exactly 2 battle traits.");
  if (!ultimateSkill || typeof ultimateSkill !== "object") errors.push("skillKit must include one ultimate skill.");

  activeSkills.forEach((skill, index) => {
    validateSkillEntry(errors, skill, `activeSkills[${index}]`, 2);
    validateHasNonCombatHook(errors, skill, `activeSkills[${index}]`);
  });
  battleTraits.forEach((skill, index) => {
    validateSkillEntry(errors, skill, `battleTraits[${index}]`, 2);
    if (index === 1) validateHasAnySource(errors, skill, `battleTraits[${index}]`, ["weakness", "storyEvent", "eventContext", "captureContext", "sourcePhotoCue"]);
  });

  if (ultimateSkill) {
    validateSkillEntry(errors, ultimateSkill, "ultimateSkill", 3);
    if (!Number.isFinite(Number(ultimateSkill.chargeCost)) || Number(ultimateSkill.chargeCost) <= 0) {
      errors.push("ultimateSkill must include a positive chargeCost.");
    }
    if (!ultimateSkill.condition || typeof ultimateSkill.condition !== "object") {
      errors.push("ultimateSkill must include an ultimate condition.");
    }
    validateHasAnySource(errors, ultimateSkill, "ultimateSkill", [
      "visibleSemanticTag",
      "signatureItem",
      "weakness",
      "values",
      "storyEvent",
      "eventContext",
      "captureContext",
      "sourcePhotoCue",
      "characterNameSeed"
    ]);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

function buildPrimaryActiveSkill({ combatIdentity, material, nameMaterial, cardStats, cardStatLine, generationProfile, rng }) {
  const core = COMBAT_CORES[combatIdentity.combatCore] ?? COMBAT_CORES.attack;
  const variant = core.variants[combatIdentity.combatVariant] ?? core.variants[core.defaultVariant];
  const primaryScale = core.primaryScale;
  const legacyPower = estimateStatPower(cardStats, cardStatLine, primaryScale, 0.58);
  const hooks = buildIdentityHooks({
    combatIdentity,
    material,
    generationProfile,
    min: 2,
    includeVariant: false,
    preferredSources: ["visibleSemanticTag", "signatureItem", "values", "sourcePhotoCue"]
  });
  const name = compactName([nameMaterial.primaryWord, core.activeWord], rng);
  const effectSpec = buildCoreActiveEffects(combatIdentity, primaryScale);

  return {
    id: createSkillId("active0", combatIdentity, name, hooks),
    slot: "active",
    slotKey: "active0",
    name,
    activation: {
      type: "manual",
      cooldown: combatIdentity.combatVariant === "burst" ? 2 : 1
    },
    identityHooks: hooks,
    effectSpec,
    displayText: `${nameMaterial.identityText}以${core.label}的${variant.label}節奏出招，造成壓力並累積大招能量。`,
    balance: {
      role: "core_pattern",
      primaryScale,
      pattern: `${combatIdentity.combatCore}.${combatIdentity.combatVariant}`
    },
    legacyBattle: {
      type: inferLegacySkillTypeFromEffects(effectSpec),
      power: legacyPower
    }
  };
}

function buildSecondaryActiveSkill({ combatIdentity, material, nameMaterial, cardStats, cardStatLine, generationProfile, rng }) {
  const core = COMBAT_CORES[combatIdentity.combatCore] ?? COMBAT_CORES.attack;
  const variant = core.variants[combatIdentity.combatVariant] ?? core.variants[core.defaultVariant];
  const primaryScale = core.primaryScale;
  const legacyPower = estimateStatPower(cardStats, cardStatLine, primaryScale, 0.44);
  const hooks = buildIdentityHooks({
    combatIdentity,
    material,
    generationProfile,
    min: 2,
    includeVariant: true,
    preferredSources: ["signatureItem", "visibleSemanticTag", "weakness", "storyEvent", "eventContext", "captureContext"]
  });
  const name = compactName([nameMaterial.secondaryWord, variant.word], rng);
  const effectSpec = buildVariantActiveEffects(combatIdentity, primaryScale);

  return {
    id: createSkillId("active1", combatIdentity, name, hooks),
    slot: "active",
    slotKey: "active1",
    name,
    activation: {
      type: "manual",
      cooldown: variant.key === "guard" || variant.key === "assist" ? 2 : 1
    },
    identityHooks: hooks,
    effectSpec,
    displayText: `${hooks[0]?.value ?? nameMaterial.primaryWord}轉成${variant.label}打法，提供第二種回合選擇。`,
    balance: {
      role: "variant_or_utility_pattern",
      primaryScale,
      pattern: `${combatIdentity.combatCore}.${combatIdentity.combatVariant}.utility`
    },
    legacyBattle: {
      type: inferLegacySkillTypeFromEffects(effectSpec),
      power: legacyPower
    }
  };
}

function buildIdentityBattleTrait({ combatIdentity, material, nameMaterial, generationProfile, traits, rng }) {
  const core = COMBAT_CORES[combatIdentity.combatCore] ?? COMBAT_CORES.attack;
  const hooks = buildIdentityHooks({
    combatIdentity,
    material,
    generationProfile,
    min: 2,
    includeVariant: false,
    preferredSources: ["signatureItem", "visibleSemanticTag", "sourcePhotoCue", "characterNameSeed"]
  });
  const stat = combatIdentity.combatCore === "attack" ? "speed" : combatIdentity.combatCore === "defense" ? "guard" : "focus";
  const name = compactName([nameMaterial.primaryWord, core.traitWord], rng);

  return {
    id: createSkillId("trait0", combatIdentity, name, hooks),
    slot: "trait",
    slotKey: "trait0",
    name,
    activation: {
      type: "trigger",
      event: "battleStart",
      oncePerBattle: true
    },
    identityHooks: hooks,
    effectSpec: [
      { op: "triggerOnBattleStart", target: "self" },
      { op: "buff", target: "self", stat, amount: 7, turns: 2 }
    ],
    displayText: `開戰時把${traits[0] ?? core.label}轉成${statLabel(stat)}增益。`,
    balance: {
      role: "identity_trait",
      triggerBudget: 1
    }
  };
}

function buildComebackBattleTrait({ combatIdentity, material, nameMaterial, generationProfile, rng }) {
  const hooks = buildIdentityHooks({
    combatIdentity,
    material,
    generationProfile,
    min: 2,
    includeVariant: true,
    preferredSources: ["weakness", "storyEvent", "eventContext", "captureContext", "visibleSemanticTag", "sourcePhotoCue"]
  });
  const name = compactName([nameMaterial.comebackWord, "續戰"], rng);
  const effectSpec = combatIdentity.combatCore === "support"
    ? [
        { op: "triggerOnHpBelow", target: "self", percent: 45, oncePerBattle: true },
        { op: "heal", target: "self", amount: 18 },
        { op: "gainUltimateCharge", target: "self", amount: 12 }
      ]
    : [
        { op: "triggerOnHpBelow", target: "self", percent: 45, oncePerBattle: true },
        { op: "shield", target: "self", amount: combatIdentity.combatCore === "defense" ? 28 : 18 },
        { op: "gainUltimateCharge", target: "self", amount: 14 }
      ];

  return {
    id: createSkillId("trait1", combatIdentity, name, hooks),
    slot: "trait",
    slotKey: "trait1",
    name,
    activation: {
      type: "trigger",
      event: "hpBelow",
      percent: 45,
      oncePerBattle: true
    },
    identityHooks: hooks,
    effectSpec,
    displayText: `生命偏低時觸發，把${hooks[0]?.value ?? "角色弱點"}變成一次續戰回饋。`,
    balance: {
      role: "weakness_event_or_comeback_trait",
      triggerBudget: 1
    }
  };
}

function buildUltimateSkill({ combatIdentity, material, nameMaterial, generationProfile, rng }) {
  const core = COMBAT_CORES[combatIdentity.combatCore] ?? COMBAT_CORES.attack;
  const variant = core.variants[combatIdentity.combatVariant] ?? core.variants[core.defaultVariant];
  const primaryScale = core.primaryScale;
  const hooks = buildIdentityHooks({
    combatIdentity,
    material,
    generationProfile,
    min: 3,
    includeVariant: true,
    preferredSources: ["eventContext", "visibleSemanticTag", "signatureItem", "weakness", "values", "storyEvent", "characterNameSeed", "sourcePhotoCue"]
  });
  const name = compactName([nameMaterial.ultimateWord, core.ultimateWord], rng);
  const condition = buildUltimateCondition(combatIdentity, hooks);
  const effectSpec = buildUltimateEffects(combatIdentity, primaryScale);

  return {
    id: createSkillId("ultimate", combatIdentity, name, hooks),
    slot: "ultimate",
    slotKey: "ultimate",
    name,
    chargeCost: 100,
    chargeRules: [
      { event: "dealDamage", amount: combatIdentity.combatCore === "attack" ? 12 : 8 },
      { event: "takeDamage", amount: combatIdentity.combatCore === "defense" ? 12 : 8 },
      { event: "triggerBattleTrait", amount: 15 }
    ],
    condition,
    identityHooks: hooks,
    effectSpec,
    displayText: `需要大招能量與${variant.label}條件，爆發出${hooks.slice(0, 2).map((hook) => hook.value).join("、")}的招牌時刻。`,
    balance: {
      role: "signature_finisher",
      primaryScale,
      pattern: `${combatIdentity.combatCore}.${combatIdentity.combatVariant}.ultimate`
    }
  };
}

function buildCoreActiveEffects(combatIdentity, primaryScale) {
  if (combatIdentity.combatCore === "defense") {
    return [
      { op: "damage", target: "enemy", scale: primaryScale, ratio: combatIdentity.combatVariant === "control" ? 0.72 : 0.82 },
      { op: "shield", target: "self", amount: combatIdentity.combatVariant === "guard" ? 24 : 16 },
      { op: "gainUltimateCharge", target: "self", amount: 10 }
    ];
  }
  if (combatIdentity.combatCore === "support") {
    return [
      { op: "damage", target: "enemy", scale: primaryScale, ratio: 0.7 },
      { op: "buff", target: "self", stat: combatIdentity.combatVariant === "assist" ? "guard" : "luck", amount: 7, turns: 1 },
      { op: "gainUltimateCharge", target: "self", amount: 12 }
    ];
  }
  return [
    { op: "damage", target: "enemy", scale: primaryScale, ratio: combatIdentity.combatVariant === "burst" ? 1.22 : 0.98 },
    { op: "gainUltimateCharge", target: "self", amount: combatIdentity.combatVariant === "combo" ? 18 : 12 }
  ];
}

function buildVariantActiveEffects(combatIdentity, primaryScale) {
  const variant = combatIdentity.combatVariant;
  if (variant === "burst") {
    return [
      { op: "damage", target: "enemy", scale: primaryScale, ratio: 1.36 },
      { op: "cooldownChange", target: "self", slotKey: "active1", amount: 1 }
    ];
  }
  if (variant === "combo") {
    return [
      { op: "damage", target: "enemy", scale: primaryScale, ratio: 0.78 },
      { op: "gainUltimateCharge", target: "self", amount: 24 },
      { op: "cooldownChange", target: "self", slotKey: "active0", amount: -1 }
    ];
  }
  if (variant === "guard") {
    return [
      { op: "shield", target: "self", amount: 34 },
      { op: "gainUltimateCharge", target: "self", amount: 10 }
    ];
  }
  if (variant === "control") {
    return [
      { op: "damage", target: "enemy", scale: primaryScale, ratio: 0.62 },
      { op: "debuff", target: "enemy", stat: "power", amount: 9, turns: 1 }
    ];
  }
  if (variant === "assist") {
    return [
      { op: "heal", target: "self", amount: 22 },
      { op: "buff", target: "self", stat: "focus", amount: 7, turns: 1 }
    ];
  }
  return [
    { op: "damage", target: "enemy", scale: primaryScale, ratio: 0.84 },
    { op: "buff", target: "self", stat: "luck", amount: 9, turns: 1 },
    { op: "gainUltimateCharge", target: "self", amount: 16 }
  ];
}

function buildUltimateEffects(combatIdentity, primaryScale) {
  if (combatIdentity.combatCore === "defense") {
    return [
      { op: "shield", target: "self", amount: 46 },
      { op: "damage", target: "enemy", scale: primaryScale, ratio: combatIdentity.combatVariant === "control" ? 1.35 : 1.12 },
      { op: "debuff", target: "enemy", stat: combatIdentity.combatVariant === "control" ? "speed" : "power", amount: 12, turns: 2 }
    ];
  }
  if (combatIdentity.combatCore === "support") {
    return [
      { op: "heal", target: "self", amount: 34 },
      { op: "buff", target: "self", stat: combatIdentity.combatVariant === "assist" ? "guard" : "luck", amount: 16, turns: 2 },
      { op: "damage", target: "enemy", scale: primaryScale, ratio: 1.08 }
    ];
  }
  return [
    { op: "damage", target: "enemy", scale: primaryScale, ratio: combatIdentity.combatVariant === "burst" ? 2.18 : 1.72 },
    { op: "buff", target: "self", stat: combatIdentity.combatVariant === "combo" ? "speed" : "power", amount: 12, turns: 1 }
  ];
}

function buildUltimateCondition(combatIdentity, hooks) {
  const characterHook = hooks.find((hook) => !["combatCore", "combatVariant"].includes(hook.source)) ?? hooks[0];
  const variantRules = {
    burst: [{ op: "totalDamageDealtAtLeast", amount: 120 }],
    combo: [{ op: "usedActiveSkillCount", count: 2 }],
    guard: [{ op: "shieldChangedThisBattle", count: 1 }],
    control: [{ op: "enemyDebuffed", count: 1 }],
    trick: [{ op: "hpBelow", target: "self", percent: 55 }],
    assist: [{ op: "hpBelow", target: "self", percent: 65 }]
  };

  return {
    op: "any",
    rules: [
      ...(variantRules[combatIdentity.combatVariant] ?? variantRules.burst),
      { op: "hpBelow", target: "self", percent: 45 },
      { op: "hasIdentityHook", source: characterHook?.source ?? "sourcePhotoCue", value: characterHook?.value ?? "中心人物特徵" }
    ]
  };
}

function buildIdentityHooks({ combatIdentity, material, generationProfile, min, includeVariant, preferredSources }) {
  const hooks = [];
  const preferred = new Set(preferredSources ?? []);
  const traced = (material.sourceTrace ?? [])
    .filter((trace) => preferred.size === 0 || preferred.has(trace.source))
    .map((trace) => ({ source: trace.source, value: trace.value }));
  const fallbackTrace = (material.sourceTrace ?? []).map((trace) => ({ source: trace.source, value: trace.value }));
  hooks.push({ source: "combatCore", value: combatIdentity.combatCoreLabel });
  if (includeVariant) hooks.push({ source: "combatVariant", value: combatIdentity.combatVariantLabel });
  hooks.push(
    valueToHook(generationProfile.signatureItem, "signatureItem"),
    valueToHook(generationProfile.valueLabel, "values"),
    valueToHook(generationProfile.weakness, "weakness"),
    valueToHook(generationProfile.backstory, "storyEvent"),
    valueToHook(generationProfile.eventCombatProfile?.label, "eventContext"),
    generationProfile.characterName && generationProfile.characterName !== "路人"
      ? valueToHook(generationProfile.characterName, "characterNameSeed")
      : null
  );
  hooks.push(...traced);
  hooks.push(...fallbackTrace);
  hooks.push({ source: "sourcePhotoCue", value: "中心人物特徵" });

  const unique = uniqueHooks(hooks).slice(0, 6);
  while (unique.length < min) {
    unique.push({ source: "sourcePhotoCue", value: `角色特徵${unique.length + 1}` });
  }
  return unique;
}

function buildNameMaterial({ material, archetype, generationProfile }) {
  const candidates = [
    ...material.namingCandidates,
    ...material.propCues,
    ...material.visibleTags,
    ...material.sceneMotifs,
    generationProfile.signatureItem,
    generationProfile.valueLabel,
    archetype.element,
    archetype.name
  ];
  const words = uniqueStrings(candidates.map(cueToNameWord).filter(Boolean));
  const primaryWord = words[0] ?? "核心";
  const secondaryWord = words[1] ?? words[0] ?? "戰術";
  const comebackWord = cueToNameWord(generationProfile.weakness) || words[2] || "逆境";
  const ultimateWord = cueToNameWord(generationProfile.eventCombatProfile?.skillWord) || words[3] || primaryWord;
  const identityText = material.visibleTags[0] || material.propCues[0] || material.sceneMotifs[0]
    ? `把${[material.visibleTags[0], material.propCues[0], material.sceneMotifs[0]].filter(Boolean).slice(0, 2).join("、")}變成戰鬥素材，`
    : "";

  return {
    primaryWord,
    secondaryWord,
    comebackWord,
    ultimateWord,
    identityText
  };
}

function resolveCombatIdentity({ characterSpec = {}, generationProfile = {}, stats = {} } = {}) {
  const explicitCore = normalizeCombatCore(generationProfile.combatCore ?? characterSpec.combatCore);
  const legacyIdentity = LEGACY_COMBAT_STYLE_TO_IDENTITY[generationProfile.combatStyle] ?? null;
  const statIdentity = inferIdentityFromStats(stats);
  const coreKey = explicitCore ?? legacyIdentity?.combatCore ?? statIdentity.combatCore;
  const core = COMBAT_CORES[coreKey] ?? COMBAT_CORES.attack;
  const variantKey = normalizeCombatVariant(
    generationProfile.combatVariant ?? characterSpec.combatVariant ?? legacyIdentity?.combatVariant ?? statIdentity.combatVariant,
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

function addCues(buckets, sourceTrace, rejectedSensitiveCues, bucket, source, values) {
  for (const value of flattenValues(values)) {
    const normalized = safeString(value);
    if (!normalized || REJECTED_CUE_PATTERN.test(normalized)) continue;
    if (SENSITIVE_CUE_PATTERN.test(normalized)) {
      rejectedSensitiveCues.push(normalized);
      continue;
    }
    pushUnique(buckets[bucket], normalized);
    sourceTrace.push({ bucket, source, sourceLabel: SKILL_SOURCE_LABELS[source] ?? source, value: normalized });
  }
}

function flattenValues(values) {
  const output = [];
  const stack = Array.isArray(values) ? [...values] : [values];
  while (stack.length) {
    const item = stack.shift();
    if (item === null || item === undefined) continue;
    if (Array.isArray(item)) {
      stack.unshift(...item);
      continue;
    }
    if (typeof item === "object") {
      if (Array.isArray(item.tags)) stack.unshift(...item.tags);
      else if (Array.isArray(item.values)) stack.unshift(...item.values);
      else output.push(item.value ?? item.label ?? item.name ?? "");
      continue;
    }
    output.push(item);
  }
  return output;
}

function cueToNameWord(value) {
  const normalized = safeString(value);
  const text = normalized.toLowerCase();
  if (!text || REJECTED_CUE_PATTERN.test(text)) return "";
  if (containsAny(text, ["basketball", "court", "athlete", "sport", "ball", "籃球", "球場", "運動", "競技"])) return "快攻";
  if (containsAny(text, ["arcade", "controller", "game", "neon", "街機", "手把", "遊戲", "霓虹"])) return "霓虹";
  if (containsAny(text, ["camera", "poster", "design", "art", "studio", "相機", "海報", "設計", "創作"])) return "構圖";
  if (containsAny(text, ["laptop", "book", "office", "school", "data", "study", "筆電", "書", "辦公", "學校", "資料", "研究"])) return "解析";
  if (containsAny(text, ["beach", "rain", "water", "sea", "海", "雨", "水"])) return "潮汐";
  if (containsAny(text, ["park", "mountain", "forest", "green", "公園", "山", "森林", "綠"])) return "荒野";
  if (containsAny(text, ["sun", "bright", "summer", "晴", "陽光", "夏"])) return "日光";
  if (containsAny(text, ["night", "shadow", "dark", "夜", "影", "暗"])) return "夜巡";
  if (containsAny(text, ["text", "sign", "logo", "word", "文字", "招牌", "標誌"])) return "契印";
  if (/^[\p{Script=Han}A-Za-z0-9 -]{1,8}$/u.test(normalized)) return normalized.replace(/\s+/g, "").slice(0, 4);
  return "";
}

function compactName(parts, rng = Math.random) {
  const cleanParts = parts.map(cueToNameWord).filter(Boolean);
  if (cleanParts.length >= 2 && cleanParts[0] !== cleanParts[1]) return `${cleanParts[0]}${cleanParts[1]}`;
  if (cleanParts[0]) return `${cleanParts[0]}${pick(["式", "回路", "戰術"], rng)}`;
  return `未命名${pick(["式", "回路", "戰術"], rng)}`;
}

function createSkillId(slotKey, combatIdentity, name, hooks) {
  const text = `${slotKey}:${combatIdentity.combatCore}:${combatIdentity.combatVariant}:${name}:${hooks.map((hook) => `${hook.source}:${hook.value}`).join("|")}`;
  return `${slotKey}_${combatIdentity.combatCore}_${combatIdentity.combatVariant}_${hashish(text)}`;
}

function estimateStatPower(stats, cardStatLine, scale, ratio) {
  const statValue = {
    atk: Number(cardStatLine.atk) / 76 || Number(stats.power) || 36,
    def: Number(cardStatLine.def) / 72 || Number(stats.guard) || 36,
    focus: Number(stats.focus) || 36,
    speed: Number(stats.speed) || 36
  }[scale] ?? Number(stats.power) ?? 36;
  return Math.max(12, Math.round(statValue * ratio + Number(stats.focus || 0) * 0.18 + 8));
}

function inferLegacySkillType(skill) {
  return inferLegacySkillTypeFromEffects(skill?.effectSpec ?? []);
}

function inferLegacySkillTypeFromEffects(effectSpec) {
  const effects = Array.isArray(effectSpec) ? effectSpec : [];
  const hasDamage = effects.some((effect) => effect?.op === "damage");
  const hasGuardUtility = effects.some((effect) => ["shield", "heal", "buff"].includes(effect?.op));
  return hasGuardUtility && !hasDamage ? "guard" : "strike";
}

function estimateLegacyPower(skill) {
  const effects = Array.isArray(skill?.effectSpec) ? skill.effectSpec : [];
  const damage = effects.find((effect) => effect.op === "damage");
  const shield = effects.find((effect) => effect.op === "shield" || effect.op === "heal");
  if (damage) return Math.round(24 * Number(damage.ratio ?? 1));
  if (shield) return Math.round(Number(shield.amount ?? 18));
  return 20;
}

function validateSkillEntry(errors, skill, path, minHooks) {
  if (!skill || typeof skill !== "object") {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (!safeString(skill.name)) errors.push(`${path} must include a name.`);
  if (!Array.isArray(skill.identityHooks) || skill.identityHooks.length < minHooks) {
    errors.push(`${path} must include at least ${minHooks} identity hooks.`);
  }
  const effectSpec = Array.isArray(skill.effectSpec) ? skill.effectSpec : [];
  if (!effectSpec.length) errors.push(`${path} must include executable effectSpec data.`);
  for (const effect of effectSpec) {
    if (!ALLOWED_EFFECT_OPS.includes(effect?.op)) {
      errors.push(`${path} contains unsupported effect op: ${String(effect?.op ?? "")}.`);
    }
  }
}

function validateHasNonCombatHook(errors, skill, path) {
  const hooks = Array.isArray(skill?.identityHooks) ? skill.identityHooks : [];
  if (!hooks.some((hook) => !["combatCore", "combatVariant"].includes(hook.source))) {
    errors.push(`${path} must include at least one visible/user/context hook.`);
  }
}

function validateHasAnySource(errors, skill, path, allowedSources) {
  const hooks = Array.isArray(skill?.identityHooks) ? skill.identityHooks : [];
  if (!hooks.some((hook) => allowedSources.includes(hook.source))) {
    errors.push(`${path} must include one of: ${allowedSources.join(", ")}.`);
  }
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

function valueToHook(value, source) {
  const normalized = safeString(value);
  if (!normalized || REJECTED_CUE_PATTERN.test(normalized) || SENSITIVE_CUE_PATTERN.test(normalized)) return null;
  return { source, value: normalized };
}

function uniqueHooks(hooks) {
  const seen = new Set();
  return hooks
    .filter(Boolean)
    .map((hook) => ({
      source: safeString(hook.source),
      value: safeString(hook.value)
    }))
    .filter((hook) => {
      if (!hook.source || !hook.value || SENSITIVE_CUE_PATTERN.test(hook.value) || REJECTED_CUE_PATTERN.test(hook.value)) return false;
      const key = `${hook.source}:${hook.value.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function uniqueTrace(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.bucket}:${item.source}:${String(item.value).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(values) {
  const seen = new Set();
  return values
    .map((value) => safeString(value))
    .filter((value) => {
      if (!value) return false;
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function pushUnique(items, value) {
  const key = value.toLowerCase();
  if (!items.some((item) => item.toLowerCase() === key)) items.push(value);
}

function statLabel(stat) {
  return {
    power: "力量",
    speed: "速度",
    guard: "防禦",
    focus: "專注",
    luck: "幸運",
    atk: "攻擊",
    def: "防禦"
  }[stat] ?? stat;
}

function containsAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function pick(items, rng = Math.random) {
  return items[Math.floor(rng() * items.length)] ?? items[0];
}

function safeString(value, fallback = "") {
  return String(value ?? fallback)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function hashish(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
