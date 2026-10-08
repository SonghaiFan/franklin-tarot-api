import { parseArgs } from "node:util";
import { listSpreads, localeSchema } from "../src/api/core";
import { legacyReading } from "../src/api/legacy";
const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  spread: { type: "string", default: "AUTO" }, locale: { type: "string", default: "zh-CN" }, seed: { type: "string" },
  json: { type: "boolean" }, "list-spreads": { type: "boolean" }, help: { type: "boolean", short: "h" },
} });
if (values.help) console.log('Franklin Tarot CLI: npm run cli -- "Question" [--spread THREE] [--locale en] [--seed value] [--json] [--list-spreads]');
else if (values["list-spreads"]) console.log(JSON.stringify(listSpreads(localeSchema.parse(values.locale)), null, 2));
else {
  const result = legacyReading({ question: positionals.join(" "), spread: values.spread, locale: values.locale, seed: values.seed }, "https://franklin-tarot-api.vercel.app");
  console.log(values.json ? JSON.stringify(result, null, 2) : result.prompts.readingPrompt);
}
