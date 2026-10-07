import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
let server;
let columns;

before(async () => {
  server = await createServer({
    configFile: false,
    root: projectRoot,
    logLevel: "silent",
    resolve: { alias: { "@": projectRoot } },
    server: { middlewareMode: true },
  });
  columns = await server.ssrLoadModule("/lib/catalog-columns.ts");
});

after(async () => {
  await server?.close();
});

test("CSV export keeps raw values, leaves gaps empty and escapes text", () => {
  const model = {
    name: 'Model "A", large',
    slug: "model-a",
    model_creator: { name: "Lab" },
    release_date: "2026-06-09",
    evaluations: { artificial_analysis_intelligence_index: 52.3 },
    pricing: { price_1m_blended_3_to_1: null, openrouter_display_prices: [] },
    median_output_tokens_per_second: 61.25,
    output_modality_text: true,
  };
  const csv = columns.catalogCsv([model], ["intelligence", "price", "speed", "newest"], {
    intelligence: "Intelligence",
    price: "Price",
    speed: "Speed",
    newest: "Release",
  });
  assert.equal(csv, 'name,slug,creator,Intelligence,Price,Speed,Release\r\n"Model ""A"", large",model-a,Lab,52.3,,61.25,2026-06-09');
});
