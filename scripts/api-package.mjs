import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

// A closed deployment input: no UI, env files, old build output or project links.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, ".api-deploy");
await rm(output, { recursive: true, force: true });
await mkdir(join(output, "api"), { recursive: true });
const entries = [
  ["api/rest.mjs", 'export { default as fetch } from "./src/api/http.ts";'],
  ["api/mcp-agent.mjs", 'export { default as fetch } from "./mcp/agent-http.ts";'],
  ["api/health.mjs", 'export { fetch } from "./api/health.ts";'],
];
for (const [file, contents] of entries) {
  const result = await build({
    stdin: { contents, resolveDir: root, sourcefile: file },
    outfile: join(output, file),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node24",
    banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
    metafile: true,
  });
  const uiInputs = Object.keys(result.metafile.inputs).filter((file) => /node_modules\/(react|react-dom|motion|gsap|three|@modelcontextprotocol\/ext-apps)\//.test(file));
  if (uiInputs.length) throw new Error(`Unexpected UI dependencies: ${uiInputs.join(", ")}`);
}

const data = JSON.parse(await readFile(join(root, "src/data/tarot.json"), "utf8"));
const ids = data.cards.allIds.map((key) => data.cards.byId[key].image.replace(/\.[^.]+$/, ""));
let artworkCount = 0;
for (const style of ["cards", "cards_dreamy", "cards_rws_original"]) {
  const dest = join(output, "public/images", style);
  await mkdir(dest, { recursive: true });
  for (const id of ids) {
    await cp(join(root, "public/images", style, `${id}.webp`), join(dest, `${id}.webp`));
    artworkCount++;
  }
}
await cp(join(root, "public/openapi.json"), join(output, "public/openapi.json"));
const config = JSON.parse(await readFile(join(root, "vercel.api.json"), "utf8"));
config.buildCommand = "node --version";
config.installCommand = "node --version";
await writeFile(join(output, "vercel.json"), JSON.stringify(config, null, 2) + "\n");
await writeFile(join(output, "package.json"), JSON.stringify({ name: "franklin-tarot-api", private: true, type: "module", engines: { node: "24.x" } }, null, 2) + "\n");
await writeFile(join(output, ".vercelignore"), ".env*\n.git\nnode_modules\n");
console.log(`API deployment package: ${output} (3 bundled functions, ${artworkCount} card images; no runtime npm install)`);
