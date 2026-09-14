import {
  QUESTIONNAIRE_CURRENT_FLOW,
  VLM_CREATIVE_ROLL_POLICY
} from "./questionnaire-schema.js";
import {
  ageProfiles,
  combatStyleProfiles,
  valueProfiles
} from "./rule-data.js";

export const QUESTIONNAIRE_CANDIDATE_BUILDER_VERSION = "questionnaire-candidates-v1";

const AGE_KEYS = Object.freeze(Object.keys(ageProfiles));
const VALUE_KEYS = Object.freeze(Object.keys(valueProfiles));
const COMBAT_STYLE_KEYS = Object.freeze(Object.keys(combatStyleProfiles));
const CARD_MOOD_KEYS = Object.freeze(["cinematic", "neon", "arcane", "royal"]);

const SAFE_WEAKNESS_CANDIDATES = Object.freeze([
  {
    value: "過度分析",
    label: "過度分析",
    promptHook: "careful tactician with delayed first strike",
    rationale: "Creates a focus-heavy control tradeoff without judging the real person."
  },
  {
    value: "容易衝動",
    label: "容易衝動",
    promptHook: "reckless opening burst with exposed defense",
    rationale: "Creates a fast aggressive tradeoff for battle pacing."
  },
  {
    value: "消耗很大",
    label: "消耗很大",
    promptHook: "high-output ability with visible cooldown cost",
    rationale: "Creates a powerful skill that needs a cooldown or cost."
  },
  {
    value: "不耐久戰",
    label: "不耐久戰",
    promptHook: "short-battle specialist with fading momentum",
    rationale: "Creates a tempo tradeoff without making a real-world flaw claim."
  }
]);

const DEFAULT_STORY_EVENTS = Object.freeze([
  "在本地訓練門第一次覺醒卡牌形態",
  "從照片中的場景吸收能量後成為新手挑戰者",
  "在平凡的一天裡找到屬於自己的戰鬥節奏",
  "把可見道具轉化成第一個招牌技能"
]);

export function buildQuestionnaireCandidatePrompt({ subjectFocus = "center_primary_subject", hasSubjectCrop = false, analysis = {}, captureContext = {}, eventContext = {} } = {}) {
  const imageModeRule = hasSubjectCrop
    ? "Image 1 is the Target Subject crop. Image 2 is the full Source Photo. Use image 1 for the target character and image 2 only for world context."
    : "One full Source Photo is provided. Use the centered/largest/clearest foreground subject as the Target Subject.";
  const contextSummary = summarizeCandidateContext({ analysis, captureContext, eventContext });

  return [
    "You are the VLM Creative Roll designer for a photo-to-game-card pipeline.",
    "Return only JSON. Do not include markdown, comments, or prose.",
    imageModeRule,
    `Target Subject focus: ${safeString(subjectFocus, 64)}.`,
    "Create roleplay/game candidates from visible pixels and supplied capture/event context.",
    "Never infer real identity, real age, gender, ethnicity, sexuality, politics, religion, health, wealth, private belief, or real personality.",
    "ageImpression, values, weakness, and storyEvent must each contain exactly 4 candidates.",
    "ageImpression candidates must use one of: teen, young_adult, adult, veteran, legend.",
    "values candidates must use one of: growth, friendship, freedom, order, victory, knowledge, protection.",
    "Each values candidate must include a narrative field: one short Traditional Chinese sentence explaining that fictional value direction. Do not output VLM tags for values.",
    "weakness candidates must be battle tradeoffs, not insults or sensitive claims.",
    "storyEvent candidates must be fictional origin events grounded in scene, props, OCR, location/time/event context.",
    "Auto fields must be non-sensitive roleplay motifs, not factual claims.",
    "Context summary:",
    contextSummary || "none",
    "JSON shape:",
    JSON.stringify(questionnaireCandidateJsonSchemaExample())
  ].join("\n");
}

export function questionnaireCandidateJsonSchema() {
  const candidateSchema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        value: { type: "string" },
        label: { type: "string" },
        narrative: { type: "string" },
        promptHook: { type: "string" },
        rationale: { type: "string" }
      },
      required: ["value", "label", "promptHook", "rationale"]
    }
  };
  const autoTextSchema = {
    type: "object",
    properties: {
      value: { type: "string" },
      label: { type: "string" },
      promptHook: { type: "string" },
      rationale: { type: "string" }
    },
    required: ["value", "label", "promptHook", "rationale"]
  };

  return {
    type: "object",
    properties: {
      userChoiceFields: {
        type: "object",
        properties: {
          ageImpression: candidateSchema,
          values: candidateSchema,
          weakness: candidateSchema,
          storyEvent: candidateSchema
        },
        required: ["ageImpression", "values", "weakness", "storyEvent"]
      },
      vlmAutoFields: {
        type: "object",
        properties: {
          realWorldRole: autoTextSchema,
          personality: candidateSchema,
          specialty: candidateSchema,
          combatStyle: autoTextSchema,
          signatureItem: autoTextSchema,
          cardMood: autoTextSchema
        },
        required: ["realWorldRole", "personality", "specialty", "combatStyle", "signatureItem", "cardMood"]
      }
    },
    required: ["userChoiceFields", "vlmAutoFields"]
  };
}

export function normalizeQuestionnaireCandidatePayload(payload = {}, context = {}) {
  const fallback = createFallbackQuestionnaireCandidates(context);
  const userChoiceFields = payload?.userChoiceFields ?? payload?.candidates ?? {};
  const vlmAutoFields = payload?.vlmAutoFields ?? payload?.autoFields ?? {};

  return {
    ...fallback,
    providerVersion: QUESTIONNAIRE_CANDIDATE_BUILDER_VERSION,
    userChoiceFields: {
      ageImpression: normalizeAgeCandidates(userChoiceFields.ageImpression, fallback.userChoiceFields.ageImpression),
      values: normalizeValueCandidates(userChoiceFields.values, fallback.userChoiceFields.values),
      weakness: normalizeTextCandidates(userChoiceFields.weakness, fallback.userChoiceFields.weakness, 80),
      storyEvent: normalizeTextCandidates(userChoiceFields.storyEvent ?? userChoiceFields.storyEvents, fallback.userChoiceFields.storyEvent, 120)
    },
    vlmAutoFields: {
      realWorldRole: normalizeAutoText(vlmAutoFields.realWorldRole, fallback.vlmAutoFields.realWorldRole, 48),
      personality: normalizeTextCandidates(vlmAutoFields.personality, fallback.vlmAutoFields.personality, 32, 3),
      specialty: normalizeTextCandidates(vlmAutoFields.specialty, fallback.vlmAutoFields.specialty, 32, 5),
      combatStyle: normalizeEnumAutoText(vlmAutoFields.combatStyle, fallback.vlmAutoFields.combatStyle, COMBAT_STYLE_KEYS),
      signatureItem: normalizeAutoText(vlmAutoFields.signatureItem, fallback.vlmAutoFields.signatureItem, 36),
      cardMood: normalizeEnumAutoText(vlmAutoFields.cardMood, fallback.vlmAutoFields.cardMood, CARD_MOOD_KEYS)
    }
  };
}

export function createFallbackQuestionnaireCandidates(context = {}) {
  const seed = toSeedNumber(context.seed);
  const signals = collectSignals(context);
  const ageKeys = rotateDistinct(["young_adult", "adult", "teen", "veteran", "legend"], seed).slice(0, 4);
  const valueKeys = chooseFallbackValueKeys(signals, seed);
  const weaknessCandidates = rotateDistinct(SAFE_WEAKNESS_CANDIDATES, seed).slice(0, 4);
  const role = inferFallbackRole(signals);
  const combatStyle = inferFallbackCombatStyle(signals);
  const cardMood = inferFallbackCardMood(signals);
  const signatureItem = inferFallbackSignatureItem(signals);
  const storyEvents = createFallbackStoryEvents(signals, role.value, signatureItem.value, seed);

  return {
    providerVersion: QUESTIONNAIRE_CANDIDATE_BUILDER_VERSION,
    schemaVersion: QUESTIONNAIRE_CURRENT_FLOW.version,
    candidateCount: VLM_CREATIVE_ROLL_POLICY.candidateCount,
    sourcePolicy: {
      role: VLM_CREATIVE_ROLL_POLICY.role,
      userChoiceRule: VLM_CREATIVE_ROLL_POLICY.userChoiceRule,
      lockRule: VLM_CREATIVE_ROLL_POLICY.lockRule,
      forbiddenInferences: [...VLM_CREATIVE_ROLL_POLICY.forbiddenInferences],
      allowedSignals: [...VLM_CREATIVE_ROLL_POLICY.allowedSignals]
    },
    userChoiceFields: {
      ageImpression: ageKeys.map((key) => ({
        value: key,
        label: ageProfiles[key]?.label ?? key,
        promptHook: `fictional ${key.replaceAll("_", " ")} character direction`,
        rationale: "Safe roleplay age direction from visible expression/pose energy; not real age detection."
      })),
      values: valueKeys.map((key) => ({
        value: key,
        label: valueProfiles[key]?.label ?? key,
        narrative: createValueNarrative(key),
        promptHook: `${key} fighting motivation`,
        rationale: "Safe fictional motivation candidate from scene mood; not a real belief claim."
      })),
      weakness: weaknessCandidates,
      storyEvent: storyEvents.map((value) => ({
        value,
        label: value.slice(0, 24),
        promptHook: value,
        rationale: "Fictional origin event grounded in visible scene/context."
      }))
    },
    vlmAutoFields: {
      realWorldRole: role,
      personality: inferFallbackPersonality(signals),
      specialty: inferFallbackSpecialty(signals),
      combatStyle,
      signatureItem,
      cardMood
    }
  };
}

function questionnaireCandidateJsonSchemaExample() {
  return {
    userChoiceFields: {
      ageImpression: [{ value: "young_adult", label: "青年", promptHook: "fictional young adult direction", rationale: "visible expression/pose energy" }],
      values: [{ value: "growth", label: "成長", narrative: "這個角色相信每一次挑戰都能讓自己更接近下一階段。", promptHook: "growth motivation", rationale: "scene mood" }],
      weakness: [{ value: "過度分析", label: "過度分析", promptHook: "careful tactician tradeoff", rationale: "battle tradeoff" }],
      storyEvent: [{ value: "在霓虹街機場贏下第一場挑戰", label: "霓虹初戰", promptHook: "neon arcade origin", rationale: "scene and props" }]
    },
    vlmAutoFields: {
      realWorldRole: { value: "街機挑戰者", label: "街機挑戰者", promptHook: "arcade challenger role motif", rationale: "visible arcade setting" },
      personality: [{ value: "playful", label: "玩心", promptHook: "playful roleplay energy", rationale: "expression and scene" }],
      specialty: [{ value: "節奏遊戲", label: "節奏遊戲", promptHook: "rhythm-game specialty", rationale: "visible game context" }],
      combatStyle: { value: "duelist", label: "速度連擊", promptHook: "tempo duelist", rationale: "pose/action energy" },
      signatureItem: { value: "耳機", label: "耳機", promptHook: "signature headphones", rationale: "visible prop" },
      cardMood: { value: "neon", label: "霓虹科技", promptHook: "neon card mood", rationale: "lighting/palette" }
    }
  };
}

function collectSignals(context = {}) {
  const analysis = context.analysis ?? {};
  const groups = analysis.visibleSemanticTagGroups ?? context.groups ?? {};
  const capture = context.captureContext ?? {};
  const event = context.eventContext ?? {};
  const values = [
    ...normalizeStringList(analysis.visibleSemanticTags),
    ...Object.values(groups).flatMap(normalizeStringList),
    ...normalizeStringList(capture.locationCreativeTags),
    ...normalizeStringList(event.eventCreativeTags),
    safeString(analysis.textSeed, 64),
    safeString(capture.placeType, 32),
    safeString(capture.timeMood, 32),
    safeString(event.season, 32)
  ].filter(Boolean);

  return uniqueStrings(values, 40);
}

function summarizeCandidateContext(context = {}) {
  const signals = collectSignals(context);
  const capture = context.captureContext ?? {};
  const event = context.eventContext ?? {};
  const lines = [
    signals.length ? `visible/context signals: ${signals.slice(0, 24).join(", ")}` : "",
    capture.placeType ? `placeType: ${capture.placeType}` : "",
    capture.timeMood ? `timeMood: ${capture.timeMood}` : "",
    event.season ? `season: ${event.season}` : "",
    normalizeStringList(event.eventCreativeTags).length ? `eventCreativeTags: ${normalizeStringList(event.eventCreativeTags).join(", ")}` : ""
  ].filter(Boolean);

  return lines.join("\n");
}

function chooseFallbackValueKeys(signals, seed) {
  const text = signals.join(" ").toLocaleLowerCase();
  let keys = ["growth", "friendship", "freedom", "knowledge"];
  if (/(arcade|game|neon|disco|controller|街機|遊戲|霓虹)/u.test(text)) keys = ["victory", "freedom", "growth", "knowledge"];
  if (/(court|stadium|sport|ball|running|athlete|球場|運動|跑步|競技)/u.test(text)) keys = ["victory", "growth", "friendship", "freedom"];
  if (/(office|laptop|book|school|study|data|筆電|書|學校|辦公)/u.test(text)) keys = ["knowledge", "order", "growth", "protection"];
  if (/(park|beach|mountain|outdoor|公園|海邊|山|戶外)/u.test(text)) keys = ["freedom", "growth", "friendship", "protection"];
  return rotateDistinct(keys, seed).slice(0, 4);
}

function inferFallbackRole(signals) {
  const text = signals.join(" ").toLocaleLowerCase();
  if (/(arcade|game|controller|pac-man|galaga|disco|街機|遊戲|手把)/u.test(text)) {
    return createAutoText("街機挑戰者", "arcade challenger role motif", "Visible game/arcade context.");
  }
  if (/(court|stadium|sport|ball|running|athlete|gym|球場|運動|跑步|健身)/u.test(text)) {
    return createAutoText("競技衝鋒者", "sports challenger role motif", "Visible sports/action context.");
  }
  if (/(camera|studio|design|poster|art|相機|設計|海報|創作)/u.test(text)) {
    return createAutoText("影像創作者", "visual creator role motif", "Visible creative tools or visual-design context.");
  }
  if (/(office|laptop|book|school|data|辦公|筆電|書|學校|資料)/u.test(text)) {
    return createAutoText("資料策士", "tactical analyst role motif", "Visible work/study/data context.");
  }
  return createAutoText("本地訓練者", "local training challenger role motif", "Safe default role motif.");
}

function inferFallbackPersonality(signals) {
  const text = signals.join(" ").toLocaleLowerCase();
  const candidates = [];
  if (/(smile|open mouth|celebrat|arcade|game|neon|微笑|張嘴|慶祝|街機|霓虹)/u.test(text)) {
    candidates.push(createCandidate("playful", "玩心", "playful roleplay energy", "Visible lively expression or playful scene."));
  }
  if (/(centered|quiet|office|study|book|中心|安靜|辦公|學校|書)/u.test(text)) {
    candidates.push(createCandidate("calm", "冷靜", "calm roleplay energy", "Visible composed scene or focused context."));
  }
  if (/(sport|running|court|stadium|victory|運動|跑步|球場|競技)/u.test(text)) {
    candidates.push(createCandidate("ambitious", "好勝", "ambitious challenger energy", "Visible competitive action context."));
  }
  if (/(night|low light|shadow|夜晚|低光|陰影)/u.test(text)) {
    candidates.push(createCandidate("mysterious", "神秘", "mysterious roleplay energy", "Visible night or low-light atmosphere."));
  }
  return uniqueCandidates([...candidates, createCandidate("brave", "勇敢", "brave roleplay energy", "Safe default adventure motif.")], 3);
}

function inferFallbackSpecialty(signals) {
  const mapping = [
    ["controller", "節奏遊戲", "game-control specialty"],
    ["arcade", "街機判讀", "arcade-reading specialty"],
    ["camera", "影像捕捉", "image-capture specialty"],
    ["laptop", "資料分析", "data-analysis specialty"],
    ["book", "知識整理", "knowledge-index specialty"],
    ["ball", "球場反應", "court-reaction specialty"],
    ["running", "速度節奏", "speed-tempo specialty"],
    ["headphones", "聲音同步", "audio-sync specialty"],
    ["sunglasses", "光線遮斷", "light-filter specialty"],
    ["neon", "霓虹感知", "neon-signal specialty"]
  ];
  const text = signals.join(" ").toLocaleLowerCase();
  const candidates = mapping
    .filter(([pattern]) => text.includes(pattern))
    .map(([, label, hook]) => createCandidate(label, label, hook, "Visible non-sensitive signal."));
  return uniqueCandidates([...candidates, createCandidate("場景適應", "場景適應", "scene-adaptation specialty", "Safe fallback specialty.")], 5);
}

function inferFallbackCombatStyle(signals) {
  const text = signals.join(" ").toLocaleLowerCase();
  if (/(running|speed|neon|arcade|跑步|速度|霓虹|街機)/u.test(text)) {
    return createEnumAutoText("duelist", combatStyleProfiles.duelist.label, "tempo duelist", "Visible movement or tempo-heavy scene.");
  }
  if (/(sport|ball|stadium|power|競技|球|力量)/u.test(text)) {
    return createEnumAutoText("striker", combatStyleProfiles.striker.label, "burst striker", "Visible competitive action context.");
  }
  if (/(office|book|laptop|study|data|辦公|書|筆電|資料)/u.test(text)) {
    return createEnumAutoText("controller", combatStyleProfiles.controller.label, "control caster", "Visible analysis/study/work context.");
  }
  if (/(group|friend|shield|守護|隊友|群體)/u.test(text)) {
    return createEnumAutoText("guardian", combatStyleProfiles.guardian.label, "frontline guardian", "Visible group/protection context.");
  }
  return createEnumAutoText("trickster", combatStyleProfiles.trickster.label, "chance tactician", "Safe creative fallback.");
}

function inferFallbackSignatureItem(signals) {
  const itemPatterns = [
    ["headphones", "耳機"],
    ["controller", "手把"],
    ["phone", "手機"],
    ["camera", "相機"],
    ["laptop", "筆電"],
    ["book", "書"],
    ["ball", "球"],
    ["sunglasses", "墨鏡"],
    ["glasses", "眼鏡"],
    ["poster", "海報"]
  ];
  const text = signals.join(" ").toLocaleLowerCase();
  const match = itemPatterns.find(([pattern, label]) => text.includes(pattern) || text.includes(label));
  if (match) return createAutoText(match[1], `signature ${match[1]}`, "Visible or OCR-supported prop.");
  return createAutoText("訓練徽記", "signature training sigil", "Safe default prop.");
}

function inferFallbackCardMood(signals) {
  const text = signals.join(" ").toLocaleLowerCase();
  if (/(neon|arcade|disco|night|霓虹|街機|夜晚)/u.test(text)) return createEnumAutoText("neon", "霓虹科技", "neon card mood", "Visible neon/night/game lighting.");
  if (/(mountain|sunny|stadium|royal|山|晴朗|競技)/u.test(text)) return createEnumAutoText("royal", "史詩王者", "heroic card mood", "Visible open/heroic staging.");
  if (/(mysterious|shadow|night|low light|神秘|陰影|低光)/u.test(text)) return createEnumAutoText("arcane", "祕法幻想", "arcane card mood", "Visible mystery or low-light atmosphere.");
  return createEnumAutoText("cinematic", "電影感", "cinematic card mood", "Safe default visual mood.");
}

function createFallbackStoryEvents(signals, role, signatureItem, seed) {
  const text = signals.join(" ").toLocaleLowerCase();
  let events = [...DEFAULT_STORY_EVENTS];
  if (/(arcade|game|neon|街機|遊戲|霓虹)/u.test(text)) {
    events = [
      "在霓虹街機場贏下第一場挑戰",
      "把遊戲機台的光轉成自己的戰鬥節奏",
      "在喧鬧場景中發現隱藏關卡入口",
      "用招牌道具啟動一段連擊試煉"
    ];
  } else if (/(sport|court|stadium|ball|running|運動|球場|跑步|競技)/u.test(text)) {
    events = [
      "在一場高強度比賽後覺醒戰鬥卡形態",
      "把最後一次衝刺變成自己的第一個技能",
      "在場邊燈光下接住反擊的機會",
      "用招牌道具完成一次逆轉訓練"
    ];
  } else if (/(office|school|book|laptop|data|辦公|學校|書|筆電|資料)/u.test(text)) {
    events = [
      "在資料與線索之間組出第一張戰術卡",
      "把安靜場景中的細節化成分析技能",
      "從一次失敗推演中找到新的勝利路線",
      "用招牌道具建立自己的作戰索引"
    ];
  }

  return rotateDistinct(events, seed)
    .slice(0, 4)
    .map((event) => event.replace("招牌道具", signatureItem || role || "招牌道具"));
}

function normalizeAgeCandidates(value, fallback) {
  return normalizeEnumCandidates(value, fallback, AGE_KEYS, ageProfiles, 4);
}

function normalizeValueCandidates(value, fallback) {
  return normalizeEnumCandidates(value, fallback, VALUE_KEYS, valueProfiles, 4, createValueNarrative);
}

function normalizeEnumCandidates(value, fallback, allowedKeys, profiles, limit, narrativeFactory = null) {
  const candidates = normalizeCandidateArray(value)
    .map((candidate) => {
      const key = normalizeEnumKey(candidate.value, allowedKeys);
      if (!key) return null;
      return {
        value: key,
        label: safeString(candidate.label || profiles[key]?.label || key, 24),
        narrative: safeString(candidate.narrative || narrativeFactory?.(key) || "", 140),
        promptHook: safeString(candidate.promptHook || `${key} motif`, 80),
        rationale: safeString(candidate.rationale || "VLM creative candidate.", 120)
      };
    })
    .filter(Boolean);
  return fillCandidates(candidates, fallback, limit);
}

function createValueNarrative(key) {
  return {
    growth: "這個角色相信每一次挑戰都能讓自己更接近下一階段。",
    friendship: "這個角色相信夥伴之間的呼應能把危機變成反擊。",
    freedom: "這個角色相信不被固定路線限制，才能找到最快的突破口。",
    order: "這個角色相信規則與節奏能讓混亂的戰場重新站穩。",
    victory: "這個角色相信勝利不是炫耀，而是把每次行動都推向終點。",
    knowledge: "這個角色相信先看懂局勢，就能在出手前改寫戰局。",
    protection: "這個角色相信守住重要的人事物，才有繼續進攻的理由。"
  }[key] ?? "這個角色把眼前的場景轉化成自己的戰鬥理由。";
}

function normalizeTextCandidates(value, fallback, maxLength, limit = 4) {
  const candidates = normalizeCandidateArray(value)
    .map((candidate) => {
      const text = safeString(candidate.value || candidate.label, maxLength);
      if (!text) return null;
      return {
        value: text,
        label: safeString(candidate.label || text, 24),
        promptHook: safeString(candidate.promptHook || text, 80),
        rationale: safeString(candidate.rationale || "VLM creative candidate.", 120)
      };
    })
    .filter(Boolean);
  return fillCandidates(candidates, fallback, limit);
}

function normalizeAutoText(value, fallback, maxLength) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate && typeof candidate === "object") {
    const normalized = createAutoText(
      safeString(candidate.value || candidate.label, maxLength),
      safeString(candidate.promptHook || candidate.value || candidate.label, 80),
      safeString(candidate.rationale || "VLM auto field.", 120)
    );
    if (normalized.value) return normalized;
  }
  if (typeof value === "string" && value.trim()) return createAutoText(safeString(value, maxLength), safeString(value, 80), "VLM auto field.");
  return fallback;
}

function normalizeEnumAutoText(value, fallback, allowedKeys) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const raw = typeof candidate === "object" ? candidate.value || candidate.label : candidate;
  const key = normalizeEnumKey(raw, allowedKeys);
  if (!key) return fallback;
  return {
    value: key,
    label: safeString(candidate?.label || combatStyleProfiles[key]?.label || key, 24),
    promptHook: safeString(candidate?.promptHook || `${key} motif`, 80),
    rationale: safeString(candidate?.rationale || "VLM normalized enum field.", 120)
  };
}

function normalizeCandidateArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(/[,，、;\n]/u)
      .map((item) => ({ value: item.trim(), label: item.trim() }))
      .filter((item) => item.value);
  }
  if (value && typeof value === "object") return [value];
  return [];
}

function fillCandidates(candidates, fallback, limit) {
  const seen = new Set();
  const result = [];
  for (const candidate of [...candidates, ...(fallback ?? [])]) {
    const key = String(candidate.value ?? "").toLocaleLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
    if (result.length >= limit) break;
  }
  return result;
}

function normalizeEnumKey(value, allowedKeys) {
  const normalized = String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9_-]+/gu, "_");
  return allowedKeys.includes(normalized) ? normalized : "";
}

function rotateDistinct(values, seed) {
  const list = [...values];
  if (!list.length) return list;
  const offset = Math.abs(seed) % list.length;
  return [...list.slice(offset), ...list.slice(0, offset)];
}

function createCandidate(value, label, promptHook, rationale) {
  return {
    value: safeString(value, 48),
    label: safeString(label, 24),
    promptHook: safeString(promptHook, 80),
    rationale: safeString(rationale, 120)
  };
}

function createAutoText(value, promptHook, rationale) {
  return {
    value: safeString(value, 48),
    label: safeString(value, 24),
    promptHook: safeString(promptHook, 80),
    rationale: safeString(rationale, 120)
  };
}

function createEnumAutoText(value, label, promptHook, rationale) {
  return {
    value,
    label,
    promptHook,
    rationale
  };
}

function uniqueCandidates(candidates, limit) {
  return fillCandidates(candidates, [], limit);
}

function normalizeStringList(value) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,，、;\n]/u) : [];
  return values
    .map((item) => safeString(item, 48))
    .filter(Boolean);
}

function uniqueStrings(values, limit = Number.MAX_SAFE_INTEGER) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const text = safeString(value, 80);
    const key = text.toLocaleLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

function safeString(value, maxLength) {
  return String(value ?? "")
    .trim()
    .replace(/[<>]/gu, "")
    .replace(/\s+/gu, " ")
    .slice(0, maxLength);
}

function toSeedNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}
