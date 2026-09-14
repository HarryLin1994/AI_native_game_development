import {
  DEFAULT_SELECTED_BRANCHES,
  DEFAULT_SKILL_RANKS,
  DEFAULT_XP_TO_NEXT,
  EVOLUTION_ART_JOB_STATUSES,
  EVOLUTION_MILESTONES,
  MAX_CARD_LEVEL,
  PROGRESSION_LOCK_REASONS,
  PROGRESSION_SCHEMA_VERSION,
  PROGRESSION_SKILL_SLOTS,
  VISUAL_EVOLUTION_IMAGE_STATUSES
} from "./progression-rule-data.js";

export function createInitialProgressionState(options = {}) {
  const now = normalizeIso(options.now);
  const level = clampLevel(options.level);
  const xp = nonNegativeInt(options.xp, 0);
  const xpToNext = positiveInt(options.xpToNext, DEFAULT_XP_TO_NEXT);
  const currentArtUrl = options.currentArtUrl ?? null;

  return {
    schemaVersion: PROGRESSION_SCHEMA_VERSION,
    cardId: safeString(options.cardId),
    maxLevel: MAX_CARD_LEVEL,
    level,
    xp,
    xpToNext,
    skillRanks: { ...DEFAULT_SKILL_RANKS },
    selectedBranches: { ...DEFAULT_SELECTED_BRANCHES },
    selectedBranchDetails: {},
    visualEvolution: {
      tier: positiveInt(options.evolutionTier, 1),
      frameKey: safeString(options.frameKey, "base"),
      auraKey: safeString(options.auraKey, "none"),
      badgeKeys: normalizeStringList(options.badgeKeys),
      artRevision: nonNegativeInt(options.artRevision, 0),
      promptHooks: normalizeStringList(options.promptHooks),
      imageStatus: currentArtUrl
        ? VISUAL_EVOLUTION_IMAGE_STATUSES.ACCEPTED
        : VISUAL_EVOLUTION_IMAGE_STATUSES.BASE,
      currentArtUrl,
      evolutionArtJobs: []
    },
    pendingChoices: [],
    progressionLock: null,
    pendingEvolutionArt: null,
    pendingEvolutionMilestones: [],
    completedEvolutionMilestones: [],
    completedEvolutionSteps: [],
    failedEvolutionSteps: [],
    visualHistory: [
      {
        tier: positiveInt(options.evolutionTier, 1),
        artRevision: nonNegativeInt(options.artRevision, 0),
        artUrl: currentArtUrl,
        provider: options.provider ?? null,
        acceptedAt: currentArtUrl ? now : null
      }
    ],
    progressionTransactions: [
      createProgressionTransaction({
        id: "prog_tx_initial",
        status: "complete",
        reason: "initial_card_generation",
        now
      })
    ],
    battleRecord: {
      wins: nonNegativeInt(options.wins, 0),
      losses: nonNegativeInt(options.losses, 0),
      battles: nonNegativeInt(options.battles, 0)
    }
  };
}

export function normalizeProgressionState(input = {}, context = {}) {
  const fallback = createInitialProgressionState(context);
  const source = input && typeof input === "object" ? input : {};
  const visual = source.visualEvolution && typeof source.visualEvolution === "object" ? source.visualEvolution : {};
  const battleRecord = source.battleRecord && typeof source.battleRecord === "object" ? source.battleRecord : {};

  return {
    ...fallback,
    ...source,
    schemaVersion: PROGRESSION_SCHEMA_VERSION,
    cardId: safeString(context.cardId ?? source.cardId ?? fallback.cardId),
    maxLevel: MAX_CARD_LEVEL,
    level: clampLevel(context.level ?? source.level ?? fallback.level),
    xp: nonNegativeInt(context.xp ?? source.xp, fallback.xp),
    xpToNext: positiveInt(source.xpToNext, fallback.xpToNext),
    skillRanks: normalizeSlotMap(source.skillRanks, DEFAULT_SKILL_RANKS, positiveInt),
    selectedBranches: normalizeSlotMap(source.selectedBranches, DEFAULT_SELECTED_BRANCHES, nullableString),
    selectedBranchDetails: source.selectedBranchDetails && typeof source.selectedBranchDetails === "object"
      ? source.selectedBranchDetails
      : {},
    visualEvolution: {
      ...fallback.visualEvolution,
      ...visual,
      badgeKeys: normalizeStringList(visual.badgeKeys),
      promptHooks: normalizeStringList(visual.promptHooks),
      evolutionArtJobs: Array.isArray(visual.evolutionArtJobs) ? visual.evolutionArtJobs : [],
      currentArtUrl: visual.currentArtUrl ?? context.currentArtUrl ?? fallback.visualEvolution.currentArtUrl,
      imageStatus: safeString(visual.imageStatus, fallback.visualEvolution.imageStatus)
    },
    pendingChoices: Array.isArray(source.pendingChoices) ? source.pendingChoices : [],
    progressionLock: source.progressionLock ?? null,
    pendingEvolutionArt: source.pendingEvolutionArt ?? null,
    pendingEvolutionMilestones: Array.isArray(source.pendingEvolutionMilestones) ? source.pendingEvolutionMilestones : [],
    completedEvolutionMilestones: Array.isArray(source.completedEvolutionMilestones) ? source.completedEvolutionMilestones : [],
    completedEvolutionSteps: Array.isArray(source.completedEvolutionSteps) ? source.completedEvolutionSteps : [],
    failedEvolutionSteps: Array.isArray(source.failedEvolutionSteps) ? source.failedEvolutionSteps : [],
    visualHistory: Array.isArray(source.visualHistory) && source.visualHistory.length ? source.visualHistory : fallback.visualHistory,
    progressionTransactions: Array.isArray(source.progressionTransactions) && source.progressionTransactions.length
      ? source.progressionTransactions
      : fallback.progressionTransactions,
    battleRecord: {
      wins: nonNegativeInt(context.wins ?? battleRecord.wins, fallback.battleRecord.wins),
      losses: nonNegativeInt(context.losses ?? battleRecord.losses, fallback.battleRecord.losses),
      battles: nonNegativeInt(context.battles ?? battleRecord.battles, fallback.battleRecord.battles)
    }
  };
}

export function createPendingBranchChoice(progression, choice) {
  const normalized = normalizeProgressionState(progression);
  if (normalized.progressionLock && normalized.progressionLock.reason !== PROGRESSION_LOCK_REASONS.PENDING_BRANCH_CHOICE) {
    throw new Error(`Progression is locked by ${normalized.progressionLock.reason}.`);
  }

  const slot = normalizeSlot(choice?.slot);
  const options = normalizeBranchOptions(choice?.options);
  const choiceId = safeString(choice?.choiceId, `branch_${slot}_lv${normalized.level}`);
  const pendingChoice = {
    type: "skillBranch",
    slot,
    choiceId,
    required: true,
    options,
    createdAt: normalizeIso(choice?.now),
    reason: safeString(choice?.reason, "skill_branch_unlock")
  };

  const pendingChoices = normalized.pendingChoices.filter((item) => item.choiceId !== choiceId);
  pendingChoices.push(pendingChoice);

  return {
    ...normalized,
    pendingChoices,
    progressionLock: {
      reason: PROGRESSION_LOCK_REASONS.PENDING_BRANCH_CHOICE,
      choiceId
    },
    progressionTransactions: [
      ...normalized.progressionTransactions,
      createProgressionTransaction({
        status: "pending",
        reason: "pending_branch_choice",
        now: choice?.now,
        detail: { choiceId, slot }
      })
    ]
  };
}

export function chooseSkillBranch(progression, selection) {
  const normalized = normalizeProgressionState(progression);
  const choiceId = safeString(selection?.choiceId);
  const branchId = safeString(selection?.branchId);
  const choice = normalized.pendingChoices.find((item) => item.choiceId === choiceId);
  if (!choice) throw new Error(`Pending branch choice not found: ${choiceId}`);

  const selectedOption = choice.options.find((option) => option.branchId === branchId);
  if (!selectedOption) throw new Error(`Branch option not found: ${branchId}`);

  const pendingChoices = normalized.pendingChoices.filter((item) => item.choiceId !== choiceId);
  const selectedBranches = {
    ...normalized.selectedBranches,
    [choice.slot]: branchId
  };
  const selectedBranchDetails = {
    ...normalized.selectedBranchDetails,
    [choice.slot]: selectedOption
  };

  return {
    ...normalized,
    selectedBranches,
    selectedBranchDetails,
    pendingChoices,
    progressionLock: pendingChoices.some((item) => item.required)
      ? {
          reason: PROGRESSION_LOCK_REASONS.PENDING_BRANCH_CHOICE,
          choiceId: pendingChoices.find((item) => item.required)?.choiceId
        }
      : null,
    progressionTransactions: [
      ...normalized.progressionTransactions,
      createProgressionTransaction({
        status: "complete",
        reason: "skill_branch_chosen",
        now: selection?.now,
        detail: {
          choiceId,
          slot: choice.slot,
          branchId,
          label: selectedOption.label ?? null
        }
      })
    ]
  };
}

export function validateProgressionState(progression) {
  const errors = [];
  const source = progression && typeof progression === "object" ? progression : {};

  if (source.schemaVersion !== PROGRESSION_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${PROGRESSION_SCHEMA_VERSION}`);
  }
  if (source.maxLevel !== MAX_CARD_LEVEL) {
    errors.push(`maxLevel must be ${MAX_CARD_LEVEL}`);
  }
  if (!Number.isInteger(source.level) || source.level < 1 || source.level > MAX_CARD_LEVEL) {
    errors.push(`level must be between 1 and ${MAX_CARD_LEVEL}`);
  }

  for (const slot of PROGRESSION_SKILL_SLOTS) {
    if (!Number.isInteger(source.skillRanks?.[slot]) || source.skillRanks[slot] < 1) {
      errors.push(`skillRanks.${slot} must be a positive integer`);
    }
    if (!Object.prototype.hasOwnProperty.call(source.selectedBranches ?? {}, slot)) {
      errors.push(`selectedBranches.${slot} is required`);
    }
  }

  if (source.progressionLock?.reason === PROGRESSION_LOCK_REASONS.PENDING_BRANCH_CHOICE) {
    const choiceId = source.progressionLock.choiceId;
    if (!source.pendingChoices?.some((choice) => choice.choiceId === choiceId && choice.required)) {
      errors.push("pending_branch_choice lock must reference a required pending choice");
    }
  }

  for (const choice of source.pendingChoices ?? []) {
    if (choice.type === "skillBranch") {
      try {
        normalizeSlot(choice.slot);
        normalizeBranchOptions(choice.options);
      } catch (error) {
        errors.push(`invalid branch choice ${choice.choiceId ?? "(missing id)"}: ${error.message}`);
      }
    }
  }

  for (const job of source.visualEvolution?.evolutionArtJobs ?? []) {
    if (!Object.values(EVOLUTION_ART_JOB_STATUSES).includes(job.status)) {
      errors.push(`invalid evolution art job status: ${job.status}`);
    }
  }
  for (const milestone of source.pendingEvolutionMilestones ?? []) {
    if (!EVOLUTION_MILESTONES.some((item) => item.key === milestone.key)) {
      errors.push(`unknown pending evolution milestone: ${milestone.key}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function createProgressionTransaction({ id = "", status = "complete", reason = "", now = null, detail = null } = {}) {
  return {
    id: safeString(id, `prog_tx_${hashish(`${reason}:${normalizeIso(now)}:${JSON.stringify(detail ?? {})}`)}`),
    status: safeString(status, "complete"),
    reason: safeString(reason, "unspecified"),
    createdAt: normalizeIso(now),
    detail
  };
}

function normalizeSlot(slot) {
  const value = safeString(slot);
  if (!PROGRESSION_SKILL_SLOTS.includes(value)) {
    throw new Error(`Invalid progression slot: ${value}`);
  }
  return value;
}

function normalizeBranchOptions(options) {
  if (!Array.isArray(options) || !options.length) {
    throw new Error("Branch choices require at least one option.");
  }
  return options.map((option) => {
    const branchId = safeString(option?.branchId);
    if (!branchId) throw new Error("Branch option branchId is required.");
    return {
      source: safeString(option?.source),
      sourceLabel: safeString(option?.sourceLabel),
      sourceHook: option?.sourceHook && typeof option.sourceHook === "object" ? option.sourceHook : null,
      milestoneKey: option?.milestoneKey ?? null,
      slot: option?.slot ? safeString(option.slot) : undefined,
      branchId,
      label: safeString(option?.label, branchId),
      shortText: safeString(option?.shortText),
      identityHooks: Array.isArray(option?.identityHooks) ? option.identityHooks : [],
      effectPreview: Array.isArray(option?.effectPreview) ? option.effectPreview : [],
      statBiasPreview: option?.statBiasPreview && typeof option.statBiasPreview === "object" ? option.statBiasPreview : {},
      visualPromptHooks: normalizeStringList(option?.visualPromptHooks),
      tradeoffPreview: safeString(option?.tradeoffPreview)
    };
  });
}

function normalizeSlotMap(input, fallback, normalizer) {
  const source = input && typeof input === "object" ? input : {};
  return Object.fromEntries(
    PROGRESSION_SKILL_SLOTS.map((slot) => [slot, normalizer(source[slot], fallback[slot])])
  );
}

function normalizeStringList(input) {
  if (!Array.isArray(input)) return [];
  return input.map((item) => safeString(item)).filter(Boolean);
}

function nullableString(value) {
  const normalized = safeString(value);
  return normalized || null;
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function positiveInt(value, fallback = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.floor(numeric));
}

function nonNegativeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.floor(numeric));
}

function clampLevel(value) {
  const numeric = positiveInt(value, 1);
  return Math.min(MAX_CARD_LEVEL, numeric);
}

function normalizeIso(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function hashish(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
