export const QUESTIONNAIRE_SCHEMA_VERSION = "questionnaire-v2-vlm-randomized-setup";

export const QUESTIONNAIRE_V1_FLOW = Object.freeze({
  version: QUESTIONNAIRE_SCHEMA_VERSION,
  purpose: "vlm_creative_roll_plus_user_choice",
  consentLocation: "game_entry_onboarding",
  productOrder: ["google_maps_key", "questionnaire_decisions", "image_provider_keys"],
  uiMode: "separate_setup_review_flow",
  defaultPolicy: "vlm_roll_fields_then_user_choice_or_safe_default",
  randomnessPolicy: "VLM may create character variation, user-choice fields are locked after selection, and storyEvent is system-selected by seed.",
  userChoiceFields: Object.freeze(["ageImpression", "values", "weakness"]),
  systemSelectedFields: Object.freeze(["storyEvent"]),
  vlmAutoFields: Object.freeze(["realWorldRole", "personality", "specialty", "combatStyle", "signatureItem", "cardMood"])
});

export const VLM_CREATIVE_ROLL_POLICY = Object.freeze({
  role: "create_game_variation_from_visible_context",
  candidateCount: 4,
  userChoiceRule: "The user picks one candidate for user-choice fields; unpicked candidates do not affect rules.",
  systemChoiceRule: "The system picks one storyEvent candidate by seed; it is random-feeling but reproducible.",
  lockRule: "After selection, rules are deterministic from Character Spec and seeded reroll.",
  forbiddenInferences: Object.freeze(["real age", "identity", "gender", "ethnicity", "sexuality", "politics", "religion", "health", "wealth"]),
  allowedSignals: Object.freeze(["expression cue", "pose", "clothing cue", "visible prop", "scene", "activity", "lighting", "composition", "OCR text seed", "capture/event context"])
});

export const QUESTIONNAIRE_V1_FIELDS = Object.freeze([
  Object.freeze({
    key: "ageImpression",
    label: "年齡印象",
    prompt: "你想讓這個角色的年齡印象偏向？",
    priority: "core",
    required: false,
    defaultValue: "young_adult",
    sourceOfTruth: "user_selected_from_vlm_candidates",
    modelSuggestion: "four_roleplay_age_impression_candidates_from_expression_not_detected_age",
    inputType: "vlm_four_choice",
    candidateCount: 4,
    characterSpecPath: "contexts.questionnaire.ageImpression",
    options: Object.freeze([
      { value: "teen", label: "少年" },
      { value: "young_adult", label: "青年" },
      { value: "adult", label: "成年" },
      { value: "veteran", label: "資深" },
      { value: "legend", label: "傳奇" }
    ]),
    affects: Object.freeze({
      stats: Object.freeze(["ageProfiles statMods"]),
      traits: Object.freeze(["ageProfiles trait"]),
      skills: Object.freeze(["ageProfiles skillWord"]),
      promptHooks: Object.freeze(["age direction"]),
      explanation: "年齡印象由 VLM 依表情、姿態與場景產生角色創作候選，但不是偵測真人年齡；User 選定後才影響規則。"
    })
  }),
  Object.freeze({
    key: "realWorldRole",
    label: "身份 / 背景",
    prompt: "這個角色在現實中的身份、職業、興趣或背景是什麼？",
    priority: "core",
    required: false,
    defaultValue: "",
    sourceOfTruth: "vlm_generated_from_visible_context",
    modelSuggestion: "auto_visible_role_motif_not_real_profession",
    inputType: "vlm_auto_text_reviewable",
    maxLength: 36,
    characterSpecPath: "contexts.questionnaire.realWorldRole",
    examples: Object.freeze(["工程師", "學生", "設計師", "運動員", "創作者", "研究者"]),
    affects: Object.freeze({
      stats: Object.freeze(["occupationRules statMods"]),
      traits: Object.freeze(["occupationRules trait"]),
      skills: Object.freeze(["occupationRules skillWord"]),
      promptHooks: Object.freeze(["role motif"]),
      explanation: "身份/背景由 VLM 轉成角色職能 motif，例如街機挑戰者、球場跑者、舞台表演者；它不是判斷真人職業。"
    })
  }),
  Object.freeze({
    key: "personality",
    label: "性格",
    prompt: "這個角色的性格最接近哪幾個詞？",
    priority: "core",
    required: false,
    defaultValue: Object.freeze([]),
    sourceOfTruth: "vlm_generated_from_expression_pose_scene",
    modelSuggestion: "auto_roleplay_personality_motif_not_real_personality",
    inputType: "vlm_auto_tags_reviewable",
    maxSelections: 3,
    characterSpecPath: "contexts.questionnaire.personality",
    options: Object.freeze([
      { value: "brave", label: "勇敢", statBias: { power: 2, guard: 1 }, skillHook: "frontline" },
      { value: "calm", label: "冷靜", statBias: { focus: 3 }, skillHook: "analysis" },
      { value: "playful", label: "玩心", statBias: { luck: 3 }, skillHook: "tempo" },
      { value: "kind", label: "溫柔", statBias: { guard: 2, focus: 1 }, skillHook: "support" },
      { value: "ambitious", label: "好勝", statBias: { power: 2, speed: 1 }, skillHook: "finisher" },
      { value: "mysterious", label: "神秘", statBias: { focus: 2, luck: 1 }, skillHook: "control" }
    ]),
    affects: Object.freeze({
      stats: Object.freeze(["small capped personality bias, future rule table"]),
      traits: Object.freeze(["personality motif trait"]),
      skills: Object.freeze(["skill family flavor"]),
      promptHooks: Object.freeze(["personality motif"]),
      explanation: "性格是角色性格 motif，由表情、姿勢、場景能量轉譯，不是真人心理判斷。"
    })
  }),
  Object.freeze({
    key: "specialty",
    label: "專長 / 特色",
    prompt: "這個角色最擅長什麼，或最有記憶點的特色是什麼？",
    priority: "core",
    required: false,
    defaultValue: Object.freeze([]),
    sourceOfTruth: "vlm_generated_from_visible_context",
    modelSuggestion: "auto_visible_non_sensitive",
    inputType: "vlm_auto_tags_reviewable",
    maxTags: 5,
    characterSpecPath: "contexts.questionnaire.specialty",
    examples: Object.freeze(["籃球", "拍照", "節奏遊戲", "設計", "演講", "跑步", "料理"]),
    affects: Object.freeze({
      stats: Object.freeze(["featureTags capped stat keywords"]),
      traits: Object.freeze(["specialty trait tags"]),
      skills: Object.freeze(["skill naming and visual prop hooks"]),
      promptHooks: Object.freeze(["identity / feature hooks"]),
      explanation: "專長讓照片生成不只是像本人，也能長出角色獨特技能與視覺道具。"
    })
  }),
  Object.freeze({
    key: "combatStyle",
    label: "戰鬥風格",
    prompt: "你希望這個角色怎麼戰鬥？",
    priority: "core",
    required: false,
    defaultValue: "auto",
    sourceOfTruth: "vlm_generated_then_rule_normalized",
    modelSuggestion: "auto_from_visible_action_pose_scene",
    inputType: "vlm_auto_select_reviewable",
    characterSpecPath: "generationProfile.combatStyle",
    options: Object.freeze([
      { value: "auto", label: "自動判定" },
      { value: "striker", label: "攻擊壓制" },
      { value: "duelist", label: "速度連擊" },
      { value: "guardian", label: "防禦守護" },
      { value: "controller", label: "控制干擾" },
      { value: "trickster", label: "幸運奇襲" }
    ]),
    affects: Object.freeze({
      stats: Object.freeze(["combatStyleProfiles statMods and primary stat"]),
      traits: Object.freeze(["combatStyleProfiles trait"]),
      skills: Object.freeze(["first skill template and combat role"]),
      promptHooks: Object.freeze(["pose energy and action direction"]),
      explanation: "戰鬥風格由 VLM 的動作/場景線索建議，再由規則正規化成卡牌定位。"
    })
  }),
  Object.freeze({
    key: "values",
    label: "價值觀",
    prompt: "這個角色最重視什麼？",
    priority: "core",
    required: false,
    defaultValue: "growth",
    sourceOfTruth: "user_selected_from_vlm_candidates",
    modelSuggestion: "four_roleplay_value_candidates_with_one_sentence_narrative",
    inputType: "vlm_four_choice",
    candidateCount: 4,
    characterSpecPath: "contexts.questionnaire.values",
    options: Object.freeze([
      { value: "growth", label: "成長" },
      { value: "friendship", label: "友情" },
      { value: "freedom", label: "自由" },
      { value: "order", label: "秩序" },
      { value: "victory", label: "勝利" },
      { value: "knowledge", label: "知識" },
      { value: "protection", label: "守護" }
    ]),
    affects: Object.freeze({
      stats: Object.freeze(["valueProfiles statMods"]),
      traits: Object.freeze(["valueProfiles trait"]),
      skills: Object.freeze(["valueProfiles skillWord and future effect family"]),
      promptHooks: Object.freeze(["value motif"]),
      explanation: "價值觀由 VLM 產生角色創作候選，每個候選需要一句角色敘事；User 選定後才進技能家族，這不是判斷真人內在價值。"
    })
  }),
  Object.freeze({
    key: "weakness",
    label: "弱點 / 代價",
    prompt: "這個角色的弱點或使用能力的代價是什麼？",
    priority: "recommended",
    required: false,
    defaultValue: "",
    sourceOfTruth: "user_selected_from_vlm_candidates",
    modelSuggestion: "four_battle_tradeoff_candidates_from_expression_pose",
    inputType: "vlm_four_choice",
    candidateCount: 4,
    maxLength: 80,
    characterSpecPath: "contexts.questionnaire.weakness",
    examples: Object.freeze(["過度分析", "容易衝動", "消耗很大", "不耐久戰"]),
    affects: Object.freeze({
      stats: Object.freeze(["weaknessRules tradeoff statMods"]),
      traits: Object.freeze(["weaknessRules trait"]),
      skills: Object.freeze(["cooldown, risk/reward, counterplay hooks"]),
      promptHooks: Object.freeze(["tradeoff motif"]),
      explanation: "弱點是戰鬥代價候選，由 VLM 依表情/姿態產生戲劇性選項；不是對真人缺點的判斷。"
    })
  }),
  Object.freeze({
    key: "signatureItem",
    label: "招牌物品",
    prompt: "這個角色一定要帶著或象徵他的物品是什麼？",
    priority: "recommended",
    required: false,
    defaultValue: "",
    sourceOfTruth: "vlm_generated_from_visible_object_or_ocr",
    modelSuggestion: "auto_visible_or_ocr_supported",
    inputType: "vlm_auto_text_reviewable",
    maxLength: 36,
    characterSpecPath: "contexts.questionnaire.signatureItem",
    examples: Object.freeze(["耳機", "相機", "球鞋", "筆電", "護身符", "舊外套"]),
    affects: Object.freeze({
      stats: Object.freeze(["minor trait hook only in v1"]),
      traits: Object.freeze(["signature item holder trait"]),
      skills: Object.freeze(["passive or skill name flavor"]),
      promptHooks: Object.freeze(["signature item prop"]),
      explanation: "招牌物品讓卡圖有明確道具，也能變成技能名稱或被動效果的來源。"
    })
  }),
  Object.freeze({
    key: "storyEvent",
    label: "故事事件",
    prompt: "有沒有一件事可以成為這個角色的起源？",
    priority: "optional",
    required: false,
    defaultValue: "",
    sourceOfTruth: "system_selected_from_vlm_candidates",
    modelSuggestion: "four_fictional_origin_events_from_scene_context_then_seed_pick",
    inputType: "vlm_system_random_choice",
    candidateCount: 4,
    maxLength: 120,
    characterSpecPath: "contexts.questionnaire.storyEvents",
    examples: Object.freeze(["贏下一場街機挑戰", "旅途中迷路後找到新能力", "一場比賽後開始訓練"]),
    affects: Object.freeze({
      stats: Object.freeze(["none in v1"]),
      traits: Object.freeze(["lore and title flavor"]),
      skills: Object.freeze(["skill name flavor, future quest hook"]),
      promptHooks: Object.freeze(["story hooks"]),
      explanation: "故事事件由 VLM 根據可見場景與道具生成 4 個虛構起源，再由系統用 seed 隨機選一個進敘事與技能命名。"
    })
  }),
  Object.freeze({
    key: "cardMood",
    label: "卡面氣質",
    prompt: "你希望卡面氣質偏向？",
    priority: "visual",
    required: false,
    defaultValue: "cinematic",
    sourceOfTruth: "vlm_generated_from_visual_mood",
    modelSuggestion: "auto_from_lighting_palette_scene",
    inputType: "vlm_auto_select_reviewable",
    characterSpecPath: "generationProfile.cardMood",
    options: Object.freeze([
      { value: "cinematic", label: "電影感" },
      { value: "neon", label: "霓虹科技" },
      { value: "arcane", label: "祕法幻想" },
      { value: "royal", label: "史詩王者" }
    ]),
    affects: Object.freeze({
      stats: Object.freeze(["none"]),
      traits: Object.freeze(["none"]),
      skills: Object.freeze(["none"]),
      promptHooks: Object.freeze(["art direction"]),
      explanation: "卡面氣質只影響美術，不應該讓角色變強。"
    })
  })
]);

export const QUESTIONNAIRE_V1_EXCLUDED_FIELDS = Object.freeze([
  Object.freeze({
    key: "sensitiveCreativeContext",
    status: "future_only",
    reason: "Needs separate consent copy, storage policy, and non-stereotyping mechanics before product UI."
  }),
  Object.freeze({
    key: "captureContext",
    status: "automatic_context",
    reason: "Time, GPS, Google Maps place, and holiday context are acquired automatically after consent."
  }),
  Object.freeze({
    key: "detectedAgeGenderEthnicityPoliticsReligionHealth",
    status: "forbidden",
    reason: "Must never be inferred from photo, OCR, location, clothes, pose, or VLM output."
  })
]);

export const QUESTIONNAIRE_V1_CORE_KEYS = Object.freeze(
  QUESTIONNAIRE_V1_FIELDS.filter((field) => field.priority === "core").map((field) => field.key)
);

export function getQuestionnaireV1Field(key) {
  return QUESTIONNAIRE_V1_FIELDS.find((field) => field.key === key) ?? null;
}

export function getQuestionnaireV1Defaults() {
  return Object.fromEntries(QUESTIONNAIRE_V1_FIELDS.map((field) => [field.key, field.defaultValue]));
}

export const QUESTIONNAIRE_CURRENT_FLOW = QUESTIONNAIRE_V1_FLOW;
export const QUESTIONNAIRE_CURRENT_FIELDS = QUESTIONNAIRE_V1_FIELDS;
export const QUESTIONNAIRE_CURRENT_EXCLUDED_FIELDS = QUESTIONNAIRE_V1_EXCLUDED_FIELDS;
export const QUESTIONNAIRE_CURRENT_CORE_KEYS = QUESTIONNAIRE_V1_CORE_KEYS;

export function getQuestionnaireCurrentField(key) {
  return getQuestionnaireV1Field(key);
}

export function getQuestionnaireCurrentDefaults() {
  return getQuestionnaireV1Defaults();
}
