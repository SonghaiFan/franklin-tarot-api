import { mkdir } from "node:fs/promises";
import { build } from "esbuild";

await mkdir(".server", { recursive: true });

const shared = {
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
};

await Promise.all([
  build({
    ...shared,
    entryPoints: ["src/api/http.ts"],
    outfile: ".server/tarot-api.mjs",
  }),
  build({
    ...shared,
    entryPoints: ["mcp/agent-http.ts"],
    outfile: ".server/agent-mcp.mjs",
  }),
]);
