import type { ComparisonGroup, ComparisonRow } from "@/lib/comparison-rows";
import { comparisonHasDifferences } from "@/lib/comparison-rows";

export type ComparisonView = ComparisonGroup | "essential" | "all";

export interface RowSection {
  key: string;
  /** Shown only in the "all" view, where groups follow each other. */
  title: string | null;
  rows: ComparisonRow[];
}

const GROUP_ORDER: ComparisonGroup[] = ["benchmarks", "performance", "pricing", "capabilities", "info"];

export function visibleSections(
  rows: ComparisonRow[],
  view: ComparisonView,
  differencesOnly: boolean,
  groupTitles: Record<ComparisonGroup, string>,
): RowSection[] {
  const visible = rows.filter(
    (row) =>
      (view === "all" || (view === "essential" ? row.essential : row.group === view)) &&
      (!differencesOnly || comparisonHasDifferences(row)),
  );
  if (view !== "all") return visible.length ? [{ key: view, title: null, rows: visible }] : [];
  return GROUP_ORDER.flatMap((group) => {
    const groupRows = visible.filter((row) => row.group === group);
    return groupRows.length ? [{ key: group, title: groupTitles[group], rows: groupRows }] : [];
  });
}
