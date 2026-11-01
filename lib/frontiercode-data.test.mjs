import assert from "node:assert/strict";
import test from "node:test";
import { parseFrontierCode, selectFrontierCodeRows } from "./frontiercode-data.ts";

const model = (overrides) => ({
  slug: "model-a",
  name: "Model A (Max)",
  suffix: "Max",
  release: { name: "Model A" },
  releaseDate: "2026-09-01",
  creator: { slug: "anthropic", name: "Anthropic" },
  isReasoning: true,
  isOpenWeights: false,
  frontierCode20: 0.5,
  ...overrides,
});

// Mirrors the Flight line that carries the leaderboard, with unrelated props around it.
const payload = (models) =>
  `5:["$","$L26",null,{"slug":"frontiercode-2-0","other":[1],"initialModels":${JSON.stringify(models)},"tail":"]"}]\n`;

test("FrontierCode reads scores from the embedded model list and sorts them", () => {
  const rows = parseFrontierCode(
    payload([
      model({ slug: "low", name: "Low", suffix: null, release: null, frontierCode20: 0.1 }),
      model({ slug: "high", frontierCode20: 0.62 }),
    ]),
  );
  assert.deepEqual(rows.map((row) => row.slug), ["high", "low"]);
  assert.equal(rows[0].family_name, "Model A");
  assert.equal(rows[0].configuration, "Max");
  assert.equal(rows[0].creator_slug, "anthropic");
  // Without a release name or suffix, the source name is kept as is.
  assert.equal(rows[1].family_name, "Low");
  assert.equal(rows[1].configuration, null);
});

test("FrontierCode keeps a measured zero and drops missing, invalid and duplicate scores", () => {
  const rows = parseFrontierCode(
    payload([
      model({ slug: "zero", frontierCode20: 0 }),
      model({ slug: "missing", frontierCode20: null }),
      model({ slug: "percent", frontierCode20: 52.2 }),
      model({ slug: "negative", frontierCode20: -0.1 }),
      model({ slug: "nameless", name: "" }),
      // A FrontierCode 1.1 score alone is a different task set.
      model({ slug: "legacy", frontierCode20: undefined, frontierCode: 0.5 }),
      model({ slug: "zero", frontierCode20: 0.9 }),
      null,
      "$L12",
    ]),
  );
  assert.deepEqual(rows.map((row) => [row.slug, row.score]), [["zero", 0]]);
});

test("FrontierCode leaves unpublished traits null instead of inventing them", () => {
  const [row] = parseFrontierCode(
    payload([model({ isReasoning: undefined, isOpenWeights: "yes", releaseDate: null, creator: null })]),
  );
  assert.equal(row.is_reasoning, null);
  assert.equal(row.is_open_weights, null);
  assert.equal(row.release_date, null);
  assert.equal(row.creator_slug, null);
});

// Published inputs of six models on 2026-11-01, with the figures AA's page showed for them.
const AA_INPUTS = {
  "claude-opus-5-5": { price1mInputTokens: 4, price1mOutputTokens: 20, cacheHitPrice: 0.2, cacheWritePrice: 5, cacheHitRate: 0.996663404781368, medianCanonicalAnswerOutputSpeed: 151.924862855129, canonicalEvalTokenCounts: { frontierCode20: { input: 4566850091, answer: 7912780, reasoning: 18486777, cacheableInput: 4512172119 } } },
  "gpt-6-astra": { price1mInputTokens: 10, price1mOutputTokens: 50, cacheHitPrice: 1, cacheWritePrice: 12.5, cacheHitRate: 0.99339067738, medianCanonicalAnswerOutputSpeed: 78.9407368695878, canonicalEvalTokenCounts: { frontierCode20: { input: 390224479, answer: 2034335, reasoning: 2861315, cacheableInput: 372853166 } } },
  "claude-haiku-5-5": { price1mInputTokens: 0.1, price1mOutputTokens: 0.5, cacheHitPrice: 0.01, cacheWritePrice: 0.125, cacheHitRate: 0.990532129394232, medianCanonicalAnswerOutputSpeed: 381.458757056541, canonicalEvalTokenCounts: { frontierCode20: { input: 3425414487, answer: 7643360, reasoning: 26007861, cacheableInput: 3372943041 } } },
  "grok-4-7": { price1mInputTokens: 2, price1mOutputTokens: 6, cacheHitPrice: 0.5, cacheWritePrice: null, cacheHitRate: 0.891210278503212, medianCanonicalAnswerOutputSpeed: 85.3123346248935, canonicalEvalTokenCounts: { frontierCode20: { input: 2542145904, answer: 4096174, reasoning: 11493398, cacheableInput: 2507165153 } } },
  "k2-horizon-375b-a23b": { price1mInputTokens: 0, price1mOutputTokens: 0, cacheHitPrice: null, cacheWritePrice: null, cacheHitRate: 0, medianCanonicalAnswerOutputSpeed: 150.223642550459, canonicalEvalTokenCounts: { frontierCode20: { input: 1774279880, answer: 3172281, reasoning: 7629447, cacheableInput: 1753426696 } } },
  inkling: { price1mInputTokens: 1, price1mOutputTokens: 4.05, cacheHitPrice: 0.17, cacheWritePrice: null, cacheHitRate: 0.987285331399386, medianCanonicalAnswerOutputSpeed: 224.826610016156, canonicalEvalTokenCounts: { frontierCode20: { input: 2095144128, answer: 2159204, reasoning: 5698266, cacheableInput: 2068491014 } } },
};
const AA_SHOWN = {
  // [cost per task in USD, decode minutes per task, thousands of output tokens per task]
  "claude-opus-5-5": [13.46, 21.9, 200],
  "gpt-6-astra": [6.54, 7.8, 37],
  "claude-haiku-5-5": [0.46, 11.1, 255],
  "grok-4-7": [13.83, 23.1, 118],
  // AA prints $0.00 for a free model; a zero price is not a measured cost.
  "k2-horizon-375b-a23b": [null, 9.1, 82],
  inkling: [3.27, 4.4, 60],
};

test("FrontierCode per-task cost, time and tokens match what Artificial Analysis shows", () => {
  const rows = parseFrontierCode(payload(Object.entries(AA_INPUTS).map(([slug, inputs]) => model({ slug, ...inputs }))));
  const round = (value, digits) => (value === null ? null : Number(value.toFixed(digits)));
  assert.deepEqual(
    Object.fromEntries(rows.map((row) => [row.slug, [
      round(row.cost_per_task_usd, 2),
      round(row.time_per_task_seconds / 60, 1),
      Math.round(row.output_tokens_per_task / 1000),
    ]])),
    AA_SHOWN,
  );
});

test("FrontierCode leaves per-task figures null when an input is missing", () => {
  const opus = AA_INPUTS["claude-opus-5-5"];
  const counts = opus.canonicalEvalTokenCounts.frontierCode20;
  const [half, noSpeed, noHitPrice, other] = ["half", "no-speed", "no-hit-price", "other"];
  const rows = parseFrontierCode(
    payload([
      model({ slug: half, ...opus, canonicalEvalTokenCounts: { frontierCode20: { ...counts, reasoning: null } } }),
      model({ slug: noSpeed, ...opus, medianCanonicalAnswerOutputSpeed: null }),
      model({ slug: noHitPrice, ...opus, cacheHitPrice: null }),
      model({ slug: other, ...opus, canonicalEvalTokenCounts: { frontierCode: counts } }),
    ]),
  );
  const pick = (slug) => {
    const row = rows.find((item) => item.slug === slug);
    return [row.output_tokens_per_task !== null, row.cost_per_task_usd !== null, row.time_per_task_seconds !== null];
  };
  assert.deepEqual(pick(half), [false, false, false]);
  assert.deepEqual(pick(noSpeed), [true, true, false]);
  assert.deepEqual(pick(noHitPrice), [true, false, true]);
  assert.deepEqual(pick(other), [false, false, false]);
});

test("FrontierCode shows creators under their canonical identity", () => {
  const [row] = parseFrontierCode(payload([model({ creator: { slug: "kimi", name: "Kimi" } })]));
  assert.equal(row.creator_name, "Moonshot AI");
});

test("FrontierCode returns nothing when the page has no model list", () => {
  assert.deepEqual(parseFrontierCode("1:[]\n"), []);
  assert.deepEqual(parseFrontierCode('5:{"initialModels":[{broken'), []);
});

test("FrontierCode filters by query and open weights, and sorts missing dates last", () => {
  const rows = parseFrontierCode(
    payload([
      model({ slug: "a", name: "Alpha", release: { name: "Alpha" }, frontierCode20: 0.4, releaseDate: "2026-07-01", isOpenWeights: true }),
      model({ slug: "b", name: "Beta", release: { name: "Beta" }, frontierCode20: 0.6, releaseDate: "2026-09-01" }),
      model({ slug: "c", name: "Gamma", release: { name: "Gamma" }, frontierCode20: 0.5, releaseDate: null, isOpenWeights: true }),
    ]),
  );
  const pick = (options) => selectFrontierCodeRows(rows, { query: "", openOnly: false, sort: "score", ...options }).map((row) => row.slug);
  assert.deepEqual(pick({}), ["b", "c", "a"]);
  assert.deepEqual(pick({ sort: "release" }), ["b", "a", "c"]);
  assert.deepEqual(pick({ openOnly: true }), ["c", "a"]);
  assert.equal(pick({ query: " anthropic " }).length, 3);
  assert.deepEqual(pick({ query: "gam" }), ["c"]);
  assert.deepEqual(pick({ searchText: (row) => (row.slug === "a" ? "legacy name" : ""), query: "legacy" }), ["a"]);
});

test("FrontierCode strips the configuration from the name only when the source gives no release name", () => {
  const [row] = parseFrontierCode(
    payload([model({ name: "Claude Opus 5.5 (Max, Default Fallback)", suffix: "Max, Default Fallback", release: null })]),
  );
  assert.equal(row.family_name, "Claude Opus 5.5");
  assert.equal(row.configuration, "Max, Default Fallback");
});
