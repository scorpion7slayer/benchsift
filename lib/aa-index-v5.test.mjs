import assert from "node:assert/strict";
import test from "node:test";

import { mergeAAIndexV5, parseAAIndexV5 } from "./aa-index-v5.ts";

const OPUS_ID = "0b0e5d4e-1c33-4f7e-9d3a-2f6c1a5b9e10";

const model = (overrides) => ({
  id: OPUS_ID,
  slug: "claude-opus-5-5",
  name: "Claude Opus 5.5 (Max, Default Fallback)",
  frontierCode20: 0.464359595959596,
  terminalBenchScience: 0.59047619047619,
  hleDiamond: 0.679,
  critptAgentic: 0.6,
  critptAgenticHard: 0.61,
  automationBenchPartialScore: 0.6953868128636069,
  gdpPdfAllPass: 0.262,
  briefcaseElo: 1800.51,
  frontierCode: 0.521731,
  ...overrides,
});

// Mirrors the Flight line that carries the page's model list, with unrelated props around it.
const payload = (models) =>
  `5:["$","$L26",null,{"slug":"artificial-analysis-intelligence-index","initialModels":${JSON.stringify(models)},"tail":"]"}]\n`;

const catalogueModel = (overrides) => ({
  id: OPUS_ID,
  slug: "claude-opus-5-5",
  name: "Claude Opus 5.5",
  evaluations: { artificial_analysis_intelligence_index: 58.4 },
  ...overrides,
});

test("Index v5 reads each benchmark from its AA field", () => {
  const [entry] = parseAAIndexV5(payload([model({})]));
  assert.deepEqual(entry, {
    aa_id: OPUS_ID,
    slug: "claude-opus-5-5",
    scores: {
      frontiercode_2_0: 0.464359595959596,
      terminalbench_science: 0.59047619047619,
      hle_diamond: 0.679,
      critpt_v2: 0.6,
      automationbench_aa: 0.6953868128636069,
      gdp_pdf: 0.262,
      aa_briefcase: 1800.51,
    },
  });
});

test("Index v5 keeps measured zeros and drops missing, out-of-range and duplicate rows", () => {
  const entries = parseAAIndexV5(
    payload([
      model({ slug: "zero", id: null, frontierCode20: 0, hleDiamond: null, terminalBenchScience: 59, briefcaseElo: -1 }),
      model({ slug: "zero", frontierCode20: 0.9 }),
      model({
        slug: "empty",
        frontierCode20: null,
        terminalBenchScience: null,
        hleDiamond: null,
        critptAgentic: null,
        automationBenchPartialScore: null,
        gdpPdfAllPass: null,
        briefcaseElo: null,
      }),
      model({ slug: "Bad Slug" }),
      null,
      "$L12",
    ]),
  );
  assert.equal(entries.length, 1);
  const [zero] = entries;
  assert.equal(zero.aa_id, null);
  assert.equal(zero.scores.frontiercode_2_0, 0);
  assert.equal("hle_diamond" in zero.scores, false);
  assert.equal("terminalbench_science" in zero.scores, false);
  assert.equal("aa_briefcase" in zero.scores, false);
});

test("Index v5 returns nothing when the page has no model list", () => {
  assert.deepEqual(parseAAIndexV5("1:[]\n"), []);
  assert.deepEqual(parseAAIndexV5('5:{"initialModels":[{broken'), []);
});

test("Index v5 fills gaps in AA models and keeps API values, zero included", () => {
  const entries = parseAAIndexV5(payload([model({}), model({ id: "other", slug: "by-slug", hleDiamond: 0.3 })]));
  const result = mergeAAIndexV5(
    [
      catalogueModel({ evaluations: { hle_diamond: 0, frontiercode_2_0: null } }),
      catalogueModel({ id: "aa-by-slug", slug: "by-slug" }),
      catalogueModel({ id: "openrouter:x/by-slug", slug: "by-slug" }),
    ],
    entries,
  );
  assert.equal(result.matched, 2);
  const [opus, bySlug, openRouter] = result.models;
  assert.equal(opus.evaluations.hle_diamond, 0);
  assert.equal(opus.evaluations.frontiercode_2_0, 0.464359595959596);
  assert.equal(bySlug.evaluations.hle_diamond, 0.3);
  assert.equal(bySlug.evaluations.artificial_analysis_intelligence_index, 58.4);
  // OpenRouter-only rows are never matched by an AA slug.
  assert.equal(openRouter.evaluations.hle_diamond, undefined);
});

test("Index page benchmarks read nested Omniscience accuracy, not the net index", () => {
  const [entry] = parseAAIndexV5(
    payload([
      model({
        terminalBench40: 0.67,
        mmmuPro: 0.87,
        critpt: 0.33,
        apexAgents: 0.42,
        itbenchSre: 0.55,
        gdpval: 1866.27,
        omniscience: 53.5,
        omniscienceBreakdown: { accuracy: 0.58, hallucinationRate: 0.11 },
        harveyLab: 0,
        mlcrOverall: 0.41,
        healthbench: 0.62,
        healthbenchProfessional: 0.66,
        analystAgent: 0.575,
        enterpriseOpsGym: 0.47,
        code2videoElo: 1535.57,
      }),
    ]),
  );
  assert.equal(entry.scores.omniscience, 0.58);
  assert.equal(entry.scores.harvey_lab_aa, 0);
  assert.equal(entry.scores.gdpval, 1866.27);
  assert.equal(entry.scores.code2video_aa, 1535.57);
  assert.deepEqual(
    [entry.scores.terminalbench_v4_0, entry.scores.mmmu_pro, entry.scores.critpt, entry.scores.apex_agents, entry.scores.itbench_aa],
    [0.67, 0.87, 0.33, 0.42, 0.55],
  );
  assert.deepEqual(
    [entry.scores.mlcr_aa, entry.scores.healthbench, entry.scores.healthbench_professional, entry.scores.analyst_agent_aa, entry.scores.enterprise_ops_gym_aa],
    [0.41, 0.62, 0.66, 0.575, 0.47],
  );

  const [bare] = parseAAIndexV5(payload([model({ omniscience: 53.5, omniscienceBreakdown: "n/a", healthbench: 62 })]));
  assert.equal(bare.scores.omniscience, undefined);
  assert.equal(bare.scores.healthbench, undefined);
});

test("Index page scores never replace an API value", () => {
  const [entry] = parseAAIndexV5(payload([model({ gdpval: 1866.27, healthbench: 0.62 })]));
  const { models } = mergeAAIndexV5(
    [catalogueModel({ evaluations: { gdpval: 1700, healthbench: null } })],
    [entry],
  );
  assert.equal(models[0].evaluations.gdpval, 1700);
  assert.equal(models[0].evaluations.healthbench, 0.62);
});
