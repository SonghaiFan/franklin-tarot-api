# Franklin deployment

The API is deployed to the `franklin-tarot-api` Vercel project. Developer documentation is published by GitHub Pages from this repository. The user-facing app and plugin adapter live in `SonghaiFan/frankie-tarot`.

## Build and verify

```sh
npm ci
npm run api:test
npm run typecheck
npm run api:package
```

The generated `.api-deploy/` includes three bundled functions, OpenAPI and 234 WebP images. It does not contain the docs UI, credentials or an npm runtime install. After linking that generated directory to the API project, use an explicit local config:

```sh
cd .api-deploy
vercel project inspect --non-interactive
vercel deploy . --local-config ./vercel.json --prod --skip-domain --yes --no-wait
```

Verify the Ready deployment before promoting it. From the repository:

```sh
node scripts/api-smoke.mjs https://DEPLOYMENT.vercel.app --vercel
vercel promote https://DEPLOYMENT.vercel.app --yes
node scripts/api-smoke.mjs https://franklin-tarot-api.vercel.app
```

The last check is ordinary unauthenticated HTTP: passing through a signed-in CLI alone does not prove public availability.

Git deployments use the root `vercel.json`, which bundles service code into `.server/` and serves only API functions and `public/`. The GitHub Pages workflow builds docs separately, with `/franklin-tarot-api/` as its base path. API runtime code does not load React or plugin resources.

## Compatibility

The dataset was moved byte-for-byte from the previous application repository. Its dataset hash and draw algorithm version are unchanged, so existing v1 snapshots can still be validated. The previous API hostname is retained as a compatibility alias. New consumers should use the Franklin origin.

A real ChatGPT connection refresh remains a host-side acceptance step after plugin deployments. Protocol tests and the local AppBridge preview do not constitute verification in the actual ChatGPT host.
