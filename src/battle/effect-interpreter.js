import { ALLOWED_EFFECT_OPS } from "../card-generation/skill-kit.js";

const MAX_ULTIMATE_CHARGE = 100;
const STAT_KEYS = Object.freeze(["power", "speed", "guard", "focus", "luck", "atk", "def"]);

export function selectActiveSkill(fighter, index) {
  return fighter?.skillKit?.activeSkills?.[index] ?? fighter?.skills?.[index] ?? null;
}

export function resolveEffectSpec({ battle = {}, actor = null, opponent = null, skill = null, rng = Math.random } = {}) {
  if (!actor || !opponent || !skill) {
    return { ok: false, logs: ["技能解析失敗：缺少戰鬥角色或技能資料。"], events: [] };
  }

  prepareBattleFighter(actor);
  prepareBattleFighter(opponent);
  expireTemporaryStatMods(actor, battle.turn);
  expireTemporaryStatMods(opponent, battle.turn);

  const effectSpec = Array.isArray(skill.effectSpec) && skill.effectSpec.length
    ? skill.effectSpec
    : legacySkillToEffectSpec(skill);
  const validation = validateEffectSpec(effectSpec);
  if (!validation.ok) {
    return {
      ok: false,
      logs: [`${actor.name} 的 ${skill.name ?? "技能"} 無法解析：${validation.errors[0]}`],
      events: []
    };
  }

  const logs = [`${actor.name} 發動 ${skill.name}`];
  const events = [];

  for (const effect of effectSpec) {
    const result = resolveEffect({ battle, actor, opponent, skill, effect, rng });
    if (result.log) logs.push(result.log);
    events.push(...result.events);
  }

  recordSkillUse(battle, actor, skill, events);
  return { ok: true, logs, events };
}

export function validateEffectSpec(effectSpec) {
  const errors = [];
  if (!Array.isArray(effectSpec) || !effectSpec.length) {
    return { ok: false, errors: ["effectSpec must be a non-empty array."] };
  }

  effectSpec.forEach((effect, index) => {
    if (!effect || typeof effect !== "object") {
      errors.push(`effectSpec[${index}] must be an object.`);
      return;
    }
    if (!ALLOWED_EFFECT_OPS.includes(effect.op)) {
      errors.push(`effectSpec[${index}] has unsupported op: ${String(effect.op ?? "")}.`);
    }
    if (["damage", "shield", "heal", "buff", "debuff", "gainUltimateCharge", "cooldownChange"].includes(effect.op)) {
      if (!["self", "enemy"].includes(effect.target)) {
        errors.push(`effectSpec[${index}] has invalid target: ${String(effect.target ?? "")}.`);
      }
    }
  });

  return {
    ok: errors.length === 0,
    errors
  };
}

function resolveEffect({ battle, actor, opponent, skill, effect, rng }) {
  switch (effect.op) {
    case "damage":
      return resolveDamage({ battle, actor, opponent, skill, effect, rng });
    case "shield":
      return resolveShield({ battle, actor, opponent, effect });
    case "heal":
      return resolveHeal({ battle, actor, opponent, effect });
    case "buff":
      return resolveStatMod({ battle, actor, opponent, effect, sign: 1 });
    case "debuff":
      return resolveStatMod({ battle, actor, opponent, effect, sign: -1 });
    case "gainUltimateCharge":
      return resolveUltimateCharge({ actor, opponent, effect });
    case "cooldownChange":
      return resolveCooldownChange({ battle, actor, effect });
    case "triggerOnBattleStart":
    case "triggerOnHpBelow":
    case "checkUltimateCondition":
      return { log: "", events: [{ type: effect.op, source: skill.id ?? skill.name ?? "skill" }] };
    default:
      return { log: "", events: [] };
  }
}

function resolveDamage({ battle, actor, opponent, skill, effect, rng }) {
  const target = resolveTarget({ actor, opponent, target: effect.target });
  const scale = readBattleScale(actor, effect.scale);
  const ratio = readNumber(effect.ratio, 1);
  const variance = 0.94 + rng() * 0.12;
  const crit = rng() < readBattleScale(actor, "luck") / 280;
  const base = scale * ratio * variance + readBattleScale(actor, "focus") * 0.12 + (crit ? readBattleScale(actor, "luck") * 0.28 : 0);
  const damage = mitigateDamage(base, target);
  const beforeHp = target.hp;
  target.hp = clamp(Math.round(target.hp - damage), 0, target.maxHp);
  const dealt = Math.max(0, beforeHp - target.hp);
  battle.battleStats = battle.battleStats ?? {};
  battle.battleStats[actor.side] = battle.battleStats[actor.side] ?? {};
  battle.battleStats[actor.side].damageDealt = Math.round((battle.battleStats[actor.side].damageDealt ?? 0) + dealt);

  return {
    log: `造成 ${dealt}${crit ? " 暴擊" : ""}傷害`,
    events: [{ type: "dealDamage", actorSide: actor.side, targetSide: target.side, amount: dealt, skillId: skill.id ?? null }]
  };
}

function resolveShield({ battle, actor, opponent, effect }) {
  const target = resolveTarget({ actor, opponent, target: effect.target });
  const amount = Math.max(1, Math.round(readNumber(effect.amount, 0) + readBattleScale(target, "guard") * 0.16));
  target.shield = Math.max(0, Math.round((target.shield ?? 0) + amount));
  battle.battleStats = battle.battleStats ?? {};
  battle.battleStats[target.side] = battle.battleStats[target.side] ?? {};
  battle.battleStats[target.side].shieldChanged = Math.round((battle.battleStats[target.side].shieldChanged ?? 0) + amount);

  return {
    log: `獲得 ${amount} 護盾`,
    events: [{ type: "shield", targetSide: target.side, amount }]
  };
}

function resolveHeal({ actor, opponent, effect }) {
  const target = resolveTarget({ actor, opponent, target: effect.target });
  const amount = Math.max(1, Math.round(readNumber(effect.amount, 0) + readBattleScale(target, "focus") * 0.12));
  const beforeHp = target.hp;
  target.hp = clamp(Math.round(target.hp + amount), 0, target.maxHp);
  const healed = target.hp - beforeHp;

  return {
    log: `恢復 ${healed} HP`,
    events: [{ type: "heal", targetSide: target.side, amount: healed }]
  };
}

function resolveStatMod({ battle, actor, opponent, effect, sign }) {
  const target = resolveTarget({ actor, opponent, target: effect.target });
  const stat = normalizeStatKey(effect.stat);
  const amount = Math.max(1, Math.round(Math.abs(readNumber(effect.amount, 0)))) * sign;
  const turns = Math.max(1, Math.round(readNumber(effect.turns, 1)));
  target.temporaryStatMods.push({
    stat,
    amount,
    createdTurn: Math.max(1, Number(battle.turn) || 1),
    expiresAfterTurn: Math.max(1, Number(battle.turn) || 1) + turns
  });
  const label = amount > 0 ? "提升" : "降低";

  return {
    log: `${label}${statLabel(stat)} ${Math.abs(amount)}，持續 ${turns} 回合`,
    events: [{ type: amount > 0 ? "buff" : "debuff", targetSide: target.side, stat, amount, turns }]
  };
}

function resolveUltimateCharge({ actor, opponent, effect }) {
  const target = resolveTarget({ actor, opponent, target: effect.target });
  const amount = Math.max(0, Math.round(readNumber(effect.amount, 0)));
  target.ultimateCharge = clamp(Math.round((target.ultimateCharge ?? 0) + amount), 0, MAX_ULTIMATE_CHARGE);

  return {
    log: `大招能量 +${amount}（${target.ultimateCharge}/${MAX_ULTIMATE_CHARGE}）`,
    events: [{ type: "gainUltimateCharge", targetSide: target.side, amount }]
  };
}

function resolveCooldownChange({ battle, actor, effect }) {
  battle.skillRuntime = battle.skillRuntime ?? {};
  battle.skillRuntime[actor.side] = battle.skillRuntime[actor.side] ?? { usedActiveSkillCount: 0, cooldownAdjustments: {} };
  const slotKey = String(effect.slotKey ?? "active0");
  const amount = Math.round(readNumber(effect.amount, 0));
  const runtime = battle.skillRuntime[actor.side];
  runtime.cooldownAdjustments[slotKey] = Math.round((runtime.cooldownAdjustments[slotKey] ?? 0) + amount);

  return {
    log: `${slotLabel(slotKey)}冷卻 ${amount > 0 ? "+" : ""}${amount}`,
    events: [{ type: "cooldownChange", targetSide: actor.side, slotKey, amount }]
  };
}

function legacySkillToEffectSpec(skill) {
  if (skill?.type === "guard") {
    return [
      { op: "shield", target: "self", amount: readNumber(skill.power, 16) }
    ];
  }
  return [
    { op: "damage", target: "enemy", scale: "power", ratio: Math.max(0.5, readNumber(skill?.power, 24) / 42) }
  ];
}

function recordSkillUse(battle, actor, skill, events) {
  battle.skillRuntime = battle.skillRuntime ?? {};
  battle.skillRuntime[actor.side] = battle.skillRuntime[actor.side] ?? { usedActiveSkillCount: 0, cooldownAdjustments: {} };
  if (skill.slot === "active" || String(skill.slotKey ?? "").startsWith("active") || !skill.slot) {
    battle.skillRuntime[actor.side].usedActiveSkillCount += 1;
  }
  battle.skillRuntime[actor.side].lastEvents = events;
}

function resolveTarget({ actor, opponent, target }) {
  return target === "self" ? actor : opponent;
}

function prepareBattleFighter(fighter) {
  fighter.side = fighter.side ?? "fighter";
  fighter.hp = Math.round(readNumber(fighter.hp, fighter.maxHp ?? 1));
  fighter.maxHp = Math.max(1, Math.round(readNumber(fighter.maxHp, fighter.hp)));
  fighter.shield = Math.max(0, Math.round(readNumber(fighter.shield, 0)));
  fighter.ultimateCharge = clamp(Math.round(readNumber(fighter.ultimateCharge, 0)), 0, MAX_ULTIMATE_CHARGE);
  fighter.temporaryStatMods = Array.isArray(fighter.temporaryStatMods) ? fighter.temporaryStatMods : [];
}

function expireTemporaryStatMods(fighter, turn) {
  const currentTurn = Math.max(1, Number(turn) || 1);
  fighter.temporaryStatMods = (fighter.temporaryStatMods ?? []).filter((mod) => {
    return !Number.isFinite(Number(mod.expiresAfterTurn)) || Number(mod.expiresAfterTurn) >= currentTurn;
  });
}

function readBattleScale(fighter, scale) {
  const stat = normalizeStatKey(scale);
  const base = readBaseStat(fighter, stat);
  const mod = (fighter.temporaryStatMods ?? [])
    .filter((item) => normalizeStatKey(item.stat) === stat)
    .reduce((sum, item) => sum + readNumber(item.amount, 0), 0);
  return Math.max(1, base + mod);
}

function readBaseStat(fighter, stat) {
  if (stat === "atk") {
    return readNumber(fighter.stats?.power, 36) * 0.62 + readNumber(fighter.stats?.speed, 36) * 0.24 + readNumber(fighter.stats?.focus, 36) * 0.12;
  }
  if (stat === "def") {
    return readNumber(fighter.stats?.guard, 36) * 0.62 + readNumber(fighter.stats?.focus, 36) * 0.18 + readNumber(fighter.stats?.power, 36) * 0.08;
  }
  return readNumber(fighter.stats?.[stat], 36);
}

function normalizeStatKey(value) {
  const normalized = String(value ?? "power").trim();
  return STAT_KEYS.includes(normalized) ? normalized : "power";
}

function mitigateDamage(base, defender) {
  let reduced = base - readBattleScale(defender, "guard") * 0.18;
  if (defender.shield > 0) {
    const absorbed = Math.min(defender.shield, Math.max(1, Math.round(reduced)));
    defender.shield -= absorbed;
    reduced -= absorbed;
  }
  return Math.max(1, Math.round(reduced));
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

function slotLabel(slotKey) {
  return {
    active0: "主動技能一",
    active1: "主動技能二",
    trait0: "戰鬥特性一",
    trait1: "戰鬥特性二",
    ultimate: "大招"
  }[slotKey] ?? "技能";
}

function readNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
