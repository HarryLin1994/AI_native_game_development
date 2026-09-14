export const SKILL_TAXONOMY_VERSION = "skill-taxonomy-v1-original";

export const SKILL_CARD_TABS = Object.freeze({
  ACTIVE_ULTIMATE: "active_ultimate",
  PASSIVE_CONDITIONS: "passive_conditions",
  ULTIMATE_ANIMATION: "ultimate_animation"
});

export const SKILL_TRIGGER_FAMILIES = Object.freeze({
  MANUAL: "manual",
  BATTLE_START: "battle_start",
  HP_THRESHOLD: "hp_threshold",
  ACTION_COUNT: "action_count",
  BATTLE_STATE: "battle_state",
  IDENTITY_HOOK: "identity_hook",
  ULTIMATE_CHARGE: "ultimate_charge"
});

export const SKILL_KIND_RULES = Object.freeze({
  direct_strike: Object.freeze({
    label: "直接打擊",
    role: "用穩定傷害建立基本壓力。",
    slotFamilies: Object.freeze(["active"]),
    preferredOps: Object.freeze(["damage"]),
    triggerFamilies: Object.freeze([SKILL_TRIGGER_FAMILIES.MANUAL]),
    animationKey: "impact_slash",
    borderGlowKey: "impact"
  }),
  burst_strike: Object.freeze({
    label: "爆發打擊",
    role: "用高倍率或高節奏在關鍵回合壓制。",
    slotFamilies: Object.freeze(["active", "ultimate"]),
    preferredOps: Object.freeze(["damage", "buff"]),
    triggerFamilies: Object.freeze([SKILL_TRIGGER_FAMILIES.MANUAL, SKILL_TRIGGER_FAMILIES.ULTIMATE_CHARGE]),
    animationKey: "burst_flash",
    borderGlowKey: "surge"
  }),
  combo_drive: Object.freeze({
    label: "連段推進",
    role: "用多段節奏、冷卻循環或大招充能累積優勢。",
    slotFamilies: Object.freeze(["active", "ultimate"]),
    preferredOps: Object.freeze(["damage", "gainUltimateCharge", "cooldownChange"]),
    triggerFamilies: Object.freeze([SKILL_TRIGGER_FAMILIES.MANUAL, SKILL_TRIGGER_FAMILIES.ACTION_COUNT]),
    animationKey: "afterimage_combo",
    borderGlowKey: "rhythm"
  }),
  guard_wall: Object.freeze({
    label: "護盾壁壘",
    role: "把角色特色轉成護盾、防禦與長戰容錯。",
    slotFamilies: Object.freeze(["active", "trait", "ultimate"]),
    preferredOps: Object.freeze(["shield", "buff"]),
    triggerFamilies: Object.freeze([SKILL_TRIGGER_FAMILIES.MANUAL, SKILL_TRIGGER_FAMILIES.BATTLE_START, SKILL_TRIGGER_FAMILIES.HP_THRESHOLD]),
    animationKey: "barrier_raise",
    borderGlowKey: "barrier"
  }),
  recovery_pulse: Object.freeze({
    label: "回復脈衝",
    role: "在壓力下回復 HP 或延長續戰。",
    slotFamilies: Object.freeze(["active", "trait", "ultimate"]),
    preferredOps: Object.freeze(["heal", "gainUltimateCharge"]),
    triggerFamilies: Object.freeze([SKILL_TRIGGER_FAMILIES.MANUAL, SKILL_TRIGGER_FAMILIES.HP_THRESHOLD]),
    animationKey: "restorative_wave",
    borderGlowKey: "restore"
  }),
  command_aura: Object.freeze({
    label: "指令增幅",
    role: "把角色身份轉成短期增益或戰術姿態。",
    slotFamilies: Object.freeze(["active", "trait", "ultimate"]),
    preferredOps: Object.freeze(["buff", "gainUltimateCharge"]),
    triggerFamilies: Object.freeze([SKILL_TRIGGER_FAMILIES.MANUAL, SKILL_TRIGGER_FAMILIES.BATTLE_START]),
    animationKey: "command_aura",
    borderGlowKey: "aura"
  }),
  disruption_mark: Object.freeze({
    label: "干擾刻印",
    role: "透過弱化、控速或節奏破壞讓敵人失去主導權。",
    slotFamilies: Object.freeze(["active", "ultimate"]),
    preferredOps: Object.freeze(["damage", "debuff", "cooldownChange"]),
    triggerFamilies: Object.freeze([SKILL_TRIGGER_FAMILIES.MANUAL, SKILL_TRIGGER_FAMILIES.BATTLE_STATE]),
    animationKey: "hex_mark",
    borderGlowKey: "disrupt"
  }),
  opening_trait: Object.freeze({
    label: "開場特性",
    role: "開戰時自動把角色核心轉成第一個戰鬥優勢。",
    slotFamilies: Object.freeze(["trait"]),
    preferredOps: Object.freeze(["triggerOnBattleStart", "buff", "shield"]),
    triggerFamilies: Object.freeze([SKILL_TRIGGER_FAMILIES.BATTLE_START]),
    animationKey: "opening_flare",
    borderGlowKey: "trait_ready"
  }),
  comeback_trigger: Object.freeze({
    label: "逆境觸發",
    role: "把弱點、故事或低血量時刻轉成反打機會。",
    slotFamilies: Object.freeze(["trait"]),
    preferredOps: Object.freeze(["triggerOnHpBelow", "shield", "heal", "gainUltimateCharge"]),
    triggerFamilies: Object.freeze([SKILL_TRIGGER_FAMILIES.HP_THRESHOLD]),
    animationKey: "comeback_spark",
    borderGlowKey: "comeback"
  }),
  signature_ultimate: Object.freeze({
    label: "招牌大招",
    role: "需要能量與角色條件，展現最深的角色連結。",
    slotFamilies: Object.freeze(["ultimate"]),
    preferredOps: Object.freeze(["damage", "shield", "heal", "buff", "debuff"]),
    triggerFamilies: Object.freeze([
      SKILL_TRIGGER_FAMILIES.ULTIMATE_CHARGE,
      SKILL_TRIGGER_FAMILIES.ACTION_COUNT,
      SKILL_TRIGGER_FAMILIES.BATTLE_STATE,
      SKILL_TRIGGER_FAMILIES.IDENTITY_HOOK
    ]),
    animationKey: "signature_cinematic",
    borderGlowKey: "ultimate"
  })
});

export const SKILL_ANIMATION_RULES = Object.freeze({
  impact_slash: Object.freeze({
    label: "衝擊斬擊",
    timeline: Object.freeze(["card_focus", "forward_snap", "impact_flash", "damage_number"]),
    intensity: "medium",
    cameraCue: "short_hit_shake",
    target: "enemy"
  }),
  burst_flash: Object.freeze({
    label: "爆發閃光",
    timeline: Object.freeze(["card_charge", "aura_overflow", "single_heavy_impact", "afterglow"]),
    intensity: "high",
    cameraCue: "impact_zoom",
    target: "enemy"
  }),
  afterimage_combo: Object.freeze({
    label: "殘影連段",
    timeline: Object.freeze(["card_focus", "multi_afterimage", "combo_hits", "charge_tick"]),
    intensity: "high",
    cameraCue: "rhythm_pulse",
    target: "enemy"
  }),
  barrier_raise: Object.freeze({
    label: "護盾升起",
    timeline: Object.freeze(["card_guard_pose", "barrier_ring", "shield_value_pop"]),
    intensity: "medium",
    cameraCue: "steady_push",
    target: "self"
  }),
  restorative_wave: Object.freeze({
    label: "回復波紋",
    timeline: Object.freeze(["card_breathe", "soft_wave", "hp_value_pop"]),
    intensity: "medium",
    cameraCue: "soft_lift",
    target: "self"
  }),
  command_aura: Object.freeze({
    label: "指令氣場",
    timeline: Object.freeze(["card_focus", "stat_glyphs", "buff_rise"]),
    intensity: "medium",
    cameraCue: "focus_lock",
    target: "self"
  }),
  hex_mark: Object.freeze({
    label: "干擾刻印",
    timeline: Object.freeze(["card_focus", "mark_project", "enemy_glyph_lock"]),
    intensity: "medium",
    cameraCue: "snap_cut",
    target: "enemy"
  }),
  opening_flare: Object.freeze({
    label: "開場亮框",
    timeline: Object.freeze(["battle_start_flash", "card_border_glow", "buff_rise"]),
    intensity: "low",
    cameraCue: "none",
    target: "self"
  }),
  comeback_spark: Object.freeze({
    label: "逆境亮框",
    timeline: Object.freeze(["hp_warning", "card_border_pulse", "reversal_spark"]),
    intensity: "medium",
    cameraCue: "low_hp_pulse",
    target: "self"
  }),
  signature_cinematic: Object.freeze({
    label: "招牌演出",
    timeline: Object.freeze(["ultimate_cut_in", "identity_hook_reveal", "signature_motion", "final_impact", "result_hold"]),
    intensity: "ultimate",
    cameraCue: "cinematic_zoom",
    target: "mixed"
  })
});

export function buildSkillKitPresentationModel(skillKit = {}) {
  return {
    taxonomyVersion: SKILL_TAXONOMY_VERSION,
    tabOrder: [
      {
        key: SKILL_CARD_TABS.ACTIVE_ULTIMATE,
        label: "主動 / 大招",
        slots: ["active0", "active1", "ultimate"]
      },
      {
        key: SKILL_CARD_TABS.PASSIVE_CONDITIONS,
        label: "被動 / 觸發",
        slots: ["trait0", "trait1"]
      },
      {
        key: SKILL_CARD_TABS.ULTIMATE_ANIMATION,
        label: "大招演出",
        slots: ["ultimate"]
      }
    ],
    triggerGlow: {
      activeSkill: "card-border-skill-ready",
      passiveTriggered: "card-border-passive-triggered",
      ultimateReady: "card-border-ultimate-ready",
      ultimateAnimating: "card-border-ultimate-cinematic"
    },
    ultimateAnimationSlot: skillKit.ultimateSkill?.animationProfile?.animationKey ?? "signature_cinematic"
  };
}

export function applySkillTaxonomy(skill, context = {}) {
  const classification = classifySkill(skill, context);
  const animationProfile = buildAnimationProfile(skill, classification, context);
  return {
    ...skill,
    classification,
    presentation: buildSkillPresentation(skill, classification, animationProfile),
    animationProfile
  };
}

export function validateSkillTaxonomy(skill) {
  const errors = [];
  const kind = skill?.classification?.skillKind;
  const rule = SKILL_KIND_RULES[kind];
  if (!rule) errors.push(`unknown skill kind: ${String(kind ?? "")}`);
  if (!skill?.presentation?.tabKey) errors.push("skill presentation must include tabKey.");
  if (!skill?.animationProfile?.animationKey || !SKILL_ANIMATION_RULES[skill.animationProfile.animationKey]) {
    errors.push("skill animationProfile must include a known animationKey.");
  }
  if (rule && skill?.slot && !rule.slotFamilies.includes(skill.slot)) {
    errors.push(`${kind} cannot be used in ${skill.slot} slot.`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

function classifySkill(skill, context) {
  const effects = Array.isArray(skill?.effectSpec) ? skill.effectSpec : [];
  const ops = effects.map((effect) => effect?.op).filter(Boolean);
  const has = (op) => ops.includes(op);
  const slot = skill?.slot ?? "active";
  const combatVariant = context.combatIdentity?.combatVariant ?? "";

  let skillKind = "direct_strike";
  if (slot === "ultimate") skillKind = "signature_ultimate";
  else if (has("triggerOnHpBelow")) skillKind = "comeback_trigger";
  else if (has("triggerOnBattleStart")) skillKind = "opening_trait";
  else if (has("debuff")) skillKind = "disruption_mark";
  else if (has("heal")) skillKind = "recovery_pulse";
  else if (has("shield") && !has("damage")) skillKind = "guard_wall";
  else if (has("buff") && !has("damage")) skillKind = "command_aura";
  else if (combatVariant === "combo" || has("gainUltimateCharge") || has("cooldownChange")) skillKind = "combo_drive";
  else if (combatVariant === "burst" || maxDamageRatio(effects) >= 1.2) skillKind = "burst_strike";

  const rule = SKILL_KIND_RULES[skillKind] ?? SKILL_KIND_RULES.direct_strike;
  return {
    taxonomyVersion: SKILL_TAXONOMY_VERSION,
    skillKind,
    skillKindLabel: rule.label,
    role: rule.role,
    triggerFamilies: [...rule.triggerFamilies],
    effectOps: uniqueStrings(ops),
    slotFamily: slot,
    combatCore: context.combatIdentity?.combatCore ?? null,
    combatVariant: context.combatIdentity?.combatVariant ?? null
  };
}

function buildAnimationProfile(skill, classification, context) {
  const rule = SKILL_KIND_RULES[classification.skillKind] ?? SKILL_KIND_RULES.direct_strike;
  const animation = SKILL_ANIMATION_RULES[rule.animationKey] ?? SKILL_ANIMATION_RULES.impact_slash;
  const identityHooks = Array.isArray(skill?.identityHooks) ? skill.identityHooks : [];
  const sourceHooks = identityHooks
    .filter((hook) => !["combatCore", "combatVariant"].includes(hook.source))
    .slice(0, skill.slot === "ultimate" ? 4 : 2)
    .map((hook) => ({
      source: safeString(hook.source),
      value: safeString(hook.value)
    }));
  const motifTokens = uniqueStrings([
    ...sourceHooks.map((hook) => hook.value),
    context.material?.propCues?.[0],
    context.material?.sceneMotifs?.[0],
    context.material?.moodCues?.[0]
  ]).slice(0, 5);

  return {
    version: SKILL_TAXONOMY_VERSION,
    animationKey: rule.animationKey,
    animationLabel: animation.label,
    borderGlowKey: rule.borderGlowKey,
    intensity: animation.intensity,
    cameraCue: animation.cameraCue,
    target: animation.target,
    timeline: [...animation.timeline],
    motifTokens,
    sourceHooks,
    triggerGlowClass: skill.slot === "trait" ? "card-border-passive-triggered" : skill.slot === "ultimate" ? "card-border-ultimate-ready" : "card-border-skill-ready",
    ultimateSequence: skill.slot === "ultimate"
      ? buildUltimateSequence({ skill, animation, motifTokens, combatIdentity: context.combatIdentity })
      : null
  };
}

function buildSkillPresentation(skill, classification, animationProfile) {
  const tabKey = skill.slot === "trait"
    ? SKILL_CARD_TABS.PASSIVE_CONDITIONS
    : SKILL_CARD_TABS.ACTIVE_ULTIMATE;

  return {
    tabKey,
    detailTabKeys: skill.slot === "ultimate"
      ? [SKILL_CARD_TABS.ACTIVE_ULTIMATE, SKILL_CARD_TABS.ULTIMATE_ANIMATION]
      : [tabKey],
    kindLabel: classification.skillKindLabel,
    triggerSummary: summarizeTrigger(skill),
    effectSummary: summarizeEffects(skill.effectSpec),
    animationSummary: `${animationProfile.animationLabel} / ${animationProfile.motifTokens.join("、") || "角色核心"}`
  };
}

function buildUltimateSequence({ skill, animation, motifTokens, combatIdentity }) {
  const hookText = motifTokens.slice(0, 3).join("、") || "角色核心";
  return [
    {
      phase: "cut_in",
      label: "角色切入",
      direction: `${skill.name} 先以卡面切入，亮出${combatIdentity?.combatCoreLabel ?? "戰鬥核心"}。`
    },
    {
      phase: "identity_reveal",
      label: "身份線索展開",
      direction: `畫面用 ${hookText} 作為主要符號，不使用無關的通用爆炸。`
    },
    {
      phase: "signature_motion",
      label: animation.label,
      direction: `依照 ${animation.timeline.join(" -> ")} 的順序演出。`
    },
    {
      phase: "result_hold",
      label: "結果定格",
      direction: "最後停在傷害、護盾、治療或增益結果，讓玩家看懂發生了什麼。"
    }
  ];
}

function summarizeTrigger(skill) {
  if (skill.slot === "ultimate") return "大招能量滿且角色條件成立";
  if (skill.activation?.event === "battleStart") return "開戰時自動觸發";
  if (skill.activation?.event === "hpBelow") return `HP 低於 ${skill.activation.percent ?? 45}% 時觸發`;
  if (skill.activation?.type === "manual") return `手動發動${skill.activation.cooldown ? ` / 冷卻 ${skill.activation.cooldown}` : ""}`;
  return "依戰鬥條件觸發";
}

function summarizeEffects(effectSpec) {
  const effects = Array.isArray(effectSpec) ? effectSpec : [];
  const labels = effects
    .map((effect) => {
      if (effect.op === "damage") return "造成傷害";
      if (effect.op === "shield") return "獲得護盾";
      if (effect.op === "heal") return "回復 HP";
      if (effect.op === "buff") return "提升能力";
      if (effect.op === "debuff") return "弱化敵人";
      if (effect.op === "gainUltimateCharge") return "累積大招能量";
      if (effect.op === "cooldownChange") return "調整冷卻";
      if (effect.op === "triggerOnBattleStart") return "開場觸發";
      if (effect.op === "triggerOnHpBelow") return "低血量觸發";
      if (effect.op === "checkUltimateCondition") return "檢查大招條件";
      return "";
    })
    .filter(Boolean);
  return uniqueStrings(labels).join(" / ") || "特殊效果";
}

function maxDamageRatio(effects) {
  return effects
    .filter((effect) => effect?.op === "damage")
    .reduce((max, effect) => Math.max(max, Number(effect.ratio) || 0), 0);
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

function safeString(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}
