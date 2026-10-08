import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const origin = process.argv[2];
if (!origin || !/^https?:\/\//.test(origin)) throw new Error("Usage: node scripts/api-smoke.mjs <origin> [--vercel]");
const protectedPreview = process.argv.includes("--vercel");
async function request(path, { method = "GET", body, headers = {} } = {}) {
  if (!protectedPreview) return fetch(new URL(path, origin), {
    method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000),
  });
  // CLI handles its credentials; never read or print protection tokens ourselves.
  const args = ["curl", path, "--deployment", origin, "--", "--silent", "--show-error", "--max-time", "30", "--include", "--request", method];
  for (const [key, value] of Object.entries(headers)) args.push("--header", `${key}: ${value}`);
  if (body !== undefined) args.push("--data-binary", "@-");
  const bytes = await new Promise((resolve, reject) => {
    const child = spawn("vercel", args, { stdio: ["pipe", "pipe", "pipe"] });
    const chunks = [];
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.stderr.resume();
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(`vercel curl failed (${code}) for ${path}`)));
    child.stdin.end(body === undefined ? undefined : JSON.stringify(body));
  });
  let rest = bytes;
  let status;
  let responseHeaders;
  while (rest.subarray(0, 5).toString() === "HTTP/") {
    const end = rest.indexOf("\r\n\r\n");
    assert.ok(end >= 0, "Response must include headers");
    const lines = rest.subarray(0, end).toString().split("\r\n");
    status = Number(lines.shift().split(" ")[1]);
    responseHeaders = new Headers(lines.map((line) => { const at = line.indexOf(":"); return [line.slice(0, at), line.slice(at + 1).trim()]; }));
    rest = rest.subarray(end + 4);
  }
  assert.ok(status, "Expected an HTTP response from the deployment");
  return new Response([204, 304].includes(status) ? null : rest, { status, headers: responseHeaders });
}
async function json(path, options, expected = 200) {
  const response = await request(path, options);
  assert.equal(response.status, expected, path);
  return response.json();
}
const post = (body) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body });
const home = await request("/");
assert.equal(home.status, 200, "Documentation homepage must be served directly");
assert.match(await home.text(), /Franklin Tarot API/);
for (const path of ["/api/tarot/spreads", "/api/tarot/predict", "/api/v1/cards/0"]) {
  assert.equal((await request(path, path.endsWith("predict") ? post({}) : {})).status, 404, path);
}
console.log("PASS documentation homepage and removed legacy routes");
const health = await json("/health");
assert.equal(health.status, "ok");
assert.equal((await json("/openapi.json")).openapi, "3.1.0");
const cards = await json("/api/v1/cards?limit=78&locale=en");
assert.equal(cards.total, 78);
assert.equal(cards.cards.length, 78);
assert.equal((await json("/api/v1/spreads?locale=en")).spreads.length, 11);
assert.equal((await json("/api/v1/cards/maj00?locale=en")).id, "maj00");
console.log("PASS health, OpenAPI, 78 cards, 11 spreads, card detail");

const args = { spread: "THREE", seed: "deployment-smoke-v1", locale: "en" };
const draw = await json("/api/v1/readings/draw", post(args));
assert.deepEqual(await json("/api/v1/readings/draw", post(args)), draw);
assert.equal(new Set(draw.reading.cards.map((card) => card.cardId)).size, 3);
assert.equal((await json("/api/v1/readings/draw", post({ spread: "AUTO" }), 400)).error.code, "VALIDATION_ERROR");
console.log("PASS deterministic draw and input errors");

let id = 0;
async function rpc(method, params) {
  const message = await json("/mcp/agent", { ...post({ jsonrpc: "2.0", id: ++id, method, params }), headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" } });
  assert.equal(message.error, undefined, method);
  assert.notEqual(message.result.isError, true, method);
  return message.result;
}
await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "tarot-deployment-smoke", version: "1.0.0" } });
assert.equal((await rpc("tools/list", {})).tools.length, 4);
const tool = async (name, args) => (await rpc("tools/call", { name, arguments: args })).structuredContent;
assert.deepEqual(await tool("draw_tarot_reading", args), draw);
assert.equal((await tool("list_tarot_spreads", { locale: "en" })).spreads.length, 11);
assert.equal((await tool("search_tarot_cards", { locale: "en", limit: 1 })).total, 78);
assert.equal((await tool("get_tarot_card", { cardId: "maj00", locale: "en" })).card.id, "maj00");
console.log("PASS MCP initialization, all four tools, REST/MCP draw parity");

for (const url of Object.values(cards.cards[0].imageUrls)) {
  const assetUrl = new URL(url);
  assert.equal(assetUrl.origin, new URL(origin).origin);
  const response = await request(assetUrl.pathname + assetUrl.search);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /image\/webp/);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 4).toString(), "RIFF");
  assert.equal(bytes.subarray(8, 12).toString(), "WEBP");
}
for (const path of ["/api/v1/readings/draw", "/mcp/agent"]) {
  const response = await request(path, { method: "OPTIONS", headers: { Origin: "https://example.com", "Access-Control-Request-Method": "POST" } });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
}
console.log("PASS all three artwork styles and cross-origin preflights");
