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
