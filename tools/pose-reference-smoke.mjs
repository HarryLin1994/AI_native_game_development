import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  POSE_ASSET_STATUS,
  POSE_BODY_PROFILES,
  POSE_OCCUPATION_GROUPS,
  POSE_REFERENCE_LIBRARY,
  SOURCE_POSE_ASSET_REFERENCES,
  formatSelectedPoseReferenceForImageModel,
  selectPoseReference
} from "../src/card-generation/pose-reference.js";
import {
  buildCharacterSpecContexts,
  formatPromptHooksForImageModel
} from "../src/card-generation/character-spec.js";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname);
const bodyProfileKeys = new Set(POSE_BODY_PROFILES.map((profile) => profile.key));
const occupationGroupKeys = new Set(POSE_OCCUPATION_GROUPS.map((group) => group.key));

assert.ok(POSE_REFERENCE_LIBRARY.length >= POSE_BODY_PROFILES.length * POSE_OCCUPATION_GROUPS.length * 8);

for (const pose of POSE_REFERENCE_LIBRARY) {
  assert.equal(pose.assetStatus, POSE_ASSET_STATUS.textOnlyPendingNeutralAsset);
  assert.equal(pose.assetPath, null);
  assert.equal(bodyProfileKeys.has(pose.bodyProfile), true, `unknown body profile: ${pose.bodyProfile}`);
  assert.equal(occupationGroupKeys.has(pose.occupationGroup), true, `unknown occupation group: ${pose.occupationGroup}`);
}

for (const bodyProfile of POSE_BODY_PROFILES) {
  for (const occupationGroup of POSE_OCCUPATION_GROUPS) {
    const candidates = POSE_REFERENCE_LIBRARY.filter((pose) => pose.bodyProfile === bodyProfile.key && pose.occupationGroup === occupationGroup.key);
    const stages = new Set(candidates.map((pose) => pose.poseStage));
    assert.ok(candidates.length >= 8, `${bodyProfile.key}/${occupationGroup.key} needs at least 8 pose candidates`);
    assert.ok(candidates.length <= 10, `${bodyProfile.key}/${occupationGroup.key} should stay reviewable for now`);
    assert.equal(stages.has("base"), true, `${bodyProfile.key}/${occupationGroup.key} missing base stage`);
    assert.equal(stages.has("evolved"), true, `${bodyProfile.key}/${occupationGroup.key} missing evolved stage`);
    assert.equal(stages.has("advanced"), true, `${bodyProfile.key}/${occupationGroup.key} missing advanced stage`);
    assert.equal(stages.has("awakened"), true, `${bodyProfile.key}/${occupationGroup.key} missing awakened stage`);
    assert.equal(stages.has("final"), true, `${bodyProfile.key}/${occupationGroup.key} missing final stage`);
  }
}

for (const sourcePose of SOURCE_POSE_ASSET_REFERENCES) {
  assert.equal(sourcePose.assetStatus, POSE_ASSET_STATUS.sourceRequiresNeutralization);
  assert.equal(sourcePose.sourceUse, "do_not_send_as_image_input");
  const relativeGodotPath = sourcePose.assetPath.replace(/^res:\/\//u, "");
  assert.equal(
    fs.existsSync(path.join(projectRoot, "godot", relativeGodotPath)),
    true,
    `missing local source pose asset: ${sourcePose.assetPath}`
  );
}

const speedAnalysis = {
  hash: "pose-speed",
  metrics: { centerFocus: 0.74 },
  visibleSemanticTags: ["arcade", "controller", "motion blur", "competitive game"],
  visibleSemanticTagGroups: {
    activity: ["competitive game", "running motion"],
    object: ["controller"],
    composition: ["centered pose"],
    lighting: ["neon light"]
  }
};

const speedPose = selectPoseReference({
  analysis: speedAnalysis,
  generationProfile: {
    occupation: "運動教練",
    combatStyle: "duelist",
    cardMood: "neon",
    characterFormBranch: "humanlike",
    signatureItem: "controller"
  },
  cardStats: { power: 44, speed: 86, guard: 32, focus: 48, luck: 37 }
});

assert.equal(speedPose.selectionMode, "deterministic_body_profile_profession_progression_scorer");
assert.equal(speedPose.bodyProfile, "neutral_human");
assert.equal(speedPose.occupationGroup, "athlete");
assert.equal(speedPose.poseStage, "base");
assert.ok(speedPose.candidateCountForOccupation >= 8);
assert.equal(speedPose.poseIntent.sourcePolicy.doesNotChangeBattleStats, true);
assert.equal(speedPose.poseIntent.sourcePolicy.noGenderInferenceFromPhoto, true);
assert.equal(speedPose.imageInputPolicy, "do_not_send_original_pose_image_to_image_model");
assert.equal(speedPose.anatomyPolicy, "do_not_copy_chest_waist_hips_or_sex_coded_body_proportions");
assert.equal(speedPose.topCandidates[0].poseFamily, "speed_lunge");

const guardPose = selectPoseReference({
  analysis: {
    hash: "pose-guard",
    metrics: { centerFocus: 0.82 },
    visibleSemanticTags: ["standing", "crossed arms", "stable", "centered portrait"],
    visibleSemanticTagGroups: {
      personAppearance: ["crossed arms"],
      composition: ["centered pose"]
    }
  },
  generationProfile: {
    occupation: "消防救援",
    combatStyle: "guardian",
    cardMood: "quiet",
    characterFormBranch: "humanlike"
  },
  cardStats: { power: 34, speed: 30, guard: 90, focus: 48, luck: 20 }
});

assert.equal(guardPose.occupationGroup, "frontline");
assert.equal(guardPose.topCandidates[0].poseFamily, "guard_ready");

const catPose = selectPoseReference({
  analysis: {
    hash: "pose-cat",
    metrics: { centerFocus: 0.6 },
    visibleSemanticTags: ["playful", "cat", "toy", "smile"],
    visibleSemanticTagGroups: {
      state: ["playful"],
      object: ["toy"]
    }
  },
  generationProfile: {
    combatStyle: "auto",
    cardMood: "playful",
    characterFormBranch: "animalized.cat"
  },
  cardStats: { power: 30, speed: 44, guard: 30, focus: 42, luck: 82 }
});

assert.equal(catPose.bodyProfile, "mascot_nonhuman");
assert.equal(catPose.bodyProfilePolicy, "character_form_branch");
assert.equal(catPose.topCandidates[0].poseFamily, "playful_tilt");

const evolvedPose = selectPoseReference({
  analysis: {
    hash: "pose-evolved",
    metrics: { centerFocus: 0.7 },
    visibleSemanticTags: ["laptop", "focused", "centered"]
  },
  generationProfile: {
    occupation: "工程師",
    combatStyle: "controller",
    characterFormBranch: "humanlike",
    evolutionTier: 4
  },
  cardStats: { power: 40, speed: 45, guard: 50, focus: 88, luck: 38 }
});

assert.equal(evolvedPose.occupationGroup, "tech_research");
assert.equal(evolvedPose.poseStage, "awakened");
assert.match(evolvedPose.upgradeCue, /awakening/u);

const poseBlock = formatSelectedPoseReferenceForImageModel(speedPose);
assert.match(poseBlock, /POSE REFERENCE/u);
assert.match(poseBlock, /body\/action silhouette/u);
assert.match(poseBlock, /Body profile/u);
assert.match(poseBlock, /Do not copy pixel-art style/u);
assert.match(poseBlock, /Do not copy chest, waist, hip, shoulder/u);
assert.match(poseBlock, /Do not infer or change gender/u);

const contexts = buildCharacterSpecContexts({
  analysis: speedAnalysis,
  generationProfile: {
    characterName: "昶志",
    occupation: "運動教練",
    combatStyle: "duelist",
    cardMood: "neon",
    characterFormBranch: "humanlike",
    signatureItem: "controller"
  },
  cardStats: { power: 44, speed: 86, guard: 32, focus: 48, luck: 37 },
  captureMoment: { localDate: "2026-09-13", timezone: "America/Los_Angeles" }
});

assert.equal(contexts.promptProfile.selectedPoseReference.occupationGroup, "athlete");
assert.equal(contexts.contexts.vision.poseIntent.combatStyle, "duelist");

const promptHooks = formatPromptHooksForImageModel(contexts.promptProfile);
assert.match(promptHooks, /POSE REFERENCE/u);
assert.match(promptHooks, new RegExp(contexts.promptProfile.selectedPoseReference.poseId, "u"));

console.log("pose reference smoke ok");
