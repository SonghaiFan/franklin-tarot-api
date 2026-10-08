import { createHash, randomInt } from "node:crypto";
import { z } from "zod";
import groundTruth from "../data/tarot.json";

export const LOCALES = ["en", "zh-CN"] as const;
export const localeSchema = z.enum(LOCALES);
export type ApiLocale = z.infer<typeof localeSchema>;

const data = groundTruth as any;
export const API_VERSION = "1";
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
    // Major arcana: their number, 0–21. Minor arcana: 1–10 pips, 11–14 Page, Knight, Queen, King.
    rank: Number(id.match(/(\d+)$/)![1]),
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
  return { cards: filtered, locale: query.locale };
}

export const randomCardsQuerySchema = z.object({
  n: z.coerce.number().int().min(1).max(78).default(1),
  locale: localeSchema.default("zh-CN"),
});
export type RandomCardsQuery = z.infer<typeof randomCardsQuerySchema>;

/** n distinct cards in random order. Orientation and spreads belong to the caller. */
export function randomCards(query: RandomCardsQuery, origin: string, random: (max: number) => number = randomInt) {
  const ids = [...CARD_IDS];
  for (let index = 0; index < query.n; index++) {
    const pick = index + random(ids.length - index);
    [ids[index], ids[pick]] = [ids[pick], ids[index]];
  }
  return { cards: ids.slice(0, query.n).map((id) => getCard(id, query.locale, origin)!), locale: query.locale };
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
      layout: {
        type: spread.layout.type,
        positions: spread.layout.positions,
      },
      interpretationInstruction: localeText(spread.interpretationInstruction, locale),
      interpretationInstructions: spread.interpretationInstruction,
      defaultQuestions: spread.defaultQuestions ?? { en: [], "zh-CN": [] },
    };
  });
}
