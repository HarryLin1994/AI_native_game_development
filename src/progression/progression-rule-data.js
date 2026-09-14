export const PROGRESSION_SCHEMA_VERSION = 1;

export const MAX_CARD_LEVEL = 100;

export const PROGRESSION_SKILL_SLOTS = Object.freeze([
  "active0",
  "active1",
  "trait0",
  "trait1",
  "ultimate"
]);

export const DEFAULT_SKILL_RANKS = Object.freeze({
  active0: 1,
  active1: 1,
  trait0: 1,
  trait1: 1,
  ultimate: 1
});

export const DEFAULT_SELECTED_BRANCHES = Object.freeze({
  active0: null,
  active1: null,
  trait0: null,
  trait1: null,
  ultimate: null
});

export const PROGRESSION_LOCK_REASONS = Object.freeze({
  PENDING_BRANCH_CHOICE: "pending_branch_choice",
  PENDING_EVOLUTION_ART: "pending_evolution_art"
});

export const EVOLUTION_ART_JOB_STATUSES = Object.freeze({
  QUEUED: "queued",
  GENERATING: "generating",
  NEEDS_REVIEW: "needs_review",
  ACCEPTED: "accepted",
  FAILED: "failed",
  RETRYABLE: "retryable"
});

export const VISUAL_EVOLUTION_IMAGE_STATUSES = Object.freeze({
  BASE: "base",
  PENDING: "pending",
  GENERATING: "generating",
  NEEDS_REVIEW: "needs_review",
  ACCEPTED: "accepted",
  FAILED: "failed"
});

export const DEFAULT_XP_TO_NEXT = 100;

export const EVOLUTION_MILESTONES = Object.freeze([
  {
    key: "stage_one_evolution",
    level: 16,
    label: "一階進化",
    requiresBranchChoice: true,
    requiresEvolutionArt: true,
    branchSlots: Object.freeze(["active0"]),
    visualTier: 2
  },
  {
    key: "stage_two_evolution",
    level: 36,
    label: "二階進化",
    requiresBranchChoice: true,
    requiresEvolutionArt: true,
    branchSlots: Object.freeze(["active1"]),
    visualTier: 3
  },
  {
    key: "awakening",
    level: 70,
    label: "覺醒",
    requiresBranchChoice: true,
    requiresEvolutionArt: true,
    branchSlots: Object.freeze(["trait1", "ultimate"]),
    visualTier: 4
  },
  {
    key: "final_form",
    level: 100,
    label: "完成體",
    requiresBranchChoice: true,
    requiresEvolutionArt: true,
    branchSlots: Object.freeze(["ultimate"]),
    visualTier: 5
  }
]);

export function getEvolutionMilestonesReached(fromLevel, toLevel) {
  const start = Number(fromLevel) || 1;
  const end = Number(toLevel) || start;
  return EVOLUTION_MILESTONES.filter((milestone) => milestone.level > start && milestone.level <= end);
}

export function getEvolutionMilestoneByKey(key) {
  return EVOLUTION_MILESTONES.find((milestone) => milestone.key === key) ?? null;
}
