import { test } from "node:test";
import assert from "node:assert/strict";
import { legacyReading } from "../src/api/legacy";
import { handleTarotApi } from "../src/api/http";
test("legacy AUTO falls back to SINGLE and preserves its response envelope", async () => {
  const result = legacyReading({ question: "test", spread: "AUTO", locale: "en", seed: "legacy" }, "https://example.com");
  assert.equal(result.spread.id, "SINGLE");
  assert.equal(result.cards.length, 1);
  assert.equal(typeof result.cards[0].card.id, "number");
  assert.ok(result.prompts.readingPrompt);
  const response = await handleTarotApi(new Request("https://example.com/api/tarot/predict", { method: "POST", body: JSON.stringify({spread:"AUTO"}) }));
  assert.equal(response.status, 200);
});
test("legacy custom cards use authoritative meanings and reject invalid pools", () => {
  const result = legacyReading({ spread: "SINGLE", customCards: [{id: 0, isReversed: true, negative: "FORGED"}] }, "https://example.com");
  assert.equal(result.cards[0].card.isReversed, true);
  assert.ok(!result.prompts.readingPrompt.includes("FORGED"));
  assert.throws(() => legacyReading({spread:"THREE",customCards:Array.from({length:3},()=>({id:0,isReversed:false}))},"https://example.com"));
});
