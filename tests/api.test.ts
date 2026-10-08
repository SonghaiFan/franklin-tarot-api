import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createAgentMcpServer } from "../mcp/agent";
import { getCard, listCards, listCardsQuerySchema, listSpreads, randomCards } from "../src/api/core";
import { handleTarotApi } from "../src/api/http";

const origin = "https://tarot.example";

test("catalog exposes 78 stable IDs with ranks and rejects numeric aliases", () => {
  const result = listCards(listCardsQuerySchema.parse({}), origin);
  assert.equal(result.cards.length, 78);
  assert.equal(new Set(result.cards.map((card) => card.id)).size, 78);
  assert.equal(getCard("maj00", "en", origin)?.rank, 0);
  assert.equal(getCard("maj21", "en", origin)?.rank, 21);
  assert.equal(getCard("cups01", "en", origin)?.rank, 1);
  const courts = result.cards.filter((card) => card.arcana === "MINOR" && card.rank >= 11);
  assert.equal(courts.length, 16);
  assert.ok(courts.every((card) => /^(Page|Knight|Queen|King) of /.test(card.names.en)));
  assert.equal(listCards(listCardsQuerySchema.parse({ suit: "CUPS" }), origin).cards.length, 14);
  assert.equal(getCard("0", "en", origin), undefined);
  assert.equal(getCard("maj00", "en", origin)?.names.en, "The Fool");
  assert.equal(listSpreads("en").length, 11);
  assert.ok(listSpreads("en").every((spread) => spread.cardCount === spread.labels.length));
});

test("random cards are distinct and bounded", () => {
  assert.equal(randomCards({ n: 1, locale: "en" }, origin).cards.length, 1);
  const all = randomCards({ n: 78, locale: "en" }, origin).cards;
  assert.equal(new Set(all.map((card) => card.id)).size, 78);
  // Always picking 0 leaves the catalog order, so the first n cards come back.
  assert.deepEqual(randomCards({ n: 3, locale: "en" }, origin, () => 0).cards.map((card) => card.id), ["maj00", "maj01", "maj02"]);
  assert.ok(!("orientation" in all[0]));
});

test("REST routes are read-only and return structured errors", async () => {
  const openapi = await handleTarotApi(new Request(`${origin}/openapi.json`));
  assert.equal(openapi.status, 200);
  assert.equal((await openapi.json() as any).openapi, "3.1.0");
  const cards = await handleTarotApi(new Request(`${origin}/api/v1/cards`));
  assert.equal(cards.status, 200);
  assert.equal((await cards.json() as any).cards.length, 78);
  const random = await handleTarotApi(new Request(`${origin}/api/v1/cards/random?n=3&locale=en`));
  assert.equal(random.status, 200);
  assert.equal(random.headers.get("cache-control"), "no-store");
  assert.equal((await random.json() as any).cards.length, 3);
  for (const query of ["n=0", "n=79", "locale=fr"]) {
    const invalid = await handleTarotApi(new Request(`${origin}/api/v1/cards/random?${query}`));
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json() as any).error.code, "VALIDATION_ERROR");
  }
  for (const [path, method] of [["/api/tarot/spreads", "GET"], ["/api/tarot/predict", "POST"], ["/api/v1/cards/0", "GET"], ["/api/v1/readings/draw", "GET"]]) {
    assert.equal((await handleTarotApi(new Request(`${origin}${path}`, { method }))).status, 404);
  }
  for (const path of ["/api/v1/readings/draw", "/api/v1/readings/context", "/api/v1/cards"]) {
    const response = await handleTarotApi(new Request(`${origin}${path}`, { method: "POST", body: "{}" }));
    assert.equal(response.status, 405);
    assert.equal((await response.json() as any).error.code, "METHOD_NOT_ALLOWED");
  }
});

test("agent MCP serves the same cards and spreads as REST", async () => {
  const apiOrigin = "https://tarot.example";
  const server = createAgentMcpServer(apiOrigin);
  const client = new Client({ name: "tarot-api-tests", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), ["get_random_tarot_cards", "get_tarot_card", "list_tarot_spreads", "search_tarot_cards"]);
    const card = await client.callTool({ name: "get_tarot_card", arguments: { cardId: "maj00", locale: "en" } });
    const rest = await handleTarotApi(new Request(`${apiOrigin}/api/v1/cards/maj00?locale=en`));
    assert.deepEqual((card.structuredContent as any).card, await rest.json());
    const spreads = await client.callTool({ name: "list_tarot_spreads", arguments: { locale: "en" } });
    assert.equal((spreads.structuredContent as any).spreads.length, 11);
  } finally {
    await client.close();
    await server.close();
  }
});
