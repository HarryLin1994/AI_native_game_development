import assert from "node:assert/strict";
import {
  buildSkillMaterialProfile,
  createLegacySkillsFromSkillKit,
  generateSkillKit,
  validateSkillKit
} from "../src/card-generation/skill-kit.js";
import {
  SKILL_ANIMATION_RULES,
  SKILL_CARD_TABS,
  SKILL_KIND_RULES,
  SKILL_TAXONOMY_VERSION
} from "../src/card-generation/skill-taxonomy.js";

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
assert.deepEqual(
  skillKit.presentationModel.tabOrder.map((tab) => tab.key),
  [
    SKILL_CARD_TABS.ACTIVE_ULTIMATE,
    SKILL_CARD_TABS.PASSIVE_CONDITIONS,
    SKILL_CARD_TABS.ULTIMATE_ANIMATION
  ]
);
assert.equal(skillKit.presentationModel.ultimateAnimationSlot, skillKit.ultimateSkill.animationProfile.animationKey);

const allGeneratedSkills = [
  ...skillKit.activeSkills,
  ...skillKit.battleTraits,
  skillKit.ultimateSkill
];

for (const skill of allGeneratedSkills) {
  assert.equal(skill.classification.taxonomyVersion, SKILL_TAXONOMY_VERSION);
  assert.ok(SKILL_KIND_RULES[skill.classification.skillKind]);
  assert.ok(skill.presentation.tabKey);
  assert.ok(skill.presentation.triggerSummary);
  assert.ok(skill.presentation.effectSummary);
  assert.equal(skill.animationProfile.version, SKILL_TAXONOMY_VERSION);
  assert.ok(SKILL_ANIMATION_RULES[skill.animationProfile.animationKey]);
  assert.ok(skill.animationProfile.borderGlowKey);
  assert.ok(skill.animationProfile.triggerGlowClass);
}

assert.ok(skillKit.activeSkills.every((skill) => skill.presentation.tabKey === SKILL_CARD_TABS.ACTIVE_ULTIMATE));
assert.ok(skillKit.battleTraits.every((skill) => skill.presentation.tabKey === SKILL_CARD_TABS.PASSIVE_CONDITIONS));
assert.ok(skillKit.battleTraits.every((skill) => skill.presentation.triggerSummary.includes("觸發")));
assert.ok(skillKit.ultimateSkill.presentation.detailTabKeys.includes(SKILL_CARD_TABS.ULTIMATE_ANIMATION));
assert.equal(skillKit.ultimateSkill.classification.skillKind, "signature_ultimate");
assert.equal(skillKit.ultimateSkill.animationProfile.animationKey, "signature_cinematic");
assert.ok(skillKit.ultimateSkill.animationProfile.motifTokens.length > 0);
assert.ok(skillKit.ultimateSkill.animationProfile.sourceHooks.length > 0);
assert.ok(skillKit.ultimateSkill.animationProfile.ultimateSequence.length >= 4);

const ultimateSequenceText = skillKit.ultimateSkill.animationProfile.ultimateSequence
  .map((step) => `${step.label} ${step.direction}`)
  .join(" ");
assert.ok(skillKit.ultimateSkill.animationProfile.motifTokens.some((token) => ultimateSequenceText.includes(token)));

const legacySkills = createLegacySkillsFromSkillKit(skillKit);

assert.equal(legacySkills.length, 2);
assert.ok(legacySkills.every((skill) => skill.name && Number.isFinite(skill.power)));

console.log("skill kit smoke ok");
