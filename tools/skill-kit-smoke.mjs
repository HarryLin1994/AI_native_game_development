import assert from "node:assert/strict";
import {
  buildSkillMaterialProfile,
  createLegacySkillsFromSkillKit,
  generateSkillKit,
  validateSkillKit
} from "../src/card-generation/skill-kit.js";

function rng() {
  return 0.42;
}

const analysis = {
  textSeed: "A12",
  visibleSemanticTags: ["arcade", "controller", "political badge"],
  visibleSemanticTagGroups: {
    personAppearance: ["visible face", "forward pose"],
    scene: ["retro arcade"],
    activity: ["competitive game"],
    object: ["controller"],
    state: ["celebrating"],
    clothing: ["sports jacket"],
    lighting: ["neon light"],
    composition: ["centered pose"],
    visualSignal: ["blue palette"]
  }
};

const generationProfile = {
  characterName: "昶志",
  combatStyle: "duelist",
  valueLabel: "勝利",
  weakness: "容易逞強",
  signatureItem: "controller",
  backstory: "街機挑戰者",
  cardMood: "neon",
  placeTypeLabel: "街機場",
  timeMoodLabel: "霓虹",
  eventCombatProfile: {
    label: "新年覺醒",
    skillWord: "新星",
    promptHook: "new year countdown glow"
  }
};

const characterSpec = {
  contexts: {
    capture: {
      locationCreativeTags: ["arcade neon venue"],
      timeMoodLabel: "霓虹"
    },
    event: {
      holidayTags: ["new_year"],
      eventCreativeTags: ["new year countdown glow"]
    },
    questionnaire: {
      signatureItem: "controller",
      valueLabel: "勝利",
      weakness: "容易逞強",
      storyEvents: ["街機挑戰者"]
    },
    vision: {
      visibleSemanticTags: ["arcade", "controller"],
      semanticTagGroups: analysis.visibleSemanticTagGroups
    }
  },
  promptProfile: {
    worldHooks: ["retro game-floor energy"],
    storyHooks: ["retro arcade rival"]
  },
  photoSemantics: {
    textSeed: "A12",
    visibleSemanticTags: ["arcade", "controller"],
    visibleSemanticTagGroups: analysis.visibleSemanticTagGroups
  }
};

const material = buildSkillMaterialProfile({ characterSpec, analysis, generationProfile });

assert.ok(material.visibleTags.includes("arcade"));
assert.ok(material.propCues.includes("controller"));
assert.ok(material.sceneMotifs.includes("retro arcade"));
assert.ok(material.namingCandidates.includes("霓虹"));
assert.ok(material.rejectedSensitiveCues.includes("political badge"));
assert.ok(material.sourceTrace.some((trace) => trace.source === "visibleSemanticTag"));

const skillKit = generateSkillKit({
  characterSpec,
  cardStats: { power: 42, speed: 58, guard: 30, focus: 46, luck: 35 },
  cardStatLine: { hp: 4200, atk: 5100, def: 3600, cost: 12, level: 1 },
  archetype: { key: "volt", name: "脈衝客", element: "Voltage" },
  traits: ["Voltage", "連擊節奏"],
  generationProfile,
  skillMaterialProfile: material,
  rng
});

const validation = validateSkillKit(skillKit);

assert.equal(validation.ok, true);
assert.equal(skillKit.activeSkills.length, 2);
assert.equal(skillKit.battleTraits.length, 2);
assert.equal(skillKit.ultimateSkill.chargeCost, 100);
assert.equal(skillKit.combatIdentity.combatCore, "attack");
assert.equal(skillKit.combatIdentity.combatVariant, "combo");
assert.ok(skillKit.activeSkills.every((skill) => skill.identityHooks.length >= 2));
assert.ok(skillKit.battleTraits.every((skill) => skill.effectSpec.length > 0));
assert.ok(skillKit.ultimateSkill.condition.rules.length >= 2);

const legacySkills = createLegacySkillsFromSkillKit(skillKit);

assert.equal(legacySkills.length, 2);
assert.ok(legacySkills.every((skill) => skill.name && Number.isFinite(skill.power)));

console.log("skill kit smoke ok");
