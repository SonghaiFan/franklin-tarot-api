import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { agentContextSchema, getCard, listCards, listCardsQuerySchema, listSpreads, SPREAD_IDS } from "../src/api/core";
import { handleTarotApi } from "../src/api/http";

const localeSchema = z.enum(["en", "zh-CN"]).default("zh-CN");
const cardsOutput = z.object({ cards: z.array(z.any()), total: z.number(), limit: z.number(), offset: z.number(), locale: z.enum(["en", "zh-CN"]), datasetVersion: z.string() });
const spreadOutput = z.object({ spreads: z.array(z.any()), locale: z.enum(["en", "zh-CN"]) });
const readingOutput = z.object({ reading: z.any(), context: z.any(), policy: z.string() });
const contextOutput = z.object({ question: z.string(), locale: z.enum(["en", "zh-CN"]), spread: z.any(), cards: z.array(z.any()), sourceReadingId: z.string(), policy: z.string() });
export function createAgentMcpServer(apiOrigin = process.env.PUBLIC_API_BASE_URL || "http://127.0.0.1:3001", fetcher: typeof fetch = (input, init) => handleTarotApi(new Request(input, init))) {
  const server = new McpServer({ name: "franklin-tarot-agent", version: "1.0.0" }, {
    instructions: "Tools provide tarot card references, spread metadata, and seeded reading draws for symbolic reflection. Choose a real spread from list_tarot_spreads before drawing. draw_tarot_reading makes a new draw; reuse its returned reading snapshot with get_tarot_reading_context for follow-up, never redraw to answer a follow-up. Use a caller-generated seed when retries must reproduce the same draw. Do not present tarot as factual prediction, certainty, or probability. Card meanings are project-curated and field-level source attribution is not independently verified.",
  });

  server.registerTool("search_tarot_cards", {
    title: "Search tarot cards",
    description: "Search the 78-card deck by name, keyword, description or meaning. Optionally filter by arcana or suit. Returns a compact, paginated result.",
    inputSchema: { q: z.string().trim().max(120).optional(), arcana: z.enum(["MAJOR", "MINOR"]).optional(), suit: z.enum(["WANDS", "CUPS", "SWORDS", "PENTACLES"]).optional(), locale: localeSchema, limit: z.number().int().min(1).max(78).default(12), offset: z.number().int().min(0).max(10000).default(0) },
    outputSchema: cardsOutput,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async (args) => {
    const query = listCardsQuerySchema.parse(args);
    const payload = listCards(query, apiOrigin);
    return { structuredContent: payload, content: [{ type: "text", text: JSON.stringify(payload) }] };
  });

  server.registerTool("get_tarot_card", {
    title: "Get tarot card meaning",
    description: "Return the bilingual name, upright and reversed meanings, keywords, image URLs, and data provenance for one card. Stable IDs such as maj00 are preferred; legacy numeric IDs are accepted.",
    inputSchema: { cardId: z.string().min(1).max(32), locale: localeSchema },
    outputSchema: z.object({ card: z.any() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ cardId, locale }) => {
    const card = getCard(cardId, locale, apiOrigin);
    if (!card) return { isError: true, content: [{ type: "text", text: `No tarot card matches ID '${cardId}'.` }] };
    return { structuredContent: { card }, content: [{ type: "text", text: JSON.stringify(card) }] };
  });

  server.registerTool("list_tarot_spreads", {
    title: "List tarot spreads",
    description: "List the 11 real spreads with card counts, position labels, per-position card pools, and interpretation goals. AUTO is not a drawable spread; choose a listed ID.",
    inputSchema: { locale: localeSchema },
    outputSchema: spreadOutput,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ locale }) => {
    const payload = { spreads: listSpreads(locale), locale };
    return { structuredContent: payload, content: [{ type: "text", text: JSON.stringify(payload) }] };
  });

  server.registerTool("draw_tarot_reading", {
    title: "Draw a tarot reading",
    description: "Draw a new reading for a user-requested symbolic reflection. Select a real spread ID from list_tarot_spreads first. Provide and retain a seed if the same draw must be reproduced after a retry. Returns a complete snapshot and orientation-aware structured context.",
    inputSchema: { question: z.string().trim().max(2000).default(""), spread: z.enum(SPREAD_IDS as [string, ...string[]]), locale: localeSchema, seed: z.string().min(1).max(128).optional(), reversedProbability: z.number().min(0).max(1).default(0.4) },
    outputSchema: readingOutput,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async (args) => {
    const response = await fetcher(`${apiOrigin}/api/v1/readings/draw`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) });
    const payload = await response.json();
    if (!response.ok) return { isError: true, content: [{ type: "text", text: JSON.stringify(payload) }] };
    return { structuredContent: payload, content: [{ type: "text", text: JSON.stringify(payload) }] };
  });

  server.registerTool("get_tarot_reading_context", {
    title: "Get tarot reading context",
    description: "Rebuild meanings and position context for a previously returned snapshot. Pass the exact snapshot and a follow-up question. This does not draw cards or persist the reading.",
    inputSchema: { reading: z.record(z.string(), z.unknown()), question: z.string().trim().max(2000).default(""), locale: localeSchema },
    outputSchema: contextOutput,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async (args) => {
    const parsed = agentContextSchema.parse(args);
    const response = await fetcher(`${apiOrigin}/api/v1/readings/context`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
    const payload = await response.json();
    if (!response.ok) return { isError: true, content: [{ type: "text", text: JSON.stringify(payload) }] };
    return { structuredContent: payload, content: [{ type: "text", text: JSON.stringify(payload) }] };
  });

  return server;
}
