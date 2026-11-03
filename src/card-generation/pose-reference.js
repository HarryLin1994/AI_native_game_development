export const POSE_REFERENCE_VERSION = "pose-reference-v2-body-profession-progression";

export const POSE_ASSET_STATUS = Object.freeze({
  textOnlyPendingNeutralAsset: "text_only_candidate_pending_neutral_asset",
  sourceRequiresNeutralization: "source_asset_requires_anatomy_neutralization"
});

export const POSE_BODY_PROFILES = Object.freeze([
  Object.freeze({
    key: "neutral_human",
    label: "Neutral Human",
    sourcePolicy: "character_setting_default",
    promptCue: "gender-neutral human mannequin proportions; no chest, waist, hip, or shoulder body-shape signal",
    compatibleBranches: Object.freeze(["humanlike"]),
    anatomyLock: "preserve source-photo broad body proportion only; do not add sex-coded anatomy"
  }),
  Object.freeze({
    key: "masculine_human",
    label: "Masculine Human",
    sourcePolicy: "explicit_character_setting_only",
    promptCue: "masculine-coded heroic body profile only when explicitly present in character settings",
    compatibleBranches: Object.freeze(["humanlike"]),
    anatomyLock: "do not infer this from the source photo; use only if character settings explicitly request it"
  }),
  Object.freeze({
    key: "feminine_human",
    label: "Feminine Human",
    sourcePolicy: "explicit_character_setting_only",
    promptCue: "feminine-coded heroic body profile only when explicitly present in character settings",
    compatibleBranches: Object.freeze(["humanlike"]),
    anatomyLock: "do not infer this from the source photo; use only if character settings explicitly request it"
  }),
  Object.freeze({
    key: "mascot_nonhuman",
    label: "Mascot / Nonhuman",
    sourcePolicy: "character_form_branch",
    promptCue: "nonhuman mascot body profile; readable creature silhouette; no human chest or hip anatomy",
    compatibleBranches: Object.freeze(["animalized.cat", "nonhuman", "mascot"]),
    anatomyLock: "use creature or mascot structure, not human sex-coded anatomy"
  })
]);

export const SOURCE_POSE_ASSET_REFERENCES = Object.freeze([
  sourceAsset("raziel_source_power_charge_front_01", "res://art/source/pose-catalog/power_charge_front_01.png"),
  sourceAsset("raziel_source_speed_lunge_diagonal_01", "res://art/source/pose-catalog/speed_lunge_diagonal_01.png"),
  sourceAsset("raziel_source_guard_ready_front_01", "res://art/source/pose-catalog/guard_ready_front_01.png"),
  sourceAsset("raziel_source_caster_focus_three_quarter_01", "res://art/source/pose-catalog/caster_focus_three_quarter_01.png"),
  sourceAsset("raziel_source_playful_tilt_mascot_01", "res://art/source/pose-catalog/playful_tilt_mascot_01.png"),
  sourceAsset("raziel_source_neutral_hero_center_01", "res://art/source/pose-catalog/neutral_hero_center_01.png")
]);

export const POSE_OCCUPATION_GROUPS = Object.freeze([
  occupationGroup("tech_research", "Tech / Research", ["工程", "程式", "developer", "engineer", "研究", "科學", "資料", "analysis", "tech"]),
  occupationGroup("medical_support", "Medical / Support", ["醫", "護理", "治療", "藥", "心理", "support", "heal", "care"]),
  occupationGroup("education", "Education", ["學生", "老師", "教授", "教育", "study", "school", "teacher"]),
  occupationGroup("creative", "Creative", ["設計", "藝術", "音樂", "創作", "攝影", "creator", "artist", "music"]),
  occupationGroup("athlete", "Athlete / Performer", ["運動", "健身", "球", "舞", "武術", "sport", "dance", "martial", "runner"]),
  occupationGroup("frontline", "Frontline", ["警", "軍", "消防", "保全", "救援", "rescue", "security", "soldier"]),
  occupationGroup("commander", "Commander", ["老闆", "管理", "經理", "pm", "企劃", "創業", "leader", "manager"]),
  occupationGroup("general", "General Hero", [])
]);

export const POSE_VARIANTS_BY_OCCUPATION = Object.freeze({
  tech_research: Object.freeze([
    poseVariant("terminal_focus", "caster_focus", "base", "focused console stance, one hand near an interface, calm analytical silhouette", ["focused", "laptop", "desk", "work", "study", "phone"], ["controller", "caster"], ["focus"]),
    poseVariant("data_scan", "caster_focus", "base", "scanning gesture, one hand extended as if reading data in the air", ["phone", "book", "hands", "tech", "screen"], ["controller"], ["focus"]),
    poseVariant("debug_guard", "guard_ready", "base", "defensive analyst stance, protected torso, device held close", ["standing", "stable", "centered", "device"], ["guardian", "support"], ["guard", "focus"]),
    poseVariant("circuit_dash", "speed_lunge", "evolved", "quick sidestep between holographic panels, agile technical rhythm", ["motion", "arcade", "controller", "walking"], ["duelist", "controller"], ["speed", "focus"]),
    poseVariant("overclock_charge", "power_charge", "evolved", "overclock power-up stance, clenched energy around the hands", ["intense", "performance", "power"], ["striker", "controller"], ["power", "focus"]),
    poseVariant("command_matrix", "commander_order", "advanced", "commanding matrix pose, one arm directing multiple tactical lines", ["centered", "hands", "work"], ["controller"], ["focus"]),
    poseVariant("data_burst", "ultimate_release", "awakened", "data-burst release pose, arms opening as code-like energy erupts", ["chaotic", "neon", "hands"], ["controller", "striker"], ["focus", "power"]),
    poseVariant("system_finale", "ultimate_release", "final", "final-system execution pose, calm center with explosive digital aura", ["centered", "intense", "tech"], ["controller"], ["focus", "luck"])
  ]),
  medical_support: Object.freeze([
    poseVariant("care_ready", "guard_ready", "base", "protective healer-ready stance, hands close to the core", ["stable", "standing", "focused"], ["support", "guardian"], ["guard", "focus"]),
    poseVariant("triage_focus", "caster_focus", "base", "triage focus pose, one hand measuring energy and one hand steady", ["hands", "focused", "holding"], ["support", "caster"], ["focus"]),
    poseVariant("warding_step", "speed_lunge", "base", "quick support step, moving into position to protect an ally", ["walking", "motion", "centered"], ["support", "duelist"], ["speed", "guard"]),
    poseVariant("recovery_cast", "caster_focus", "evolved", "recovery casting pose, circular restorative energy around open hands", ["hands", "quiet", "focused"], ["support"], ["focus", "luck"]),
    poseVariant("protective_wall", "guard_ready", "evolved", "medical barrier stance, body angled between danger and ally", ["guard", "stable", "standing"], ["guardian", "support"], ["guard"]),
    poseVariant("pulse_sprint", "speed_lunge", "advanced", "urgent rescue sprint pose, forward momentum with controlled hands", ["running", "motion", "intense"], ["support", "duelist"], ["speed"]),
    poseVariant("revival_burst", "ultimate_release", "awakened", "revival burst pose, hands lifting healing light upward", ["hands", "power", "focused"], ["support"], ["focus", "luck"]),
    poseVariant("sanctuary_finale", "ultimate_release", "final", "final sanctuary pose, calm central healer with wide protective aura", ["centered", "quiet", "guard"], ["support", "guardian"], ["guard", "focus"])
  ]),
  education: Object.freeze([
    poseVariant("study_ready", "neutral_hero", "base", "student-hero stance, readable face and torso, learning posture", ["study", "book", "centered"], ["caster", "auto"], ["focus"]),
    poseVariant("chalk_point", "commander_order", "base", "teaching point pose, one hand indicating a target or lesson", ["hands", "book", "standing"], ["controller", "caster"], ["focus"]),
    poseVariant("book_guard", "guard_ready", "base", "book-guard stance, knowledge held close like a shield", ["book", "holding", "stable"], ["guardian", "caster"], ["guard", "focus"]),
    poseVariant("lesson_cast", "caster_focus", "evolved", "lesson-casting pose, pages or symbols orbiting the hands", ["book", "hands", "focused"], ["caster"], ["focus"]),
    poseVariant("exam_dash", "speed_lunge", "evolved", "fast answer dash, energetic step forward with sharp focus", ["motion", "walking", "competitive"], ["duelist", "caster"], ["speed", "focus"]),
    poseVariant("archive_command", "commander_order", "advanced", "archive command pose, directing knowledge shards around the body", ["hands", "centered", "study"], ["controller"], ["focus"]),
    poseVariant("wisdom_burst", "ultimate_release", "awakened", "wisdom burst pose, arms opening into bright glyph-like energy", ["hands", "power", "focused"], ["caster"], ["focus", "power"]),
    poseVariant("mastery_finale", "ultimate_release", "final", "final mastery pose, composed scholar silhouette with radiant aura", ["centered", "quiet", "focused"], ["caster", "controller"], ["focus"])
  ]),
  creative: Object.freeze([
    poseVariant("sketch_ready", "neutral_hero", "base", "creative-ready stance, one hand framing the subject or holding a tool", ["art", "camera", "holding", "hands"], ["trickster", "caster"], ["luck", "focus"]),
    poseVariant("rhythm_tilt", "playful_tilt", "base", "playful rhythm pose, tilted body line and expressive hand gesture", ["playful", "dance", "music", "smile"], ["trickster", "duelist"], ["luck", "speed"]),
    poseVariant("composition_guard", "guard_ready", "base", "composed artist stance, tool guarded near the chest without copying body anatomy", ["holding", "stable", "focused"], ["support", "controller"], ["guard", "focus"]),
    poseVariant("stage_step", "speed_lunge", "evolved", "stage-step action pose, diagonal movement with performance energy", ["dance", "performance", "motion"], ["duelist", "trickster"], ["speed", "luck"]),
    poseVariant("inspiration_cast", "caster_focus", "evolved", "inspiration casting pose, one hand shaping visual energy", ["hands", "art", "music"], ["caster", "trickster"], ["focus", "luck"]),
    poseVariant("spotlight_command", "commander_order", "advanced", "spotlight command pose, directing color and rhythm outward", ["performance", "centered", "hands"], ["controller", "trickster"], ["luck", "focus"]),
    poseVariant("creation_burst", "ultimate_release", "awakened", "creation burst pose, art-energy exploding from both hands", ["chaotic", "power", "hands"], ["trickster", "striker"], ["luck", "power"]),
    poseVariant("masterpiece_finale", "ultimate_release", "final", "final masterpiece pose, confident creator silhouette with full aura", ["centered", "performance", "art"], ["trickster"], ["luck", "focus"])
  ]),
  athlete: Object.freeze([
    poseVariant("warmup_ready", "neutral_hero", "base", "athletic ready stance, knees and shoulders prepared for motion", ["sport", "standing", "centered"], ["duelist", "striker"], ["speed", "power"]),
    poseVariant("guarded_athlete", "guard_ready", "base", "guarded athlete pose, compact defensive stance", ["guard", "sport", "stable"], ["guardian", "duelist"], ["guard", "speed"]),
    poseVariant("quick_feint", "speed_lunge", "base", "quick feint step, diagonal body rhythm, ready to burst forward", ["motion", "dance", "running", "sport"], ["duelist"], ["speed"]),
    poseVariant("sprint_start", "speed_lunge", "evolved", "sprint-start pose, strong forward lean and explosive first step", ["running", "motion", "competition"], ["duelist", "striker"], ["speed"]),
    poseVariant("impact_charge", "power_charge", "evolved", "impact charge pose, grounded stance before a heavy strike", ["intense", "sport", "power"], ["striker"], ["power"]),
    poseVariant("combo_drive", "speed_lunge", "advanced", "combo-drive pose, mid-action rhythm with multiple attack lines", ["motion", "competitive", "arcade"], ["duelist"], ["speed", "power"]),
    poseVariant("arena_burst", "ultimate_release", "awakened", "arena burst pose, athletic silhouette framed by explosive energy", ["performance", "intense", "power"], ["striker", "duelist"], ["power", "speed"]),
    poseVariant("champion_finale", "ultimate_release", "final", "champion final pose, decisive victory stance with maximum aura", ["celebrating", "competition", "centered"], ["striker"], ["power", "luck"])
  ]),
  frontline: Object.freeze([
    poseVariant("patrol_ready", "guard_ready", "base", "frontline patrol stance, stable and alert", ["standing", "stable", "uniform"], ["guardian"], ["guard"]),
    poseVariant("signal_point", "commander_order", "base", "frontline signal pose, one hand directing attention safely", ["hands", "centered", "uniform"], ["guardian", "controller"], ["focus", "guard"]),
    poseVariant("shield_step", "guard_ready", "base", "shield-step pose, body guarding the center line", ["guard", "stable", "jacket"], ["guardian"], ["guard"]),
    poseVariant("intercept_dash", "speed_lunge", "evolved", "intercept dash, quick movement into danger control", ["running", "motion", "intense"], ["guardian", "duelist"], ["speed", "guard"]),
    poseVariant("suppression_charge", "power_charge", "evolved", "suppression charge pose, grounded power before action", ["power", "intense", "sport"], ["striker", "guardian"], ["power", "guard"]),
    poseVariant("rescue_command", "commander_order", "advanced", "rescue command pose, clear tactical direction and protective posture", ["hands", "stable", "focused"], ["controller", "guardian"], ["focus", "guard"]),
    poseVariant("fortress_burst", "ultimate_release", "awakened", "fortress burst pose, defensive aura expanding outward", ["guard", "power", "centered"], ["guardian"], ["guard", "power"]),
    poseVariant("sentinel_finale", "ultimate_release", "final", "sentinel final pose, unbreakable stance with full protective field", ["stable", "centered", "guard"], ["guardian"], ["guard"])
  ]),
  commander: Object.freeze([
    poseVariant("planner_ready", "neutral_hero", "base", "planner-ready stance, centered leadership presence", ["centered", "work", "focused"], ["controller", "auto"], ["focus"]),
    poseVariant("directive_point", "commander_order", "base", "directive pose, one hand giving a clear order", ["hands", "standing", "centered"], ["controller"], ["focus"]),
    poseVariant("calm_guard", "guard_ready", "base", "calm guard pose, measured leadership under pressure", ["stable", "quiet", "jacket"], ["guardian", "controller"], ["guard", "focus"]),
    poseVariant("tactical_step", "speed_lunge", "evolved", "tactical step forward, leader entering the fight", ["walking", "motion", "focused"], ["controller", "duelist"], ["speed", "focus"]),
    poseVariant("rally_charge", "power_charge", "evolved", "rally charge pose, clenched command energy", ["performance", "power", "centered"], ["controller", "striker"], ["power", "focus"]),
    poseVariant("formation_order", "commander_order", "advanced", "formation order pose, arms directing team battle lines", ["hands", "centered", "work"], ["controller"], ["focus", "guard"]),
    poseVariant("command_burst", "ultimate_release", "awakened", "command burst pose, battlefield directives radiating outward", ["chaotic", "hands", "power"], ["controller"], ["focus", "power"]),
    poseVariant("sovereign_finale", "ultimate_release", "final", "sovereign final pose, commanding stillness inside a full aura", ["centered", "quiet", "power"], ["controller"], ["focus", "guard"])
  ]),
  general: Object.freeze([
    poseVariant("balanced_ready", "neutral_hero", "base", "balanced hero stance, clear face-and-torso read", ["centered", "portrait", "standing"], ["auto", "balanced"], []),
    poseVariant("playful_mascot_ready", "playful_tilt", "base", "playful mascot-ready pose, tilted action line with expressive charm", ["playful", "cat", "toy", "smile", "casual"], ["auto", "trickster"], ["luck"]),
    poseVariant("soft_guard", "guard_ready", "base", "soft guard stance, readable protected silhouette", ["standing", "stable", "guard"], ["guardian", "support"], ["guard"]),
    poseVariant("curious_focus", "caster_focus", "base", "curious focus pose, controlled hand gesture and calm expression", ["hands", "focused", "holding"], ["caster", "controller"], ["focus"]),
    poseVariant("brave_step", "speed_lunge", "evolved", "brave step forward, light action rhythm without overcommitting", ["walking", "motion", "centered"], ["duelist", "auto"], ["speed"]),
    poseVariant("spark_charge", "power_charge", "evolved", "small spark charge, grounded and ready for battle", ["power", "intense", "performance"], ["striker", "auto"], ["power"]),
    poseVariant("heroic_order", "commander_order", "advanced", "heroic order pose, one hand guiding the scene", ["hands", "centered"], ["controller", "auto"], ["focus"]),
    poseVariant("aura_burst", "ultimate_release", "awakened", "aura burst pose, arms opening into bright battle energy", ["hands", "power", "chaotic"], ["striker", "caster"], ["power", "focus"]),
    poseVariant("legend_finale", "ultimate_release", "final", "legend final pose, centered hero silhouette with maximum aura", ["centered", "performance", "power"], ["auto"], ["luck", "power"])
  ])
});

const COMBAT_STYLE_ALIASES = Object.freeze({
  auto: "auto",
  brawler: "striker",
  striker: "striker",
  attack: "striker",
  burst: "striker",
  duelist: "duelist",
  tempo: "duelist",
  guardian: "guardian",
  guard: "guardian",
  tank: "guardian",
  strategist: "controller",
  controller: "controller",
  caster: "caster",
  healer: "support",
  support: "support",
  trickster: "trickster",
  luck: "trickster"
});

const EVOLUTION_STAGE_BY_TIER = Object.freeze({
  0: "base",
  1: "base",
  2: "evolved",
  3: "advanced",
  4: "awakened",
  5: "final"
});

export const POSE_REFERENCE_LIBRARY = Object.freeze(buildPoseReferenceLibrary());

export function selectPoseReference({ analysis = null, generationProfile = {}, cardStats = {}, contexts = {} } = {}) {
  const poseIntent = buildPoseIntent({ analysis, generationProfile, cardStats, contexts });
  const scored = POSE_REFERENCE_LIBRARY
    .map((pose) => scorePoseReference(pose, poseIntent))
    .filter((entry) => entry.score > -20)
    .sort((a, b) => b.score - a.score || a.pose.poseId.localeCompare(b.pose.poseId));
  const bestScore = scored[0]?.score ?? 0;
  const closeCandidates = scored.filter((entry) => entry.score >= bestScore - 2).slice(0, 6);
  const stageMatchedCloseCandidates = closeCandidates.filter((entry) => entry.pose.poseStage === poseIntent.poseStage);
  const selectionPool = stageMatchedCloseCandidates.length ? stageMatchedCloseCandidates : closeCandidates.length ? closeCandidates : scored.slice(0, 1);
  const selectedIndex = deterministicIndex(poseIntent.selectionSeed, selectionPool.length);
  const best = selectionPool[selectedIndex] ?? scored[0] ?? scorePoseReference(POSE_REFERENCE_LIBRARY[0], poseIntent);
  const topCandidates = scored.slice(0, 10).map(formatCandidateSummary);

  return {
    version: POSE_REFERENCE_VERSION,
    selectionMode: "deterministic_body_profile_profession_progression_scorer",
    poseIntent,
    poseId: best.pose.poseId,
    poseFamily: best.pose.poseFamily,
    poseVariant: best.pose.poseVariant,
    poseStage: best.pose.poseStage,
    bodyProfile: best.pose.bodyProfile,
    bodyProfileLabel: getBodyProfile(best.pose.bodyProfile)?.label ?? best.pose.bodyProfile,
    occupationGroup: best.pose.occupationGroup,
    occupationGroupLabel: getOccupationGroup(best.pose.occupationGroup)?.label ?? best.pose.occupationGroup,
    label: best.pose.label,
    promptCue: best.pose.promptCue,
    upgradeCue: best.pose.upgradeCue,
    assetPath: best.pose.assetPath,
    assetStatus: best.pose.assetStatus,
    usePolicy: "text_pose_only_until_neutral_pose_assets_exist",
    imageInputPolicy: "do_not_send_original_pose_image_to_image_model",
    bodyProfilePolicy: poseIntent.bodyProfilePolicy,
    anatomyPolicy: "do_not_copy_chest_waist_hips_or_sex_coded_body_proportions",
    candidateCountForOccupation: countCandidatesFor(poseIntent),
    topCandidates,
    poseProgressionPlan: buildPoseProgressionPlan(best.pose, poseIntent),
    promptUse: [
      "use the selected pose only for body/action silhouette and camera rhythm",
      "choose body profile only from character settings, never from source-photo gender inference",
      "preserve approved source-photo visible cues and Character Spec hooks",
      "do not copy pixel-art style, low resolution, sprite outlines, or baked pose-reference colors",
      "do not copy chest, waist, hip, shoulder, or other sex-coded anatomy from the pose reference"
    ],
    score: best.score,
    scoreBreakdown: best.breakdown
  };
}

export function buildPoseIntent({ analysis = null, generationProfile = {}, cardStats = {}, contexts = {} } = {}) {
  const groups = analysis?.visibleSemanticTagGroups ?? contexts.vision?.visibleSemanticTagGroups ?? {};
  const occupationText = generationProfile.occupation || contexts.questionnaire?.realWorldRole || "";
  const visibleTags = uniqueStrings([
    ...normalizeStringList(analysis?.visibleSemanticTags),
    ...Object.values(groups).flatMap(normalizeStringList),
    ...normalizeStringList(contexts.vision?.visibleSemanticTags),
    ...normalizeStringList(generationProfile.featureTags),
    generationProfile.signatureItem,
    occupationText,
    generationProfile.placeType,
    generationProfile.timeMood,
    generationProfile.cardMood,
    generationProfile.combatStyle
  ]);
  const combatStyle = normalizeToken(generationProfile.combatStyle || contexts.questionnaire?.combatStyle || "auto");
  const combatAlias = COMBAT_STYLE_ALIASES[combatStyle] ?? combatStyle;
  const characterFormBranch = normalizeToken(generationProfile.characterFormBranch || contexts.questionnaire?.characterFormBranch || "humanlike");
  const bodyProfileResolution = resolveBodyProfile({ generationProfile, contexts, characterFormBranch });
  const occupationGroup = resolveOccupationGroup(occupationText);
  const evolutionTier = resolveEvolutionTier({ generationProfile, contexts });
  const poseStage = EVOLUTION_STAGE_BY_TIER[evolutionTier] ?? "base";
  const cardMood = normalizeToken(generationProfile.cardMood || contexts.questionnaire?.cardMood || generationProfile.timeMood || "cinematic");
  const strongestStats = getStrongestStats(cardStats);
  const poseCues = derivePoseCues({ visibleTags, analysis, groups });
  const selectionSeed = [
    analysis?.hash,
    generationProfile.characterName,
    occupationText,
    combatStyle,
    cardMood,
    characterFormBranch,
    bodyProfileResolution.bodyProfile,
    occupationGroup,
    evolutionTier,
    generationProfile.reroll ?? generationProfile.rerollCount ?? generationProfile.rerollSeed ?? 0
  ].join(":");

  return {
    combatStyle,
    combatAlias,
    characterFormBranch,
    bodyProfile: bodyProfileResolution.bodyProfile,
    bodyProfilePolicy: bodyProfileResolution.policy,
    occupationGroup,
    occupationText: safeString(occupationText, 80),
    evolutionTier,
    poseStage,
    cardMood,
    visibleTags: visibleTags.slice(0, 40),
    poseCues,
    strongestStats,
    selectionSeed,
    sourcePolicy: {
      visualGuidanceOnly: true,
      noIdentityRecognition: true,
      noSensitiveInference: true,
      noGenderInferenceFromPhoto: true,
      doesNotChangeBattleStats: true
    }
  };
}

export function formatSelectedPoseReferenceForImageModel(selectedPoseReference) {
  if (!selectedPoseReference?.poseId) return "";
  const topCandidates = selectedPoseReference.topCandidates?.slice(0, 3).map((candidate) => candidate.poseId).join(", ") || "";
  return [
    "POSE REFERENCE:",
    `- Selected pose id: ${selectedPoseReference.poseId}.`,
    `- Body profile: ${selectedPoseReference.bodyProfileLabel || selectedPoseReference.bodyProfile}. Chosen from character settings only, not from photo gender inference.`,
    `- Profession pose group: ${selectedPoseReference.occupationGroupLabel || selectedPoseReference.occupationGroup}.`,
    `- Evolution pose stage: ${selectedPoseReference.poseStage}; cue: ${selectedPoseReference.promptCue}.`,
    selectedPoseReference.upgradeCue ? `- Upgrade cue: ${selectedPoseReference.upgradeCue}.` : "",
    topCandidates ? `- Other valid candidate ids considered: ${topCandidates}.` : "",
    "- Use the selected pose only for body/action silhouette and camera rhythm.",
    "- Preserve the source photo's recognizable visible cues, outfit/accessory motifs, and approved Character Spec hooks.",
    "- Do not copy pixel-art style, low resolution, sprite outlines, or baked colors from the pose reference.",
    "- Do not copy chest, waist, hip, shoulder, or other sex-coded anatomy from the pose reference.",
    "- Do not infer or change gender from the source photo."
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPoseReferenceLibrary() {
  const rows = [];
  for (const bodyProfile of POSE_BODY_PROFILES) {
    for (const occupation of POSE_OCCUPATION_GROUPS) {
      const variants = POSE_VARIANTS_BY_OCCUPATION[occupation.key] ?? POSE_VARIANTS_BY_OCCUPATION.general;
      for (const variant of variants) {
        rows.push(
          Object.freeze({
            poseId: `${bodyProfile.key}_${occupation.key}_${variant.variantId}`,
            poseFamily: variant.poseFamily,
            poseVariant: variant.variantId,
            poseStage: variant.stage,
            bodyProfile: bodyProfile.key,
            occupationGroup: occupation.key,
            assetPath: null,
            assetStatus: POSE_ASSET_STATUS.textOnlyPendingNeutralAsset,
            label: `${bodyProfile.label} ${occupation.label} ${titleCaseToken(variant.variantId)}`,
            promptCue: `${bodyProfile.promptCue}; ${variant.promptCue}`,
            upgradeCue: buildUpgradeCue(variant.stage, variant.promptCue),
            energy: stageEnergy(variant.stage),
            bodyFacing: variant.bodyFacing,
            cropFit: variant.cropFit,
            combatAffinity: variant.combatAffinity,
            statAffinity: variant.statAffinity,
            sourceTagAffinity: variant.sourceTagAffinity,
            moodAffinity: variant.moodAffinity,
            branchAffinity: bodyProfile.compatibleBranches,
            avoidWhen: variant.avoidWhen
          })
        );
      }
    }
  }
  return rows;
}

function sourceAsset(poseId, assetPath) {
  return Object.freeze({
    poseId,
    assetPath,
    assetStatus: POSE_ASSET_STATUS.sourceRequiresNeutralization,
    sourceUse: "do_not_send_as_image_input"
  });
}

function occupationGroup(key, label, patterns) {
  return Object.freeze({
    key,
    label,
    patterns: Object.freeze(patterns)
  });
}

function poseVariant(
  variantId,
  poseFamily,
  stage,
  promptCue,
  sourceTagAffinity = [],
  combatAffinity = [],
  statAffinity = [],
  opts = {}
) {
  return Object.freeze({
    variantId,
    poseFamily,
    stage,
    promptCue,
    sourceTagAffinity: Object.freeze(sourceTagAffinity),
    combatAffinity: Object.freeze(combatAffinity),
    statAffinity: Object.freeze(statAffinity),
    bodyFacing: opts.bodyFacing ?? "three_quarter",
    cropFit: opts.cropFit ?? "upper_body_or_full_body",
    moodAffinity: Object.freeze(opts.moodAffinity ?? ["cinematic", "neon", "quiet", "chaotic", "playful"]),
    avoidWhen: Object.freeze(opts.avoidWhen ?? [])
  });
}

function scorePoseReference(pose, intent) {
  const breakdown = [];
  let score = 0;

  if (pose.bodyProfile === intent.bodyProfile) {
    score += addScore(breakdown, "bodyProfile", 10);
  } else if (pose.bodyProfile === "neutral_human" && intent.characterFormBranch === "humanlike") {
    score += addScore(breakdown, "bodyProfile:fallbackNeutral", 2);
  } else {
    score += addScore(breakdown, "bodyProfile:mismatch", -14);
  }

  if (pose.occupationGroup === intent.occupationGroup) {
    score += addScore(breakdown, "occupationGroup", 8);
  } else if (pose.occupationGroup === "general") {
    score += addScore(breakdown, "occupationGroup:generalFallback", 2);
  } else {
    score += addScore(breakdown, "occupationGroup:mismatch", -6);
  }

  score += addScore(breakdown, `stage:${pose.poseStage}`, scoreStage(pose.poseStage, intent.poseStage));

  if (pose.combatAffinity.includes(intent.combatStyle) || pose.combatAffinity.includes(intent.combatAlias)) {
    score += addScore(breakdown, "combatStyle", 5);
  }

  for (const stat of intent.strongestStats) {
    if (pose.statAffinity.includes(stat) || (stat === "speed" && pose.statAffinity.includes("agi"))) {
      score += addScore(breakdown, `stat:${stat}`, 3);
    }
  }

  if (pose.branchAffinity.includes(intent.characterFormBranch)) {
    score += addScore(breakdown, "formBranch", 4);
  }

  if (pose.moodAffinity.includes(intent.cardMood)) {
    score += addScore(breakdown, "cardMood", 1);
  }

  const signalText = uniqueStrings([...intent.visibleTags, ...intent.poseCues]).join(" ").toLowerCase();
  for (const tag of pose.sourceTagAffinity) {
    if (signalText.includes(tag)) {
      score += addScore(breakdown, `source:${tag}`, 2);
    }
  }

  for (const avoid of pose.avoidWhen) {
    if (signalText.includes(avoid)) {
      score += addScore(breakdown, `avoid:${avoid}`, -5);
    }
  }

  return { pose, score, breakdown };
}

function resolveBodyProfile({ generationProfile = {}, contexts = {}, characterFormBranch = "humanlike" } = {}) {
  const explicit = normalizeToken(
    generationProfile.characterSetting?.poseBodyProfile ??
      generationProfile.characterSetting?.bodyProfile ??
      generationProfile.poseBodyProfile ??
      generationProfile.bodyProfile ??
      contexts.questionnaire?.poseBodyProfile ??
      contexts.questionnaire?.bodyProfile
  );
  const explicitProfile = explicit ? getBodyProfile(explicit) : null;
  if (explicitProfile) {
    return {
      bodyProfile: explicitProfile.key,
      policy: explicitProfile.sourcePolicy
    };
  }
  if (["animalized.cat", "nonhuman", "mascot"].includes(characterFormBranch)) {
    return {
      bodyProfile: "mascot_nonhuman",
      policy: "character_form_branch"
    };
  }
  return {
    bodyProfile: "neutral_human",
    policy: "default_no_gender_inference"
  };
}

function resolveOccupationGroup(occupationText = "") {
  const text = safeString(occupationText, 120).toLowerCase();
  const match = POSE_OCCUPATION_GROUPS.find((group) => group.patterns.some((pattern) => text.includes(pattern.toLowerCase())));
  return match?.key ?? "general";
}

function resolveEvolutionTier({ generationProfile = {}, contexts = {} } = {}) {
  const raw =
    generationProfile.evolutionTier ??
    generationProfile.visualEvolutionTier ??
    generationProfile.progression?.visualEvolution?.tier ??
    contexts.progression?.visualEvolution?.tier ??
    contexts.visualEvolution?.tier ??
    0;
  return Math.max(0, Math.min(5, Math.round(Number(raw) || 0)));
}

function derivePoseCues({ visibleTags, analysis, groups }) {
  const text = visibleTags.join(" ").toLowerCase();
  const cues = [];
  if (/(run|running|walk|walking|motion|blur|dance|dancing|jump|action|衝|跑|動作)/u.test(text)) cues.push("motion");
  if (/(crossed arms|guard|shield|stable|standing|centered|防禦|穩|站)/u.test(text)) cues.push("stable");
  if (/(hand|hands|holding|phone|book|laptop|controller|prop|手|拿|握|書|手機)/u.test(text)) cues.push("hands_or_prop");
  if (/(smile|playful|toy|cat|pet|casual|笑|玩|貓|寵物)/u.test(text)) cues.push("playful");
  if (/(intense|sport|sports|celebrat|performance|competition|competitive|運動|競賽|表演)/u.test(text)) cues.push("intense");
  if (analysis?.metrics?.centerFocus >= 0.62 || normalizeStringList(groups.composition).some((tag) => tag.toLowerCase().includes("center"))) {
    cues.push("centered");
  }
  return uniqueStrings(cues);
}

function getStrongestStats(cardStats = {}) {
  const entries = ["power", "speed", "guard", "focus", "luck"]
    .map((key) => [key, Number(cardStats[key]) || 0])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
  if (!entries.length) return [];
  const topValue = entries[0][1];
  return entries.filter(([, value]) => value >= topValue - 6 || value >= 70).slice(0, 2).map(([key]) => key);
}

function buildPoseProgressionPlan(pose, intent) {
  const variants = POSE_VARIANTS_BY_OCCUPATION[intent.occupationGroup] ?? POSE_VARIANTS_BY_OCCUPATION.general;
  const baseVariant = variants.find((variant) => variant.stage === "base") ?? variants[0];
  return {
    bodyProfile: intent.bodyProfile,
    occupationGroup: intent.occupationGroup,
    startPoseId: `${intent.bodyProfile}_${intent.occupationGroup}_${baseVariant.variantId}`,
    currentPoseId: pose.poseId,
    currentStage: pose.poseStage,
    nextStage: nextStage(intent.poseStage),
    stagePath: ["base", "evolved", "advanced", "awakened", "final"],
    upgradeRule: "higher evolution tiers prefer higher-intensity poses in the same body profile and occupation group"
  };
}

function countCandidatesFor(intent) {
  return POSE_REFERENCE_LIBRARY.filter((pose) => pose.bodyProfile === intent.bodyProfile && pose.occupationGroup === intent.occupationGroup).length;
}

function formatCandidateSummary(entry) {
  return {
    poseId: entry.pose.poseId,
    bodyProfile: entry.pose.bodyProfile,
    occupationGroup: entry.pose.occupationGroup,
    poseStage: entry.pose.poseStage,
    poseFamily: entry.pose.poseFamily,
    promptCue: entry.pose.promptCue,
    score: entry.score
  };
}

function getBodyProfile(key) {
  return POSE_BODY_PROFILES.find((profile) => profile.key === key) ?? null;
}

function getOccupationGroup(key) {
  return POSE_OCCUPATION_GROUPS.find((group) => group.key === key) ?? null;
}

function scoreStage(poseStage, targetStage) {
  if (poseStage === targetStage) return 5;
  const order = ["base", "evolved", "advanced", "awakened", "final"];
  const distance = Math.abs(order.indexOf(poseStage) - order.indexOf(targetStage));
  if (distance === 1) return 2;
  if (targetStage === "base" && ["awakened", "final"].includes(poseStage)) return -8;
  return -2;
}

function stageEnergy(stage) {
  if (stage === "base") return "medium";
  if (stage === "evolved") return "high";
  if (stage === "advanced") return "high";
  return "ultimate";
}

function buildUpgradeCue(stage, promptCue) {
  if (stage === "base") return "starting card pose should read as capable but not fully evolved";
  if (stage === "evolved") return `first evolution adds clearer motion and stronger aura while preserving identity: ${promptCue}`;
  if (stage === "advanced") return `second evolution adds command, scale, and sharper battle silhouette: ${promptCue}`;
  if (stage === "awakened") return `awakening pose should feel like a major power release: ${promptCue}`;
  return `final form pose should feel decisive, iconic, and more powerful than all previous stages: ${promptCue}`;
}

function nextStage(stage) {
  const order = ["base", "evolved", "advanced", "awakened", "final"];
  return order[Math.min(order.length - 1, order.indexOf(stage) + 1)] ?? "evolved";
}

function titleCaseToken(token) {
  return safeString(token, 80)
    .split("_")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function deterministicIndex(seed, length) {
  if (!length) return 0;
  let hash = 2166136261;
  const text = String(seed ?? "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % length;
}

function addScore(breakdown, reason, value) {
  if (value) breakdown.push({ reason, value });
  return value;
}

function normalizeStringList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(normalizeStringList);
  return String(value)
    .split(/[,\n，、/｜|]+/u)
    .map((item) => safeString(item, 80))
    .filter(Boolean);
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values ?? []) {
    const safeValue = safeString(value, 120);
    const key = safeValue.toLowerCase();
    if (!safeValue || seen.has(key)) continue;
    seen.add(key);
    result.push(safeValue);
  }
  return result;
}

function normalizeToken(value) {
  return safeString(value, 48).toLowerCase().replace(/\s+/g, "_");
}

function safeString(value, maxLength = 120) {
  return String(value ?? "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/-?\d{1,3}\.\d{3,}/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
