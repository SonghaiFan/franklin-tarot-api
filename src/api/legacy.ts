import { z } from "zod";
import { allowedPool, drawReading, getCard, listSpreads, localeSchema, SPREAD_IDS } from "./core";

const schema = z.object({
  question: z.string().max(2000).default(""),
  spread: z.string().default("AUTO").refine(id => id === "AUTO" || SPREAD_IDS.includes(id)),
  locale: localeSchema.default("zh-CN"), seed: z.string().min(1).max(128).optional(),
  reversedProbability: z.number().min(0).max(1).default(0.4),
  customCards: z.array(z.object({ id: z.union([z.string(), z.number().int()]), isReversed: z.boolean() })).max(78).optional(),
});
export function legacyReading(input: unknown, origin: string) {
  const args = schema.parse(input);
  const spreadId = args.spread === "AUTO" ? "SINGLE" : args.spread;
  const spread = listSpreads(args.locale).find(item => item.id === spreadId)!;
  const selected = args.customCards?.length ? args.customCards.map(item => {
    const card = getCard(item.id, args.locale, origin);
    if (!card) throw new Error("Unknown custom card ID.");
    return { card, orientation: item.isReversed ? "REVERSED" : "UPRIGHT" };
  }) : drawReading({ question: args.question, spread: spreadId, locale: args.locale, seed: args.seed, reversedProbability: args.reversedProbability }, origin).context.cards;
  if (selected.length !== spread.cardCount || new Set(selected.map(item => item.card.id)).size !== selected.length ||
      selected.some((item, i) => !allowedPool(spread.cardPools[i]).includes(item.card.id))) throw new Error("Custom cards do not satisfy this spread's count, uniqueness or position pools.");
  const cards = selected.map(({ card, orientation }, i) => ({ positionIndex: i + 1, positionLabel: spread.labels[i], card: {
    id: card.legacyId, nameEn: card.names.en, nameCn: card.names["zh-CN"], image: `${card.id}.webp`,
    descriptionEn: card.description.en, descriptionCn: card.description["zh-CN"], keywordsEn: card.keywords.en, keywords: card.keywords["zh-CN"],
    positiveEn: card.meanings.upright.en, positive: card.meanings.upright["zh-CN"], negativeEn: card.meanings.reversed.en, negative: card.meanings.reversed["zh-CN"], isReversed: orientation === "REVERSED",
  } }));
  const readingPrompt = [args.question, spread.name, ...selected.map(({ card, orientation }, i) => `${spread.labels[i]}: ${card.name} (${orientation}) — ${card.meanings[orientation === "REVERSED" ? "reversed" : "upright"][args.locale]}`), spread.interpretationInstruction, "Tarot supports symbolic reflection, not factual prediction."].join("\n");
  return { question: args.question, locale: args.locale, spread: { id: spread.id, name: spread.name, description: spread.description, cardCount: spread.cardCount }, cards, prompts: { readingPrompt } };
}
