# Franklin Tarot API — Agent guide

This page is written for AI agents and the developers who connect them to Franklin. The API has no API-key requirement and is read-only.

- API base URL: `https://tarot-api.songhai.site`
- OpenAPI schema: [`/openapi.json`](https://tarot-api.songhai.site/openapi.json)
- Human documentation: [`/`](https://tarot-api.songhai.site/)
- Agent MCP endpoint: `https://tarot-api.songhai.site/mcp/agent` (Streamable HTTP)
- Supported locales: `en`, `zh-CN`

## Operating contract

Franklin knows the cards and the spreads, and nothing else. It serves the 78-card catalog with bilingual meanings, and the spread definitions: positions, localized labels, interpretation guidance, and a card pool for each position.

The calling application owns everything about a reading: the user's question and consent, drawing the cards, deciding upright or reversed, the flow, and any state. Franklin does not draw, store, or interpret readings.

Use tarot as symbolic material for reflection. Do not state card meanings as facts, probabilities, or certain predictions. The card dataset is project-curated; per-field source attribution has not been independently verified.

## Card pools

Each spread lists one pool per position in `cardPools`. A drawn card must belong to its position's pool, and a reading never repeats a card.

| Pool | Cards |
| --- | --- |
| `FULL` | All 78 cards |
| `MAJOR` | Major arcana, IDs `maj00`–`maj21` |
| `MINOR_PIP` | Minor arcana ranks 1–10 |
| `COURT` | Minor arcana ranks 11–14 (Page, Knight, Queen, King) |
| `SUIT_WANDS`, `SUIT_CUPS`, `SUIT_SWORDS`, `SUIT_PENTACLES` | All 14 cards of that suit (IDs `wandsNN`, `cupsNN`, `swordsNN`, `pentsNN`) |

## REST endpoints

| Method and path | Purpose |
| --- | --- |
| `GET /health` | Check service health and API version |
| `GET /api/v1/cards?q=moon&locale=en&limit=10` | Search cards; optional `arcana`, `suit`, `offset` |
| `GET /api/v1/cards/{id}?locale=en` | Retrieve one stable card ID, such as `maj00` |
| `GET /api/v1/spreads?locale=en` | Retrieve spread IDs, card counts, layout positions, localized labels, card pools, and interpretation guidance |

Card search accepts `q` up to 120 characters, `limit` from 1 to 78, and `offset` from 0. Any method other than `GET` returns `405`.

## MCP tools

Connect to `https://tarot-api.songhai.site/mcp/agent` using Streamable HTTP. The server exposes these read-only, idempotent tools:

- `search_tarot_cards`: search by name, keyword, description, or meaning; optional arcana and suit filters.
- `get_tarot_card`: retrieve one card by stable `cardId`, such as `maj00`.
- `list_tarot_spreads`: list the spreads with their positions and card pools.

## Errors

Errors use a JSON envelope such as `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }`. A `400` means malformed input; correct the request rather than retrying it unchanged. A `404` means an unknown route or card ID. A `405` means a method other than `GET`.

---

# Franklin Tarot API — Agent 接入指南

本文面向 AI Agent 及其接入开发者。API 无需密钥，且只读。

- API 根地址：`https://tarot-api.songhai.site`
- OpenAPI Schema：[`/openapi.json`](https://tarot-api.songhai.site/openapi.json)
- 面向开发者的网页文档：[`/`](https://tarot-api.songhai.site/)
- Agent MCP 地址：`https://tarot-api.songhai.site/mcp/agent`（Streamable HTTP）
- 支持语言：`en`、`zh-CN`

## 服务边界

Franklin 只知道牌和牌阵：提供 78 张牌的中英文牌义，以及牌阵定义，包括位置、本地化标签、解读指引和每个位置的牌池。

牌局的一切由调用方应用负责：用户的问题与抽牌意愿、抽牌、正逆位、流程和状态。Franklin 不抽牌、不保存牌局，也不做解读。

塔罗用于象征性反思。不要把牌义说成事实、概率或确定的预言。牌库由项目整理，尚未逐字段独立核实来源归属。

## 牌池

每个牌阵的 `cardPools` 为每个位置给出一个牌池。抽到的牌必须属于该位置的牌池，同一局不重复抽同一张牌。

| 牌池 | 包含的牌 |
| --- | --- |
| `FULL` | 全部 78 张 |
| `MAJOR` | 大阿卡那，ID 为 `maj00`–`maj21` |
| `MINOR_PIP` | 小阿卡那 1–10 号 |
| `COURT` | 小阿卡那 11–14 号（侍从、骑士、王后、国王） |
| `SUIT_WANDS`、`SUIT_CUPS`、`SUIT_SWORDS`、`SUIT_PENTACLES` | 该花色的全部 14 张（ID 为 `wandsNN`、`cupsNN`、`swordsNN`、`pentsNN`） |

## REST 端点

| 方法与路径 | 用途 |
| --- | --- |
| `GET /health` | 检查服务和 API 版本 |
| `GET /api/v1/cards?q=月亮&locale=zh-CN&limit=10` | 搜索卡牌；还可使用 `arcana`、`suit`、`offset` |
| `GET /api/v1/cards/{id}?locale=zh-CN` | 查询稳定 ID 的牌，例如 `maj00` |
| `GET /api/v1/spreads?locale=zh-CN` | 获取牌阵 ID、张数、位置布局、本地化标签、牌池和解读指引 |

卡牌搜索的 `q` 最长 120 字符，`limit` 为 1 至 78，`offset` 不小于 0。`GET` 以外的请求返回 `405`。

## MCP 工具

使用 Streamable HTTP 连接 `https://tarot-api.songhai.site/mcp/agent`。服务提供以下只读、幂等的工具：

- `search_tarot_cards`：按名称、关键词、描述或牌义搜索，可筛选大/小阿卡那和花色。
- `get_tarot_card`：按稳定的 `cardId` 查询单张牌，例如 `maj00`。
- `list_tarot_spreads`：列出牌阵及其位置和牌池。

## 错误

错误采用如下 JSON 结构：`{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }`。`400` 表示输入格式错误，应修正请求，不要原样重复。`404` 表示端点或卡牌 ID 不存在。`405` 表示使用了 `GET` 以外的方法。
