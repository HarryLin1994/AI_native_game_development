import assert from "node:assert/strict";
import {
  chooseSkillBranch,
  createInitialProgressionState,
  createPendingBranchChoice,
  validateProgressionState
} from "../src/progression/progression-state.js";
import {
  EVOLUTION_MILESTONES,
  getEvolutionMilestonesReached,
  MAX_CARD_LEVEL
} from "../src/progression/progression-rule-data.js";
import {
  acceptEvolutionArtResult,
  buildEvolutionPromptProfile,
  createEvolutionArtProviderRequest,
  createEvolutionArtJob,
  formatEvolutionPromptForImageModel
} from "../src/progression/evolution-art.js";
import {
  BRANCH_OPTION_SOURCES,
  buildSkillBranchOptions
} from "../src/progression/skill-branch-options.js";

const initial = createInitialProgressionState({
  cardId: "card-smoke",
  currentArtUrl: "data:image/png;base64,base",
  provider: "local",
  now: "2026-09-13T00:00:00.000Z"
});

assert.equal(initial.maxLevel, MAX_CARD_LEVEL);
assert.equal(EVOLUTION_MILESTONES.map((milestone) => milestone.level).join(","), "16,36,70,100");
assert.deepEqual(
  getEvolutionMilestonesReached(15, 36).map((milestone) => milestone.key),
  ["stage_one_evolution", "stage_two_evolution"]
);

const sampleBattleCard = {
  id: "card-smoke",
  name: "霓虹昶志",
  level: 16,
  stats: { power: 42, speed: 58, guard: 30, focus: 46, luck: 35 },
  skills: [{ name: "霓虹連段" }],
  characterSpec: {
    characterFormBranch: "humanlike",
    generationProfile: {
      combatStyle: "duelist",
      characterName: "昶志",
      signatureItem: "controller"
    },
    photoSemantics: {
      visibleSemanticTags: ["arcade", "neon sign", "controller"]
    },
    promptProfile: {
      storyHooks: ["retro arcade rival"]
    },
    visualPipeline: { prompt: "base card prompt" }
  }
};

const branchOptions = buildSkillBranchOptions({
  battleCard: sampleBattleCard,
  slot: "active0",
  skillMaterialProfile: {
    visibleTags: ["arcade", "neon sign"],
    propCues: ["controller"],
    sceneMotifs: ["retro arcade"]
  },
  milestone: EVOLUTION_MILESTONES[0]
});

assert.equal(branchOptions.length, 2);
assert.equal(branchOptions[0].source, BRANCH_OPTION_SOURCES.COMBAT_VARIANT);
assert.equal(branchOptions[1].source, BRANCH_OPTION_SOURCES.CHARACTER_HOOK);
assert.equal(branchOptions[0].sourceHook.value, "連擊");
assert.equal(branchOptions[1].sourceHook.value, "arcade");
assert.ok(branchOptions.every((option) => option.effectPreview.length > 0));
assert.ok(branchOptions.every((option) => option.visualPromptHooks.length > 0));

const withChoice = createPendingBranchChoice(initial, {
  slot: "active0",
  choiceId: "branch_active0_stage_one_evolution",
  options: branchOptions,
  now: "2026-09-13T00:01:00.000Z"
});

assert.equal(withChoice.progressionLock.reason, "pending_branch_choice");
assert.equal(validateProgressionState(withChoice).ok, true);

const chosen = chooseSkillBranch(withChoice, {
  choiceId: "branch_active0_stage_one_evolution",
  branchId: branchOptions[1].branchId,
  now: "2026-09-13T00:02:00.000Z"
});

assert.equal(chosen.selectedBranches.active0, branchOptions[1].branchId);
assert.equal(chosen.selectedBranchDetails.active0.source, BRANCH_OPTION_SOURCES.CHARACTER_HOOK);
assert.equal(chosen.progressionLock, null);
assert.equal(validateProgressionState(chosen).ok, true);

const promptProfile = buildEvolutionPromptProfile({
  battleCard: { ...sampleBattleCard, progression: chosen },
  progression: chosen,
  branchOptions: withChoice.pendingChoices[0].options
});

assert.equal(promptProfile.artRevision, 1);
assert.match(formatEvolutionPromptForImageModel(promptProfile), /EVOLUTION TIER/u);
assert.match(promptProfile.branchHooks.join(" "), /arcade/u);

const providerRequest = createEvolutionArtProviderRequest({
  battleCard: {
    ...sampleBattleCard,
    progression: chosen,
    imageDataUrl: "data:image/png;base64,base",
  },
  progression: chosen,
  provider: "local",
  branchOptions: withChoice.pendingChoices[0].options
});

assert.equal(providerRequest.provider, "local");
assert.equal(providerRequest.imageDataUrl, "data:image/png;base64,base");
assert.match(providerRequest.prompt, /evolved battle-card/u);

const { progression: withJob, job } = createEvolutionArtJob({
  progression: chosen,
  provider: "local",
  promptProfile,
  now: "2026-09-13T00:03:00.000Z"
});

assert.equal(withJob.pendingEvolutionArt, job.id);
assert.equal(withJob.visualEvolution.evolutionArtJobs.length, 1);

const accepted = acceptEvolutionArtResult(withJob, {
  jobId: job.id,
  imageDataUrl: "data:image/png;base64,evolved",
  providerResult: { provider: "local" },
  now: "2026-09-13T00:04:00.000Z"
});

assert.equal(accepted.pendingEvolutionArt, null);
assert.equal(accepted.visualEvolution.artRevision, 1);
assert.equal(accepted.visualEvolution.currentArtUrl, "data:image/png;base64,evolved");
assert.equal(validateProgressionState(accepted).ok, true);

console.log("progression smoke ok");
