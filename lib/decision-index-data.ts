import { findFlightElementProps, parseFlightRecords } from "./aa-flight";
import { getCanonicalCreatorSlug, getCreatorDisplayName } from "./provider-map";

/*
 * Artificial Analysis Decision Index, read from the `contestants` prop of the
 * `/evaluations/artificial-analysis-decision-index` RSC payload. AA publishes,
 * per hosted model, the index, its five component scores (0–100), the average
 * cost and time per task, and whether the model is a decision model (answers
 * through a decision API) or a language model answering in structured JSON.
 */

export type DecisionModelKind = "decision" | "llm";

export const DECISION_SCORE_KEYS = [
  "omniscience_accuracy",
  "omniscience_non_hallucination",
  "hle_multichoice",
  "when2call",
  "wildguardtest",
] as const;

export type DecisionScoreKey = (typeof DECISION_SCORE_KEYS)[number];

const SOURCE_SCORE_KEYS: Record<DecisionScoreKey, string> = {
  omniscience_accuracy: "omniscienceAccuracy",
  omniscience_non_hallucination: "omniscienceNonHallucinationRate",
  hle_multichoice: "hleTextMcqAccuracy",
  when2call: "when2callAccuracy",
  wildguardtest: "wildguardtestAverageF1",
};

export interface DecisionIndexRow {
  /** AA contestant id, `<host>_<model>`. */
  id: string;
  /** Model part of the id, the catalogue join key. */
  model_slug: string;
  name: string;
  kind: DecisionModelKind;
  host_name: string | null;
  creator_slug: string | null;
  creator_name: string | null;
  /** Decision Index, 0–100. */
  index: number;
  /** Component scores, 0–100; an unpublished one is null. */
  scores: Record<DecisionScoreKey, number | null>;
  cost_per_task_usd: number | null;
  time_per_task_seconds: number | null;
}

export interface DecisionIndexData {
  rows: DecisionIndexRow[];
}

const ID_PATTERN = /^([a-z0-9][a-z0-9-]{0,59})_([a-z0-9][a-z0-9._-]{0,119})$/;

type Props = Record<string, unknown>;

function isProps(value: unknown): value is Props {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function percent(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

function amount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function creatorSlug(name: string | null): string | null {
  const slug = name?.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug ? getCanonicalCreatorSlug(slug) : null;
}

/**
 * Parses the contestants. A row needs a valid `<host>_<model>` id, a name, a
 * known kind and an index in [0, 100]; a measured zero is kept. Duplicates
 * keep their first occurrence and rows are ordered by index, ties in source order.
 */
export function parseDecisionIndex(payload: string): DecisionIndexRow[] {
  const records = parseFlightRecords(payload);
  const [props] = findFlightElementProps(records, (props) => Array.isArray(props.contestants));
  if (!props) return [];
  const seen = new Set<string>();
  const rows = (props.contestants as unknown[]).flatMap((contestant): DecisionIndexRow[] => {
    if (!isProps(contestant)) return [];
    const id = text(contestant.slug);
    const match = id ? ID_PATTERN.exec(id) : null;
    const name = text(contestant.name);
    const kind = contestant.kind === "decisionModel" ? "decision" : contestant.kind === "llm" ? "llm" : null;
    const index = percent(contestant.indexScore);
    if (!id || !match || !name || !kind || index === null || seen.has(id)) return [];
    seen.add(id);
    const sourceScores = isProps(contestant.scores) ? contestant.scores : {};
    const scores = Object.fromEntries(
      DECISION_SCORE_KEYS.map((key) => [key, percent(sourceScores[SOURCE_SCORE_KEYS[key]])]),
    ) as Record<DecisionScoreKey, number | null>;
    const creatorName = text(contestant.creatorName);
    const creator = creatorSlug(creatorName);
    const timeMs = amount(contestant.timePerTaskMs);
    return [{
      id,
      model_slug: match[2],
      name,
      kind,
      host_name: text(contestant.hostName),
      creator_slug: creator,
      creator_name: creator && creatorName ? getCreatorDisplayName(creator, creatorName) : creatorName,
      index,
      scores,
      cost_per_task_usd: amount(contestant.costPerTaskUsd),
      time_per_task_seconds: timeMs === null ? null : timeMs / 1000,
    }];
  });
  return rows
    .map((row, position) => ({ row, position }))
    .sort((a, b) => b.row.index - a.row.index || a.position - b.position)
    .map(({ row }) => row);
}

export type DecisionKindFilter = "all" | DecisionModelKind;

/**
 * Filters rows for display, keeping the index order. `searchText` adds text
 * to match, such as a catalogue name.
 */
export function selectDecisionIndexRows(
  rows: readonly DecisionIndexRow[],
  options: { query: string; kind: DecisionKindFilter; searchText?: (row: DecisionIndexRow) => string },
): DecisionIndexRow[] {
  const query = options.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (options.kind !== "all" && row.kind !== options.kind) return false;
    if (!query) return true;
    return [row.name, row.model_slug, row.creator_name, row.host_name, options.searchText?.(row)]
      .some((value) => value?.toLowerCase().includes(query));
  });
}
