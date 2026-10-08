import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import groundTruth from "../data/tarot.json";

export const LOCALES = ["en", "zh-CN"] as const;
export const localeSchema = z.enum(LOCALES);
export type ApiLocale = z.infer<typeof localeSchema>;

const data = groundTruth as any;
export const API_VERSION = "1";
export const DRAW_ALGORITHM_VERSION = "sha256-counter-v1";
export const DATASET_VERSION = createHash("sha256").update(JSON.stringify(groundTruth)).digest("hex").slice(0, 16);
export const CARD_IDS = data.cards.allIds.map((key: string) => data.cards.byId[key].image.replace(/\.[^.]+$/, "")) as string[];
export const SPREAD_IDS = data.spreads.allIds.filter((id: string) => id !== "AUTO") as string[];

const localeText = (value: Record<string, string | undefined>, locale: ApiLocale) =>
  value[locale] ?? value.en ?? value["zh-CN"] ?? "";

function cardGroups() {
  return new Map(CARD_IDS.map((id, index) => [id, data.cards.byId[data.cards.allIds[index]] as any]));
}
const cardsByStableId = cardGroups();

function suitFor(id: string): string | null {
  if (id.startsWith("wands")) return "WANDS";
  if (id.startsWith("cups")) return "CUPS";
  if (id.startsWith("swords")) return "SWORDS";
  if (id.startsWith("pents")) return "PENTACLES";
  return null;
}

export function getCard(cardId: string, locale: ApiLocale, origin: string) {
  const id = cardsByStableId.has(cardId) ? cardId : undefined;
  const source = id ? cardsByStableId.get(id) : undefined;
  if (!id || !source) return undefined;
  const urls = Object.fromEntries(["redraw", "dreamy", "original"].map((style) =>
    [style, `${origin}/images/${style === "redraw" ? "cards" : style === "original" ? "cards_rws_original" : "cards_dreamy"}/${id}.webp?v=${DATASET_VERSION}`],
  ));
  return {
    id,
    name: localeText(source.name, locale),
    names: { en: source.name.en, "zh-CN": source.name["zh-CN"] },
    arcana: source.numericId < 22 ? "MAJOR" : "MINOR",
    suit: suitFor(id),
    imageUrls: urls,
    keywords: { en: source.keywords.en, "zh-CN": source.keywords["zh-CN"] },
    description: { en: source.description.en ?? "", "zh-CN": source.description["zh-CN"] ?? "" },
    meanings: {
      upright: { en: source.meanings.upright.en ?? "", "zh-CN": source.meanings.upright["zh-CN"] ?? "" },
      reversed: { en: source.meanings.reversed.en ?? "", "zh-CN": source.meanings.reversed["zh-CN"] ?? "" },
    },
    source: {
      dataset: "frankie-tarot-ground-truth",
      datasetVersion: DATASET_VERSION,
      note: "Project-curated data. Per-field source attribution has not been independently verified.",
    },
  };
}

export const listCardsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  arcana: z.enum(["MAJOR", "MINOR"]).optional(),
  suit: z.enum(["WANDS", "CUPS", "SWORDS", "PENTACLES"]).optional(),
  locale: localeSchema.default("zh-CN"),
  limit: z.coerce.number().int().min(1).max(78).default(20),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});
export type ListCardsQuery = z.infer<typeof listCardsQuerySchema>;

export function listCards(query: ListCardsQuery, origin: string) {
  const normalized = query.q?.toLocaleLowerCase(query.locale);
  const filtered = CARD_IDS.flatMap((id) => {
    const card = getCard(id, query.locale, origin)!;
    if (query.arcana && card.arcana !== query.arcana) return [];
    if (query.suit && card.suit !== query.suit) return [];
    if (normalized) {
      const searchable = [card.name, ...card.keywords[query.locale], card.description[query.locale], card.meanings.upright[query.locale], card.meanings.reversed[query.locale]].join(" ").toLocaleLowerCase(query.locale);
      if (!searchable.includes(normalized)) return [];
    }
    return [card];
  });
  return { cards: filtered.slice(query.offset, query.offset + query.limit), total: filtered.length, limit: query.limit, offset: query.offset, locale: query.locale, datasetVersion: DATASET_VERSION };
}

export function listSpreads(locale: ApiLocale) {
  return SPREAD_IDS.map((id) => {
    const spread = data.spreads.byId[id];
    const labels = (spread.layout.type === "absolute" ? spread.layout.positionLabels : spread.layout.labels)[locale] ?? [];
    const constraints = spread.cardPools ?? Array.from({ length: spread.cardCount }, () => "FULL");
    return {
      id,
      name: localeText(spread.name, locale),
      names: spread.name,
      description: localeText(spread.description, locale),
      descriptions: spread.description,
      cardCount: spread.cardCount,
      labels,
      labelsByLocale: spread.layout.type === "absolute" ? spread.layout.positionLabels : spread.layout.labels,
      cardPools: constraints,
      interpretationInstruction: localeText(spread.interpretationInstruction, locale),
      interpretationInstructions: spread.interpretationInstruction,
      defaultQuestions: spread.defaultQuestions ?? { en: [], "zh-CN": [] },
      layoutType: spread.layout.type,
    };
  });
}

const drawRequestSchema = z.object({
  question: z.string().trim().max(2000).default(""),
  spread: z.string().refine((value) => SPREAD_IDS.includes(value), "Choose a supported spread ID."),
  locale: localeSchema.default("zh-CN"),
  seed: z.string().min(1).max(128).optional(),
  reversedProbability: z.number().min(0).max(1).default(0.4),
}).strict();
export type DrawRequest = z.input<typeof drawRequestSchema>;

function makeRng(seed: string) {
  let counter = 0;
  const uint32 = () => createHash("sha256").update(`${DRAW_ALGORITHM_VERSION}\0${seed}\0${counter++}`).digest().readUInt32BE(0);
  return (max: number) => {
    const range = 0x100000000;
    const ceiling = Math.floor(range / max) * max;
    let value = uint32();
    while (value >= ceiling) value = uint32();
    return value % max;
  };
}

export function allowedPool(pool: string): string[] {
  return CARD_IDS.filter((id) => {
    const suit = suitFor(id);
    const numericId = cardsByStableId.get(id)!.numericId;
    const isMajor = numericId < 22;
    const rank = Number(id.match(/(\d+)$/)?.[1] ?? 0);
    const isCourt = !isMajor && rank >= 11;
    if (pool === "MAJOR") return isMajor;
    if (pool === "MINOR_PIP") return !isMajor && !isCourt;
    if (pool === "COURT") return isCourt;
    if (pool === "SUIT_CUPS") return suit === "CUPS";
    if (pool === "SUIT_PENTACLES") return suit === "PENTACLES";
    if (pool === "SUIT_SWORDS") return suit === "SWORDS";
    if (pool === "SUIT_WANDS") return suit === "WANDS";
    return true;
  });
}

export function drawReading(input: DrawRequest, origin: string) {
  const request = drawRequestSchema.parse(input);
  const seed = request.seed ?? randomBytes(16).toString("hex");
  const spread = listSpreads(request.locale).find((item) => item.id === request.spread)!;
  const rawSpread = data.spreads.byId[spread.id];
  const pools: string[] = rawSpread.cardPools ?? Array.from({ length: spread.cardCount }, () => "FULL");
  const pick = makeRng(seed);
  const used = new Set<string>();
  const threshold = Math.round(request.reversedProbability * 1_000_000);
  const cards = pools.map((pool, index) => {
    const available = allowedPool(pool).filter((id) => !used.has(id));
    if (!available.length) throw new Error(`The card pool for ${spread.id} position ${index + 1} is exhausted.`);
    const id = available[pick(available.length)];
    used.add(id);
    const orientation = pick(1_000_000) < threshold ? "REVERSED" : "UPRIGHT";
    const definition = getCard(id, request.locale, origin)!;
    const labels = spread.labelsByLocale[request.locale] ?? [];
    const positionLabel = labels[index] || `Position ${index + 1}`;
    return {
      positionIndex: index + 1,
      positionLabel,
      cardId: id,
      orientation,
      card: definition,
      selectedMeaning: {
        keywords: definition.keywords[request.locale],
        meaning: definition.meanings[orientation === "REVERSED" ? "reversed" : "upright"][request.locale],
      },
    };
  });
  const identity = { datasetVersion: DATASET_VERSION, algorithmVersion: DRAW_ALGORITHM_VERSION, seed, spreadId: spread.id, reversedProbability: request.reversedProbability, cards: cards.map(({ cardId, orientation }) => ({ cardId, orientation })) };
  const readingId = createHash("sha256").update(JSON.stringify(identity)).digest("hex").slice(0, 24);
  const snapshot = { readingId, datasetVersion: DATASET_VERSION, algorithmVersion: DRAW_ALGORITHM_VERSION, seed, spreadId: spread.id, drawLocale: request.locale, reversedProbability: request.reversedProbability, cards: cards.map(({ positionIndex, positionLabel, cardId, orientation }) => ({ positionIndex, positionLabel, cardId, orientation })) };
  return { reading: { ...snapshot, question: request.question, locale: request.locale }, context: { question: request.question, locale: request.locale, spread: { id: spread.id, name: spread.name, description: spread.description, cardCount: spread.cardCount, interpretationInstruction: spread.interpretationInstruction }, cards }, policy: "Tarot is offered for symbolic reflection; the cards do not establish factual outcomes or probabilities." };
}

export const readingContextRequestSchema = z.object({
  reading: z.object({
    readingId: z.string().length(24),
    datasetVersion: z.string(),
    algorithmVersion: z.string(),
    seed: z.string().min(1).max(128),
    spreadId: z.string(),
    drawLocale: localeSchema,
    reversedProbability: z.number().min(0).max(1),
    cards: z.array(z.object({ positionIndex: z.number().int().positive(), positionLabel: z.string(), cardId: z.string(), orientation: z.enum(["UPRIGHT", "REVERSED"]) }).strict()),
    // The draw endpoint returns these convenience fields; accept them when its
    // `reading` object is passed back verbatim, but never use them as authority.
    question: z.string().optional(),
    locale: localeSchema.optional(),
  }).strict(),
  question: z.string().trim().max(2000).default(""),
  locale: localeSchema.default("zh-CN"),
}).strict();
export type ReadingContextRequest = z.input<typeof readingContextRequestSchema>;

export function buildReadingContext(input: ReadingContextRequest, origin: string) {
  const request = readingContextRequestSchema.parse(input);
  if (request.reading.datasetVersion !== DATASET_VERSION) throw Object.assign(new Error("This reading uses an unsupported card dataset version."), { status: 409, code: "DATASET_VERSION_UNAVAILABLE" });
  if (request.reading.algorithmVersion !== DRAW_ALGORITHM_VERSION) throw Object.assign(new Error("This reading uses an unsupported draw algorithm version."), { status: 409, code: "ALGORITHM_VERSION_UNAVAILABLE" });
  const replay = drawReading({ spread: request.reading.spreadId, seed: request.reading.seed, reversedProbability: request.reading.reversedProbability, locale: request.reading.drawLocale }, origin);
  if (replay.reading.readingId !== request.reading.readingId || JSON.stringify(replay.reading.cards) !== JSON.stringify(request.reading.cards)) {
    throw Object.assign(new Error("The supplied reading snapshot does not match its seed and version."), { status: 400, code: "INVALID_READING_SNAPSHOT" });
  }
  const localized = request.locale === request.reading.drawLocale
    ? replay
    : drawReading({ spread: request.reading.spreadId, seed: request.reading.seed, reversedProbability: request.reading.reversedProbability, locale: request.locale }, origin);
  return { ...localized.context, question: request.question, sourceReadingId: request.reading.readingId, policy: replay.policy };
}

export const agentDrawSchema = drawRequestSchema;
export const agentContextSchema = readingContextRequestSchema;
