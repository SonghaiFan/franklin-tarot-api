export type Locale = "en" | "zh-CN";
type CopySet = {
  nav: string[]; onPage: string; asideNote: string; heroEyebrow: string; heroDescription: string;
  quickstart: string; reference: string; stats: string[]; firstRequest: string; quickDescription: string;
  quickFields: string[]; auth: string; spreadChoice: string; copied: string; copy: string; errors: string;
  endpointDescriptions: string[]; equivalentCurl: string; statelessNote: string; spreadTitle: string;
  spreadDescription: string; spreadLoadError: string; spreadLoading: string; spreadDataNote: string; spreadPoolNote: string;
  agentUse: string; restOrMcp: string; agentDescription: string; agentInstruction: string;
  tools: string; agentNote: string; poolTitle: string; poolDescription: string;
  poolMembers: string[]; openapi: string; footer: string[]; positions: string;
  card: string; cards: string;
};

export const COPY = {
  en: {
    nav: ["Overview", "Quickstart", "Endpoints", "Spreads", "Card pools"],
    onPage: "On this page",
    asideNote: "Read-only REST and MCP. Franklin knows the cards and the spreads; your app owns the reading.",
    heroEyebrow: "REST API · MCP · Open source",
    heroDescription: "A read-only tarot service for apps and AI agents: 78 bilingual cards and real spreads, with positions and card pools. Your app draws the cards and owns the reading.",
    quickstart: "Quickstart", reference: "Reference", stats: ["Cards", "Spreads", "Locales"],
    firstRequest: "Your first request", quickDescription: "Load the deck and the spreads. Everything a reading needs comes from these two calls.",
    quickFields: ["Base URL", "Auth", "Spreads"],
    auth: "None. No key required.", spreadChoice: "Choose a spread from",
    copied: "Copied", copy: "Copy",
    errors: "Five primitives", endpointDescriptions: ["Lightweight service health check.", "Every card, or those matching a name, keyword, description, meaning, arcana or suit. Each card has arcana, suit and rank.", "Get bilingual card descriptions, upright and reversed meanings, provenance notes, and versioned image URLs.", "List available spreads with relative positions, localized labels, position card pools, and interpretation guidance.", "n distinct cards in random order (1–78). No orientation: your app decides upright or reversed."],
    equivalentCurl: "Equivalent cURL request", statelessNote: "Franklin does not draw, store or interpret readings. Your app draws the cards, decides orientation and keeps the reading; tarot is for reflection, not factual prediction.",
    spreadTitle: "See the spreads", spreadDescription: "Each diagram uses the same relative card positions as the Frankie app. Numbers show draw order; labels name each position.", spreadLoadError: "Spread layouts could not be loaded. Try refreshing.", spreadLoading: "Loading spread layouts…", spreadDataNote: "Positions and localized labels come from", spreadPoolNote: "each position's card pool says which cards may be drawn there.", agentUse: "Agent use", restOrMcp: "REST or MCP", agentDescription: "Try the Frankie Tarot app, or build your own interface. Franklin also exposes a UI-free Agent MCP at", agentInstruction: "Agents can look up cards and spreads, or take random cards; the calling app owns spreads, orientation and the reading.", tools: "Tools", agentNote: "Web and plugin interfaces are separate example applications. The browser uses REST; an agent can use MCP for cards, spreads and random cards.",
    poolTitle: "Card pools", poolDescription: "Each spread lists one pool per position in cardPools. A drawn card must come from its position's pool, and a reading never repeats a card.",
    poolMembers: ["All 78 cards", "Major arcana (suit is null)", "Minor arcana with rank 1–10", "Minor arcana with rank 11–14: Page, Knight, Queen, King", "All 14 cards whose suit matches"], openapi: "OpenAPI schema", footer: ["For reflection, not prediction", "Source"],
    positions: "positions in draw order", card: "card", cards: "cards",
  },
  "zh-CN": {
    nav: ["概览", "快速开始", "端点", "牌阵", "牌池"],
    onPage: "本页导航",
    asideNote: "只读的 REST 与 MCP。Franklin 只知道牌和牌阵，牌局由你的应用负责。",
    heroEyebrow: "REST API · MCP · 开源",
    heroDescription: "为应用和 AI Agent 提供的只读塔罗服务：78 张中英文牌和真实牌阵，含位置与牌池。抽牌和牌局由你的应用负责。",
    quickstart: "快速开始", reference: "接口参考", stats: ["张牌", "种牌阵", "种语言"],
    firstRequest: "第一个请求", quickDescription: "加载牌库和牌阵。一局牌需要的数据都来自这两个请求。",
    quickFields: ["服务地址", "身份验证", "牌阵"],
    auth: "无需密钥。", spreadChoice: "从这里选择牌阵：",
    copied: "已复制", copy: "复制",
    errors: "五个基础端点", endpointDescriptions: ["轻量级服务健康检查。", "返回全部牌，或按名称、关键词、描述、牌义、大小阿卡那或花色筛选。每张牌带有 arcana、suit 和 rank。", "获取中英文牌面描述、正逆位牌义、来源说明及带版本的图片地址。", "列出可用牌阵、相对位置、对应语言的标签、位置牌池和解读指引。", "随机返回 n 张不重复的牌（1–78）。不含正逆位，由你的应用决定。"],
    equivalentCurl: "对应的 cURL 请求", statelessNote: "Franklin 不抽牌、不保存牌局，也不做解读。抽牌、正逆位和牌局状态都由你的应用负责；塔罗用于反思，不用于确定性预测。",
    spreadTitle: "查看牌阵", spreadDescription: "牌阵图使用与 Frankie 应用相同的相对位置。数字表示抽牌顺序，下方列出每个位置的含义。", spreadLoadError: "无法加载牌阵布局，请刷新后重试。", spreadLoading: "正在加载牌阵…", spreadDataNote: "相对位置和本地化标签来自", spreadPoolNote: "每个位置的牌池决定该位置可以抽到哪些牌。", agentUse: "Agent 接入", restOrMcp: "REST 或 MCP", agentDescription: "可以体验 Frankie Tarot 应用，也可以自行构建界面。Franklin 还提供不含 UI 的 Agent MCP 接口：", agentInstruction: "Agent 可以查询牌和牌阵，也可以随机取牌；牌阵、正逆位和牌局由调用方应用负责。", tools: "工具", agentNote: "网页和插件是独立的示例应用。浏览器使用 REST；Agent 可使用 MCP 查询牌、牌阵和随机取牌。",
    poolTitle: "牌池", poolDescription: "每个牌阵的 cardPools 为每个位置给出一个牌池。抽到的牌必须来自该位置的牌池，同一局不重复抽同一张牌。",
    poolMembers: ["全部 78 张", "大阿卡那（suit 为 null）", "rank 为 1–10 的小阿卡那", "rank 为 11–14 的小阿卡那：侍从、骑士、王后、国王", "suit 匹配的全部 14 张"], openapi: "OpenAPI Schema", footer: ["用于反思，不作预测", "源码"],
    positions: "按抽牌顺序排列", card: "张牌", cards: "张牌",
  },
} satisfies Record<Locale, CopySet>;
