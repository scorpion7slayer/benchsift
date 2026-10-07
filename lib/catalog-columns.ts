import { advancedSortValue } from "./model-grid-logic";
import type { LLMModel } from "./model-types";

/** Measurements the Advanced table can show; each is also a sort. */
export const COLUMN_KEYS = [
  "intelligence", "coding", "math", "agentic", "gpqa", "hle", "livecodebench",
  "speed", "ttft", "price", "input_price", "output_price", "cost_per_task", "context", "newest",
] as const;
export type ColumnKey = (typeof COLUMN_KEYS)[number];

export const DEFAULT_COLUMNS: ColumnKey[] = ["intelligence", "coding", "math", "speed", "ttft", "price", "context"];
/** Beyond nine measurements the table no longer fits beside the model names. */
export const MAX_COLUMNS = 9;

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * The filtered catalogue as CSV with raw source values (no unit, no rounding)
 * so it can be analysed elsewhere; absent values stay empty, never zero.
 */
export function catalogCsv(models: LLMModel[], columns: ColumnKey[], labels: Record<ColumnKey, string>): string {
  const header = ["name", "slug", "creator", ...columns.map((key) => labels[key])];
  const rows = models.map((model) => [
    model.name,
    model.slug,
    model.model_creator.name,
    ...columns.map((key) => (key === "newest" ? model.release_date : advancedSortValue(model, key))),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

