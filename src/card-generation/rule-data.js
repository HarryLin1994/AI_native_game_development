export const DEFAULT_CHARACTER_FORM_BRANCH = "humanlike";
export const CHARACTER_FORM_BRANCHES = ["humanlike", "animalized.cat"];
export const CARD_ART_PROMPT_VERSION = "card-art-prompt-v2.5-event-combat";

export const archetypes = [
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

export const rarityTable = [
  { key: "N", name: "Normal", threshold: 0, bonus: 0 },
  { key: "R", name: "Rare", threshold: 55, bonus: 8 },
  { key: "SR", name: "Super Rare", threshold: 72, bonus: 15 },
  { key: "SSR", name: "Super Super Rare", threshold: 80, bonus: 20 },
  { key: "UR", name: "Ultra Rare", threshold: 86, bonus: 24 }
];

export const statLabels = {
  power: "力量",
  speed: "速度",
  guard: "防禦",
  focus: "專注",
  luck: "幸運"
};

export const cardStatLabels = {
  hp: "HP",
  atk: "ATK",
  def: "DEF",
  agi: "AGI",
  cost: "COST"
};

export const metricLabels = {
  brightness: "亮度",
  contrast: "對比",
  saturation: "色彩",
  edgeDensity: "線條",
  centerFocus: "中心感",
  symmetry: "對稱",
  textSignal: "文字"
};

export const ageProfiles = {
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

export const combatStyleProfiles = {
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

export const valueProfiles = {
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

export const placeTypeProfiles = {
  neutral: { label: "中性訓練場", statMods: {}, trait: "訓練場出身", archetypeBias: {} },
  indoor: { label: "室內", statMods: { focus: 2, guard: 1 }, trait: "室內戰術", archetypeBias: { veil: 0.14, aegis: 0.1 } },
  street: { label: "街道", statMods: { speed: 3, luck: 1 }, trait: "街頭節奏", archetypeBias: { volt: 0.18, veil: 0.1 } },
  school: { label: "學校", statMods: { focus: 4, luck: 1 }, trait: "學院迴路", archetypeBias: { tide: 0.12, veil: 0.12 } },
  office: { label: "辦公室", statMods: { focus: 3, guard: 2 }, trait: "指令中樞", archetypeBias: { volt: 0.14, aegis: 0.12 } },
  park: { label: "公園", statMods: { luck: 3, guard: 1 }, trait: "綠地呼吸", archetypeBias: { wild: 0.2, tide: 0.1 } },
  beach: { label: "海邊", statMods: { focus: 2, luck: 2 }, trait: "潮線記憶", archetypeBias: { tide: 0.28 } },
  mountain: { label: "山區", statMods: { guard: 3, power: 2 }, trait: "山脊耐性", archetypeBias: { wild: 0.22, aegis: 0.14 } },
  transit: { label: "交通場所", statMods: { speed: 4, focus: 1 }, trait: "轉乘步法", archetypeBias: { volt: 0.22 } },
  arcade: { label: "街機場", statMods: { speed: 4, focus: 2, luck: 2 }, trait: "霓虹遊戲場", archetypeBias: { volt: 0.28, wild: 0.08 } },
  cafe: { label: "咖啡館", statMods: { focus: 3, luck: 2 }, trait: "角落靈感", archetypeBias: { tide: 0.12, veil: 0.12 } },
  stadium: { label: "競技場", statMods: { power: 3, speed: 3, guard: 1 }, trait: "競技聚光", archetypeBias: { flare: 0.2, volt: 0.16 } }
};

export const timeMoodProfiles = {
  clear: { label: "清晰日常", statMods: { focus: 1, guard: 1 }, trait: "清晰基準", archetypeBias: {} },
  sunny: { label: "晴朗", statMods: { power: 2, speed: 1 }, trait: "日光脈動", archetypeBias: { flare: 0.16, wild: 0.08 } },
  rainy: { label: "雨天", statMods: { focus: 2, guard: 2 }, trait: "雨幕節奏", archetypeBias: { tide: 0.22, veil: 0.08 } },
  night: { label: "夜晚", statMods: { focus: 2, luck: 2 }, trait: "夜行視野", archetypeBias: { veil: 0.2, volt: 0.08 } },
  dusk: { label: "黃昏", statMods: { power: 1, focus: 2 }, trait: "黃昏臨界", archetypeBias: { flare: 0.12, veil: 0.12 } },
  neon: { label: "霓虹", statMods: { speed: 3, focus: 1 }, trait: "霓虹訊號", archetypeBias: { volt: 0.24, veil: 0.1 } },
  quiet: { label: "安靜", statMods: { focus: 3, guard: 1 }, trait: "靜默判讀", archetypeBias: { tide: 0.12, veil: 0.1 } },
  chaotic: { label: "混亂", statMods: { luck: 4, speed: 1, guard: -1 }, trait: "混線反應", archetypeBias: { wild: 0.18, volt: 0.12 } }
};

export const seasonCombatProfiles = {
  spring: {
    label: "春季萌發",
    statMods: { luck: 2, focus: 1 },
    trait: "春季萌發",
    skillWord: "萌發",
    promptHook: "fresh season color",
    archetypeBias: { wild: 0.12, tide: 0.08 }
  },
  summer: {
    label: "夏日熱能",
    statMods: { power: 2, speed: 1 },
    trait: "夏日熱能",
    skillWord: "盛夏",
    promptHook: "summer brightness",
    archetypeBias: { flare: 0.12, volt: 0.08 }
  },
  autumn: {
    label: "秋季收束",
    statMods: { focus: 2, guard: 1 },
    trait: "秋季收束",
    skillWord: "秋印",
    promptHook: "autumn palette",
    archetypeBias: { veil: 0.1, wild: 0.08 }
  },
  winter: {
    label: "冬季護光",
    statMods: { guard: 2, focus: 1 },
    trait: "冬季護光",
    skillWord: "冬護",
    promptHook: "winter glow",
    archetypeBias: { aegis: 0.12, tide: 0.08 }
  }
};

export const eventCombatProfiles = [
  {
    key: "new_year",
    label: "新年覺醒",
    patterns: ["new_year", "new year", "fresh-start", "fresh start", "countdown", "元旦", "新年"],
    statMods: { luck: 4, speed: 2, focus: 1 },
    trait: "新年覺醒",
    skillWord: "新星",
    promptHook: "new year countdown glow",
    archetypeBias: { volt: 0.14, wild: 0.1 }
  },
  {
    key: "year_end",
    label: "年終衝刺",
    patterns: ["year_end", "year-end", "new year's eve", "countdown", "跨年", "年終"],
    statMods: { speed: 3, luck: 3 },
    trait: "年終衝刺",
    skillWord: "倒數",
    promptHook: "year-end countdown glow",
    archetypeBias: { volt: 0.16, flare: 0.08 }
  },
  {
    key: "costume_night",
    label: "變裝奇襲",
    patterns: ["costume", "halloween", "spooky", "變裝", "萬聖", "幽光"],
    statMods: { luck: 4, speed: 1, focus: 1 },
    trait: "變裝奇襲",
    skillWord: "幻裝",
    promptHook: "costume-night playful motif",
    archetypeBias: { veil: 0.16, wild: 0.1 }
  },
  {
    key: "winter_festival",
    label: "冬祭護光",
    patterns: ["christmas", "winter festival", "gift-season", "gift season", "聖誕", "冬祭"],
    statMods: { guard: 3, luck: 2, focus: 1 },
    trait: "冬祭護光",
    skillWord: "禮光",
    promptHook: "winter festival lights",
    archetypeBias: { aegis: 0.16, tide: 0.08 }
  },
  {
    key: "public_celebration",
    label: "慶典火花",
    patterns: ["independence", "national", "celebration", "festival color", "public celebration", "國慶", "慶典"],
    statMods: { power: 3, luck: 2, speed: 1 },
    trait: "慶典火花",
    skillWord: "慶火",
    promptHook: "festival color accents",
    archetypeBias: { flare: 0.16, volt: 0.08 }
  },
  {
    key: "harvest",
    label: "豐收餘韻",
    patterns: ["thanksgiving", "harvest", "gathering", "豐收", "感恩"],
    statMods: { guard: 2, luck: 3, focus: 1 },
    trait: "豐收餘韻",
    skillWord: "豐收",
    promptHook: "harvest-season warmth",
    archetypeBias: { wild: 0.16, tide: 0.08 }
  },
  {
    key: "rest_day",
    label: "休整工坊",
    patterns: ["labor", "labour", "workshop rest", "rest-day", "休整", "勞動"],
    statMods: { focus: 3, guard: 2 },
    trait: "休整工坊",
    skillWord: "整備",
    promptHook: "workshop rest-day motif",
    archetypeBias: { aegis: 0.12, veil: 0.08 }
  },
  {
    key: "commemorative",
    label: "追憶專注",
    patterns: ["memorial", "remembrance", "commemorative", "追憶", "紀念"],
    statMods: { focus: 4, guard: 1 },
    trait: "追憶專注",
    skillWord: "追憶",
    promptHook: "quiet commemorative atmosphere",
    archetypeBias: { veil: 0.14, aegis: 0.08 }
  }
];

export const weaknessRules = [
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

export const occupationRules = [
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
