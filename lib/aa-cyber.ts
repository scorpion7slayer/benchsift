import type { LLMModel } from "./model-types";
import { findFlightElementProps, flightElementProps, parseFlightRecords } from "./aa-flight";
import {
  CYBER_INDEX_KEY,
  type CyberAccess,
  type CyberBenchmarkResult,
  type CyberIndexResult,
} from "./cyber-index";

/*
 * Artificial Analysis Cyber Index, read from the RSC payload of the AA home
 * page. Its "cyber-index" section holds the index (successes, safety blocks,
 * trusted access) and the score of each benchmark; "cyber-index-cost" holds
 * the cost per task of the index and of each benchmark.
 */

/** One leaderboard configuration with the AA identity it is matched by. */
export interface AACyberIndexEntry extends CyberIndexResult {
  aa_id: string;
  slug: string;
  name: string;
}

const INDEX_SECTION = "cyber-index";
const COST_SECTION = "cyber-index-cost";
const INDEX_EVAL_SLUG = "artificial-analysis-cyber-index";
const SLUG_PATTERN = /^[a-z0-9][a-z0-9._-]{1,119}$/;

type Props = Record<string, unknown>;

function isProps(value: unknown): value is Props {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function rows(value: unknown): Props[] {
  return Array.isArray(value) ? value.filter(isProps) : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function inRange(value: unknown, max: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max ? value : null;
}

function cost(value: unknown): number | null {
  return inRange(value, Number.POSITIVE_INFINITY);
}

function access(value: unknown): CyberAccess | null {
  if (value === "unmitigated") return "trusted";
  if (value === "standard") return "standard";
  return null;
}

/** Tab panels of a home-page section, with the tab label AA shows for each. */
function sectionPanels(records: ReadonlyMap<string, unknown>, param: string) {
  const [section] = findFlightElementProps(
    records,
    (props) => props.param === param && Array.isArray(props.tabs),
  );
  return rows(section?.tabs).flatMap((tab) => {
    const props = flightElementProps(tab.panel, records);
    return props ? [{ label: text(tab.label), props }] : [];
  });
}

/** Per-model values of one cost panel, keyed by AA id. */
function costPanelValues(props: Props) {
  return new Map(
    rows(props.models).flatMap((row) => {
      const id = text(row.id);
      return id ? [[id, { score: inRange(row.score, 1), cost: cost(row.costPerTask) }] as const] : [];
    }),
  );
}

/**
 * Parses the Cyber Index leaderboard. A configuration needs an AA id, a valid
 * slug, a name and an index score; any other unpublished value stays null.
 */
export function parseAACyberIndex(payload: string): AACyberIndexEntry[] {
  const records = parseFlightRecords(payload);
  const panels = sectionPanels(records, INDEX_SECTION);
  const index = panels.find(({ props }) => props.evalSlug === INDEX_EVAL_SLUG)?.props;
  if (!index) return [];
  const breakdownPanel = panels.find(({ props }) => rows(props.models).some((row) => isProps(row.evalScores)))?.props;
  const breakdown = new Map(
    rows(breakdownPanel?.models).flatMap((row) => {
      const id = text(row.id);
      return id ? [[id, row] as const] : [];
    }),
  );
  const version = text(index.indexSubtitle)?.match(/\bv\d+(?:\.\d+)*\b/i)?.[0].toLowerCase() ?? null;

  // The cost tabs name each benchmark ("CWE-Bench-AA vs. Cost per Task") in AA's order.
  const labels = new Map<string, string>();
  const costs = new Map<string, ReturnType<typeof costPanelValues>>();
  for (const { label, props } of sectionPanels(records, COST_SECTION)) {
    const id = text(props.evalSlug);
    if (!id) continue;
    costs.set(id, costPanelValues(props));
    if (id !== INDEX_EVAL_SLUG) labels.set(id, label?.replace(/\s+vs\.?\s+cost per task$/i, "").trim() || id);
  }
  for (const row of breakdown.values()) {
    for (const id of Object.keys(isProps(row.evalScores) ? row.evalScores : {})) {
      if (!labels.has(id)) labels.set(id, id);
    }
  }

  const seen = new Set<string>();
  return rows(index.models).flatMap((row): AACyberIndexEntry[] => {
    const id = text(row.id);
    const slug = text(row.slug) ?? text(row.modelUrl)?.match(/^\/models\/([^/?#]+)$/)?.[1] ?? null;
    const name = text(row.name);
    const score = inRange(row.score, 100);
    if (!id || !slug || !SLUG_PATTERN.test(slug) || !name || score === null || seen.has(id)) return [];
    seen.add(id);
    const detail = breakdown.get(id);
    const scores = isProps(detail?.evalScores) ? detail.evalScores : {};
    const refusals = isProps(detail?.evalHasRefusals) ? detail.evalHasRefusals : {};
    const benchmarks = [...labels].flatMap(([benchmark, label]): CyberBenchmarkResult[] => {
      const costValues = costs.get(benchmark)?.get(id);
      const result = {
        id: benchmark,
        label,
        score: inRange(scores[benchmark], 1) ?? costValues?.score ?? null,
        safety_blocks: typeof refusals[benchmark] === "boolean" ? refusals[benchmark] : null,
        cost_per_task_usd: costValues?.cost ?? null,
      };
      return result.score === null && result.safety_blocks === null && result.cost_per_task_usd === null ? [] : [result];
    });
    return [{
      aa_id: id,
      slug,
      name,
      version,
      score,
      safety_block_rate: inRange(row.refusalRate, 1),
      access: access(row.mitigationStatus ?? detail?.mitigationStatus),
      cost_per_task_usd: costs.get(INDEX_EVAL_SLUG)?.get(id)?.cost ?? null,
      benchmarks,
    }];
  });
}

/**
 * Attaches each entry to its catalogue model: by AA id, then by slug for AA
 * rows built from model pages. An entry without a model is left out rather
 * than turned into a model from a chart.
 */
export function mergeAACyberIndex(
  models: LLMModel[],
  entries: AACyberIndexEntry[],
): { models: LLMModel[]; matched: number } {
  const byId = new Map(models.map((model) => [model.id, model]));
  const bySlug = new Map(
    models
      .filter((model) => !/^(?:openrouter|modelsdev):/.test(model.id))
      .map((model) => [model.slug, model]),
  );
  const results = new Map<LLMModel, CyberIndexResult>();
  for (const entry of entries) {
    const model = byId.get(entry.aa_id) ?? bySlug.get(entry.slug);
    if (!model || results.has(model)) continue;
    results.set(model, {
      version: entry.version,
      score: entry.score,
      safety_block_rate: entry.safety_block_rate,
      access: entry.access,
      cost_per_task_usd: entry.cost_per_task_usd,
      benchmarks: entry.benchmarks,
    });
  }
  return {
    matched: results.size,
    models: models.map((model) => {
      const result = results.get(model);
      return result
        ? {
            ...model,
            evaluations: { ...model.evaluations, [CYBER_INDEX_KEY]: result.score },
            cyber_index_result: result,
          }
        : model;
    }),
  };
}
