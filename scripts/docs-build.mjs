import { build } from "vite";
import { copyFile, writeFile } from "node:fs/promises";
await build();
await copyFile("public/openapi.json", "dist/openapi.json");
await writeFile("dist/.nojekyll", "");
