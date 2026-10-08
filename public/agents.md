# Franklin Tarot API — Agent guide

This page is written for AI agents and the developers who connect them to Franklin. The API has no API-key requirement and does not store questions or readings.

- API base URL: `https://tarot-api.songhai.site`
- OpenAPI schema: [`/openapi.json`](https://tarot-api.songhai.site/openapi.json)
- Human documentation: [`/`](https://tarot-api.songhai.site/)
- Agent MCP endpoint: `https://tarot-api.songhai.site/mcp/agent` (Streamable HTTP)
- Supported locales: `en`, `zh-CN`

## Operating contract

Franklin owns the card catalog, spread definitions, seeded draw algorithm, and validation/reconstruction of reading context. The calling application or agent owns the user's question and consent, the selected locale, and persistence of the returned reading snapshot. Franklin does not keep reading history and does not generate an interpretation with a model.

Use tarot as symbolic material for reflection. Do not state card meanings as facts, probabilities, or certain predictions. The card dataset is project-curated; per-field source attribution has not been independently verified.

## Recommended flow

1. When a user asks for a reading, call `list_tarot_spreads` or `GET /api/v1/spreads?locale=en` and select an ID from the returned catalog. Do not guess IDs. `AUTO` is not drawable.
2. Generate a seed in the caller before requesting a draw if retries must reproduce the same result. Save that seed before sending the request.
3. Call `draw_tarot_reading` or `POST /api/v1/readings/draw`. Save the complete `reading` object from the response exactly as returned. It is the caller's reading snapshot.
4. For a follow-up, call `get_tarot_reading_context` or `POST /api/v1/readings/context` with that exact snapshot, the follow-up question, and the desired locale. This validates and reconstructs context from the same draw; it does not draw again.
5. Present the returned card positions and selected upright/reversed meanings. The agent may synthesize a reflection, while making clear it is interpretive rather than factual.

If a context request returns `409` because the dataset or algorithm version is no longer supported, explain that this snapshot cannot be reconstructed by the current service. Do not silently draw replacement cards.

## REST endpoints

| Method and path | Purpose |
| --- | --- |
| `GET /health` | Check service health and API version |
| `GET /api/v1/cards?q=moon&locale=en&limit=10` | Search cards; optional `arcana`, `suit`, `offset` |
| `GET /api/v1/cards/{id}?locale=en` | Retrieve one stable card ID, such as `maj00` |
| `GET /api/v1/spreads?locale=en` | Retrieve spread IDs, card counts, layout positions, localized labels, and card-pool constraints |
| `POST /api/v1/readings/draw` | Draw a new reading and return its snapshot and structured context |
| `POST /api/v1/readings/context` | Validate a saved snapshot and rebuild context for follow-up |

Card search accepts `q` up to 120 characters, `limit` from 1 to 78, and `offset` from 0. Draw questions and context questions may be up to 2,000 characters. Draw requests accept an optional `seed` of 1–128 characters and optional `reversedProbability` from 0 to 1 (default `0.4`). Unknown JSON fields are rejected.

## Draw example

Create and retain the seed before the network request. Retain the returned `reading` object; do not reconstruct it from the visible cards.

```js
const seed = crypto.randomUUID();
await savePendingSeed(seed); // Your application's persistence layer

const response = await fetch("https://tarot-api.songhai.site/api/v1/readings/draw", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: "What deserves my attention today?",
    spread: "THREE", // Choose an ID returned by /api/v1/spreads
    locale: "en",
    seed
  })
});

const payload = await response.json();
if (!response.ok) throw new Error(payload.error?.message ?? `HTTP ${response.status}`);
await saveReadingSnapshot(payload.reading);
// payload.context contains localized cards, positions, and selected meanings.
```

## Follow-up example

Pass the saved snapshot verbatim. The locale can change; the returned context is localized for the requested locale while referring to the same reading ID.

```js
const response = await fetch("https://tarot-api.songhai.site/api/v1/readings/context", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    reading: savedReadingSnapshot,
    question: "What could I reflect on next?",
    locale: "en"
  })
});

const context = await response.json();
if (!response.ok) throw new Error(context.error?.message ?? `HTTP ${response.status}`);
```

## MCP tools

Connect to `https://tarot-api.songhai.site/mcp/agent` using Streamable HTTP. The server exposes these tools:

- `search_tarot_cards`: search by name, keyword, description, or meaning; optional arcana and suit filters.
- `get_tarot_card`: retrieve one card by stable `cardId`, such as `maj00`.
- `list_tarot_spreads`: list the real drawable spreads. Always choose a returned spread ID.
- `draw_tarot_reading`: create a new reading. Use a caller-generated seed for replayable retries and retain the returned `reading` snapshot.
- `get_tarot_reading_context`: rebuild context for a follow-up from the exact saved snapshot, without drawing again.

Search, card lookup, and spread listing are read-only and idempotent. Draw is not idempotent unless the caller supplies and reuses its seed. Context reconstruction is idempotent for the same request.

## Errors and retry behavior

Errors use a JSON envelope such as `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }`. A `400` usually means malformed input or a snapshot that does not match its seed and version; correct the request rather than retrying it unchanged. A `404` means an unknown route or card ID. A `409` means a saved snapshot uses an unsupported dataset or algorithm version. A `413` means the request body exceeds 128 KB.

For transient network failures, retry the same draw with the same caller-held seed. Never generate a replacement seed just because a response was lost. A repeated request with the same seed, spread, dataset version, algorithm version, and draw settings reproduces the same cards and orientations.

---

# Franklin Tarot API — Agent 接入指南

本文面向 AI Agent 及其接入开发者。API 无需密钥，也不会保存问题或牌局。

- API 根地址：`https://tarot-api.songhai.site`
- OpenAPI Schema：[`/openapi.json`](https://tarot-api.songhai.site/openapi.json)
- 面向开发者的网页文档：[`/`](https://tarot-api.songhai.site/)
- Agent MCP 地址：`https://tarot-api.songhai.site/mcp/agent`（Streamable HTTP）
- 支持语言：`en`、`zh-CN`

## 服务边界

Franklin 负责牌库、牌阵定义、带 seed 的抽牌算法，以及牌局上下文的校验和重建。调用方应用或 Agent 负责取得用户的问题与抽牌意愿、选择语言，并保存 API 返回的牌局快照。Franklin 不保存历史牌局，也不调用模型生成解读。

塔罗用于象征性反思。不要把牌义说成事实、概率或确定的预言。牌库由项目整理，尚未逐字段独立核实来源归属。

## 建议流程

1. 用户提出抽牌请求后，先调用 `list_tarot_spreads` 或 `GET /api/v1/spreads?locale=zh-CN`，从返回目录中选择牌阵 ID。不要自行猜测 ID；`AUTO` 不能用于抽牌。
2. 如果网络重试必须复现同一结果，在请求前由调用方生成 seed，并先保存 seed。
3. 调用 `draw_tarot_reading` 或 `POST /api/v1/readings/draw`。将响应里的完整 `reading` 对象原样保存为牌局快照。
4. 用户追问时，调用 `get_tarot_reading_context` 或 `POST /api/v1/readings/context`，传入完全相同的快照、追问和所需语言。该接口会校验并重建同一局的上下文，不会重新抽牌。
5. 展示 API 返回的位置、正逆位及对应牌义。Agent 可以据此组织反思，但要说明这是象征性解读，不是事实预测。

如果上下文接口因数据集或算法版本不再受支持而返回 `409`，请说明当前服务无法重建该快照，不要悄悄替用户抽取新牌。

## REST 端点

| 方法与路径 | 用途 |
| --- | --- |
| `GET /health` | 检查服务和 API 版本 |
| `GET /api/v1/cards?q=月亮&locale=zh-CN&limit=10` | 搜索卡牌；还可使用 `arcana`、`suit`、`offset` |
| `GET /api/v1/cards/{id}?locale=zh-CN` | 查询稳定 ID 的牌，例如 `maj00` |
| `GET /api/v1/spreads?locale=zh-CN` | 获取牌阵 ID、张数、位置布局、本地化标签和位置牌池 |
| `POST /api/v1/readings/draw` | 抽牌并返回快照和结构化上下文 |
| `POST /api/v1/readings/context` | 校验已保存的快照并重建追问上下文 |

卡牌搜索的 `q` 最长 120 字符，`limit` 为 1 至 78，`offset` 不小于 0。抽牌问题和追问最长 2,000 字符。抽牌可选 `seed`（1 至 128 字符）和 `reversedProbability`（0 至 1，默认 `0.4`）。请求 JSON 不接受未定义字段。

## MCP 工具

使用 Streamable HTTP 连接 `https://tarot-api.songhai.site/mcp/agent`。服务提供以下工具：

- `search_tarot_cards`：按名称、关键词、描述或牌义搜索，可筛选大/小阿卡那和花色。
- `get_tarot_card`：按稳定的 `cardId` 查询单张牌，例如 `maj00`。
- `list_tarot_spreads`：列出可抽取的牌阵。始终选择返回结果中的 ID。
- `draw_tarot_reading`：创建新牌局。重试时使用调用方生成的 seed，并保存返回的 `reading` 快照。
- `get_tarot_reading_context`：根据原样保存的快照重建追问上下文，不会重新抽牌。

卡牌搜索、单牌查询和牌阵查询均为只读且幂等。抽牌只有在调用方提供并复用 seed 时才能确定性重放。相同请求的上下文重建是幂等的。

## 错误与重试

错误采用如下 JSON 结构：`{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }`。`400` 通常表示输入格式错误，或快照与 seed、版本不匹配；应修正请求，不要原样重复。`404` 表示端点或卡牌 ID 不存在。`409` 表示快照使用的牌库数据集或算法版本当前不受支持。`413` 表示请求体超过 128 KB。

网络暂时失败时，用调用方保存的同一个 seed 重试抽牌。不能因为响应丢失就生成新 seed。只要 seed、牌阵、数据集版本、算法版本及抽牌设置相同，重试会得到相同的卡牌和正逆位。
