import { parseArgs } from "node:util";
import { drawReading, listSpreads, localeSchema } from "../src/api/core";
const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  spread: { type: "string", default: "SINGLE" }, locale: { type: "string", default: "zh-CN" }, seed: { type: "string" },
  "list-spreads": { type: "boolean" }, help: { type: "boolean", short: "h" },
} });
if (values.help) console.log('Franklin Tarot CLI: npm run cli -- "Question" [--spread THREE] [--locale en] [--seed value] [--list-spreads]. Outputs the same JSON as REST/MCP.');
else if (values["list-spreads"]) console.log(JSON.stringify(listSpreads(localeSchema.parse(values.locale)), null, 2));
else console.log(JSON.stringify(drawReading({ question: positionals.join(" "), spread: values.spread, locale: localeSchema.parse(values.locale), seed: values.seed }, "https://tarot-api.songhai.site"), null, 2));
