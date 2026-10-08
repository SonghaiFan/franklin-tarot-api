import { build } from "vite";
import { cp } from "node:fs/promises";
import { execFileSync } from "node:child_process";

// One deployment serves docs, OpenAPI, artwork and API functions.
await build();
await cp("public", "dist", { recursive: true });
execFileSync(process.execPath, ["scripts/api-build.mjs"], { stdio: "inherit" });
