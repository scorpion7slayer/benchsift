import assert from "node:assert/strict";
import test from "node:test";
import { aa3dSceneUrl, parseAa3d, parseAa3dPage, selectAa3dRows } from "./aa3d-data.ts";

const model = (overrides) => ({
  id: "id-opus",
  slug: "claude-opus-5-5",
  name: "Claude Opus 5.5 (Max, Default Fallback)",
  suffix: "Max, Default Fallback",
  release: { name: "Claude Opus 5.5" },
  releaseDate: "2026-09-22",
  isReasoning: true,
  isOpenWeights: false,
  creator: { slug: "anthropic", name: "Anthropic" },
  aa3dElo: 1190.0668,
  aa3dBreakdown: { turns: { p5: 76.4, p25: 109.5, p50: 137, p75: 158, p95: 207 } },
  ...overrides,
});

const interval = (id, elo, lower95ci, upper95ci) => ({
  id,
  displayName: id,
  creator: { name: "Creator" },
  elo,
  lower95ci,
  upper95ci,
});

// Mirrors the two Flight lines AA's page renders: the model list and the Elo leaderboard.
const payload = (models, intervals = []) =>
  `5:["$","$L26",null,{"slug":"aa-3d","initialModels":${JSON.stringify(models)},"defaultSlugs":[]}]\n` +
  `6:["$","$L3c",null,{"models":${JSON.stringify(intervals)},"messages":{}}]\n`;

test("AA-3D reads Elo and its interval, and orders models by Elo", () => {
  const rows = parseAa3d(
    payload(
      [
        model({}),
        model({ id: "id-sonnet", slug: "claude-sonnet-5-5", name: "Claude Sonnet 5.5 (Max, Default Fallback)", release: { name: "Claude Sonnet 5.5" }, aa3dElo: 1194.2268 }),
      ],
      [interval("id-opus", 1190.0668, 1155.431, 1224.7025), interval("id-sonnet", 1194.2268, 1160.2295, 1228.2241)],
    ),
  );
  assert.deepEqual(rows.map((row) => [row.slug, row.family_name, row.configuration]), [
    ["claude-sonnet-5-5", "Claude Sonnet 5.5", "Max, Default Fallback"],
    ["claude-opus-5-5", "Claude Opus 5.5", "Max, Default Fallback"],
  ]);
  const opus = rows[1];
  assert.equal(opus.elo, 1190.0668);
  assert.equal(opus.elo_lower, 1155.431);
  assert.equal(opus.elo_upper, 1224.7025);
  assert.equal(opus.is_anchor, false);
  assert.equal(opus.median_turns, 137);
  assert.equal(opus.creator_slug, "anthropic");
  assert.equal(opus.release_date, "2026-09-22");
});

test("AA-3D marks the fixed reference model and drops intervals that do not match the Elo", () => {
  const rows = parseAa3d(
    payload(
      [
        model({ id: "id-luna", slug: "gpt-6-luna", name: "GPT-6 Luna (Max)", aa3dElo: 1000 }),
        model({ id: "id-stale", slug: "stale", name: "Stale", aa3dElo: 900 }),
        model({ id: "id-inverted", slug: "inverted", name: "Inverted", aa3dElo: 800 }),
        model({ id: null, slug: "no-id", name: "No id", aa3dElo: 700 }),
      ],
      [interval("id-luna", 1000, 1000, 1000), interval("id-stale", 905, 880, 930), interval("id-inverted", 800, 820, 780)],
    ),
  );
  const pick = (slug) => {
    const row = rows.find((item) => item.slug === slug);
    return [row.elo_lower, row.elo_upper, row.is_anchor];
  };
  assert.deepEqual(pick("gpt-6-luna"), [1000, 1000, true]);
  assert.deepEqual(pick("stale"), [null, null, false]);
  assert.deepEqual(pick("inverted"), [null, null, false]);
  assert.deepEqual(pick("no-id"), [null, null, false]);
});

test("AA-3D drops missing, invalid and duplicate Elo scores", () => {
  const rows = parseAa3d(
    payload([
      model({ slug: "kept" }),
      model({ slug: "missing", aa3dElo: null }),
      model({ slug: "zero", aa3dElo: 0 }),
      model({ slug: "text", aa3dElo: "1100" }),
      model({ slug: "Bad Slug" }),
      model({ slug: "no-name", name: " " }),
      model({ slug: "kept", aa3dElo: 1300 }),
    ]),
  );
  assert.deepEqual(rows.map((row) => [row.slug, row.elo]), [["kept", 1190.0668]]);
});

// Published inputs of four models on 2026-10-14, with the cost per scene AA's page showed for them.
const AA_INPUTS = {
  "claude-sonnet-5-5": { price1mInputTokens: 2, price1mOutputTokens: 10, cacheHitPrice: 0.1, cacheWritePrice: 2.5, cacheHitRate: 0.990532129394232, canonicalEvalTokenCounts: { aa3d: { input: 3352888184, answer: 10596315, reasoning: 19574141, cacheableInput: 3314346808 } } },
  "gpt-6-luna": { price1mInputTokens: 0.1, price1mOutputTokens: 0.5, cacheHitPrice: 0.01, cacheWritePrice: 0.125, cacheHitRate: 0.99339067738, canonicalEvalTokenCounts: { aa3d: { input: 542389816, answer: 2577729, reasoning: 5352251, cacheableInput: 531571950 } } },
  "grok-4-7": { price1mInputTokens: 2, price1mOutputTokens: 6, cacheHitPrice: 0.5, cacheWritePrice: null, cacheHitRate: 0.80356086139913, canonicalEvalTokenCounts: { aa3d: { input: 864488415, answer: 4473400, reasoning: 8290161, cacheableInput: 847237037 } } },
  inkling: { price1mInputTokens: 1, price1mOutputTokens: 4.05, cacheHitPrice: 0.17, cacheWritePrice: null, cacheHitRate: null, canonicalEvalTokenCounts: { aa3d: { input: 215837254, answer: 1332271, reasoning: 1113452, cacheableInput: 211036953 } } },
};
const AA_SHOWN = {
  // [cost per scene in USD, thousands of output tokens per scene]
  "claude-sonnet-5-5": [14.63, 549],
  "gpt-6-luna": [0.2, 144],
  "grok-4-7": [14.26, 232],
  inkling: [null, 44],
};

test("AA-3D cost and output tokens per scene match what Artificial Analysis shows", () => {
  const rows = parseAa3d(payload(Object.entries(AA_INPUTS).map(([slug, inputs]) => model({ id: slug, slug, ...inputs }))));
  assert.deepEqual(
    Object.fromEntries(rows.map((row) => [row.slug, [
      row.cost_per_scene_usd === null ? null : Number(row.cost_per_scene_usd.toFixed(2)),
      Math.round(row.output_tokens_per_scene / 1000),
    ]])),
    AA_SHOWN,
  );
});

test("AA-3D leaves unpublished figures and traits null", () => {
  const [row] = parseAa3d(
    payload([model({ suffix: null, release: null, releaseDate: "soon", creator: null, isReasoning: null, isOpenWeights: undefined, aa3dBreakdown: { turns: { p50: null } } })]),
  );
  assert.equal(row.family_name, "Claude Opus 5.5 (Max, Default Fallback)");
  assert.equal(row.configuration, null);
  assert.equal(row.release_date, null);
  assert.equal(row.creator_slug, null);
  assert.equal(row.is_reasoning, null);
  assert.equal(row.is_open_weights, null);
  assert.equal(row.median_turns, null);
  assert.equal(row.cost_per_scene_usd, null);
  assert.equal(row.output_tokens_per_scene, null);
  assert.equal(row.elo_lower, null);
});

test("AA-3D returns nothing without a model list", () => {
  assert.deepEqual(parseAa3d("1:[]\n"), []);
  assert.deepEqual(parseAa3d('5:{"initialModels":[{broken'), []);
});

test("AA-3D filters by query and open weights, and sorts missing dates last", () => {
  const rows = parseAa3d(
    payload([
      model({ slug: "a", name: "Alpha", release: { name: "Alpha" }, aa3dElo: 900, releaseDate: "2026-07-01", isOpenWeights: true }),
      model({ slug: "b", name: "Beta", release: { name: "Beta" }, aa3dElo: 1100, releaseDate: "2026-09-01" }),
      model({ slug: "c", name: "Gamma", release: { name: "Gamma" }, aa3dElo: 1000, releaseDate: null, isOpenWeights: true }),
    ]),
  );
  const pick = (options) => selectAa3dRows(rows, { query: "", openOnly: false, sort: "elo", ...options }).map((row) => row.slug);
  assert.deepEqual(pick({}), ["b", "c", "a"]);
  assert.deepEqual(pick({ openOnly: true }), ["c", "a"]);
  assert.deepEqual(pick({ sort: "release" }), ["b", "a", "c"]);
  assert.deepEqual(pick({ query: " GAM " }), ["c"]);
  assert.deepEqual(pick({ query: "omega", searchText: (row) => (row.slug === "a" ? "Omega" : "") }), ["a"]);
});

const OPUS_BREAKDOWN = {
  turns: { p5: 76.4, p25: 109.5, p50: 137, p75: 158, p95: 207 },
  toolCallsPerTask: { browserTest: 51.509, code: 31.182, assets: 21.927, imageViews: 43.818, other: 2.636 },
  firstLookByTurn20Share: 0.927,
  assetLibraryShare: 0.927,
};
const SCENE = "121e42a1-96c5-4889-9c7f-e1d677b68460";
const sceneUrl = (id) => `https://artificialanalysiscdn.com/media-arena/${id}/index.html`;

// Adds the win-rate and scene explorer lines that follow the leaderboard on AA's page.
const fullPayload = (models, winRatesByModelId, domains) =>
  payload(models) +
  `7:["$","$L41",null,{"variant":"raw","winRatesByModelId":${JSON.stringify(winRatesByModelId)},"panelVotes":10000,"messages":{}}]\n` +
  `8:["$","$L42",null,{"locale":"en-US","domains":${JSON.stringify(domains)},"models":[],"messages":{}}]\n`;

test("AA-3D reads the agent breakdown and rejects incomplete or out-of-range figures", () => {
  const rows = parseAa3d(
    payload([
      model({ aa3dBreakdown: OPUS_BREAKDOWN }),
      model({ id: "b", slug: "b", aa3dElo: 900, aa3dBreakdown: { turns: { p5: 90, p25: 80, p50: 100, p75: 120, p95: 150 }, toolCallsPerTask: { ...OPUS_BREAKDOWN.toolCallsPerTask, code: null }, firstLookByTurn20Share: 1.2, assetLibraryShare: 0 } }),
    ]),
  );
  const [opus, other] = rows;
  assert.deepEqual(opus.turns, OPUS_BREAKDOWN.turns);
  assert.deepEqual(opus.tool_calls, { browser_test: 51.509, code: 31.182, assets: 21.927, image_views: 43.818, other: 2.636 });
  assert.equal(opus.first_look_share, 0.927);
  assert.equal(opus.asset_library_share, 0.927);
  // Percentiles out of order, a missing tool kind and a share above 1 are not shown.
  assert.equal(other.turns, null);
  assert.equal(other.median_turns, 100);
  assert.equal(other.tool_calls, null);
  assert.equal(other.first_look_share, null);
  assert.equal(other.asset_library_share, 0);
});

test("AA-3D joins domain win rates by AA id and keeps the low-sample flags", () => {
  const data = parseAa3dPage(
    fullPayload(
      [model({}), model({ id: "id-luna", slug: "gpt-6-luna", aa3dElo: 1000 })],
      {
        "id-opus": {
          machines: { opponents: 20, winRate: 0.7988, winRateBalanced: 0.8226, tooFewOpponents: false, scenes: 9, tooFewScenes: false },
          space: { opponents: 20, winRate: 0.104, winRateBalanced: 0.0982, tooFewOpponents: false, scenes: 4, tooFewScenes: true },
          games: { opponents: 3, winRate: 1.4, winRateBalanced: 0.5, scenes: 6 },
          "bad domain": { opponents: 20, winRate: 0.5, scenes: 9 },
        },
        "id-unknown": { machines: { winRate: 0.5 } },
      },
      [{ id: "machines", label: "Machines", tasks: [] }],
    ),
  );
  const opus = data.rows.find((row) => row.slug === "claude-opus-5-5");
  assert.deepEqual(opus.domains.machines, { win_rate: 0.7988, win_rate_balanced: 0.8226, opponents: 20, scenes: 9, too_few_scenes: false, too_few_opponents: false });
  assert.equal(opus.domains.space.too_few_scenes, true);
  assert.deepEqual(Object.keys(opus.domains).sort(), ["machines", "space"]);
  assert.deepEqual(data.rows.find((row) => row.slug === "gpt-6-luna").domains, {});
  assert.equal(data.panel_votes, 10000);
  // A domain with votes but no explorer entry still gets a column.
  assert.deepEqual(data.domains, [{ id: "machines", label: "Machines" }, { id: "space", label: "space" }]);
});

test("AA-3D lists tasks with scenes of ranked models on AA's media CDN only", () => {
  const data = parseAa3dPage(
    fullPayload(
      [model({}), model({ id: "id-luna", slug: "gpt-6-luna", aa3dElo: 1000 })],
      {},
      [
        {
          id: "landmarks",
          label: "Landmarks and real places",
          tasks: [
            {
              id: "eiffel-tower",
              title: "Eiffel Tower",
              brief: "Create an interactive Eiffel Tower in its Paris setting.",
              scenes: [
                { id: "s1", modelId: "id-opus", url: sceneUrl(SCENE) },
                { id: "s2", modelId: "id-opus", url: sceneUrl("221e42a1-96c5-4889-9c7f-e1d677b68460") },
                { id: "s3", modelId: "id-luna", url: "https://evil.example/media-arena/x/index.html" },
                { id: "s4", modelId: "id-unranked", url: sceneUrl("321e42a1-96c5-4889-9c7f-e1d677b68460") },
              ],
            },
            { id: "eiffel-tower", title: "Duplicate", brief: "Duplicate", scenes: [] },
            { id: "no-brief", title: "No brief", scenes: [] },
          ],
        },
        { id: "landmarks", label: "Duplicate", tasks: [] },
      ],
    ),
  );
  assert.deepEqual(data.domains, [{ id: "landmarks", label: "Landmarks and real places" }]);
  assert.deepEqual(data.tasks, [
    {
      id: "eiffel-tower",
      domain: "landmarks",
      title: "Eiffel Tower",
      brief: "Create an interactive Eiffel Tower in its Paris setting.",
      scenes: [{ slug: "claude-opus-5-5", id: SCENE }],
    },
  ]);
  assert.equal(aa3dSceneUrl(SCENE), sceneUrl(SCENE));
});

test("AA-3D page without the extra elements still returns the leaderboard", () => {
  const data = parseAa3dPage(payload([model({})]));
  assert.equal(data.rows.length, 1);
  assert.deepEqual([data.domains, data.tasks, data.panel_votes], [[], [], null]);
});
