/**
 * AI-powered Natural Language Search Parser
 *
 * Converts Chinese natural language queries into Scryfall search syntax.
 * Uses keyword matching and pattern recognition for MVP.
 *
 * Examples:
 *   "3费以下的绿色生物" → "cmc<=3 color:G type:creature"
 *   "能抽牌的蓝色瞬间" → "oracle:draw color:U type:instant"
 *   "指挥官合法的传奇生物" → "type:legendary type:creature format:commander"
 *   "近代可用的去除" → "oracle:destroy format:modern"
 */

interface ParsedQuery {
  scryfall: string;
  explanation: string;
}

// Color keywords mapping
const COLOR_MAP: Record<string, string> = {
  "白": "W", "白色": "W", "平原": "W",
  "蓝": "U", "蓝色": "U", "海岛": "U",
  "黑": "B", "黑色": "B", "沼泽": "B",
  "红": "R", "红色": "R", "山脉": "R",
  "绿": "G", "绿色": "G", "树林": "G",
  "无色": "C", "无": "C",
  "多色": "m", "金色": "m",
};

// Type keywords mapping
const TYPE_MAP: Record<string, string> = {
  "生物": "creature", "creatures": "creature",
  "瞬间": "instant", "闪电": "instant",
  "法术": "sorcery",
  "结界": "enchantment", "附魔": "enchantment",
  "神器": "artifact", "工件": "artifact",
  "旅法师": "planeswalker", "鹏洛客": "planeswalker",
  "地": "land", "地牌": "land",
  "传奇": "legendary",
  "部族": "tribal",
  "灵气": "aura",
  "武具": "equipment", "装备": "equipment",
};

// Format keywords mapping
const FORMAT_MAP: Record<string, string> = {
  "标准": "standard", "标准赛": "standard",
  "先驱": "pioneer",
  "近代": "modern", "摩登": "modern",
  "指挥官": "commander", "EDH": "commander", "edh": "commander",
  "薪传": "legacy",
  "特选": "vintage",
  "纯普": "pauper",
};

// Oracle text intent keywords (Chinese → English search terms)
const ORACLE_MAP: Record<string, string> = {
  "抽牌": "draw", "抽一张": "draw a card", "抽卡": "draw",
  "消灭": "destroy", "去除": "destroy",
  "放逐": "exile",
  "补血": "gain life", "回复生命": "gain life", "加血": "gain life",
  "扣血": "lose life", "失去生命": "lose life",
  "飞行": "flying",
  "践踏": "trample",
  "闪现": "flash",
  "不灭": "indestructible",
  "敏捷": "haste",
  "警戒": "vigilance",
  "先攻": "first strike",
  "连击": "double strike",
  "死触": "deathtouch",
  "系命": "lifelink",
  "辟邪": "hexproof",
  "威慑": "menace",
  "穿透": "can't be blocked",
  "反击": "counter target",
  "弹回": "return target",
  "回手": "return to",
  "增益": "+1/+1", "强化": "+1/+1",
  "减益": "-1/-1", "弱化": "-1/-1",
  "指示物": "counter",
  "衍生物": "token", "衍生": "create",
  "牺牲": "sacrifice",
  "磨牌": "mill", "磨": "mill",
  "搜寻": "search your library", "找地": "search your library",
  "闪烁": "exile.*return", "忽隐忽现": "exile.*return",
  "复制": "copy",
  "变身": "transform",
};

// Rarity keywords
const RARITY_MAP: Record<string, string> = {
  "秘稀": "mythic", "密稀": "mythic",
  "稀有": "rare",
  "非普通": "uncommon",
  "普通": "common",
};

// CMC patterns
const CMC_PATTERNS = [
  { regex: /(\d+)费以下/, extract: (m: RegExpMatchArray) => `cmc<=${m[1]}` },
  { regex: /(\d+)费以上/, extract: (m: RegExpMatchArray) => `cmc>=${m[1]}` },
  { regex: /(\d+)费/, extract: (m: RegExpMatchArray) => `cmc=${m[1]}` },
  { regex: /低费/, extract: () => `cmc<=2` },
  { regex: /高费/, extract: () => `cmc>=5` },
  { regex: /零费/, extract: () => `cmc=0` },
  { regex: /免费/, extract: () => `cmc=0` },
];

// Power/Toughness patterns
const PT_PATTERNS = [
  { regex: /(\d+)\/(\d+)/, extract: (m: RegExpMatchArray) => `pow=${m[1]} tou=${m[2]}` },
  { regex: /力量(\d+)以上/, extract: (m: RegExpMatchArray) => `pow>=${m[1]}` },
  { regex: /防御(\d+)以上/, extract: (m: RegExpMatchArray) => `tou>=${m[1]}` },
];

/**
 * Detect if a query is natural language (Chinese) vs structured search
 */
function isNaturalLanguage(query: string): boolean {
  // Already has Scryfall operators
  if (/[:(>=<!)]/.test(query)) return false;
  // Contains Chinese characters and is more than just a card name
  if (/[\u4e00-\u9fff]/.test(query) && query.length > 4) {
    // Check if it contains any of our keyword triggers
    const allKeywords = [
      ...Object.keys(COLOR_MAP),
      ...Object.keys(TYPE_MAP),
      ...Object.keys(FORMAT_MAP),
      ...Object.keys(ORACLE_MAP),
      ...Object.keys(RARITY_MAP),
      "费", "可用", "合法",
    ];
    return allKeywords.some(k => query.includes(k));
  }
  return false;
}

/**
 * Parse natural language query into Scryfall search syntax
 */
export function parseSmartSearch(query: string): ParsedQuery {
  if (!isNaturalLanguage(query)) {
    return { scryfall: query, explanation: "" };
  }

  const parts: string[] = [];
  const explanations: string[] = [];
  let remaining = query;

  // Extract CMC
  for (const pattern of CMC_PATTERNS) {
    const match = remaining.match(pattern.regex);
    if (match) {
      parts.push(pattern.extract(match));
      explanations.push(`费用: ${match[0]}`);
      remaining = remaining.replace(match[0], "");
    }
  }

  // Extract Power/Toughness
  for (const pattern of PT_PATTERNS) {
    const match = remaining.match(pattern.regex);
    if (match) {
      parts.push(pattern.extract(match));
      explanations.push(`攻防: ${match[0]}`);
      remaining = remaining.replace(match[0], "");
    }
  }

  // Extract colors
  const colors: string[] = [];
  for (const [keyword, code] of Object.entries(COLOR_MAP)) {
    if (remaining.includes(keyword)) {
      if (code === "m") {
        parts.push("color>=2");
        explanations.push("多色");
      } else {
        colors.push(code);
      }
      remaining = remaining.replace(keyword, "");
    }
  }
  if (colors.length > 0) {
    parts.push(`color:${colors.join("")}`);
    explanations.push(`颜色: ${colors.join("")}`);
  }

  // Extract types
  for (const [keyword, type] of Object.entries(TYPE_MAP)) {
    if (remaining.includes(keyword)) {
      parts.push(`type:${type}`);
      explanations.push(`类型: ${keyword}`);
      remaining = remaining.replace(keyword, "");
    }
  }

  // Extract formats
  for (const [keyword, format] of Object.entries(FORMAT_MAP)) {
    if (remaining.includes(keyword)) {
      parts.push(`format:${format}`);
      explanations.push(`赛制: ${keyword}`);
      remaining = remaining.replace(keyword, "");
      // Remove common suffixes
      remaining = remaining.replace(/可用|合法|赛制/, "");
    }
  }

  // Extract rarity
  for (const [keyword, rarity] of Object.entries(RARITY_MAP)) {
    if (remaining.includes(keyword)) {
      parts.push(`rarity:${rarity}`);
      explanations.push(`稀有度: ${keyword}`);
      remaining = remaining.replace(keyword, "");
    }
  }

  // Extract oracle text intents
  for (const [keyword, oracle] of Object.entries(ORACLE_MAP)) {
    if (remaining.includes(keyword)) {
      parts.push(`oracle:"${oracle}"`);
      explanations.push(`效果: ${keyword}`);
      remaining = remaining.replace(keyword, "");
    }
  }

  // Clean remaining text and add as name search if meaningful
  remaining = remaining.replace(/的|能|会|有|带|具有|可以|合法|可用|牌|卡|张/g, "").trim();
  if (remaining.length >= 2) {
    parts.unshift(remaining);
    explanations.push(`名称: ${remaining}`);
  }

  if (parts.length === 0) {
    return { scryfall: query, explanation: "" };
  }

  return {
    scryfall: parts.join(" "),
    explanation: explanations.join(" | "),
  };
}
