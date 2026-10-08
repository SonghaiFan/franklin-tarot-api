# Franklin Tarot API

Stateless tarot data, seeded draws and reading context for applications and AI agents. REST and the UI-free Agent MCP use the same service implementation. The caller stores the reading; the service has no reading-history database or model API dependency.

无状态塔罗服务：提供牌库、牌阵、可重放抽牌及后续解读上下文。调用方保存牌局，Agent 负责解读。

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
| `GET /api/v1/cards` | Search/filter 78 bilingual cards |
| `GET /api/v1/cards/{id}` | Card detail; stable IDs such as `maj00` |
| `GET /api/v1/spreads` | 11 real spreads and position rules |
| `POST /api/v1/readings/draw` | Seeded draw and structured context |
| `POST /api/v1/readings/context` | Validate a stored snapshot and rebuild context |
| `/mcp/agent` | Stateless Streamable HTTP MCP |

```sh
curl -sS http://127.0.0.1:3001/api/v1/readings/draw \
  -H 'Content-Type: application/json' \
  -d '{"spread":"THREE","locale":"en","seed":"my-first-reading"}'
```

Choose a spread from the catalog; `AUTO` is not drawable. Generate and retain a seed **before** sending if a retry must reproduce the draw. Save the returned `reading` object, then submit `{ "reading": ..., "question": "Follow-up", "locale": "en" }` to the context endpoint. The dataset and algorithm versions must still be supported; unavailable versions return `409`.

MCP tools: `search_tarot_cards`, `get_tarot_card`, `list_tarot_spreads`, `draw_tarot_reading`, `get_tarot_reading_context`. They execute the same validated service logic in-process, without making an HTTP request back to their own deployment. `npm run mcp:agent` provides the stdio transport.

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

`npm run dev` previews documentation during editing. After building, `npm run api` serves the complete site locally. The online example uses the current origin and preserves the returned snapshot for follow-up.

The independent [Frankie Tarot app](https://github.com/SonghaiFan/frankie-tarot) is the reference consumer, live at [tarot.songhai.site](https://tarot.songhai.site). Browsers use REST; its plugin adapter calls this service through MCP. There are no sibling source imports or local path dependencies.

Public API: `https://tarot-api.songhai.site` · Agent MCP: `/mcp/agent` · [Developer documentation](https://tarot-api.songhai.site/).

`npm run cli -- "Question" --spread THREE --locale en` returns the same JSON as REST/MCP. Only the v1 API and stable card IDs are supported.

## Data and interpretation

The deck contains project-curated English and Simplified Chinese descriptions and upright/reversed meanings. Per-field attribution has **not** been independently verified; the entire dataset should not be represented as a verbatim historical source. Each card response reports the dataset version and this attribution boundary.

Tarot supplies material for symbolic reflection, not factual prediction. The service returns structured meanings and positions; applications and agents choose how to present an interpretation.

牌义包含项目整理的中英文描述及正逆位解释，尚未逐字段核实来源。服务提供反思材料，不对现实结果作确定性预测。

## License

MIT, as stated by the existing project. Data provenance limitations are described above.
