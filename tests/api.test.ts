import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createAgentMcpServer } from "../mcp/agent";
import { DATASET_VERSION, DRAW_ALGORITHM_VERSION, drawReading, getCard, listCards, listCardsQuerySchema, listSpreads } from "../src/api/core";
import { handleTarotApi } from "../src/api/http";

const origin = "https://tarot.example";

test("catalog exposes 78 stable IDs and rejects numeric aliases", () => {
  const result = listCards(listCardsQuerySchema.parse({ limit: 78 }), origin);
  assert.equal(result.total, 78);
  assert.equal(new Set(result.cards.map((card) => card.id)).size, 78);
  assert.equal(getCard("0", "en", origin), undefined);
  assert.equal(getCard("maj00", "en", origin)?.names.en, "The Fool");
  assert.equal(listSpreads("en").length, 11);
  assert.ok(listSpreads("en").every((spread) => spread.cardCount === spread.labels.length));
});

test("fixed seeds replay exactly, respecting pools, uniqueness, and orientation meanings", () => {
  const request = { spread: "THREE", seed: "replay-test-01", locale: "en" as const };
  const first = drawReading(request, origin);
  const second = drawReading(request, origin);
  assert.deepEqual(first, second);
  assert.equal(first.reading.datasetVersion, DATASET_VERSION);
  assert.equal(first.reading.algorithmVersion, DRAW_ALGORITHM_VERSION);
  assert.equal(new Set(first.reading.cards.map((card) => card.cardId)).size, 3);
  for (const item of first.context.cards) {
    assert.equal(item.selectedMeaning.meaning, item.card.meanings[item.orientation === "REVERSED" ? "reversed" : "upright"].en);
  }
  const courts = drawReading({ spread: "COURT", seed: "court-pool", locale: "en" }, origin);
  assert.equal(courts.reading.cards.length, 3);
  assert.ok(!/^(Page|Knight|Queen|King) of /.test(courts.context.cards[0].card.names.en));
  assert.ok(/^(Page|Knight|Queen|King) of /.test(courts.context.cards[1].card.names.en));
  assert.equal(courts.context.cards[2].card.arcana, "MAJOR");
});

test("REST routes return structured validation and size errors", async () => {
  const openapi = await handleTarotApi(new Request(`${origin}/openapi.json`));
  assert.equal(openapi.status, 200);
  assert.equal((await openapi.json() as any).openapi, "3.1.0");
  const cards = await handleTarotApi(new Request(`${origin}/api/v1/cards?limit=78`));
  assert.equal(cards.status, 200);
  assert.equal((await cards.json() as any).total, 78);
  const invalid = await handleTarotApi(new Request(`${origin}/api/v1/readings/draw`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ spread: "AUTO" }) }));
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json() as any).error.code, "VALIDATION_ERROR");
  for (const [path, method] of [["/api/tarot/spreads", "GET"], ["/api/tarot/predict", "POST"], ["/api/v1/cards/0", "GET"], ["/api/v1/readings/context", "POST"]]) {
    assert.equal((await handleTarotApi(new Request(`${origin}${path}`, { method }))).status, 404);
  }
  const tooLarge = await handleTarotApi(new Request(`${origin}/api/v1/readings/draw`, { method: "POST", body: " ".repeat(128 * 1024 + 1) }));
  assert.equal(tooLarge.status, 413);
  assert.equal((await tooLarge.json() as any).error.code, "BODY_TOO_LARGE");
});

test("agent MCP and REST draw share the same deterministic service result", async () => {
  const apiOrigin = "https://tarot.example";
  const fetcher: typeof fetch = (input, init) => handleTarotApi(new Request(input, init));
  const server = createAgentMcpServer(apiOrigin, fetcher);
  const client = new Client({ name: "tarot-api-tests", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), ["draw_tarot_reading", "get_tarot_card", "list_tarot_spreads", "search_tarot_cards"]);
    const args = { spread: "THREE", seed: "mcp-rest-parity", locale: "en" };
    const mcp = await client.callTool({ name: "draw_tarot_reading", arguments: args });
    const rest = await fetcher(`${apiOrigin}/api/v1/readings/draw`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(args) });
    assert.deepEqual(mcp.structuredContent, await rest.json());
    const spreads = await client.callTool({ name: "list_tarot_spreads", arguments: { locale: "en" } });
    assert.equal((spreads.structuredContent as any).spreads.length, 11);
  } finally {
    await client.close();
    await server.close();
  }
});
