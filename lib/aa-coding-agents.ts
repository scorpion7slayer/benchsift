import type { CodingAgent } from "./coding-agents";
import {
  resolveCreatorFromModelSlug,
  getCanonicalCreatorSlug,
} from "./provider-map";

interface AAAgentRow {
  isUnavailable?: boolean;
  id?: string;
  agentName?: string;
  provider?: string;
  hostModelSlug?: string;
  display?: {
    agent?: string;
    model?: string;
    creator?: { agent?: string; model?: string };
  };
  displayLabel?: string;
  releaseDate?: string;
  hostName?: string;
  hostShortName?: string;
  modelName?: string;
  indexScore?: number;
  mean?: {
    reward?: number;
    costUsd?: number;
    agentWallTimeSec?: number;
    steps?: number;
    inputTokens?: number;
    outputTokens?: number;
    cacheTokens?: number;
    cacheHitRate?: number;
    totalTokens?: number;
  };
  evals?: Array<{
    datasetIndexName?: string;
    evaluationDatasetSlug?: string;
    mean?: { reward?: number };
  }>;
  componentScores?: Array<{
    datasetIndexName?: string;
    evaluationDatasetSlug?: string;
    mean?: { reward?: number };
  }>;
}

/**
 * Extracts the agent rows array from AA's RSC payload.
 * AA's /agents/coding-agents is client-rendered, but Next.js exposes the data
 * via the React Server Components (RSC) payload when the "RSC: 1" header is set.
 * The full benchmarkRows list can refer back to objects in the highlights.
 * Keep those Flight references intact until the complete list is resolved.
 */
function extractArray(payload: string, name: string): unknown[] | null {
  const key = `"${name}":[`;
  const start = payload.indexOf(key);
  if (start < 0) return null;

  // Walk balanced brackets from inside the array opener
  let i = start + key.length;
  let depth = 1;
  let inStr = false;
  let esc = false;
  const maxLen = payload.length;
  while (i < maxLen && depth > 0) {
    const c = payload[i];
    if (esc) esc = false;
    else if (c === "\\") esc = true;
    else if (c === '"') inStr = !inStr;
    else if (!inStr) {
      if (c === "[" || c === "{") depth++;
      else if (c === "]" || c === "}") depth--;
    }
    i++;
  }
  if (depth !== 0) return null;
  const arrText = payload.slice(start + key.length - 1, i);
  try {
    const value: unknown = JSON.parse(arrText);
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

/** Decode only JSON records and property references; never evaluate upstream code. */
export function extractRowsFromRSC(payload: string): AAAgentRow[] | null {
  const full = extractArray(payload, "benchmarkRows");
  if (!full)
    return payload.includes('"benchmarkRows":')
      ? null
      : (extractArray(payload, "rows") as AAAgentRow[] | null);
  const records = new Map<string, unknown>();
  for (const line of payload.split("\n")) {
    const match = /^([a-f0-9]+):([\[{].*)$/.exec(line);
    if (!match) continue;
    try {
      records.set(match[1], JSON.parse(match[2]));
    } catch {
      /* Non-JSON Flight records. */
    }
  }
  function resolve(
    value: unknown,
    seen = new Set<string>(),
    depth = 0,
  ): unknown {
    if (depth > 64) throw new Error("Nested Flight data");
    if (typeof value === "string" && /^\$[a-f0-9]+(?::|$)/.test(value)) {
      if (seen.has(value)) throw new Error("Cyclic Flight reference");
      const [id, ...path] = value.slice(1).split(":");
      let target = records.get(id);
      for (const key of path) {
        if (key === "__proto__" || key === "constructor" || key === "prototype")
          throw new Error("Invalid reference");
        if (Array.isArray(target) && target[0] === "$" && key === "props")
          target = target[3];
        else if (
          target &&
          typeof target === "object" &&
          Object.hasOwn(target, key)
        )
          target = (target as Record<string, unknown>)[key];
        else throw new Error("Unresolved Flight reference");
      }
      if (target === undefined) throw new Error("Missing Flight record");
      return resolve(target, new Set([...seen, value]), depth + 1);
    }
    if (Array.isArray(value))
      return value.map((item) => resolve(item, seen, depth + 1));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          resolve(item, seen, depth + 1),
        ]),
      );
    return value;
  }
  try {
    return resolve(full) as AAAgentRow[];
  } catch {
    return null;
  }
}

/** Slug-ify the harness name to match HARNESS keys / icons. */
function harnessSlug(agentName: string): string {
  return agentName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}
function score(value: unknown): number | null {
  const result = finite(value);
  return result !== null && result <= 1 ? result : null;
}

export function parseCodingAgents(payload: string): CodingAgent[] {
  const rows = extractRowsFromRSC(payload);
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row, i): CodingAgent[] => {
    if (!row || typeof row !== "object" || row.isUnavailable) return [];
    const agentName = row.agentName ?? row.display?.agent;
    if (typeof agentName !== "string" || !agentName.trim()) return [];
    const slug = harnessSlug(agentName);
    const hostSlug =
      typeof row.hostModelSlug === "string" ? row.hostModelSlug : "";
    const [hostRaw, ...modelRest] = hostSlug.split("_");
    const modelSlug = modelRest.join("_") || hostSlug;
    const components = Array.isArray(row.evals)
      ? row.evals
      : Array.isArray(row.componentScores)
        ? row.componentScores
        : [];
    const benchmarks = components.flatMap((component) => {
      if (!component || typeof component.datasetIndexName !== "string")
        return [];
      return [
        {
          id: component.datasetIndexName,
          label:
            typeof component.evaluationDatasetSlug === "string"
              ? component.evaluationDatasetSlug
              : component.datasetIndexName,
          value: score(component.mean?.reward),
        },
      ];
    });
    const component = (id: string) =>
      benchmarks.find((item) => item.id === id)?.value ?? null;
    const mean = row.mean ?? {};
    const index = score(row.indexScore);
    const displayModel = row.display?.model ?? row.modelName ?? modelSlug;
    const creators = row.display?.creator?.model?.split(" + ");
    // AA explicitly uses these creator prefixes for Devin's published compound configuration.
    const fusion =
      row.display?.agent === "Devin Fusion CLI" ||
      agentName === "Devin Fusion CLI";
    const fusionCreators: Record<string, string> = {
      Claude: "anthropic",
      "GPT-": "openai",
      Penguin: "cognition",
      "SWE-": "cognition",
    };
    const modelParts = displayModel.split(" + ").map((name, index) => {
      const creator =
        creators?.[index] ??
        (fusion
          ? Object.entries(fusionCreators).find(([prefix]) =>
              name.startsWith(prefix),
            )?.[1]
          : undefined);
      return {
        name,
        creator: creator
          ? getCanonicalCreatorSlug(creator.toLowerCase())
          : !fusion && !displayModel.includes(" + ")
            ? resolveCreatorFromModelSlug(
                modelSlug,
                (hostRaw || row.provider || "").toLowerCase(),
              )
            : null,
      };
    });
    return [
      {
        id: row.id ?? `${slug}-${i}`,
        agent_name: agentName,
        agent_slug: slug,
        agent_creator_slug: row.display?.creator?.agent
          ? getCanonicalCreatorSlug(row.display.creator.agent.toLowerCase())
          : fusion
            ? "cognition"
            : null,
        models: modelParts,
        display_label:
          row.displayLabel ??
          `${agentName} - ${row.modelName ?? row.display?.model ?? ""}`,
        model_name: row.modelName ?? row.display?.model ?? modelSlug,
        model_short: row.display?.model ?? row.modelName ?? "",
        model_slug: modelSlug,
        model_creator_slug: resolveCreatorFromModelSlug(
          modelSlug,
          (hostRaw || row.provider || "").toLowerCase(),
        ),
        release_date: row.releaseDate ?? null,
        coding_agent_index: index === null ? null : index * 100,
        benchmark_scores: benchmarks,
        // Historical keys remain separate: a new benchmark is never a renamed old score.
        deep_swe: component("deep-swe"),
        terminal_bench_v2: component("terminal-bench-v2"),
        swe_atlas_qna: component("swe-atlas-qna"),
        cost_per_task_usd: finite(mean.costUsd),
        time_per_task_seconds: finite(mean.agentWallTimeSec),
        input_tokens_per_task: finite(mean.inputTokens),
        cached_input_tokens_per_task: finite(mean.cacheTokens),
        output_tokens_per_task: finite(mean.outputTokens),
        total_tokens_per_task: finite(mean.totalTokens),
        cache_hit_rate: score(mean.cacheHitRate),
        steps_per_task: finite(mean.steps),
      },
    ];
  });
}
