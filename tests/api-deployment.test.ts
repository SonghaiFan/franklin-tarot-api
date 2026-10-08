import assert from "node:assert/strict";
import { test } from "node:test";
import handleAgentMcp from "../mcp/agent-http";
import { handleTarotApi } from "../src/api/http";

test("HTTP MCP answers without fetching its own protected origin", async () => {
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
    const spreads = await call("list_tarot_spreads", { locale: "en" });
    const rest = await (await handleTarotApi(new Request(`${origin}/api/v1/spreads?locale=en`))).json() as any;
    assert.deepEqual(spreads, rest);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
