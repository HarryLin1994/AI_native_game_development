import {
  EVOLUTION_ART_JOB_STATUSES,
  VISUAL_EVOLUTION_IMAGE_STATUSES
} from "./progression-rule-data.js";
import {
  createProgressionTransaction,
  normalizeProgressionState
} from "./progression-state.js";

export function buildEvolutionPromptProfile({ battleCard = {}, progression = null, branchOptions = [] } = {}) {
  const normalizedProgression = normalizeProgressionState(progression ?? battleCard.progression, {
    cardId: battleCard.id,
    level: battleCard.level,
    xp: battleCard.xp,
    currentArtUrl: battleCard.aiPortraitDataUrl ?? battleCard.imageDataUrl ?? null
  });
  const visual = normalizedProgression.visualEvolution;
  const selectedBranchIds = Object.values(normalizedProgression.selectedBranches).filter(Boolean);
  const savedSelectedOptions = Object.values(normalizedProgression.selectedBranchDetails ?? {});
  const selectedOptions = [
    ...savedSelectedOptions,
    ...branchOptions.filter((option) => selectedBranchIds.includes(option.branchId))
  ];
  const branchHooks = uniqueStrings([
    ...selectedOptions.flatMap((option) => option.visualPromptHooks ?? []),
    ...visual.promptHooks
  ]);
  const skillHooks = uniqueStrings([
    ...(battleCard.skills ?? []).map((skill) => skill.name),
    ...(battleCard.skillKit?.activeSkills ?? []).map((skill) => skill.name),
    ...(battleCard.skillKit?.battleTraits ?? []).map((skill) => skill.name),
    battleCard.skillKit?.ultimateSkill?.name
  ]);

  return {
    profileVersion: "evolution-prompt-profile-v1",
    cardId: battleCard.id ?? normalizedProgression.cardId,
    characterName: battleCard.name ?? battleCard.characterSpec?.name ?? "",
    evolutionTier: visual.tier,
    artRevision: visual.artRevision + 1,
    branchHooks,
    skillHooks,
    selectedBranches: { ...normalizedProgression.selectedBranches },
    sourceRefs: battleCard.characterSpec?.sourceRefs ?? {},
    promptBase: battleCard.characterSpec?.visualPipeline?.prompt ?? "",
    promptProfile: battleCard.characterSpec?.promptProfile ?? {},
    characterFormBranch: battleCard.characterSpec?.characterFormBranch ?? "humanlike",
    visualLocks: [
      "preserve recognizable source-photo facial cues",
      "preserve character form branch",
      "keep plausible anatomy and stable proportions",
      "keep original character identity hooks readable"
    ],
    visualChanges: uniqueStrings([
      `evolution tier ${visual.tier}`,
      ...branchHooks,
      ...skillHooks.slice(0, 3)
    ]),
    avoid: [
      "new unrelated face",
      "extra limbs",
      "fake card text",
      "changed identity hooks",
      "unreadable UI text baked into the art"
    ]
  };
}

export function formatEvolutionPromptForImageModel(profile) {
  return [
    "ROLE/PURPOSE: evolved battle-card character art for a progression upgrade",
    `SUBJECT: ${profile.characterName || "generated card character"}`,
    `EVOLUTION TIER: ${profile.evolutionTier}, art revision ${profile.artRevision}`,
    `BRANCH HOOKS: ${profile.branchHooks.join(", ") || "selected skill branch evolution"}`,
    `SKILL HOOKS: ${profile.skillHooks.join(", ") || "existing character skill identity"}`,
    `LOCKS: ${profile.visualLocks.join("; ")}`,
    `VISUAL CHANGES: ${profile.visualChanges.join("; ")}`,
    `EXCLUDE: ${profile.avoid.join(", ")}`,
    profile.promptBase ? `BASE PROMPT CONTEXT: ${profile.promptBase}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function createEvolutionArtProviderRequest({ battleCard = {}, progression = null, provider = "gemini", branchOptions = [] } = {}) {
  const promptProfile = buildEvolutionPromptProfile({ battleCard, progression, branchOptions });
  const prompt = formatEvolutionPromptForImageModel(promptProfile);
  const sourceImageDataUrl =
    battleCard.imageDataUrl ??
    battleCard.aiPortraitDataUrl ??
    battleCard.sourceImageDataUrl ??
    battleCard.progression?.visualEvolution?.currentArtUrl ??
    "";

  return {
    provider: safeString(provider, "gemini"),
    imageDataUrl: sourceImageDataUrl,
    prompt,
    promptProfile,
    negativePrompt: [
      "new unrelated face",
      "extra limbs",
      "fake card text",
      "changed identity hooks",
      "unreadable UI text baked into the art"
    ].join(", ")
  };
}

export function createEvolutionArtJob({ progression, provider, promptProfile, now = null }) {
  const normalized = normalizeProgressionState(progression);
  const targetArtRevision = Number(promptProfile?.artRevision) || normalized.visualEvolution.artRevision + 1;
  const job = {
    id: `evo_art_${hashish(`${normalized.cardId}:${targetArtRevision}:${normalizeIso(now)}`)}`,
    status: EVOLUTION_ART_JOB_STATUSES.QUEUED,
    provider: safeString(provider, "gemini"),
    sourceArtRevision: normalized.visualEvolution.artRevision,
    targetArtRevision,
    evolutionTier: Number(promptProfile?.evolutionTier) || normalized.visualEvolution.tier,
    promptProfile,
    result: null,
    attempts: [],
    createdAt: normalizeIso(now),
    updatedAt: normalizeIso(now)
  };
  const visualEvolution = {
    ...normalized.visualEvolution,
    imageStatus: VISUAL_EVOLUTION_IMAGE_STATUSES.PENDING,
    evolutionArtJobs: [...normalized.visualEvolution.evolutionArtJobs, job]
  };

  return {
    job,
    progression: {
      ...normalized,
      visualEvolution,
      pendingEvolutionArt: job.id,
      progressionTransactions: [
        ...normalized.progressionTransactions,
        createProgressionTransaction({
          status: "pending",
          reason: "evolution_art_job_created",
          now,
          detail: { jobId: job.id, provider: job.provider, targetArtRevision }
        })
      ]
    }
  };
}

export function markEvolutionArtJobGenerating(progression, { jobId, attempt = null, now = null } = {}) {
  return updateEvolutionJob(progression, jobId, (job) => ({
    ...job,
    status: EVOLUTION_ART_JOB_STATUSES.GENERATING,
    attempts: attempt ? [...job.attempts, attempt] : job.attempts,
    updatedAt: normalizeIso(now)
  }), {
    imageStatus: VISUAL_EVOLUTION_IMAGE_STATUSES.GENERATING
  });
}

export function acceptEvolutionArtResult(progression, { jobId, imageDataUrl = "", assetUrl = "", providerResult = null, now = null } = {}) {
  const acceptedAt = normalizeIso(now);
  let acceptedJob = null;
  const updated = updateEvolutionJob(progression, jobId, (job) => {
    acceptedJob = {
      ...job,
      status: EVOLUTION_ART_JOB_STATUSES.ACCEPTED,
      result: {
        imageDataUrl,
        assetUrl,
        providerResult,
        acceptedAt
      },
      updatedAt: acceptedAt
    };
    return acceptedJob;
  }, {
    imageStatus: VISUAL_EVOLUTION_IMAGE_STATUSES.ACCEPTED
  });
  const artUrl = assetUrl || imageDataUrl || null;
  const visualEvolution = {
    ...updated.visualEvolution,
    artRevision: acceptedJob.targetArtRevision,
    currentArtUrl: artUrl,
    imageStatus: VISUAL_EVOLUTION_IMAGE_STATUSES.ACCEPTED
  };

  return {
    ...updated,
    visualEvolution,
    pendingEvolutionArt: null,
    completedEvolutionSteps: [
      ...updated.completedEvolutionSteps,
      {
        jobId,
        artRevision: acceptedJob.targetArtRevision,
        acceptedAt
      }
    ],
    visualHistory: [
      ...updated.visualHistory,
      {
        tier: acceptedJob.evolutionTier,
        artRevision: acceptedJob.targetArtRevision,
        artUrl,
        provider: acceptedJob.provider,
        acceptedAt
      }
    ],
    progressionTransactions: [
      ...updated.progressionTransactions,
      createProgressionTransaction({
        status: "complete",
        reason: "evolution_art_accepted",
        now,
        detail: { jobId, artRevision: acceptedJob.targetArtRevision }
      })
    ]
  };
}

export function failEvolutionArtJob(progression, { jobId, reason = "", retryable = true, now = null } = {}) {
  const failedAt = normalizeIso(now);
  const status = retryable ? EVOLUTION_ART_JOB_STATUSES.RETRYABLE : EVOLUTION_ART_JOB_STATUSES.FAILED;
  const updated = updateEvolutionJob(progression, jobId, (job) => ({
    ...job,
    status,
    result: {
      error: safeString(reason, "evolution art generation failed"),
      failedAt
    },
    updatedAt: failedAt
  }), {
    imageStatus: VISUAL_EVOLUTION_IMAGE_STATUSES.FAILED
  });
  return {
    ...updated,
    failedEvolutionSteps: [
      ...updated.failedEvolutionSteps,
      { jobId, reason: safeString(reason), failedAt, retryable }
    ]
  };
}

function updateEvolutionJob(progression, jobId, updater, visualPatch = {}) {
  const normalized = normalizeProgressionState(progression);
  const jobs = normalized.visualEvolution.evolutionArtJobs;
  const index = jobs.findIndex((job) => job.id === jobId);
  if (index < 0) throw new Error(`Evolution art job not found: ${jobId}`);
  const nextJobs = jobs.slice();
  nextJobs[index] = updater(jobs[index]);
  return {
    ...normalized,
    visualEvolution: {
      ...normalized.visualEvolution,
      ...visualPatch,
      evolutionArtJobs: nextJobs
    }
  };
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => safeString(value)).filter(Boolean))];
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
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
