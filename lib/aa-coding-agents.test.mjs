import assert from "node:assert/strict";
import test from "node:test";
import { extractRowsFromRSC, parseCodingAgents } from "./aa-coding-agents.ts";

const row = (id, extra = {}) => ({
  id,
  agentName: "Test harness",
  modelName: id,
  hostModelSlug: `openai_${id}`,
  indexScore: 0.5,
  ...extra,
});
const flight = (rows, benchmarkRows) =>
  `e:${JSON.stringify(["$", "div", null, { rows, benchmarkRows }])}`;

test("AA compound models retain both logos and names using the source creator metadata", () => {
  const [fusion, muse, unknown] = parseCodingAgents(
    flight(
      [],
      [
        row("fusion", {
          agentName: "Devin Fusion CLI",
          provider: "cognition",
          display: {
            agent: "Devin Fusion CLI",
            model: "GPT-6 Astra XHigh + SWE-2 Medium",
          },
        }),
        row("muse", {
          agentName: "Muse Code 1.0.2 RC",
          display: {
            agent: "Muse Code",
            model: "Muse Spark",
            creator: { agent: "Meta", model: "Meta" },
          },
        }),
        row("unknown", { display: { model: "First + Second" } }),
      ],
    ),
  );
  assert.equal(fusion.agent_creator_slug, "cognition");
  assert.deepEqual(fusion.models, [
    { name: "GPT-6 Astra XHigh", creator: "openai" },
    { name: "SWE-2 Medium", creator: "cognition" },
  ]);
  assert.equal(muse.agent_creator_slug, "meta");
  assert.equal(muse.models[0].creator, "meta");
  assert.ok(unknown.models.every((model) => model.creator === null));
});

test("AA full leaderboard resolves highlighted records and includes non-highlighted agents", () => {
  const payload = flight(
    [row("highlight")],
    ["$e:props:rows:0", row("full-only")],
  );
  assert.deepEqual(
    parseCodingAgents(payload).map((agent) => agent.id),
    ["highlight", "full-only"],
  );
});

test("AA published benchmark versions stay distinct from historical fields", () => {
  const payload = flight(
    [],
    [
      row("versioned", {
        evals: [
          {
            datasetIndexName: "deep-swe-v1.1",
            evaluationDatasetSlug: "DeepSWE v1.1",
            mean: { reward: 0 },
          },
          {
            datasetIndexName: "terminal-bench-v4",
            evaluationDatasetSlug: "Terminal-Bench 4.0",
            mean: { reward: 0.6 },
          },
        ],
        mean: { costUsd: 0, agentWallTimeSec: -5, cacheHitRate: 2 },
      }),
    ],
  );
  const [agent] = parseCodingAgents(payload);
  assert.equal(agent.coding_agent_index, 50);
  assert.equal(agent.benchmark_scores[0].value, 0);
  assert.equal(agent.benchmark_scores[1].label, "Terminal-Bench 4.0");
  assert.equal(agent.deep_swe, null);
  assert.equal(agent.terminal_bench_v2, null);
  assert.equal(agent.cost_per_task_usd, 0);
  assert.equal(agent.time_per_task_seconds, null);
  assert.equal(agent.cache_hit_rate, null);
});

test("AA missing, cyclic and inherited Flight references fail closed without a partial highlights fallback", () => {
  for (const ref of [
    "$f:props:rows:0",
    "$e:props:benchmarkRows:0",
    "$e:props:constructor",
  ]) {
    assert.equal(extractRowsFromRSC(flight([row("highlight")], [ref])), null);
    assert.deepEqual(parseCodingAgents(flight([row("highlight")], [ref])), []);
  }
  assert.equal(extractRowsFromRSC('{"rows":[],"benchmarkRows":[broken}'), null);
});

test("AA legacy JSON handles delimiters in labels and skips unavailable or invalid records", () => {
  const rows = [
    null,
    {},
    row("hidden", { isUnavailable: true }),
    row("valid", {
      modelName: 'Quoted "] }" model',
      indexScore: 2,
      componentScores: [
        null,
        { datasetIndexName: "deep-swe", mean: { reward: 0.4 } },
      ],
    }),
  ];
  const agents = parseCodingAgents(JSON.stringify({ rows }));
  assert.equal(agents.length, 1);
  assert.equal(agents[0].model_name, 'Quoted "] }" model');
  assert.equal(agents[0].coding_agent_index, null);
  assert.equal(agents[0].deep_swe, 0.4);
});

test("AA agent and model creators and stated suffixes drive logos and efforts", () => {
  const [qwen, opus, mirror] = parseCodingAgents(
    flight(
      [],
      [
        row("qwen", {
          agentName: "Claude Code",
          provider: "alibaba_cloud",
          hostModelSlug: "alibaba_cloud_qwen3-8-max",
          display: { agent: "Claude Code", model: "Qwen3.8 Max" },
          model: { release: { slug: "qwen3-8-max", name: "Qwen3.8 Max" }, suffix: null },
          agentCreator: { slug: "anthropic" },
          modelCreators: [{ slug: "alibaba" }],
        }),
        row("opus", {
          agentName: "Claude Code",
          display: { agent: "Claude Code", model: "Claude Opus 5.5 (Max, Default Fallback)" },
          model: { release: { slug: "claude-opus-5-5", name: "Claude Opus 5.5" }, suffix: "Max, Default Fallback" },
          agentCreator: { slug: "anthropic" },
          modelCreators: [{ slug: "anthropic" }],
        }),
        row("mirror", {
          agentName: "Mirror",
          display: { agent: "Mirror", model: "Beam 1.0" },
          model: { release: { slug: "reflection-beam", name: "Beam 1.0" }, suffix: null },
          agentCreator: { slug: "reflection" },
          modelCreators: [{ slug: "reflection" }],
        }),
      ],
    ),
  );
  assert.deepEqual(qwen.models, [{ name: "Qwen3.8 Max", effort: null, creator: "alibaba" }]);
  assert.equal(qwen.model_creator_slug, "alibaba");
  assert.equal(qwen.agent_creator_slug, "anthropic");
  assert.deepEqual(opus.models, [{ name: "Claude Opus 5.5 (Default Fallback)", effort: "max", creator: "anthropic" }]);
  assert.equal(mirror.agent_creator_slug, "reflection");
  assert.equal(mirror.models[0].creator, "reflection");
});
