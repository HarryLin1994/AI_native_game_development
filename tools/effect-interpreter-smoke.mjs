import assert from "node:assert/strict";
import {
  resolveEffectSpec,
  selectActiveSkill,
  validateEffectSpec
} from "../src/battle/effect-interpreter.js";
import {
  generateSkillKit
} from "../src/card-generation/skill-kit.js";

function rng() {
  return 0.42;
}

const skillKit = generateSkillKit({
  cardStats: { power: 48, speed: 62, guard: 31, focus: 44, luck: 36 },
  archetype: { key: "volt", name: "脈衝客", element: "Voltage" },
  traits: ["Voltage", "連擊節奏"],
  generationProfile: {
    characterName: "昶志",
    combatStyle: "duelist",
    valueLabel: "勝利",
    weakness: "容易逞強",
    signatureItem: "controller",
    eventCombatProfile: { label: "新年覺醒", skillWord: "新星" }
  },
  skillMaterialProfile: {
    profileVersion: "skill-material-v1",
    visibleTags: ["arcade", "controller"],
    actionCues: ["centered pose"],
    propCues: ["controller"],
    sceneMotifs: ["retro arcade"],
    moodCues: ["neon"],
    namingCandidates: ["霓虹"],
    rejectedSensitiveCues: [],
    sourceTrace: [
      { bucket: "visibleTags", source: "visibleSemanticTag", value: "arcade" },
      { bucket: "propCues", source: "signatureItem", value: "controller" }
    ]
  },
  rng
});

const player = {
  side: "player",
  name: "霓虹昶志",
  hp: 140,
  maxHp: 140,
  shield: 0,
  stats: { power: 48, speed: 62, guard: 31, focus: 44, luck: 36 },
  skillKit
};
const enemy = {
  side: "enemy",
  name: "訓練對手",
  hp: 150,
  maxHp: 150,
  shield: 0,
  stats: { power: 40, speed: 36, guard: 28, focus: 32, luck: 20 }
};
const battle = { turn: 1, player, enemy };
const active0 = selectActiveSkill(player, 0);

assert.equal(validateEffectSpec(active0.effectSpec).ok, true);

const result = resolveEffectSpec({ battle, actor: player, opponent: enemy, skill: active0, rng });

assert.equal(result.ok, true);
assert.ok(enemy.hp < enemy.maxHp);
assert.ok(player.ultimateCharge > 0);
assert.equal(battle.skillRuntime.player.usedActiveSkillCount, 1);
assert.ok(result.logs.some((line) => line.includes("造成")));

const legacyGuard = resolveEffectSpec({
  battle,
  actor: player,
  opponent: enemy,
  skill: { name: "舊式屏障", type: "guard", power: 20 },
  rng
});

assert.equal(legacyGuard.ok, true);
assert.ok(player.shield > 0);

const buffSkill = {
  name: "測試增益",
  effectSpec: [
    { op: "buff", target: "self", stat: "speed", amount: 7, turns: 1 },
    { op: "debuff", target: "enemy", stat: "power", amount: 5, turns: 1 },
    { op: "cooldownChange", target: "self", slotKey: "active0", amount: -1 }
  ]
};
const buffResult = resolveEffectSpec({ battle, actor: player, opponent: enemy, skill: buffSkill, rng });

assert.equal(buffResult.ok, true);
assert.equal(player.temporaryStatMods.length, 1);
assert.equal(enemy.temporaryStatMods.length, 1);
assert.equal(battle.skillRuntime.player.cooldownAdjustments.active0, -1);

console.log("effect interpreter smoke ok");
