import assert from "node:assert/strict";
import { test } from "node:test";
import handleAgentMcp from "../mcp/agent-http";
import { handleTarotApi } from "../src/api/http";

test("HTTP MCP draws and continues the same reading without fetching its own protected origin", async () => {
  const origin = "https://protected-preview.example";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Core MCP must not depend on a second HTTP request"); };
  try {
    const call = async (name: string, args: Record<string, unknown>) => {
      const response = await handleAgentMcp(new Request(`${origin}/mcp/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
      }));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("access-control-allow-origin"), "*");
      const message = await response.json();
      assert.equal(message.error, undefined);
      assert.equal(message.result.isError, undefined);
      return message.result.structuredContent;
    };
    const args = { spread: "THREE", seed: "deployed-http-parity", locale: "en" };
    const draw = await call("draw_tarot_reading", args);
    const rest = await handleTarotApi(new Request(`${origin}/api/v1/readings/draw`, { method: "POST", body: JSON.stringify(args) }));
    assert.deepEqual(draw, await rest.json());
    const context = await call("get_tarot_reading_context", { reading: draw.reading, question: "Follow up", locale: "zh-CN" });
    assert.equal(context.sourceReadingId, draw.reading.readingId);
    assert.deepEqual(context.cards.map((card: any) => card.card.id), draw.context.cards.map((card: any) => card.card.id));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
