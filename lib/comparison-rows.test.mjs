import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { LanguageProvider, useI18n } from "./i18n.tsx";
import { parseModelsDev } from "./models-dev.ts";
import {
  buildComparisonRows,
  bestComparisonValue,
  comparisonHasDifferences,
} from "./comparison-rows.ts";

function translations(lang) {
  let result;
  function Read() {
    result = useI18n().t;
    return null;
  }
  renderToString(
    React.createElement(
      LanguageProvider,
      { initialLang: lang },
      React.createElement(Read),
    ),
  );
  return result;
}
function model(id, extra = {}) {
  return {
    ...parseModelsDev({
      [`lab/${id}`]: {
        id: `lab/${id}`,
        name: id,
        modalities: { output: ["text"] },
      },
    })[0],
    ...extra,
  };
}
test("comparison distinguishes zero, explicit false and missing values without awarding a single measured model", () => {
  const rows = buildComparisonRows(
    [
      model("a", {
        median_output_tokens_per_second: 0,
        reasoning_model: false,
      }),
      model("b"),
    ],
    translations("fr"),
    "fr",
  );
  const speed = rows.find((row) => row.id === "speed");
  assert.deepEqual(speed.values, [0, null]);
  assert.equal(bestComparisonValue(speed), null);
  assert.equal(comparisonHasDifferences(speed), true);
  assert.deepEqual(rows.find((row) => row.id === "reasoning").values, [
    false,
    null,
  ]);
  assert.ok(!rows.some((row) => row.id === "ttft"));
});
test("comparison marks an advantage only for a known direction and multiple distinct measurements", () => {
  assert.equal(
    bestComparisonValue({ values: [5, 0, null], direction: "lower" }),
    0,
  );
  assert.equal(
    bestComparisonValue({ values: [5, 8, 8], direction: "higher" }),
    8,
  );
  assert.equal(
    bestComparisonValue({ values: [8, 8], direction: "higher" }),
    null,
  );
  assert.equal(bestComparisonValue({ values: [8, 9] }), null);
});
test("comparison shows published cost per task as a lower-is-better price without deriving missing values", () => {
  const rows = buildComparisonRows(
    [model("a", { intelligence_index_cost_per_task_usd: 0 }), model("b", { intelligence_index_cost_per_task_usd: 2.5 }), model("c")],
    translations("en"),
    "en",
  );
  const cost = rows.find((row) => row.id === "cost-per-task");
  assert.deepEqual(cost?.values, [0, 2.5, null]);
  assert.equal(cost?.direction, "lower");
  assert.equal(cost?.essential, true);
});
test("comparison keeps raw unknown benchmark units, covers known metrics, and omits text metrics on media models", () => {
  const evaluations = { gpqa: 0.8, critpt: 0.1, custom_score: 900 };
  const rows = buildComparisonRows(
    [
      model("text", { evaluations }),
      model("image", {
        evaluations,
        output_modality_text: false,
        output_modality_image: true,
        openrouter_output_modalities: ["image"],
      }),
    ],
    translations("en"),
    "en",
  );
  assert.deepEqual(rows.find((row) => row.id === "gpqa").values, [0.8, null]);
  assert.deepEqual(rows.find((row) => row.id === "critpt").values, [0.1, null]);
  assert.equal(rows.find((row) => row.id === "custom_score").format, "number");
  assert.equal(
    rows.find((row) => row.id === "custom_score").direction,
    undefined,
  );
});
test("comparison does not combine media prices with different source units; labels remain bilingual", () => {
  const models = [
    model("a", {
      pricing: {
        openrouter_display_prices: [
          { label: "Video", unit: "second", price: 0.1 },
        ],
      },
    }),
    model("b", {
      pricing: {
        openrouter_display_prices: [{ label: "Video", unit: "clip", price: 2 }],
      },
    }),
  ];
  const fr = buildComparisonRows(models, translations("fr"), "fr");
  const en = buildComparisonRows(models, translations("en"), "en");
  assert.deepEqual(
    fr.filter((row) => row.id.startsWith("price:")).map((row) => row.values),
    [
      [0.1, null],
      [null, 2],
    ],
  );
  assert.notEqual(
    fr.find((row) => row.id === "provider").label,
    en.find((row) => row.id === "provider").label,
  );
});
test("comparison formats AA fractions and Design Arena points like the model page", () => {
  const rows = buildComparisonRows(
    [
      model("a", { evaluations: { omniscience: 0.16, multilingual_aa: 0.8, openrouter_da_website_win_rate: 52.6 } }),
      model("b", { evaluations: { omniscience: 0.2, multilingual_aa: 0.7, openrouter_da_website_win_rate: 48.1 } }),
    ],
    translations("fr"),
    "fr",
  );
  assert.equal(rows.find((row) => row.id === "omniscience").format, "percent");
  assert.equal(rows.find((row) => row.id === "multilingual_aa").format, "percent");
  const arena = rows.find((row) => row.id === "openrouter_da_website_win_rate");
  assert.equal(arena.format, "points");
  assert.equal(arena.direction, "higher");
  assert.equal(rows.find((row) => row.id === "speed")?.hint ?? null, null);
});
test("comparison rows carry glossary hints for essential measurements", () => {
  const rows = buildComparisonRows(
    [model("a", { median_output_tokens_per_second: 80 }), model("b", { median_output_tokens_per_second: 120 })],
    translations("en"),
    "en",
  );
  assert.match(rows.find((row) => row.id === "speed").hint, /Tokens received per second/);
});
test("comparison helpers scale values against the best one and format them by locale", async () => {
  const { comparisonShare, comparisonPriceRatio, formatComparisonValue } = await import("./comparison-rows.ts");
  const speed = { id: "speed", label: "Speed", group: "performance", values: [200, 50, null], direction: "higher", format: "speed" };
  assert.equal(comparisonShare(speed, 200), 1);
  assert.equal(comparisonShare(speed, 50), 0.25);
  assert.equal(comparisonShare(speed, null), null);
  const price = { id: "price", label: "Input", group: "pricing", values: [0.15, 10, 0.15], direction: "lower", format: "money" };
  assert.equal(comparisonShare(price, 0.15), 1);
  assert.equal(comparisonPriceRatio(price, 0.15), null);
  assert.ok(Math.abs(comparisonPriceRatio(price, 10) - 66.67) < 0.01);
  const single = { ...speed, values: [200, null] };
  assert.equal(comparisonShare(single, 200), null);
  const labels = { yes: "Oui", no: "Non" };
  assert.equal(formatComparisonValue(0.6, price, "en", labels), "$0.60");
  assert.equal(formatComparisonValue(null, price, "fr", labels), "—");
  assert.equal(formatComparisonValue(true, { format: undefined }, "fr", labels), "Oui");
  assert.equal(formatComparisonValue(1_050_000, { format: "tokens" }, "en", labels), "1.05M");
  assert.equal(formatComparisonValue(59.94, { format: "number" }, "en", labels), "59.9");
});
