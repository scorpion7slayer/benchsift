import type { LLMModel } from "./model-types";
import { findFlightElementProps, parseFlightRecords } from "./aa-flight";

/*
 * Benchmarks added to the Artificial Analysis Intelligence Index v5, read from
 * the `initialModels` prop of the `/evaluations/artificial-analysis-intelligence-index`
 * RSC payload. AA lists only the configurations its page charts, so these
 * fill gaps in the API evaluations and never replace a value the API sent.
 */

/** Catalogue evaluation key for each Index v5 benchmark and the AA field it comes from. */
export const AA_INDEX_V5_FIELDS = {
  frontiercode_2_0: "frontierCode20",
  terminalbench_science: "terminalBenchScience",
  hle_diamond: "hleDiamond",
  critpt_v2: "critptAgentic",
  automationbench_aa: "automationBenchPartialScore",
  gdp_pdf: "gdpPdfAllPass",
  aa_briefcase: "briefcaseElo",
} as const;

export type AAIndexV5Key = keyof typeof AA_INDEX_V5_FIELDS;

/** Every Index v5 benchmark except AA-Briefcase, an Elo, is a 0–1 fraction. */
const ELO_KEYS: ReadonlySet<AAIndexV5Key> = new Set(["aa_briefcase"]);

export interface AAIndexV5Entry {
  aa_id: string | null;
  slug: string;
  scores: Partial<Record<AAIndexV5Key, number>>;
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9._-]{0,119}$/;

type Props = Record<string, unknown>;

function isProps(value: unknown): value is Props {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function score(key: AAIndexV5Key, value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return ELO_KEYS.has(key) || value <= 1 ? value : null;
}

/**
 * Parses the published scores. A configuration needs a valid slug and at least
 * one score; a measured zero is kept and duplicates keep their first occurrence.
 */
export function parseAAIndexV5(payload: string): AAIndexV5Entry[] {
  const [props] = findFlightElementProps(parseFlightRecords(payload), (props) => Array.isArray(props.initialModels));
  if (!props) return [];
  const seen = new Set<string>();
  return (props.initialModels as unknown[]).flatMap((model): AAIndexV5Entry[] => {
    if (!isProps(model)) return [];
    const slug = text(model.slug);
    if (!slug || !SLUG_PATTERN.test(slug) || seen.has(slug)) return [];
    const scores: AAIndexV5Entry["scores"] = {};
    for (const [key, field] of Object.entries(AA_INDEX_V5_FIELDS) as [AAIndexV5Key, string][]) {
      const value = score(key, model[field]);
      if (value !== null) scores[key] = value;
    }
    if (!Object.keys(scores).length) return [];
    seen.add(slug);
    return [{ aa_id: text(model.id), slug, scores }];
  });
}

/**
 * Adds the scores to AA catalogue models, matched by AA id, then slug. A key
 * the API already filled, zero included, keeps the API value.
 */
export function mergeAAIndexV5(
  models: LLMModel[],
  entries: AAIndexV5Entry[],
): { models: LLMModel[]; matched: number } {
  const aaModels = models.filter((model) => !/^(?:openrouter|modelsdev):/.test(model.id));
  const byId = new Map(aaModels.map((model) => [model.id, model]));
  const bySlug = new Map(aaModels.map((model) => [model.slug, model]));
  const scores = new Map<LLMModel, AAIndexV5Entry["scores"]>();
  for (const entry of entries) {
    const model = (entry.aa_id ? byId.get(entry.aa_id) : undefined) ?? bySlug.get(entry.slug);
    if (model && !scores.has(model)) scores.set(model, entry.scores);
  }
  return {
    matched: scores.size,
    models: models.map((model) => {
      const found = scores.get(model);
      if (!found) return model;
      const evaluations = { ...model.evaluations };
      for (const [key, value] of Object.entries(found)) {
        if (typeof evaluations[key] !== "number") evaluations[key] = value;
      }
      return { ...model, evaluations };
    }),
  };
}
