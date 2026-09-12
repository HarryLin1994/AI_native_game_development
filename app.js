const STORAGE_KEY = "photo-character-lab.characters.v1";
const DEFAULT_SUBJECT_FOCUS = "center_primary_subject";
const CARD_ART_PROMPT_VERSION = "card-art-prompt-v2.3-face-first-img2img";

const els = {
  imageInput: document.querySelector("#imageInput"),
  imagePreview: document.querySelector("#imagePreview"),
  cameraFeed: document.querySelector("#cameraFeed"),
  cameraButton: document.querySelector("#cameraButton"),
  captureButton: document.querySelector("#captureButton"),
  visionTagsButton: document.querySelector("#visionTagsButton"),
  summonButton: document.querySelector("#summonButton"),
  saveCardButton: document.querySelector("#saveCardButton"),
  rerollButton: document.querySelector("#rerollButton"),
  semanticTagsInput: document.querySelector("#semanticTagsInput"),
  sigilInput: document.querySelector("#sigilInput"),
  ageInput: document.querySelector("#ageInput"),
  occupationInput: document.querySelector("#occupationInput"),
  featureInput: document.querySelector("#featureInput"),
  combatStyleInput: document.querySelector("#combatStyleInput"),
  cardMoodInput: document.querySelector("#cardMoodInput"),
  imageModeInput: document.querySelector("#imageModeInput"),
  backstoryInput: document.querySelector("#backstoryInput"),
  valueInput: document.querySelector("#valueInput"),
  weaknessInput: document.querySelector("#weaknessInput"),
  signatureItemInput: document.querySelector("#signatureItemInput"),
  placeTypeInput: document.querySelector("#placeTypeInput"),
  timeMoodInput: document.querySelector("#timeMoodInput"),
  analysisCanvas: document.querySelector("#analysisCanvas"),
  analysisGrid: document.querySelector("#analysisGrid"),
  analysisState: document.querySelector("#analysisState"),
  captureFrame: document.querySelector(".capture-frame"),
  cardPreview: document.querySelector("#cardPreview"),
  deckList: document.querySelector("#deckList"),
  deckCount: document.querySelector("#deckCount"),
  startBattleButton: document.querySelector("#startBattleButton"),
  attackButton: document.querySelector("#attackButton"),
  skillOneButton: document.querySelector("#skillOneButton"),
  skillTwoButton: document.querySelector("#skillTwoButton"),
  guardButton: document.querySelector("#guardButton"),
  playerFighter: document.querySelector("#playerFighter"),
  enemyFighter: document.querySelector("#enemyFighter"),
  battleState: document.querySelector("#battleState"),
  battleLog: document.querySelector("#battleLog")
};

const state = {
  sourceImage: "",
  analysis: null,
  generatedCard: null,
  deck: loadDeck(),
  selectedCardId: null,
  stream: null,
  battle: null,
  reroll: 0
};

const archetypes = [
  {
    key: "flare",
    name: "焰行者",
    element: "Ember",
    accent: "#e46f4f",
    stat: "power",
    verbs: ["灼擊", "爆裂", "壓陣"]
  },
  {
    key: "volt",
    name: "脈衝客",
    element: "Voltage",
    accent: "#d8c64e",
    stat: "speed",
    verbs: ["閃步", "連鎖", "超載"]
  },
  {
    key: "veil",
    name: "影幕使",
    element: "Umbra",
    accent: "#9d83e6",
    stat: "focus",
    verbs: ["遮斷", "反制", "潛伏"]
  },
  {
    key: "aegis",
    name: "鐵壁衛",
    element: "Steel",
    accent: "#8aa0b6",
    stat: "guard",
    verbs: ["格擋", "固守", "迴響"]
  },
  {
    key: "tide",
    name: "潮汐術士",
    element: "Tide",
    accent: "#58aeca",
    stat: "focus",
    verbs: ["回流", "淨化", "導引"]
  },
  {
    key: "wild",
    name: "荒野契者",
    element: "Terra",
    accent: "#58c07b",
    stat: "luck",
    verbs: ["生長", "追獵", "契印"]
  }
];

const rarityTable = [
  { key: "N", name: "Normal", threshold: 0, bonus: 0 },
  { key: "R", name: "Rare", threshold: 55, bonus: 8 },
  { key: "SR", name: "Super Rare", threshold: 72, bonus: 15 },
  { key: "UR", name: "Ultra Rare", threshold: 86, bonus: 24 }
];

const statLabels = {
  power: "力量",
  speed: "速度",
  guard: "防禦",
  focus: "專注",
  luck: "幸運"
};

const cardStatLabels = {
  hp: "HP",
  atk: "ATK",
  def: "DEF",
  cost: "COST"
};

const metricLabels = {
  brightness: "亮度",
  contrast: "對比",
  saturation: "色彩",
  edgeDensity: "線條",
  centerFocus: "中心感",
  symmetry: "對稱",
  textSignal: "文字"
};

const ageProfiles = {
  teen: {
    label: "少年",
    statMods: { speed: 8, luck: 5, focus: -2 },
    trait: "成長潛能",
    skillWord: "閃耀"
  },
  young_adult: {
    label: "青年",
    statMods: { speed: 4, power: 4, focus: 2 },
    trait: "上升期",
    skillWord: "突破"
  },
  adult: {
    label: "成年",
    statMods: { power: 4, guard: 4, focus: 4 },
    trait: "實戰經驗",
    skillWord: "穩擊"
  },
  veteran: {
    label: "資深",
    statMods: { guard: 7, focus: 7, speed: -2 },
    trait: "老練判斷",
    skillWord: "沉著"
  },
  legend: {
    label: "傳奇",
    statMods: { power: 6, guard: 6, focus: 6, luck: 4 },
    trait: "傳奇氣場",
    skillWord: "終式"
  }
};

const combatStyleProfiles = {
  auto: { label: "自動判定", statMods: {}, preferredStat: null, role: null, trait: null, skillWord: null },
  striker: {
    label: "攻擊壓制",
    statMods: { power: 12, speed: 3, guard: -3 },
    preferredStat: "power",
    role: "Burst Striker",
    trait: "壓制火力",
    skillWord: "強襲"
  },
  duelist: {
    label: "速度連擊",
    statMods: { speed: 12, luck: 3, guard: -3 },
    preferredStat: "speed",
    role: "Tempo Duelist",
    trait: "連擊節奏",
    skillWord: "連閃"
  },
  guardian: {
    label: "防禦守護",
    statMods: { guard: 12, focus: 4, speed: -3 },
    preferredStat: "guard",
    role: "Frontline Defender",
    trait: "守護核心",
    skillWord: "壁壘"
  },
  controller: {
    label: "控制干擾",
    statMods: { focus: 12, luck: 2, power: -2 },
    preferredStat: "focus",
    role: "Control Caster",
    trait: "節奏控制",
    skillWord: "封鎖"
  },
  trickster: {
    label: "幸運奇襲",
    statMods: { luck: 12, speed: 4, guard: -2 },
    preferredStat: "luck",
    role: "Chaos Tactician",
    trait: "奇襲手段",
    skillWord: "逆轉"
  }
};

const valueProfiles = {
  growth: {
    label: "成長",
    statMods: { focus: 2, luck: 2 },
    trait: "成長意志",
    skillWord: "成長",
    archetypeBias: { wild: 0.12, tide: 0.1 }
  },
  friendship: {
    label: "友情",
    statMods: { focus: 4, guard: 4 },
    trait: "羈絆核心",
    skillWord: "羈絆",
    archetypeBias: { tide: 0.22, aegis: 0.18 }
  },
  freedom: {
    label: "自由",
    statMods: { speed: 6, luck: 3, guard: -1 },
    trait: "自由步伐",
    skillWord: "疾行",
    archetypeBias: { volt: 0.25, wild: 0.12 }
  },
  order: {
    label: "秩序",
    statMods: { guard: 5, focus: 4, speed: -1 },
    trait: "秩序框架",
    skillWord: "律令",
    archetypeBias: { aegis: 0.22, veil: 0.14 }
  },
  victory: {
    label: "勝利",
    statMods: { power: 6, speed: 2, guard: -1 },
    trait: "勝利執念",
    skillWord: "決勝",
    archetypeBias: { flare: 0.24, volt: 0.1 }
  },
  knowledge: {
    label: "知識",
    statMods: { focus: 7, luck: 1 },
    trait: "知識索引",
    skillWord: "洞察",
    archetypeBias: { veil: 0.22, volt: 0.16 }
  },
  protection: {
    label: "守護",
    statMods: { guard: 7, focus: 2, speed: -1 },
    trait: "守護誓約",
    skillWord: "守護",
    archetypeBias: { aegis: 0.28, tide: 0.12 }
  }
};

const placeTypeProfiles = {
  neutral: { label: "中性訓練場", statMods: {}, trait: "訓練場出身", archetypeBias: {} },
  indoor: { label: "室內", statMods: { focus: 2, guard: 1 }, trait: "室內戰術", archetypeBias: { veil: 0.14, aegis: 0.1 } },
  street: { label: "街道", statMods: { speed: 3, luck: 1 }, trait: "街頭節奏", archetypeBias: { volt: 0.18, veil: 0.1 } },
  school: { label: "學校", statMods: { focus: 4, luck: 1 }, trait: "學院迴路", archetypeBias: { tide: 0.12, veil: 0.12 } },
  office: { label: "辦公室", statMods: { focus: 3, guard: 2 }, trait: "指令中樞", archetypeBias: { volt: 0.14, aegis: 0.12 } },
  park: { label: "公園", statMods: { luck: 3, guard: 1 }, trait: "綠地呼吸", archetypeBias: { wild: 0.2, tide: 0.1 } },
  beach: { label: "海邊", statMods: { focus: 2, luck: 2 }, trait: "潮線記憶", archetypeBias: { tide: 0.28 } },
  mountain: { label: "山區", statMods: { guard: 3, power: 2 }, trait: "山脊耐性", archetypeBias: { wild: 0.22, aegis: 0.14 } },
  transit: { label: "交通場所", statMods: { speed: 4, focus: 1 }, trait: "轉乘步法", archetypeBias: { volt: 0.22 } }
};

const timeMoodProfiles = {
  clear: { label: "清晰日常", statMods: { focus: 1, guard: 1 }, trait: "清晰基準", archetypeBias: {} },
  sunny: { label: "晴朗", statMods: { power: 2, speed: 1 }, trait: "日光脈動", archetypeBias: { flare: 0.16, wild: 0.08 } },
  rainy: { label: "雨天", statMods: { focus: 2, guard: 2 }, trait: "雨幕節奏", archetypeBias: { tide: 0.22, veil: 0.08 } },
  night: { label: "夜晚", statMods: { focus: 2, luck: 2 }, trait: "夜行視野", archetypeBias: { veil: 0.2, volt: 0.08 } },
  dusk: { label: "黃昏", statMods: { power: 1, focus: 2 }, trait: "黃昏臨界", archetypeBias: { flare: 0.12, veil: 0.12 } },
  neon: { label: "霓虹", statMods: { speed: 3, focus: 1 }, trait: "霓虹訊號", archetypeBias: { volt: 0.24, veil: 0.1 } },
  quiet: { label: "安靜", statMods: { focus: 3, guard: 1 }, trait: "靜默判讀", archetypeBias: { tide: 0.12, veil: 0.1 } },
  chaotic: { label: "混亂", statMods: { luck: 4, speed: 1, guard: -1 }, trait: "混線反應", archetypeBias: { wild: 0.18, volt: 0.12 } }
};

const weaknessRules = [
  {
    patterns: ["過度分析", "想太多", "猶豫", "overthink"],
    statMods: { focus: 6, speed: -2 },
    trait: "思考負荷",
    tradeoff: "專注提高，但出手節奏偏慢。"
  },
  {
    patterns: ["衝動", "急躁", "莽撞", "impulsive"],
    statMods: { power: 5, guard: -2 },
    trait: "衝鋒代價",
    tradeoff: "開場火力提高，但防禦較不穩。"
  },
  {
    patterns: ["失去隊友", "隊友", "孤單", "alone"],
    statMods: { guard: 4, focus: 2, luck: -1 },
    trait: "羈絆壓力",
    tradeoff: "隊友受傷時更強，但單獨作戰較保守。"
  },
  {
    patterns: ["消耗", "疲勞", "體力", "高耗能"],
    statMods: { power: 4, focus: 4, speed: -2 },
    trait: "高耗能核心",
    tradeoff: "技能威力提高，但需要冷卻與代價。"
  },
  {
    patterns: ["脆弱", "不耐打", "怕痛", "fragile"],
    statMods: { speed: 4, luck: 2, guard: -3 },
    trait: "玻璃步伐",
    tradeoff: "迴避與爆發提高，但承受傷害能力下降。"
  }
];

const occupationRules = [
  {
    patterns: ["工程", "程式", "developer", "engineer", "研究", "科學", "資料"],
    statMods: { focus: 10, guard: 2 },
    trait: "解析職能",
    skillWord: "解析"
  },
  {
    patterns: ["醫", "護理", "治療", "藥", "心理"],
    statMods: { focus: 7, guard: 7 },
    trait: "支援職能",
    skillWord: "修復"
  },
  {
    patterns: ["學生", "老師", "教授", "教育"],
    statMods: { focus: 8, luck: 3 },
    trait: "學習迴路",
    skillWord: "研習"
  },
  {
    patterns: ["設計", "藝術", "音樂", "創作", "攝影"],
    statMods: { luck: 7, focus: 5 },
    trait: "創作感知",
    skillWord: "構圖"
  },
  {
    patterns: ["運動", "健身", "球", "舞", "武術"],
    statMods: { power: 7, speed: 7 },
    trait: "運動底盤",
    skillWord: "爆發"
  },
  {
    patterns: ["警", "軍", "消防", "保全", "救援"],
    statMods: { guard: 9, power: 5 },
    trait: "前線紀律",
    skillWord: "制壓"
  },
  {
    patterns: ["老闆", "管理", "經理", "pm", "企劃", "創業"],
    statMods: { focus: 6, guard: 5, luck: 3 },
    trait: "指揮職能",
    skillWord: "調度"
  }
];

function init() {
  bindEvents();
  renderDeck();
  renderBattle();
}

function bindEvents() {
  els.imageInput.addEventListener("change", handleImageUpload);
  els.cameraButton.addEventListener("click", toggleCamera);
  els.captureButton.addEventListener("click", captureCameraFrame);
  els.visionTagsButton.addEventListener("click", suggestVisibleSemanticTags);
  els.summonButton.addEventListener("click", summonCard);
  els.saveCardButton.addEventListener("click", saveGeneratedCard);
  els.rerollButton.addEventListener("click", rerollCardTitle);
  els.sigilInput.addEventListener("input", () => {
    if (state.sourceImage) {
      analyzeCurrentImage();
    }
  });
  els.semanticTagsInput.addEventListener("input", () => {
    if (state.sourceImage) {
      analyzeCurrentImage();
      els.saveCardButton.disabled = true;
      setStatus("語意已更新");
    }
  });
  [
    els.ageInput,
    els.occupationInput,
    els.featureInput,
    els.combatStyleInput,
    els.cardMoodInput,
    els.imageModeInput,
    els.backstoryInput,
    els.valueInput,
    els.weaknessInput,
    els.signatureItemInput,
    els.placeTypeInput,
    els.timeMoodInput
  ].forEach((input) => {
    input.addEventListener("input", markProfileChanged);
    input.addEventListener("change", markProfileChanged);
  });
  els.startBattleButton.addEventListener("click", startBattle);
  els.attackButton.addEventListener("click", () => playerAction({ type: "attack" }));
  els.skillOneButton.addEventListener("click", () => playerAction({ type: "skill", index: 0 }));
  els.skillTwoButton.addEventListener("click", () => playerAction({ type: "skill", index: 1 }));
  els.guardButton.addEventListener("click", () => playerAction({ type: "guard" }));
}

function markProfileChanged() {
  updateSummonAvailability();
  if (!state.sourceImage) return;
  els.saveCardButton.disabled = true;
  setStatus("設定已更新");
}

function hasPhotoConsent() {
  return true;
}

function readConfiguredImageMode(defaultMode) {
  const params = new URLSearchParams(window.location.search);
  const requestedMode = params.get("imageMode") ?? localStorage.getItem("photo-character-lab.imageMode") ?? defaultMode;
  return ["local", "comfy", "ai"].includes(requestedMode) ? requestedMode : defaultMode;
}

function updateSummonAvailability() {
  els.summonButton.disabled = !state.sourceImage || !hasPhotoConsent();
  els.visionTagsButton.disabled = !state.sourceImage;
}

async function handleImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    await stopCamera();
    const dataUrl = await readFileAsDataUrl(file);
    await setSourceImage(dataUrl);
  } catch (error) {
    console.warn(error);
    event.target.value = "";
    setStatus(error.message || "照片無法使用");
    updateSummonAvailability();
  }
}

async function toggleCamera() {
  if (state.stream) {
    await stopCamera();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    state.stream = stream;
    els.cameraFeed.srcObject = stream;
    await els.cameraFeed.play();
    await waitForCameraFrame(els.cameraFeed, { checkBrightness: false });
    els.captureFrame.classList.add("has-video");
    els.captureFrame.classList.remove("has-image");
    els.captureButton.disabled = false;
    els.cameraButton.textContent = "關閉相機";
    setStatus("相機已啟動");
  } catch (error) {
    setStatus("相機無法啟動");
    console.error(error);
  }
}

async function stopCamera() {
  if (!state.stream) return;
  state.stream.getTracks().forEach((track) => track.stop());
  state.stream = null;
  els.cameraFeed.srcObject = null;
  els.captureFrame.classList.remove("has-video");
  els.captureButton.disabled = true;
  els.cameraButton.textContent = "開啟相機";
}

async function captureCameraFrame() {
  if (!state.stream) return;
  try {
    setStatus("拍攝中");
    const dataUrl = await captureBestCameraFrame(state.stream, els.cameraFeed);
    await setSourceImage(dataUrl);
    await stopCamera();
  } catch (error) {
    console.warn(error);
    setStatus(error.message || "拍攝失敗，請重新拍攝");
    updateSummonAvailability();
  }
}

async function setSourceImage(dataUrl) {
  const normalizedImage = await normalizeImage(dataUrl);
  await assertUsableSourceImageDataUrl(normalizedImage);
  state.sourceImage = normalizedImage;
  state.generatedCard = null;
  state.reroll = 0;
  els.imagePreview.src = state.sourceImage;
  els.captureFrame.classList.add("has-image");
  updateSummonAvailability();
  els.saveCardButton.disabled = true;
  els.rerollButton.disabled = true;
  await analyzeCurrentImage();
}

async function analyzeCurrentImage() {
  if (!state.sourceImage) return;
  setStatus("分析中");
  state.analysis = await analyzeImage(state.sourceImage, els.sigilInput.value, els.semanticTagsInput.value);
  renderAnalysis(state.analysis);
  updateSummonAvailability();
  setStatus("可生成");
}

async function suggestVisibleSemanticTags() {
  if (!state.sourceImage) return;
  try {
    setStatus("VLM 解析中");
    els.visionTagsButton.disabled = true;
    const subjectImageDataUrl = await createCenterSubjectCropDataUrl(state.sourceImage);
    const result = await requestVisionTags(state.sourceImage, subjectImageDataUrl);
    if (!result.tags?.length) {
      setStatus("VLM 沒有回傳可用標籤");
      return;
    }
    els.semanticTagsInput.value = result.tags.join(", ");
    await analyzeCurrentImage();
    els.saveCardButton.disabled = true;
    setStatus(`VLM 候選 ${result.tags.length} 個`);
  } catch (error) {
    console.warn(error);
    setStatus(error.message || "VLM 解析失敗");
  } finally {
    updateSummonAvailability();
  }
}

async function summonCard() {
  if (!state.analysis || !state.sourceImage) return;
  if (!hasPhotoConsent()) {
    setStatus("請確認照片同意");
    return;
  }
  setStatus("生成卡牌中");
  els.summonButton.disabled = true;
  state.generatedCard = await createCard(state.analysis, state.sourceImage, state.reroll, readGenerationProfile());
  renderCard(state.generatedCard);
  els.saveCardButton.disabled = false;
  els.rerollButton.disabled = false;
  updateSummonAvailability();
  setStatus(`${state.generatedCard.rarity.name} 卡牌生成`);
}

function rerollCardTitle() {
  if (!state.analysis || !state.sourceImage) return;
  state.reroll += 1;
  summonCard();
}

function saveGeneratedCard() {
  if (!state.generatedCard) return;
  const saved = {
    ...state.generatedCard,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  state.deck.unshift(saved);
  state.selectedCardId = saved.id;
  persistDeck();
  renderDeck();
  els.startBattleButton.disabled = false;
}

function readGenerationProfile() {
  const ageBand = els.ageInput.value;
  const ageProfile = ageProfiles[ageBand] ?? ageProfiles.young_adult;
  const occupation = normalizeFreeText(els.occupationInput.value, 36);
  const features = normalizeFreeText(els.featureInput.value, 96);
  const combatStyle = els.combatStyleInput.value;
  const combatProfile = combatStyleProfiles[combatStyle] ?? combatStyleProfiles.auto;
  const cardMood = els.cardMoodInput.value;
  const imageMode = readConfiguredImageMode(els.imageModeInput.value);
  const backstory = normalizeFreeText(els.backstoryInput.value, 120);
  const valueKey = els.valueInput.value;
  const valueProfile = valueProfiles[valueKey] ?? valueProfiles.growth;
  const weakness = normalizeFreeText(els.weaknessInput.value, 80);
  const signatureItem = normalizeFreeText(els.signatureItemInput.value, 36);
  const placeType = els.placeTypeInput.value;
  const placeProfile = placeTypeProfiles[placeType] ?? placeTypeProfiles.neutral;
  const timeMood = els.timeMoodInput.value;
  const timeProfile = timeMoodProfiles[timeMood] ?? timeMoodProfiles.clear;
  return {
    photoConsent: hasPhotoConsent(),
    ageBand,
    ageLabel: ageProfile.label,
    occupation,
    features,
    featureTags: splitFeatureTags(features),
    combatStyle,
    combatStyleLabel: combatProfile.label,
    cardMood,
    imageMode,
    backstory,
    valueKey,
    valueLabel: valueProfile.label,
    weakness,
    weaknessRule: matchWeakness(weakness)?.trait ?? "",
    signatureItem,
    placeType,
    placeTypeLabel: placeProfile.label,
    timeMood,
    timeMoodLabel: timeProfile.label,
    userSuppliedContext: {
      backstory,
      values: [valueKey],
      weakness,
      signatureItem
    },
    captureContext: {
      placeType,
      timeMood,
      placeTypeLabel: placeProfile.label,
      timeMoodLabel: timeProfile.label
    }
  };
}

function createDefaultGenerationProfile() {
  const ageProfile = ageProfiles.young_adult;
  const combatProfile = combatStyleProfiles.auto;
  const valueProfile = valueProfiles.growth;
  const placeProfile = placeTypeProfiles.neutral;
  const timeProfile = timeMoodProfiles.clear;
  return {
    photoConsent: false,
    ageBand: "young_adult",
    ageLabel: ageProfile.label,
    occupation: "",
    features: "",
    featureTags: [],
    combatStyle: "auto",
    combatStyleLabel: combatProfile.label,
    cardMood: "cinematic",
    imageMode: "local",
    backstory: "",
    valueKey: "growth",
    valueLabel: valueProfile.label,
    weakness: "",
    weaknessRule: "",
    signatureItem: "",
    placeType: "neutral",
    placeTypeLabel: placeProfile.label,
    timeMood: "clear",
    timeMoodLabel: timeProfile.label,
    userSuppliedContext: {
      backstory: "",
      values: ["growth"],
      weakness: "",
      signatureItem: ""
    },
    captureContext: {
      placeType: "neutral",
      timeMood: "clear",
      placeTypeLabel: placeProfile.label,
      timeMoodLabel: timeProfile.label
    }
  };
}

function normalizeFreeText(value, maxLength) {
  return value
    .trim()
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function splitFeatureTags(value) {
  return [
    ...new Set(
      value
        .split(/[，,、/｜|\s]+/u)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length >= 2)
        .map((tag) => tag.slice(0, 10))
    )
  ].slice(0, 5);
}

function matchOccupation(value) {
  const text = value.trim().toLowerCase();
  if (!text) return null;
  return occupationRules.find((rule) => rule.patterns.some((pattern) => text.includes(pattern.toLowerCase()))) ?? null;
}

function matchWeakness(value) {
  const text = value.trim().toLowerCase();
  if (!text) return null;
  return weaknessRules.find((rule) => rule.patterns.some((pattern) => text.includes(pattern.toLowerCase()))) ?? null;
}

function applyProfileStatMods(stats, generationProfile) {
  const ageProfile = ageProfiles[generationProfile.ageBand] ?? ageProfiles.young_adult;
  const combatProfile = combatStyleProfiles[generationProfile.combatStyle] ?? combatStyleProfiles.auto;
  const occupationMatch = matchOccupation(generationProfile.occupation);
  const valueProfile = valueProfiles[generationProfile.valueKey] ?? valueProfiles.growth;
  const placeProfile = placeTypeProfiles[generationProfile.placeType] ?? placeTypeProfiles.neutral;
  const timeProfile = timeMoodProfiles[generationProfile.timeMood] ?? timeMoodProfiles.clear;
  const weaknessMatch = matchWeakness(generationProfile.weakness);
  applyStatMods(stats, ageProfile.statMods);
  applyStatMods(stats, combatProfile.statMods);
  applyStatMods(stats, valueProfile.statMods);
  applyStatMods(stats, placeProfile.statMods);
  applyStatMods(stats, timeProfile.statMods);
  if (occupationMatch) {
    applyStatMods(stats, occupationMatch.statMods);
  }
  if (weaknessMatch) {
    applyStatMods(stats, weaknessMatch.statMods);
  }

  for (const tag of generationProfile.featureTags) {
    const lower = tag.toLowerCase();
    if (lower.includes("眼鏡") || lower.includes("冷靜") || lower.includes("聰明")) applyStatMods(stats, { focus: 4 });
    if (lower.includes("運動") || lower.includes("肌肉") || lower.includes("強壯")) applyStatMods(stats, { power: 4 });
    if (lower.includes("短髮") || lower.includes("輕盈") || lower.includes("敏捷")) applyStatMods(stats, { speed: 4 });
    if (lower.includes("外套") || lower.includes("盔甲") || lower.includes("穩重")) applyStatMods(stats, { guard: 4 });
    if (lower.includes("笑") || lower.includes("幸運") || lower.includes("神秘")) applyStatMods(stats, { luck: 4 });
  }

  for (const key of Object.keys(stats)) {
    stats[key] = clamp(Math.round(stats[key]), 8, 99);
  }
}

function applyStatMods(stats, mods) {
  for (const [key, value] of Object.entries(mods ?? {})) {
    stats[key] = clamp((stats[key] ?? 0) + value, 1, 99);
  }
}

function applyArchetypeBias(scores, bias) {
  for (const [key, value] of Object.entries(bias ?? {})) {
    const score = scores.find((item) => item.key === key);
    if (score) score.score += value;
  }
}

function createOccupationArtifact(occupation) {
  const match = matchOccupation(occupation);
  if (!occupation.trim()) return "無名徽記";
  if (match?.trait === "解析職能") return "資料核心";
  if (match?.trait === "支援職能") return "治療徽章";
  if (match?.trait === "學習迴路") return "知識書頁";
  if (match?.trait === "創作感知") return "靈感筆觸";
  if (match?.trait === "運動底盤") return "動能護符";
  if (match?.trait === "前線紀律") return "前線盾章";
  if (match?.trait === "指揮職能") return "戰術指令牌";
  return `${occupation.slice(0, 6)}徽記`;
}

function createFutureImagePrompt(title, archetype, appearance, generationProfile, analysis) {
  const feature = generationProfile.featureTags.join("、") || "保留來源照片的主要人物特徵";
  const backstory = generationProfile.backstory || "rising challenger from the Localhost Training Gate";
  const signatureItem = generationProfile.signatureItem || appearance.occupationArtifact;
  const setting = `${generationProfile.placeTypeLabel} / ${generationProfile.timeMoodLabel}`;
  const weakness = generationProfile.weakness ? `tradeoff motif ${generationProfile.weakness}` : "balanced growth tradeoff";
  const promptTags = createPromptTagProfile(analysis);
  const palette = describePaletteForPrompt(analysis);
  const modelFit = describeModelFitProfile(generationProfile);
  return [
    `${CARD_ART_PROMPT_VERSION}`,
    "ROLE/PURPOSE: production character portrait art layer for game UI composition; the card frame and text will be rendered separately by the app",
    `SUBJECT: one target subject only, the same consenting person from the source photo, remade as ${title}, a ${archetype.element} ${archetype.name} game character`,
    "ANATOMY LOCK: preserve the source photo's believable human pose structure; natural hand placement, natural wrist angles, normal shoulder and neck connection, no extra limbs, no duplicated hands",
    `IDENTITY LOCK: preserve recognizable facial likeness from the source reference: face shape, jaw impression, eye and brow spacing, nose and mouth proportions, expression character`,
    `TARGET SUBJECT VISIBLE CUES: ${promptTags.subject}`,
    `CHARACTER SPEC: age direction ${generationProfile.ageLabel}; role ${generationProfile.occupation || "unspecified"}; values ${generationProfile.valueLabel}; traits ${feature}; artifact ${signatureItem}; tradeoff ${weakness}`,
    `WORLD CONTEXT FROM PHOTO: ${promptTags.world}`,
    `SCENE REMAKE: use the world context as inspiration, not as a literal photo trace; setting seed ${setting}; story seed ${backstory}`,
    `ART DIRECTION: ${modelFit.style}, high-contrast anime-real game character illustration, heroic upper-body crop, clean readable silhouette, sharp focal face, controlled detail density, dramatic rim light, energy accent ${archetype.accent}`,
    `PALETTE: ${palette}`,
    `TECHNICAL OUTPUT: full-bleed 768x1024 portrait art layer, no card frame, no UI, no text, no stat panel, no logo, no watermark`,
    "COMPOSITION LOCK: single foreground character, centered face and torso, dynamic but readable pose, background supports the subject, do not draw a trading card, do not draw a card border, no extra foreground people",
    `OUTFIT/PROP DIRECTION: ${appearance.outfit}; ${signatureItem}; keep target-subject clothing cues when visible`,
    "MODEL GUIDANCE: prioritize face likeness and believable human anatomy over style change; keep face recognizable; avoid over-transforming the body"
  ].join("\n");
}

function describePhotoSignalsForPrompt(analysis) {
  if (!analysis) return "no photo analysis available; use neutral training gate defaults";
  const m = analysis.metrics;
  const palette = (analysis.palette.length ? analysis.palette : [analysis.averageColor])
    .slice(0, 4)
    .map((color) => `${color.label} ${color.hex}`)
    .join(", ");
  const semanticTags = describeSemanticGroupsForPrompt(analysis);
  const intensity = [
    `brightness ${describeMetricBand(m.brightness)}`,
    `contrast ${describeMetricBand(m.contrast)}`,
    `saturation ${describeMetricBand(m.saturation)}`,
    `edge density ${describeMetricBand(m.edgeDensity)}`,
    `center focus ${describeMetricBand(m.centerFocus)}`,
    `symmetry ${describeMetricBand(m.symmetry)}`
  ].join(", ");
  const textSeed = analysis.textSeed ? `, OCR/manual text seed "${analysis.textSeed.slice(0, 32)}"` : "";
  return `palette ${palette}; ${intensity}; ${semanticTags}${textSeed}`;
}

function describeMetricBand(value) {
  if (value >= 0.68) return "high";
  if (value >= 0.42) return "medium";
  return "low";
}

function describeSemanticGroupsForPrompt(analysis) {
  const groups = analysis.visibleSemanticTagGroups ?? {};
  const orderedKeys = ["personAppearance", "scene", "activity", "object", "state", "clothing", "lighting", "composition", "visualSignal", "other"];
  const parts = orderedKeys
    .filter((key) => groups[key]?.length)
    .map((key) => `${key} [${groups[key].join(", ")}]`);
  if (!parts.length) return "visible semantic tags pending local vision model";
  return `visible semantic tags ${parts.join("; ")}`;
}

function createPromptTagProfile(analysis) {
  const groups = analysis?.visibleSemanticTagGroups ?? {};
  const subjectParts = [
    describeTagGroup(groups.personAppearance, "appearance"),
    describeTagGroup(groups.clothing, "clothing"),
    describeTagGroup(groups.state, "state")
  ].filter(Boolean);
  const worldParts = [
    describeTagGroup(groups.scene, "scene"),
    describeTagGroup(groups.activity, "activity"),
    describeTagGroup(groups.object, "objects"),
    describeTagGroup(groups.lighting, "lighting"),
    describeTagGroup(groups.composition, "composition"),
    describeTagGroup(groups.visualSignal, "visual signal")
  ].filter(Boolean);
  return {
    subject: subjectParts.join("; ") || "target subject details pending local VLM; rely on source photo reference",
    world: worldParts.join("; ") || "neutral card-world training space"
  };
}

function describeTagGroup(tags, label) {
  if (!tags?.length) return "";
  return `${label} [${tags.slice(0, 8).join(", ")}]`;
}

function describePaletteForPrompt(analysis) {
  if (!analysis) return "balanced card-art palette with clear subject/background separation";
  const colors = (analysis.palette.length ? analysis.palette : [analysis.averageColor])
    .slice(0, 4)
    .map((color) => `${color.label} ${color.hex}`)
    .join(", ");
  const m = analysis.metrics;
  return `${colors}; brightness ${describeMetricBand(m.brightness)}, contrast ${describeMetricBand(m.contrast)}, saturation ${describeMetricBand(m.saturation)}`;
}

function describeModelFitProfile(generationProfile) {
  const moodStyles = {
    cinematic: "cinematic game-character portrait with crisp illustration edges",
    neon: "neon arcade game-character portrait with saturated accent lighting",
    royal: "premium heroic game-character portrait with polished costume shapes",
    arcane: "mystic game-character portrait with controlled magical glow"
  };
  return {
    style: moodStyles[generationProfile.cardMood] ?? "cinematic game-character portrait with crisp illustration edges"
  };
}

function createCardArtNegativePrompt() {
  return [
    "text",
    "letters",
    "caption",
    "logo",
    "watermark",
    "signature",
    "card frame",
    "trading card",
    "card border",
    "decorative frame",
    "tarot frame",
    "ornate border",
    "UI border",
    "stat panel",
    "nameplate",
    "label",
    "title text",
    "text banner",
    "gibberish text",
    "extra foreground person",
    "second main character",
    "duplicate person",
    "crowd in foreground",
    "different face",
    "face swap",
    "identity document",
    "distorted face",
    "asymmetrical eyes",
    "bad anatomy",
    "deformed hands",
    "mutated fingers",
    "extra hand",
    "extra arm",
    "extra fingers",
    "missing fingers",
    "twisted arm",
    "broken wrist",
    "dislocated shoulder",
    "unnatural neck",
    "warped torso",
    "cropped head",
    "low quality",
    "blurry face",
    "raw camera snapshot",
    "plain photo retouch",
    "landscape-only image"
  ].join(", ");
}

async function createCard(analysis, sourceImageDataUrl, reroll, generationProfile) {
  const seedText = [
    analysis.hash,
    analysis.textSeed,
    generationProfile.ageBand,
    generationProfile.occupation,
    generationProfile.features,
    generationProfile.combatStyle,
    generationProfile.cardMood,
    generationProfile.backstory,
    generationProfile.valueKey,
    generationProfile.weakness,
    generationProfile.signatureItem,
    generationProfile.placeType,
    generationProfile.timeMood,
    analysis.metrics.brightness.toFixed(4),
    analysis.metrics.contrast.toFixed(4),
    reroll
  ].join(":");
  const seed = hashString(seedText);
  const rng = mulberry32(seed);
  const archetype = chooseArchetype(analysis, rng, generationProfile);
  const rarity = chooseRarity(analysis, rng);
  const title = createTitle(archetype, analysis, rng);
  const stats = createStats(analysis, archetype, rarity, rng, generationProfile);
  const hpBase = 96 + Math.round(stats.guard * 1.65 + stats.focus * 0.45);
  const traits = createTraits(analysis, archetype, generationProfile);
  const skills = createSkills(archetype, stats, traits, rng, generationProfile);
  const cardStatLine = deriveCardStatLineFromParts({ stats, hpBase, level: 1, rarity, skills });
  const appearance = createAppearance(analysis, archetype, rng, generationProfile);
  const personality = createPersonality(analysis, rng, generationProfile);
  const combatRole = createCombatRole(stats, archetype, generationProfile);
  const lore = createLore(title, archetype, traits, analysis, appearance, personality, generationProfile);
  const futureAiPrompt = createFutureImagePrompt(title, archetype, appearance, generationProfile, analysis);
  const cardArtNegativePrompt = createCardArtNegativePrompt();
  const characterSpec = {
    schema: "photo-character-lab.character.v1",
    source: "real_photo_local_analysis",
    identityPolicy: "no_identity_recognition",
    visualPipeline: {
      retouchMode:
        generationProfile.imageMode === "comfy"
          ? "comfyui_local_workflow"
          : generationProfile.imageMode === "ai"
            ? "openai_image_edit"
            : "local_canvas_preview_v1",
      coverMode: "battle_card_cover_canvas_v1",
      promptVersion: CARD_ART_PROMPT_VERSION,
      prompt: futureAiPrompt,
      negativePrompt: cardArtNegativePrompt
    },
    consent: {
      subject: "user_confirmed",
      photoUse: generationProfile.photoConsent,
      sensitiveContextUse: "none",
      captureContextUse: "manual_coarse"
    },
    userSuppliedContext: generationProfile.userSuppliedContext,
    captureContext: generationProfile.captureContext,
    photoSemantics: {
      textSeed: analysis.textSeed,
      subjectFocus: analysis.subjectFocus,
      visibleSemanticTags: analysis.visibleSemanticTags,
      visibleSemanticTagGroups: analysis.visibleSemanticTagGroups,
      source: analysis.semanticTagSource
    },
    generationProfile,
    name: title,
    className: archetype.name,
    element: archetype.element,
    rarity: rarity.key,
    appearance,
    personality,
    combatRole,
    traits,
    stats,
    cardStatLine,
    skills
  };
  let aiPortraitDataUrl = "";
  let imageGeneration = {
    mode: generationProfile.imageMode,
    status: "local_preview",
    model: null,
    promptVersion: CARD_ART_PROMPT_VERSION,
    error: null
  };

  if (generationProfile.imageMode === "ai") {
    try {
      setStatus("外部 AI 修飾中");
      const aiResult = await requestAiRetouch(sourceImageDataUrl, futureAiPrompt);
      aiPortraitDataUrl = aiResult.imageDataUrl;
      imageGeneration = {
        mode: "ai",
        status: "ai_generated",
        model: aiResult.model,
        promptVersion: CARD_ART_PROMPT_VERSION,
        error: null
      };
    } catch (error) {
      console.warn(error);
      imageGeneration = {
        mode: "ai",
        status: "fallback_local_preview",
        model: null,
        promptVersion: CARD_ART_PROMPT_VERSION,
        error: error.message
      };
    }
  }

  if (generationProfile.imageMode === "comfy") {
    try {
      setStatus("本機 AI 生圖中");
      const comfyResult = await requestComfyCardArt(sourceImageDataUrl, futureAiPrompt, {
        negativePrompt: cardArtNegativePrompt,
        seed,
        width: 768,
        height: 1024
      });
      aiPortraitDataUrl = comfyResult.imageDataUrl;
      imageGeneration = {
        mode: "comfy",
        status: "comfy_generated",
        model: "comfyui",
        promptVersion: CARD_ART_PROMPT_VERSION,
        promptId: comfyResult.promptId,
        workflow: comfyResult.workflow,
        source: comfyResult.source ?? null,
        output: comfyResult.output ?? null,
        error: null
      };
    } catch (error) {
      console.warn(error);
      imageGeneration = {
        mode: "comfy",
        status: "fallback_local_preview",
        model: "comfyui",
        promptVersion: CARD_ART_PROMPT_VERSION,
        source: error.source ?? null,
        output: error.output ?? null,
        error: error.message
      };
    }
  }

  if (!aiPortraitDataUrl) {
    aiPortraitDataUrl = await createRetouchedPortrait(sourceImageDataUrl, {
      archetype,
      rarity,
      appearance,
      generationProfile,
      analysis,
      rng: mulberry32(seed + 431)
    });
  }

  characterSpec.visualPipeline.result = imageGeneration;
  const imageDataUrl = await createCharacterArt(sourceImageDataUrl, {
    name: title,
    archetype,
    rarity,
    traits,
    appearance,
    personality,
    generationProfile,
    aiPortraitDataUrl,
    analysis,
    rng: mulberry32(seed + 991)
  });

  return {
    id: `preview-${seed}`,
    kind: "character",
    name: title,
    className: archetype.name,
    element: archetype.element,
    accent: archetype.accent,
    rarity,
    level: 1,
    xp: 0,
    wins: 0,
    losses: 0,
    hpBase,
    stats,
    cardStatLine,
    traits,
    skills,
    appearance,
    personality,
    combatRole,
    lore,
    characterSpec,
    imageGeneration,
    analysis,
    sourceImageDataUrl,
    aiPortraitDataUrl,
    imageDataUrl
  };
}

function chooseArchetype(analysis, rng, generationProfile) {
  const { metrics } = analysis;
  const scores = [
    { key: "flare", score: metrics.warmth * 1.2 + metrics.contrast * 0.6 },
    { key: "volt", score: metrics.edgeDensity * 1.4 + metrics.saturation * 0.7 },
    { key: "veil", score: (1 - metrics.brightness) * 0.8 + metrics.symmetry * 0.8 },
    { key: "aegis", score: metrics.centerFocus * 0.9 + metrics.contrast * 0.75 },
    { key: "tide", score: metrics.coolness * 1.1 + metrics.brightness * 0.4 },
    { key: "wild", score: metrics.colorEntropy * 0.8 + metrics.greenSignal * 1.1 + rng() * 0.2 }
  ];
  const styleStat = combatStyleProfiles[generationProfile.combatStyle]?.preferredStat;
  if (styleStat) {
    const statToKey = {
      power: "flare",
      speed: "volt",
      guard: "aegis",
      focus: "veil",
      luck: "wild"
    };
    const preferred = scores.find((score) => score.key === statToKey[styleStat]);
    if (preferred) preferred.score += 0.42;
  }
  const occupationMatch = matchOccupation(generationProfile.occupation);
  if (occupationMatch?.trait === "解析職能") {
    scores.find((score) => score.key === "volt").score += 0.22;
    scores.find((score) => score.key === "veil").score += 0.18;
  }
  if (occupationMatch?.trait === "支援職能") {
    scores.find((score) => score.key === "tide").score += 0.42;
  }
  if (occupationMatch?.trait === "運動底盤") {
    scores.find((score) => score.key === "flare").score += 0.26;
    scores.find((score) => score.key === "volt").score += 0.22;
  }
  applyArchetypeBias(scores, valueProfiles[generationProfile.valueKey]?.archetypeBias);
  applyArchetypeBias(scores, placeTypeProfiles[generationProfile.placeType]?.archetypeBias);
  applyArchetypeBias(scores, timeMoodProfiles[generationProfile.timeMood]?.archetypeBias);
  scores.sort((a, b) => b.score - a.score);
  return archetypes.find((item) => item.key === scores[0].key) ?? archetypes[0];
}

function chooseRarity(analysis, rng) {
  const { metrics } = analysis;
  const score = Math.round(
    metrics.contrast * 22 +
      metrics.saturation * 20 +
      metrics.edgeDensity * 18 +
      metrics.centerFocus * 16 +
      metrics.symmetry * 10 +
      metrics.textSignal * 8 +
      metrics.colorEntropy * 14 +
      rng() * 16
  );
  return [...rarityTable].reverse().find((rarity) => score >= rarity.threshold) ?? rarityTable[0];
}

function createStats(analysis, archetype, rarity, rng, generationProfile = readGenerationProfile()) {
  const m = analysis.metrics;
  const stats = {
    power: scoreStat(34 + m.contrast * 28 + m.warmth * 18 + m.edgeDensity * 10 + rng() * 12),
    speed: scoreStat(32 + m.edgeDensity * 30 + m.saturation * 18 + m.centerFocus * 8 + rng() * 12),
    guard: scoreStat(36 + m.centerFocus * 28 + m.symmetry * 14 + m.contrast * 9 + rng() * 12),
    focus: scoreStat(34 + m.symmetry * 22 + m.coolness * 16 + m.textSignal * 18 + rng() * 12),
    luck: scoreStat(30 + m.colorEntropy * 28 + m.saturation * 12 + m.textSignal * 15 + rng() * 18)
  };

  stats[archetype.stat] = clamp(stats[archetype.stat] + 8 + rarity.bonus, 1, 99);
  distributeBonus(stats, rarity.bonus, rng);
  applyProfileStatMods(stats, generationProfile);
  return stats;
}

function deriveCardStatLine(card) {
  return deriveCardStatLineFromParts({
    stats: card.stats ?? {},
    hpBase: card.hpBase ?? 0,
    level: card.level ?? 1,
    rarity: card.rarity ?? rarityTable[0],
    skills: card.skills ?? []
  });
}

function deriveCardStatLineFromParts({ stats, hpBase, level, rarity, skills }) {
  const rarityBonus = getRarityBonus(rarity);
  const rarityCost = getRarityCost(rarity);
  const safeLevel = Math.max(1, Number(level) || 1);
  const power = Number(stats.power) || 0;
  const speed = Number(stats.speed) || 0;
  const guard = Number(stats.guard) || 0;
  const focus = Number(stats.focus) || 0;
  const luck = Number(stats.luck) || 0;
  const total = power + speed + guard + focus + luck;
  return {
    hp: Math.round((hpBase + safeLevel * 8) * 34 + guard * 18 + focus * 9 + rarityBonus * 40),
    atk: Math.round(power * 76 + speed * 28 + focus * 18 + luck * 10 + rarityBonus * 78 + safeLevel * 38),
    def: Math.round(guard * 72 + focus * 26 + power * 8 + rarityBonus * 64 + safeLevel * 34),
    cost: clamp(Math.round(4 + rarityCost + total / 68 + skills.length * 2 + safeLevel / 12), 4, 99),
    level: safeLevel
  };
}

function getRarityBonus(rarity) {
  if (typeof rarity === "object" && rarity?.bonus !== undefined) return Number(rarity.bonus) || 0;
  return rarityTable.find((item) => item.key === rarity)?.bonus ?? 0;
}

function getRarityCost(rarity) {
  const key = typeof rarity === "object" ? rarity?.key : rarity;
  return {
    N: 0,
    R: 6,
    SR: 12,
    UR: 20
  }[key] ?? 0;
}

function scoreStat(value) {
  return clamp(Math.round(value), 18, 96);
}

function distributeBonus(stats, bonus, rng) {
  const keys = Object.keys(stats);
  for (let i = 0; i < bonus; i += 1) {
    const key = keys[Math.floor(rng() * keys.length)];
    stats[key] = clamp(stats[key] + 1, 1, 99);
  }
}

function createTitle(archetype, analysis, rng) {
  const prefixes = ["街角", "鏡界", "第七", "夜巡", "晨光", "逆風", "星塵", "霓虹", "鐵序", "潮聲"];
  const nouns = ["決鬥者", "調律師", "守望者", "召喚師", "破陣者", "策士", "行者", "執牌人"];
  const sigil = sanitizeSigil(analysis.textSeed);

  if (sigil && rng() > 0.42) {
    return `${sigil}的${archetype.name}`;
  }

  return `${pick(prefixes, rng)}${pick(nouns, rng)}`;
}

function sanitizeSigil(value) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "")
    .slice(0, 8);
}

function createTraits(analysis, archetype, generationProfile = readGenerationProfile()) {
  const m = analysis.metrics;
  const traits = [archetype.element];
  const ageProfile = ageProfiles[generationProfile.ageBand] ?? ageProfiles.young_adult;
  const combatProfile = combatStyleProfiles[generationProfile.combatStyle] ?? combatStyleProfiles.auto;
  const occupationMatch = matchOccupation(generationProfile.occupation);
  const valueProfile = valueProfiles[generationProfile.valueKey] ?? valueProfiles.growth;
  const placeProfile = placeTypeProfiles[generationProfile.placeType] ?? placeTypeProfiles.neutral;
  const timeProfile = timeMoodProfiles[generationProfile.timeMood] ?? timeMoodProfiles.clear;
  const weaknessMatch = matchWeakness(generationProfile.weakness);
  if (m.edgeDensity > 0.52) traits.push("高速輪廓");
  if (m.centerFocus > 0.58) traits.push("中心壓制");
  if (m.symmetry > 0.62) traits.push("穩定姿態");
  if (m.saturation > 0.5) traits.push("鮮明氣場");
  if (m.textSignal > 0.2) traits.push("文字契印");
  if (m.contrast > 0.55) traits.push("強對比");
  traits.push(ageProfile.trait);
  if (combatProfile.trait) traits.push(combatProfile.trait);
  if (occupationMatch?.trait) traits.push(occupationMatch.trait);
  if (valueProfile.trait) traits.push(valueProfile.trait);
  if (placeProfile.trait) traits.push(placeProfile.trait);
  if (timeProfile.trait) traits.push(timeProfile.trait);
  if (weaknessMatch?.trait) traits.push(weaknessMatch.trait);
  if (generationProfile.signatureItem) traits.push(`${generationProfile.signatureItem.slice(0, 6)}持有者`);
  for (const tag of generationProfile.featureTags.slice(0, 2)) {
    traits.push(tag);
  }
  if (traits.length < 4) traits.push("未定型");
  return [...new Set(traits)].slice(0, 7);
}

function createAppearance(analysis, archetype, rng, generationProfile = readGenerationProfile()) {
  const m = analysis.metrics;
  const palette = analysis.palette.length ? analysis.palette : [{ hex: analysis.averageColor.hex, label: analysis.averageColor.label }];
  const silhouette = m.centerFocus > 0.62 ? "集中型輪廓" : m.symmetry > 0.64 ? "平衡型輪廓" : "流動型輪廓";
  const motion = m.edgeDensity > 0.55 ? "高速動勢" : m.contrast > 0.52 ? "強烈站姿" : "穩定待機";
  const aura = m.saturation > 0.55 ? "高彩度氣場" : m.brightness > 0.58 ? "明亮氣場" : "低光氣場";
  const outfit = pick(
    archetype.key === "aegis"
      ? ["戰術外套", "護甲長衣", "重裝披肩"]
      : archetype.key === "volt"
        ? ["短版機能服", "導電斗篷", "霓虹腰帶"]
        : archetype.key === "veil"
          ? ["暗紋長袍", "遮面披風", "影線外套"]
          : ["冒險披肩", "符紋夾克", "輕裝戰衣"],
    rng
  );
  const definingFeature = generationProfile.featureTags[0] ?? "未指定特徵";
  const occupationArtifact = generationProfile.signatureItem || createOccupationArtifact(generationProfile.occupation);
  const originBackdrop = `${generationProfile.placeTypeLabel ?? "中性訓練場"} / ${generationProfile.timeMoodLabel ?? "清晰日常"}`;

  return {
    silhouette,
    motion,
    aura,
    outfit,
    definingFeature,
    occupationArtifact,
    originBackdrop,
    palette: palette.slice(0, 4).map((color) => ({
      name: color.label,
      hex: color.hex,
      weight: Number(color.weight?.toFixed?.(3) ?? 1)
    }))
  };
}

function createPersonality(analysis, rng, generationProfile = readGenerationProfile()) {
  const m = analysis.metrics;
  const ageProfile = ageProfiles[generationProfile.ageBand] ?? ageProfiles.young_adult;
  const weaknessMatch = matchWeakness(generationProfile.weakness);
  const temperament =
    ageProfile.label === "資深" || ageProfile.label === "傳奇"
      ? "沉穩"
      : m.contrast > 0.55
        ? "果斷"
        : m.symmetry > 0.64
          ? "冷靜"
          : "靈活";
  const instinct = m.edgeDensity > 0.56 ? "先手壓制" : m.centerFocus > 0.58 ? "觀察反擊" : "資源累積";
  const flaw =
    generationProfile.weakness ||
    pick(m.brightness > 0.58 ? ["容易過度相信局勢", "不擅長隱藏意圖"] : ["初期節奏偏慢", "容易被持續干擾"], rng);
  return {
    temperament,
    instinct,
    flaw,
    tradeoff: weaknessMatch?.tradeoff ?? "標準成長代價。"
  };
}

function createCombatRole(stats, archetype, generationProfile = readGenerationProfile()) {
  const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  const top = entries[0][0];
  const second = entries[1][0];
  const combatProfile = combatStyleProfiles[generationProfile.combatStyle] ?? combatStyleProfiles.auto;
  const roleMap = {
    power: "Burst Striker",
    speed: "Tempo Duelist",
    guard: "Frontline Defender",
    focus: "Control Caster",
    luck: "Chaos Tactician"
  };

  return {
    role: combatProfile.role ?? roleMap[top],
    primaryStat: combatProfile.preferredStat ?? top,
    secondaryStat: second,
    battlePlan: `${statLabels[combatProfile.preferredStat ?? top]}主軸，搭配${statLabels[second]}建立${archetype.element}系節奏。`
  };
}

function createSkills(archetype, stats, traits, rng, generationProfile = readGenerationProfile()) {
  const combatProfile = combatStyleProfiles[generationProfile.combatStyle] ?? combatStyleProfiles.auto;
  const ageProfile = ageProfiles[generationProfile.ageBand] ?? ageProfiles.young_adult;
  const occupationMatch = matchOccupation(generationProfile.occupation);
  const valueProfile = valueProfiles[generationProfile.valueKey] ?? valueProfiles.growth;
  const weaknessMatch = matchWeakness(generationProfile.weakness);
  const primary = combatProfile.preferredStat ?? archetype.stat;
  const secondary = primary === "power" ? "speed" : primary === "guard" ? "focus" : "power";
  const skillPower = Math.round(stats[primary] * 0.58 + stats[secondary] * 0.22);
  const utilityPower = Math.round(stats.focus * 0.35 + stats.luck * 0.22 + 10);
  const signatureWord = occupationMatch?.skillWord ?? combatProfile.skillWord ?? valueProfile.skillWord ?? ageProfile.skillWord;
  const signatureItem = generationProfile.signatureItem?.slice(0, 8);
  return [
    {
      name: `${signatureWord}${pick(["式", "連段", "戰術"], rng)}`,
      type: "strike",
      power: skillPower,
      text: `${statLabels[primary]}轉化為一次高倍率攻擊，價值核心為${valueProfile.label}。`
    },
    {
      name: signatureItem
        ? `${signatureItem}回路`
        : traits.includes("文字契印")
          ? "契印回路"
          : `${archetype.element}${combatProfile.preferredStat === "guard" ? "堡壘" : "屏障"}`,
      type: "guard",
      power: utilityPower,
      text: weaknessMatch
        ? `${weaknessMatch.tradeoff} 發動後獲得護盾並降低承受傷害。`
        : generationProfile.featureTags[0]
          ? `以${generationProfile.featureTags[0]}作為戰術核心，獲得護盾並降低承受傷害。`
          : "獲得護盾，並在本回合降低承受傷害。"
    }
  ];
}

function createLore(title, archetype, traits, analysis, appearance, personality, generationProfile = readGenerationProfile()) {
  const dominant = analysis.palette[0]?.label ?? "Unknown";
  const occupation = generationProfile.occupation || "未知身份";
  const feature = generationProfile.featureTags[0] ?? "照片特徵";
  const story = generationProfile.backstory ? `${generationProfile.backstory}。` : "";
  const weakness = generationProfile.weakness ? `弱點是${generationProfile.weakness}，因此戰鬥帶有${personality.tradeoff}` : "";
  return `${story}${title}是${archetype.element}系${archetype.name}，由${occupation}、${feature}、${generationProfile.valueLabel}與${appearance.originBackdrop}轉化而來。外觀被轉譯為${appearance.silhouette}與${appearance.aura}。性格傾向${personality.temperament}，以${traits.slice(1, 3).join("、") || "原始氣場"}建立戰鬥節奏。${weakness}主色訊號為 ${dominant}。`;
}

async function requestAiRetouch(sourceImageDataUrl, prompt) {
  const response = await fetch("/api/ai-retouch", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      imageDataUrl: sourceImageDataUrl,
      prompt,
      size: "1024x1536",
      quality: "medium",
      inputFidelity: "high"
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.details?.error?.message ?? payload.message ?? payload.error ?? "AI image generation failed.";
    throw new Error(detail);
  }
  if (!payload.imageDataUrl) {
    throw new Error("AI image API did not return an inline image.");
  }
  return payload;
}

async function requestComfyCardArt(sourceImageDataUrl, prompt, options = {}) {
  const response = await fetch("/api/comfy-card-art", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      imageDataUrl: sourceImageDataUrl,
      prompt,
      negativePrompt: options.negativePrompt ?? createCardArtNegativePrompt(),
      seed: options.seed,
      width: options.width ?? 768,
      height: options.height ?? 1024
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.message ?? payload.error ?? "ComfyUI image generation failed.";
    throw new Error(detail);
  }
  if (!payload.imageDataUrl) {
    throw new Error("ComfyUI did not return an inline image.");
  }
  try {
    await assertVisibleImageDataUrl(payload.imageDataUrl);
  } catch (error) {
    error.source = payload.source ?? null;
    error.output = payload.output ?? null;
    throw error;
  }
  return payload;
}

async function requestVisionTags(sourceImageDataUrl, subjectImageDataUrl) {
  const response = await fetch("/api/vision-tags", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      imageDataUrl: sourceImageDataUrl,
      subjectImageDataUrl,
      subjectFocus: DEFAULT_SUBJECT_FOCUS
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.hint ?? payload.message ?? payload.error ?? "VLM semantic tag generation failed.";
    throw new Error(detail);
  }
  return payload;
}

async function createRetouchedPortrait(sourceImageDataUrl, spec) {
  const image = await loadImage(sourceImageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = 540;
  canvas.height = 720;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { archetype, appearance, generationProfile, analysis, rng } = spec;
  const mood = generationProfile.cardMood;
  const accent = archetype.accent;

  ctx.fillStyle = "#10141b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCover(ctx, image, canvas.width, canvas.height);
  stylizeImageData(ctx, canvas.width, canvas.height, analysis, accent);

  ctx.save();
  ctx.globalCompositeOperation = mood === "neon" ? "screen" : "soft-light";
  const overlay = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  overlay.addColorStop(0, withAlpha(accent, mood === "royal" ? 0.22 : 0.34));
  overlay.addColorStop(0.52, withAlpha(analysis.averageColor.hex, 0.12));
  overlay.addColorStop(1, mood === "arcane" ? "rgba(80,58,130,0.38)" : "rgba(0,0,0,0.24)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8 + Math.round(analysis.metrics.edgeDensity * 10); i += 1) {
    ctx.strokeStyle = withAlpha(accent, 0.12 + rng() * 0.18);
    ctx.beginPath();
    const startX = rng() * canvas.width;
    const startY = rng() * canvas.height;
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + (rng() - 0.5) * 160,
      startY + (rng() - 0.5) * 260,
      startX + (rng() - 0.5) * 240,
      startY + (rng() - 0.5) * 320,
      startX + (rng() - 0.5) * 300,
      startY + (rng() - 0.5) * 420
    );
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "rgba(0,0,0,0.46)";
  ctx.fillRect(0, canvas.height - 112, canvas.width, 112);
  ctx.fillStyle = "#f4f0e8";
  ctx.font = "800 28px system-ui, -apple-system, sans-serif";
  ctx.fillText(appearance.definingFeature, 28, canvas.height - 82, 420);
  ctx.fillStyle = accent;
  ctx.font = "700 18px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${appearance.outfit} / ${appearance.occupationArtifact}`, 30, canvas.height - 42, 460);

  return canvas.toDataURL("image/jpeg", 0.9);
}

async function createCharacterArt(sourceImageDataUrl, spec) {
  const image = await loadImage(spec.aiPortraitDataUrl ?? sourceImageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 940;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { archetype, rarity, appearance, analysis, generationProfile, rng } = spec;
  const accent = archetype.accent;
  const deepColor = darkenColor(accent, 0.42);
  const highlight = analysis.palette[1]?.hex ?? analysis.averageColor.hex;
  const mood = generationProfile?.cardMood ?? "cinematic";

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, deepColor);
  bg.addColorStop(0.54, "#111820");
  bg.addColorStop(1, "#0b0d10");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.filter = mood === "neon" ? "blur(18px) saturate(1.8) contrast(1.12)" : "blur(18px) saturate(1.3) contrast(1.08)";
  drawCover(ctx, image, canvas.width, canvas.height);
  ctx.restore();

  const portrait = document.createElement("canvas");
  portrait.width = 420;
  portrait.height = 560;
  const pctx = portrait.getContext("2d", { willReadFrequently: true });
  drawCover(pctx, image, portrait.width, portrait.height);
  stylizeImageData(pctx, portrait.width, portrait.height, analysis, accent);

  const frameX = 82;
  const frameY = 84;
  const frameW = 556;
  const frameH = 668;
  roundRect(ctx, frameX, frameY, frameW, frameH, 8);
  ctx.fillStyle = "#0f141b";
  ctx.fill();
  ctx.save();
  roundRect(ctx, frameX + 10, frameY + 10, frameW - 20, frameH - 20, 7);
  ctx.clip();
  ctx.drawImage(portrait, frameX + 10, frameY + 10, frameW - 20, frameH - 20);
  ctx.globalCompositeOperation = "screen";
  const aura = ctx.createRadialGradient(360, 340, 40, 360, 360, 430);
  aura.addColorStop(0, withAlpha(accent, 0.38));
  aura.addColorStop(0.58, withAlpha(highlight, 0.18));
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.fillRect(frameX, frameY, frameW, frameH);
  ctx.restore();

  drawEnergyLines(ctx, canvas.width, canvas.height, accent, rng, analysis.metrics.edgeDensity);
  drawCharacterFrame(ctx, frameX, frameY, frameW, frameH, accent, rarity.key);
  drawClassSigil(ctx, 106, 104, 86, archetype, rng);

  ctx.fillStyle = "rgba(5,7,10,0.76)";
  ctx.fillRect(0, 742, canvas.width, 198);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 742, canvas.width, 4);

  ctx.fillStyle = "#f4f0e8";
  ctx.font = "800 44px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(spec.name, 48, 776, 520);

  ctx.font = "700 22px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = accent;
  ctx.fillText(`${rarity.key} / ${archetype.name} / ${archetype.element}`, 50, 833, 600);

  ctx.font = "500 20px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#c8d0db";
  wrapCanvasText(
    ctx,
    `${appearance.silhouette}、${appearance.motion}、${appearance.outfit}、${appearance.definingFeature}`,
    50,
    872,
    612,
    28,
    2
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

function stylizeImageData(ctx, width, height, analysis, accent) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const accentRgb = hexToRgb(accent);
  const contrast = 1.04 + analysis.metrics.contrast * 0.32;
  const saturation = 1.05 + analysis.metrics.saturation * 0.38;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    r = luma + (r - luma) * saturation;
    g = luma + (g - luma) * saturation;
    b = luma + (b - luma) * saturation;

    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    const shade = luma < 72 ? 0.78 : luma > 184 ? 1.12 : 1;
    r = Math.round((Math.round(r / 28) * 28 * 0.9 + accentRgb[0] * 0.1) * shade);
    g = Math.round((Math.round(g / 28) * 28 * 0.9 + accentRgb[1] * 0.1) * shade);
    b = Math.round((Math.round(b / 28) * 28 * 0.9 + accentRgb[2] * 0.1) * shade);

    data[i] = clamp(r, 0, 255);
    data[i + 1] = clamp(g, 0, 255);
    data[i + 2] = clamp(b, 0, 255);
  }

  ctx.putImageData(imageData, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(12,14,18,0.16)";
  for (let y = 0; y < height; y += 9) {
    ctx.fillRect(0, y, width, 2);
  }
  ctx.restore();
}

function drawEnergyLines(ctx, width, height, accent, rng, density) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 18 + Math.round(density * 14); i += 1) {
    const startX = rng() * width;
    const startY = rng() * height;
    ctx.strokeStyle = withAlpha(accent, 0.08 + rng() * 0.22);
    ctx.lineWidth = 1 + rng() * 4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + (rng() - 0.5) * 300, startY + (rng() - 0.5) * 420);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCharacterFrame(ctx, x, y, width, height, accent, rarityKey) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = accent;
  roundRect(ctx, x, y, width, height, 8);
  ctx.stroke();
  ctx.strokeStyle = "rgba(244,240,232,0.34)";
  ctx.lineWidth = 1;
  roundRect(ctx, x + 12, y + 12, width - 24, height - 24, 6);
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.72)";
  roundRect(ctx, x + width - 104, y + 20, 74, 44, 8);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.font = "900 24px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(rarityKey, x + width - 67, y + 42);
  ctx.restore();
}

function drawClassSigil(ctx, x, y, size, archetype, rng) {
  const half = size / 2;
  ctx.save();
  ctx.translate(x + half, y + half);
  ctx.rotate(rng() * Math.PI);
  ctx.strokeStyle = archetype.accent;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    const px = Math.cos(angle) * half;
    const py = Math.sin(angle) * half;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, half * 0.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-half * 0.52, 0);
  ctx.lineTo(half * 0.52, 0);
  ctx.moveTo(0, -half * 0.52);
  ctx.lineTo(0, half * 0.52);
  ctx.stroke();
  ctx.restore();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = [...text];
  let line = "";
  let lines = 0;
  for (const word of words) {
    const test = line + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      line = word;
      lines += 1;
      if (lines >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) {
    ctx.fillText(line, x, y + lines * lineHeight);
  }
}

async function analyzeImage(dataUrl, textSeed, semanticTagsText = "") {
  const image = await loadImage(dataUrl);
  const canvas = els.analysisCanvas;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  drawCover(ctx, image, width, height);

  const { data } = ctx.getImageData(0, 0, width, height);
  const samples = [];
  const luma = new Float32Array(width * height);
  const histogram = new Array(16).fill(0);
  const buckets = new Map();
  let rTotal = 0;
  let gTotal = 0;
  let bTotal = 0;
  let satTotal = 0;
  let lumaTotal = 0;
  let warmCount = 0;
  let coolCount = 0;
  let greenCount = 0;
  let centerLuma = 0;
  let borderLuma = 0;
  let centerCount = 0;
  let borderCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const { s } = rgbToHsl(r, g, b);
      const pos = y * width + x;
      luma[pos] = lum;
      lumaTotal += lum;
      satTotal += s;
      rTotal += r;
      gTotal += g;
      bTotal += b;
      histogram[Math.min(15, Math.floor(lum * 16))] += 1;

      const qr = Math.round(r / 36) * 36;
      const qg = Math.round(g / 36) * 36;
      const qb = Math.round(b / 36) * 36;
      const key = `${qr},${qg},${qb}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);

      if (r > b + 20 && r > g - 8) warmCount += 1;
      if (b > r + 15) coolCount += 1;
      if (g > r + 8 && g > b + 8) greenCount += 1;

      const nx = Math.abs(x / width - 0.5);
      const ny = Math.abs(y / height - 0.5);
      if (nx < 0.24 && ny < 0.3) {
        centerLuma += lum;
        centerCount += 1;
      }
      if (x < 14 || y < 14 || x > width - 15 || y > height - 15) {
        borderLuma += lum;
        borderCount += 1;
      }

      if (x % 4 === 0 && y % 4 === 0) {
        samples.push(r, g, b);
      }
    }
  }

  const pixelCount = width * height;
  const brightness = lumaTotal / pixelCount;
  const saturation = satTotal / pixelCount;
  let variance = 0;
  for (let i = 0; i < luma.length; i += 1) {
    variance += (luma[i] - brightness) ** 2;
  }
  const contrast = clamp(Math.sqrt(variance / luma.length) * 2.4, 0, 1);
  const edgeDensity = calculateEdges(luma, width, height);
  const symmetry = calculateSymmetry(luma, width, height);
  const centerAvg = centerLuma / Math.max(1, centerCount);
  const borderAvg = borderLuma / Math.max(1, borderCount);
  const centerFocus = clamp(0.5 + Math.abs(centerAvg - borderAvg) * 1.8 + saturation * 0.22, 0, 1);
  const colorEntropy = calculateEntropy(histogram);
  const textSignal = clamp([...textSeed.trim()].length / 28, 0, 1);
  const hash = hashString(`${samples.join(",")}:${textSeed.trim()}`);
  const avgColor = [rTotal / pixelCount, gTotal / pixelCount, bTotal / pixelCount].map(Math.round);
  const metrics = {
    brightness,
    contrast,
    saturation,
    edgeDensity,
    centerFocus,
    symmetry,
    textSignal,
    colorEntropy,
    warmth: warmCount / pixelCount,
    coolness: coolCount / pixelCount,
    greenSignal: greenCount / pixelCount
  };

  const palette = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const rgb = key.split(",").map(Number);
      return {
        rgb,
        hex: rgbToHex(rgb),
        weight: count / pixelCount,
        label: describeColor(rgb)
      };
    });
  const userSemanticTags = normalizeVisibleSemanticTags(semanticTagsText);
  const canvasSignalTags = deriveVisibleSemanticTags(metrics);
  const visibleSemanticTags = mergeUniqueTags([...userSemanticTags, ...canvasSignalTags], 20);

  return {
    hash,
    textSeed: textSeed.trim(),
    subjectFocus: DEFAULT_SUBJECT_FOCUS,
    visibleSemanticTags,
    visibleSemanticTagGroups: categorizeVisibleSemanticTags(visibleSemanticTags),
    semanticTagSource: userSemanticTags.length
      ? "manual_vlm_calibration_plus_deterministic_canvas_signals_v1"
      : "deterministic_canvas_signals_v1",
    averageColor: {
      rgb: avgColor,
      hex: rgbToHex(avgColor),
      label: describeColor(avgColor)
    },
    palette,
    metrics
  };
}

function deriveVisibleSemanticTags(metrics) {
  const tags = [];
  if (metrics.centerFocus > 0.62) tags.push("centered subject");
  if (metrics.edgeDensity > 0.58) tags.push("high motion detail");
  if (metrics.contrast > 0.58) tags.push("dramatic contrast");
  if (metrics.saturation > 0.58) tags.push("vivid color energy");
  if (metrics.brightness < 0.36) tags.push("low light mood");
  if (metrics.brightness > 0.66) tags.push("bright light mood");
  if (metrics.warmth > metrics.coolness + 0.12) tags.push("warm palette");
  if (metrics.coolness > metrics.warmth + 0.12) tags.push("cool palette");
  if (metrics.greenSignal > 0.18) tags.push("green environment cue");
  if (metrics.symmetry > 0.64) tags.push("balanced composition");
  return tags.slice(0, 6);
}

function normalizeVisibleSemanticTags(value) {
  return mergeUniqueTags(
    String(value ?? "")
      .split(/[,，、\n;]/u)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => tag.replace(/\s+/gu, " ").slice(0, 32)),
    18
  );
}

function mergeUniqueTags(tags, limit = 12) {
  const seen = new Set();
  const result = [];
  for (const tag of tags) {
    const normalized = String(tag ?? "").trim();
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length >= limit) break;
  }
  return result;
}

function categorizeVisibleSemanticTags(tags) {
  const groups = {
    personAppearance: [],
    scene: [],
    activity: [],
    object: [],
    state: [],
    clothing: [],
    lighting: [],
    composition: [],
    visualSignal: [],
    other: []
  };

  for (const tag of tags) {
    const category = chooseSemanticCategory(tag);
    groups[category].push(tag);
  }

  return Object.fromEntries(Object.entries(groups).filter(([, values]) => values.length));
}

function chooseSemanticCategory(tag) {
  const lower = tag.toLocaleLowerCase();
  if (/(sweaty|tired|exhausted|celebrating|out of breath|氣喘|流汗|疲憊|慶祝)/u.test(lower)) return "state";
  if (/(wearing headphones|wearing glasses|wearing sunglasses|wearing headband|wearing cap|wearing hat|headphones on|戴耳機|戴眼鏡|戴墨鏡|戴頭帶|戴帽)/u.test(lower)) return "personAppearance";
  if (/(playing|dancing|holding|running|training|post-game|跳舞|跑步|訓練|打球|拿著)/u.test(lower)) return "activity";
  if (/(night club|nightclub|club room|club scene)/u.test(lower)) return "scene";
  if (/(game console|game machine|game machines|controller|microphone|poster|sign|pac-man|pacman|galaga|disco ball|phone|camera|laptop|book|headphones|手把|麥克風|海報|招牌|手機|相機|筆電|書|耳機)/u.test(lower)) return "object";
  const categoryPatterns = [
    {
      key: "personAppearance",
      patterns: [
        "visible face",
        "face visible",
        "face",
        "hair",
        "hairstyle",
        "curly",
        "short hair",
        "long hair",
        "bangs",
        "beard",
        "mustache",
        "glasses",
        "sunglasses",
        "smile",
        "smiling",
        "open mouth",
        "tongue",
        "expression",
        "pose",
        "standing",
        "sitting",
        "upper-body",
        "full-body",
        "headband",
        "visor",
        "cap",
        "hat",
        "accessory",
        "subject crop",
        "臉",
        "可見臉",
        "頭髮",
        "髮型",
        "捲髮",
        "短髮",
        "長髮",
        "瀏海",
        "鬍子",
        "眼鏡",
        "墨鏡",
        "微笑",
        "張嘴",
        "吐舌",
        "表情",
        "姿勢",
        "站姿",
        "坐姿",
        "半身",
        "全身",
        "頭帶",
        "帽子",
        "配件"
      ]
    },
    {
      key: "scene",
      patterns: ["basketball court", "court", "gym", "arcade", "street", "beach", "park", "office", "school", "indoor", "outdoor", "籃球場", "球場", "健身房", "街機", "街道", "海邊", "公園", "辦公室", "學校", "室內", "戶外"]
    },
    {
      key: "activity",
      patterns: ["athlete", "player", "basketball", "running", "dancing", "post-game", "training", "運動", "球員", "籃球", "跑步", "跳舞", "比賽", "訓練", "賽後", "打球"]
    },
    {
      key: "object",
      patterns: ["ball", "controller", "phone", "camera", "microphone", "laptop", "book", "badge", "headphones", "球", "手把", "手機", "相機", "麥克風", "筆電", "書", "徽章", "耳機"]
    },
    {
      key: "state",
      patterns: ["sweaty", "tired", "exhausted", "celebrating", "post-game energy", "out of breath", "氣喘", "喘", "流汗", "疲憊", "興奮", "慶祝", "賽後能量"]
    },
    {
      key: "clothing",
      patterns: ["jersey", "sportswear", "hoodie", "jacket", "suit", "uniform", "dress", "球衣", "運動服", "帽t", "外套", "西裝", "制服", "洋裝"]
    },
    {
      key: "lighting",
      patterns: ["neon", "sunny", "night", "rainy", "backlit", "low light", "bright light", "霓虹", "晴朗", "夜晚", "雨天", "背光", "低光", "亮光"]
    },
    {
      key: "composition",
      patterns: ["centered", "close-up", "upper-body", "full-body", "balanced composition", "中心", "特寫", "半身", "全身", "平衡構圖"]
    },
    {
      key: "visualSignal",
      patterns: ["palette", "contrast", "color", "motion detail", "green environment", "warm", "cool", "vivid", "dramatic", "高對比", "色彩", "動勢", "暖色", "冷色", "鮮明"]
    }
  ];

  for (const category of categoryPatterns) {
    if (category.patterns.some((pattern) => lower.includes(pattern))) return category.key;
  }

  return "other";
}

function calculateEdges(luma, width, height) {
  let total = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const gx =
        -luma[i - width - 1] -
        2 * luma[i - 1] -
        luma[i + width - 1] +
        luma[i - width + 1] +
        2 * luma[i + 1] +
        luma[i + width + 1];
      const gy =
        -luma[i - width - 1] -
        2 * luma[i - width] -
        luma[i - width + 1] +
        luma[i + width - 1] +
        2 * luma[i + width] +
        luma[i + width + 1];
      total += Math.sqrt(gx * gx + gy * gy);
      count += 1;
    }
  }
  return clamp(total / count, 0, 1);
}

function calculateSymmetry(luma, width, height) {
  let diff = 0;
  let count = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width / 2; x += 2) {
      const left = luma[y * width + x];
      const right = luma[y * width + (width - 1 - x)];
      diff += Math.abs(left - right);
      count += 1;
    }
  }
  return clamp(1 - diff / Math.max(1, count) * 1.8, 0, 1);
}

function calculateEntropy(histogram) {
  const total = histogram.reduce((sum, value) => sum + value, 0);
  let entropy = 0;
  for (const value of histogram) {
    if (!value) continue;
    const p = value / total;
    entropy -= p * Math.log2(p);
  }
  return clamp(entropy / Math.log2(histogram.length), 0, 1);
}

function renderAnalysis(analysis) {
  const metrics = ["brightness", "contrast", "saturation", "edgeDensity", "centerFocus", "symmetry", "textSignal"];
  const semanticTags = analysis.visibleSemanticTags ?? [];
  els.analysisGrid.hidden = false;
  els.analysisGrid.innerHTML =
    `<div class="metric metric-wide"><span>語意標籤</span><div class="semantic-tags">${
      semanticTags.length
        ? semanticTags.map((tag) => `<span class="semantic-tag">${escapeHtml(tag)}</span>`).join("")
        : "<strong>等待標籤</strong>"
    }</div></div>` +
    metrics
    .map((key) => {
      const value = Math.round(analysis.metrics[key] * 100);
      return `<div class="metric"><span>${metricLabels[key]}</span><strong>${value}</strong></div>`;
    })
    .join("");
}

function renderCard(card) {
  const statLine = card.cardStatLine ?? deriveCardStatLine(card);
  const portraitUrl = card.aiPortraitDataUrl ?? card.imageDataUrl;
  card.cardStatLine = statLine;
  const xpMax = xpThreshold(card.level);
  const xpPercent = clamp(Math.round((card.xp / xpMax) * 100), 0, 100);
  const role = card.combatRole?.role ?? "Battle Role";
  const skillMarkup = card.skills
    .slice(0, 2)
    .map(
      (skill, index) => `
        <div class="card-skill">
          <span>SKILL ${index + 1}</span>
          <strong>${escapeHtml(skill.name)}</strong>
          <small>${escapeHtml(skill.text)} 威力 ${skill.power}</small>
        </div>
      `
    )
    .join("");
  els.cardPreview.classList.remove("empty-card");
  els.cardPreview.style.setProperty("--accent", card.accent);
  els.cardPreview.innerHTML = `
    <div class="card-top-strip">
      <span class="rarity-emblem">${escapeHtml(card.rarity.key)}</span>
      <span>${escapeHtml(card.element)}</span>
      <span>COST ${statLine.cost}</span>
    </div>
    <div class="card-art hero-card-art" style="background-image: url('${portraitUrl}')">
      <span class="element-badge">${escapeHtml(card.className)}</span>
    </div>
    <div class="hero-stat-strip">
      <div>
        <strong>${statLine.hp}</strong>
        <span>${cardStatLabels.hp}</span>
      </div>
      <div>
        <strong>${statLine.atk}</strong>
        <span>${cardStatLabels.atk}</span>
      </div>
      <div>
        <strong>${statLine.def}</strong>
        <span>${cardStatLabels.def}</span>
      </div>
    </div>
    <div class="card-body">
      <div class="card-title-row">
        <div>
          <p class="card-kicker">Lv.${card.level} / ${escapeHtml(role)}</p>
          <h2>${escapeHtml(card.name)}</h2>
        </div>
        <span class="rarity-badge">${escapeHtml(card.rarity.name)}</span>
      </div>
      <div class="level-strip">
        <span>Next Lv ${card.xp}/${xpMax}</span>
        <div><i style="--xp:${xpPercent}%"></i></div>
      </div>
      ${
        card.imageGeneration?.error
          ? `<p class="ai-warning">${escapeHtml(card.imageGeneration.error)}</p>`
          : ""
      }
      <div class="card-skill-list">${skillMarkup}</div>
      <div class="trait-list">
        ${card.traits.map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}
      </div>
    </div>
  `;
}

function statRow(key, value) {
  return `
    <div class="stat-row">
      <span>${statLabels[key]}</span>
      <div class="stat-track"><i style="--value:${value}%"></i></div>
      <strong>${value}</strong>
    </div>
  `;
}

function renderDeck() {
  els.deckCount.textContent = `${state.deck.length} 張`;
  els.startBattleButton.disabled = !state.selectedCardId && state.deck.length === 0;

  if (!state.deck.length) {
    els.deckList.innerHTML = `<div class="deck-empty">牌庫尚未建立</div>`;
    renderBattle();
    return;
  }

  if (!state.selectedCardId) {
    state.selectedCardId = state.deck[0].id;
  }

  els.deckList.innerHTML = state.deck
    .map(
      (card) => {
        const statLine = card.cardStatLine ?? deriveCardStatLine(card);
        return `
          <div class="deck-card ${card.id === state.selectedCardId ? "selected" : ""}" style="--accent:${card.accent}">
            <button class="deck-thumb" type="button" data-select="${card.id}" style="background-image:url('${card.aiPortraitDataUrl ?? card.imageDataUrl}')" aria-label="選擇 ${escapeHtml(card.name)}"></button>
            <button class="deck-meta" type="button" data-select="${card.id}">
              <strong>${escapeHtml(card.name)}</strong>
              <span>Lv.${card.level} ${escapeHtml(card.rarity.key)} / ${escapeHtml(card.className)} / COST ${statLine.cost}</span>
              <span class="deck-statline">
                <b>HP ${statLine.hp}</b>
                <b>ATK ${statLine.atk}</b>
                <b>DEF ${statLine.def}</b>
              </span>
            </button>
            <button class="delete-button" type="button" data-delete="${card.id}" aria-label="刪除 ${escapeHtml(card.name)}">刪除</button>
          </div>
        `;
      }
    )
    .join("");

  els.deckList.querySelectorAll("[data-select]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCardId = button.dataset.select;
      const card = getSelectedCard();
      if (card) renderCard(card);
      renderDeck();
      renderBattle();
    });
  });

  els.deckList.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.deck = state.deck.filter((card) => card.id !== button.dataset.delete);
      if (state.selectedCardId === button.dataset.delete) {
        state.selectedCardId = state.deck[0]?.id ?? null;
      }
      persistDeck();
      renderDeck();
    });
  });

  const selected = getSelectedCard();
  if (selected) {
    renderCard(selected);
  }
}

function startBattle() {
  const player = cloneFighter(getSelectedCard());
  if (!player) return;
  const enemy = createEnemyCard(player);
  state.battle = {
    active: true,
    turn: 1,
    player,
    enemy,
    guarding: false,
    log: [`${player.name} 遭遇 ${enemy.name}`]
  };
  renderBattle();
}

function playerAction(action) {
  const battle = state.battle;
  if (!battle?.active) return;

  if (action.type === "attack") {
    applyAttack(battle.player, battle.enemy, battle, "普攻");
  }

  if (action.type === "skill") {
    const skill = battle.player.skills[action.index];
    applySkill(battle.player, battle.enemy, skill, battle);
  }

  if (action.type === "guard") {
    const shield = Math.round(12 + battle.player.stats.guard * 0.36 + battle.player.stats.focus * 0.18);
    battle.player.shield += shield;
    battle.guarding = true;
    pushLog(`${battle.player.name} 進入防禦，獲得 ${shield} 護盾`);
  }

  if (checkBattleEnd()) return;
  enemyTurn();
  checkBattleEnd();
  battle.turn += 1;
  renderBattle();
}

function enemyTurn() {
  const battle = state.battle;
  if (!battle?.active) return;
  const rng = mulberry32(hashString(`${battle.enemy.name}:${battle.turn}:${battle.player.hp}`));
  const lowHp = battle.enemy.hp / battle.enemy.maxHp < 0.35;
  if (lowHp && rng() > 0.35) {
    applySkill(battle.enemy, battle.player, battle.enemy.skills[1], battle);
  } else if (rng() > 0.42) {
    applySkill(battle.enemy, battle.player, battle.enemy.skills[0], battle);
  } else {
    applyAttack(battle.enemy, battle.player, battle, "普攻");
  }
}

function applyAttack(attacker, defender, battle, label) {
  const rng = mulberry32(hashString(`${attacker.name}:${defender.name}:${battle.turn}:${label}`));
  const base = attacker.stats.power * 0.42 + attacker.stats.speed * 0.2 + rng() * 9;
  const damage = mitigateDamage(base, defender, battle.guarding && defender.side === "player");
  defender.hp = clamp(defender.hp - damage, 0, defender.maxHp);
  pushLog(`${attacker.name} 使用${label}，造成 ${damage} 傷害`);
  battle.guarding = false;
}

function applySkill(attacker, defender, skill, battle) {
  if (skill.type === "guard") {
    const shield = Math.round(skill.power + attacker.stats.guard * 0.24);
    attacker.shield += shield;
    pushLog(`${attacker.name} 發動 ${skill.name}，獲得 ${shield} 護盾`);
    return;
  }

  const rng = mulberry32(hashString(`${attacker.name}:${skill.name}:${battle.turn}:${defender.hp}`));
  const crit = rng() < attacker.stats.luck / 260;
  const base = skill.power + attacker.stats.focus * 0.18 + (crit ? attacker.stats.luck * 0.32 : 0);
  const damage = mitigateDamage(base, defender, false);
  defender.hp = clamp(defender.hp - damage, 0, defender.maxHp);
  pushLog(`${attacker.name} 發動 ${skill.name}，造成 ${damage}${crit ? " 暴擊" : ""}傷害`);
}

function mitigateDamage(base, defender, guarding) {
  let reduced = base - defender.stats.guard * 0.18;
  if (guarding) reduced *= 0.62;
  if (defender.shield > 0) {
    const absorbed = Math.min(defender.shield, Math.max(1, Math.round(reduced)));
    defender.shield -= absorbed;
    reduced -= absorbed;
  }
  return Math.max(1, Math.round(reduced));
}

function checkBattleEnd() {
  const battle = state.battle;
  if (!battle?.active) return false;

  if (battle.player.hp <= 0 || battle.enemy.hp <= 0) {
    battle.active = false;
    const won = battle.enemy.hp <= 0;
    const selected = getSelectedCard();
    if (selected) {
      if (won) {
        selected.wins += 1;
        gainXp(selected, 42 + battle.enemy.level * 11);
        pushLog(`${selected.name} 勝利，獲得經驗`);
      } else {
        selected.losses += 1;
        gainXp(selected, 14);
        pushLog(`${selected.name} 敗北，獲得少量經驗`);
      }
      persistDeck();
      renderDeck();
    }
    renderBattle();
    return true;
  }

  return false;
}

function gainXp(card, amount) {
  card.xp += amount;
  let threshold = xpThreshold(card.level);
  while (card.xp >= threshold) {
    card.xp -= threshold;
    card.level += 1;
    const rng = mulberry32(hashString(`${card.id}:${card.level}:growth`));
    const keys = Object.keys(card.stats);
    for (let i = 0; i < 3; i += 1) {
      const key = keys[Math.floor(rng() * keys.length)];
      card.stats[key] = clamp(card.stats[key] + 1, 1, 99);
    }
    card.hpBase += 7;
    card.cardStatLine = deriveCardStatLine(card);
    if (card.characterSpec) {
      card.characterSpec.cardStatLine = card.cardStatLine;
    }
    threshold = xpThreshold(card.level);
    pushLog(`${card.name} 升到 Lv.${card.level}`);
  }
}

function xpThreshold(level) {
  return 70 + level * 35;
}

function createEnemyCard(player) {
  const seed = hashString(`${player.id}:${player.wins}:${player.losses}:${Date.now().toString().slice(-4)}`);
  const rng = mulberry32(seed);
  const archetype = archetypes[Math.floor(rng() * archetypes.length)];
  const rarity = rarityTable[Math.min(rarityTable.length - 1, Math.floor(player.level / 4) + (rng() > 0.7 ? 1 : 0))];
  const enemyProfile = createDefaultGenerationProfile();
  const fakeAnalysis = {
    hash: seed,
    textSeed: "",
    visibleSemanticTags: ["synthetic rival", "training arena"],
    semanticTagSource: "synthetic_enemy_seed",
    averageColor: { rgb: [40, 48, 58], hex: "#28303a", label: "Ash" },
    palette: [{ rgb: [40, 48, 58], hex: "#28303a", label: "Ash", weight: 1 }],
    metrics: {
      brightness: 0.42 + rng() * 0.2,
      contrast: 0.36 + rng() * 0.38,
      saturation: 0.28 + rng() * 0.45,
      edgeDensity: 0.3 + rng() * 0.5,
      centerFocus: 0.35 + rng() * 0.48,
      symmetry: 0.35 + rng() * 0.45,
      textSignal: 0,
      colorEntropy: 0.44 + rng() * 0.4,
      warmth: rng() * 0.55,
      coolness: rng() * 0.55,
      greenSignal: rng() * 0.45
    }
  };
  const stats = createStats(fakeAnalysis, archetype, rarity, rng, enemyProfile);
  const level = Math.max(1, player.level + Math.round(rng() * 2 - 1));
  const hpBase = 94 + Math.round(stats.guard * 1.55 + level * 8);
  const skills = createSkills(archetype, stats, [], rng, enemyProfile);
  const card = {
    id: `enemy-${seed}`,
    name: `${pick(["鏡像", "裂隙", "巡迴", "無名"], rng)}${pick(["對手", "獵手", "騎士", "術士"], rng)}`,
    className: archetype.name,
    element: archetype.element,
    accent: archetype.accent,
    rarity,
    level,
    xp: 0,
    wins: 0,
    losses: 0,
    hpBase,
    stats,
    cardStatLine: deriveCardStatLineFromParts({ stats, hpBase, level, rarity, skills }),
    traits: createTraits(fakeAnalysis, archetype, enemyProfile),
    skills,
    lore: "",
    imageDataUrl: createEnemyArt(archetype, seed)
  };
  return cloneFighter(card, "enemy");
}

function cloneFighter(card, side = "player") {
  if (!card) return null;
  const maxHp = card.hpBase + card.level * 8;
  return {
    ...structuredClone(card),
    side,
    hp: maxHp,
    maxHp,
    shield: 0
  };
}

function createEnemyArt(archetype, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 520;
  const ctx = canvas.getContext("2d");
  const rng = mulberry32(Number(seed));
  ctx.fillStyle = "#11151b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, archetype.accent);
  gradient.addColorStop(1, "#101820");
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.68;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 18; i += 1) {
    ctx.strokeStyle = `rgba(244,240,232,${0.08 + rng() * 0.18})`;
    ctx.lineWidth = 1 + rng() * 5;
    ctx.beginPath();
    ctx.moveTo(rng() * canvas.width, rng() * canvas.height);
    ctx.lineTo(rng() * canvas.width, rng() * canvas.height);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, canvas.height * 0.62, canvas.width, canvas.height * 0.38);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function renderBattle() {
  const battle = state.battle;
  const selected = getSelectedCard();
  els.startBattleButton.disabled = !selected;

  if (!battle) {
    renderFighter(els.playerFighter, selected ? cloneFighter(selected) : null, "Player");
    renderFighter(els.enemyFighter, null, "CPU");
    els.battleState.textContent = selected ? "可開戰" : "未選擇";
    setBattleButtons(false);
    if (!els.battleLog.children.length) {
      els.battleLog.innerHTML = "";
    }
    return;
  }

  renderFighter(els.playerFighter, battle.player, "Player");
  renderFighter(els.enemyFighter, battle.enemy, "CPU");
  els.battleState.textContent = battle.active ? `第 ${battle.turn} 回合` : "戰鬥結束";
  setBattleButtons(battle.active);
  els.battleLog.innerHTML = battle.log
    .slice(-30)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  els.battleLog.scrollTop = els.battleLog.scrollHeight;
}

function renderFighter(root, fighter, label) {
  const hp = fighter ? Math.round((fighter.hp / fighter.maxHp) * 100) : 0;
  root.querySelector(".fighter-label").textContent = label;
  root.querySelector("strong").textContent = fighter ? fighter.name : label === "CPU" ? "等待中" : "未選擇";
  root.querySelector(".hp-track span").style.setProperty("--hp", `${hp}%`);
  root.querySelector("small").textContent = fighter
    ? `HP ${fighter.hp} / ${fighter.maxHp}${fighter.shield ? ` / 護盾 ${fighter.shield}` : ""}`
    : "HP 0 / 0";
}

function setBattleButtons(enabled) {
  els.attackButton.disabled = !enabled;
  els.skillOneButton.disabled = !enabled;
  els.skillTwoButton.disabled = !enabled;
  els.guardButton.disabled = !enabled;
  if (state.battle?.player?.skills) {
    els.skillOneButton.textContent = state.battle.player.skills[0]?.name ?? "技能一";
    els.skillTwoButton.textContent = state.battle.player.skills[1]?.name ?? "技能二";
  } else {
    els.skillOneButton.textContent = "技能一";
    els.skillTwoButton.textContent = "技能二";
  }
}

function pushLog(message) {
  if (!state.battle) return;
  state.battle.log.push(message);
}

function getSelectedCard() {
  return state.deck.find((card) => card.id === state.selectedCardId) ?? null;
}

function setStatus(message) {
  els.analysisState.textContent = message;
}

function persistDeck() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.deck));
}

function loadDeck() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function waitForCameraFrame(video, options = {}) {
  const timeoutMs = options.timeoutMs ?? 5000;
  const deadline = performance.now() + timeoutMs;

  while (performance.now() < deadline) {
    if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      await waitForNextVideoFrame(video);
      return;
    }
    await sleep(80);
  }

  throw new Error("相機畫面尚未準備好，請等畫面出現後再拍攝。");
}

function waitForNextVideoFrame(video) {
  return new Promise((resolve) => {
    if ("requestVideoFrameCallback" in video) {
      video.requestVideoFrameCallback(() => resolve());
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function captureBestCameraFrame(stream, video) {
  const candidates = [];

  const photoCapture = await captureTrackPhoto(stream).catch((error) => {
    console.info("ImageCapture.takePhoto is not available or failed.", error);
    return null;
  });
  if (photoCapture) {
    if (!isNearBlackImage(photoCapture.visibility)) return photoCapture.dataUrl;
    candidates.push(photoCapture);
  }

  const directCapture = await captureTrackFrame(stream).catch((error) => {
    console.info("ImageCapture.grabFrame is not available or failed.", error);
    return null;
  });
  if (directCapture) {
    if (!isNearBlackImage(directCapture.visibility)) return directCapture.dataUrl;
    candidates.push(directCapture);
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await waitForCameraFrame(video, { timeoutMs: 5000 });
    const dataUrl = captureVideoFrame(video);
    const visibility = await measureImageVisibility(dataUrl);
    candidates.push({ dataUrl, visibility, source: "video-canvas" });
    if (!isNearBlackImage(visibility)) return dataUrl;
    await sleep(120);
  }

  const best = candidates.sort((a, b) => b.visibility.meanLuma - a.visibility.meanLuma)[0];
  if (best && !isNearBlackImage(best.visibility)) return best.dataUrl;

  console.warn(
    "Camera capture candidates were near black.",
    candidates.map((candidate) => ({
      source: candidate.source,
      visibility: candidate.visibility
    }))
  );
  throw new Error("拍到的來源照片幾乎全黑，但預覽正常。請再拍一次；若持續發生，先用上傳照片測試。");
}

async function captureTrackPhoto(stream) {
  if (!("ImageCapture" in window)) return null;
  const track = stream.getVideoTracks()[0];
  if (!track) return null;
  const imageCapture = new ImageCapture(track);
  if (typeof imageCapture.takePhoto !== "function") return null;
  const blob = await imageCapture.takePhoto();
  const dataUrl = await readBlobAsDataUrl(blob);
  const visibility = await measureImageVisibility(dataUrl);
  return { dataUrl, visibility, source: "image-capture-photo" };
}

async function captureTrackFrame(stream) {
  if (!("ImageCapture" in window)) return null;
  const track = stream.getVideoTracks()[0];
  if (!track) return null;
  const imageCapture = new ImageCapture(track);
  const bitmap = await imageCapture.grabFrame();
  const dataUrl = drawableToJpegDataUrl(bitmap, bitmap.width, bitmap.height);
  if (typeof bitmap.close === "function") bitmap.close();
  const visibility = await measureImageVisibility(dataUrl);
  return { dataUrl, visibility, source: "image-capture-frame" };
}

function captureVideoFrame(video) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    throw new Error("相機尚未提供有效影像尺寸，請重新拍攝。");
  }

  return drawableToJpegDataUrl(video, width, height);
}

function drawableToJpegDataUrl(drawable, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(drawable, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function normalizeImage(dataUrl) {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const maxSize = 980;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.84);
}

async function createCenterSubjectCropDataUrl(dataUrl) {
  const image = await loadImage(dataUrl);
  const cropWidth = Math.max(1, Math.round(image.width * 0.36));
  const cropHeight = Math.max(1, Math.round(image.height * 0.78));
  const sx = Math.max(0, Math.round((image.width - cropWidth) / 2));
  const sy = Math.max(0, Math.round((image.height - cropHeight) * 0.42));
  const scale = Math.min(1, 768 / Math.max(cropWidth, cropHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cropWidth * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, sx, sy, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function assertVisibleImageDataUrl(src) {
  const visibility = await measureImageVisibility(src);
  if (isNearBlackImage(visibility)) {
    throw new Error("ComfyUI 產生近乎全黑圖片，已切回本地預覽。請用 npm run comfy:start 重新啟動後再試。");
  }
}

async function assertUsableSourceImageDataUrl(src) {
  const visibility = await measureImageVisibility(src);
  if (isNearBlackImage(visibility)) {
    throw new Error("拍到的來源照片幾乎全黑，請確認相機畫面、光線或改用上傳照片。");
  }
}

async function measureImageVisibility(src) {
  const image = await loadImage(src);
  return measureDrawableVisibility(image);
}

function measureDrawableVisibility(drawable) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(drawable, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let lumaTotal = 0;
  let visiblePixels = 0;
  let opaquePixels = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3];
    if (alpha < 10) continue;
    opaquePixels += 1;
    const luma = pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
    lumaTotal += luma;
    if (luma > 24) visiblePixels += 1;
  }

  const sampledPixels = Math.max(1, opaquePixels);
  return {
    meanLuma: lumaTotal / sampledPixels,
    visibleRatio: visiblePixels / sampledPixels
  };
}

function isNearBlackImage(visibility) {
  return visibility.meanLuma < 16 && visibility.visibleRatio < 0.02;
}

function drawCover(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const x = (width - image.width * scale) / 2;
  const y = (height - image.height * scale) / 2;
  ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized.padEnd(6, "0").slice(0, 6);
  return [0, 2, 4].map((start) => Number.parseInt(full.slice(start, start + 2), 16));
}

function withAlpha(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${clamp(alpha, 0, 1)})`;
}

function darkenColor(hex, amount) {
  const rgb = hexToRgb(hex).map((value) => value * (1 - clamp(amount, 0, 1)));
  return rgbToHex(rgb);
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function describeColor([r, g, b]) {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (l < 0.16) return "Black";
  if (l > 0.86 && s < 0.22) return "White";
  if (s < 0.16) return l > 0.5 ? "Silver" : "Ash";
  if (h < 0.05 || h >= 0.94) return "Red";
  if (h < 0.12) return "Amber";
  if (h < 0.18) return "Gold";
  if (h < 0.42) return "Green";
  if (h < 0.54) return "Cyan";
  if (h < 0.68) return "Blue";
  if (h < 0.8) return "Violet";
  return "Rose";
}

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(items, rng) {
  return items[Math.floor(rng() * items.length)];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
