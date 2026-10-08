# Franklin Tarot API

Read-only tarot data for applications and AI agents: 78 bilingual cards and the spread definitions, with positions and card pools. REST and the UI-free Agent MCP use the same service implementation. The calling app draws the cards and owns the reading; the service has no database or model API dependency.

只读塔罗数据服务：提供牌库和牌阵定义（含位置与牌池）。抽牌、流程和状态由调用方应用负责。

## Run locally

```sh
npm ci
npm run api
```

At `http://127.0.0.1:3001`:

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Service health |
| `GET /openapi.json` | OpenAPI 3.1 schema |
| `GET /api/v1/cards` | All 78 bilingual cards, or those matching `q`, `arcana`, `suit` |
| `GET /api/v1/cards/random?n=3` | `n` distinct random cards, without orientation |
| `GET /api/v1/cards/{id}` | Card detail; stable IDs such as `maj00` |
| `GET /api/v1/spreads` | 11 real spreads and position rules |
| `/mcp/agent` | Stateless Streamable HTTP MCP |

```sh
curl -sS "http://127.0.0.1:3001/api/v1/spreads?locale=en"
```

Each spread gives one card pool per position (`cardPools`); `public/agents.md` defines the pool values. Drawing, orientation and reading state belong to the calling app.

MCP tools: `search_tarot_cards`, `get_tarot_card`, `list_tarot_spreads`, `get_random_tarot_cards`. They execute the same validated service logic in-process, without making an HTTP request back to their own deployment. `npm run mcp:agent` provides the stdio transport.

## Build, run and deploy

```sh
npm run api:test
npm run typecheck
npm run build
npm run api
# In another terminal:
node scripts/api-smoke.mjs http://127.0.0.1:3001
```

One build serves documentation, REST, MCP, OpenAPI and card artwork. Vercel deploys the repository using its single `vercel.json`; GitHub Actions runs checks. See [deployment instructions](docs/api-deployment.md).

`npm run dev` previews documentation during editing. After building, `npm run api` serves the complete site locally. The online example calls the current origin.

The independent [Frankie Tarot app](https://github.com/SonghaiFan/frankie-tarot) is the reference consumer, live at [tarot.songhai.site](https://tarot.songhai.site). Browsers use REST; its plugin adapter calls this service through MCP. There are no sibling source imports or local path dependencies.

Public API: `https://tarot-api.songhai.site` · Agent MCP: `/mcp/agent` · [Developer documentation](https://tarot-api.songhai.site/).

Only the v1 API and stable card IDs are supported.

## Data and interpretation

The deck contains project-curated English and Simplified Chinese descriptions and upright/reversed meanings. Per-field attribution has **not** been independently verified; the entire dataset should not be represented as a verbatim historical source. Each card response reports the dataset version and this attribution boundary.

Tarot supplies material for symbolic reflection, not factual prediction. The service returns structured meanings and positions; applications and agents choose how to present an interpretation.

牌义包含项目整理的中英文描述及正逆位解释，尚未逐字段核实来源。服务提供反思材料，不对现实结果作确定性预测。

## License

MIT, as stated by the existing project. Data provenance limitations are described above.
