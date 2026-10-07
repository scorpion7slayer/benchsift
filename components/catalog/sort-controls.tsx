import { CatalogSelect } from "@/components/catalog-select";
import { SortAscending, SortDescending } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { formatCatalogPrice, formatDate, formatMoney, formatNumber, formatPercent, formatSeconds, formatSpeed, formatTokens, type DisplayLang } from "@/lib/format";
import { useI18n, type Translations } from "@/lib/i18n";
import { advancedSortValue, type SortDirection, type SortKey } from "@/lib/model-grid-logic";
import type { LLMModel } from "@/lib/model-types";
import { SORT_OPTIONS } from "./catalog-options";

/** Names the direction in the terms of the sort: A → Z for names, newest first for dates. */
export function directionLabel(sort: SortKey, direction: SortDirection, t: Translations): string {
  const labels = t.grid.direction;
  if (sort === "name") return direction === "asc" ? labels.az : labels.za;
  if (sort === "newest") return direction === "desc" ? labels.newest : labels.oldest;
  return direction === "asc" ? labels.asc : labels.desc;
}

const PERCENT_SORTS = new Set<SortKey>(["gpqa", "mmlu_pro", "hle", "livecodebench", "math_500", "aime_25"]);

/** The value a model is sorted by, formatted for display; null for names. */
export function formatSortValue(model: LLMModel, sort: SortKey, lang: DisplayLang): string | null {
  if (sort === "name") return null;
  if (sort === "newest") return formatDate(model.release_date, lang);
  if (sort === "price") return formatCatalogPrice(model.pricing, lang);
  const value = advancedSortValue(model, sort);
  if (PERCENT_SORTS.has(sort)) return formatPercent(value, lang);
  switch (sort) {
    case "speed":
      return formatSpeed(value, lang);
    case "ttft":
      return formatSeconds(value, lang);
    case "cost_per_task":
      return formatMoney(value, lang);
    case "context":
      return formatTokens(value, lang);
    case "openrouter_popular":
      return value == null ? formatNumber(null, lang) : `#${value}`;
    default:
      return formatNumber(value, lang);
  }
}

/** Sort criterion and a button that reverses its direction. */
export function SortControls({
  sort,
  direction,
  onSort,
  onReverse,
}: {
  sort: SortKey;
  direction: SortDirection;
  onSort: (sort: SortKey) => void;
  onReverse: () => void;
}) {
  const { t } = useI18n();
  const label = directionLabel(sort, direction, t);
  const Icon = direction === "asc" ? SortAscending : SortDescending;
  return (
    <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
      <span className="shrink-0 text-xs text-muted-foreground">{t.grid.sortBy}</span>
      <CatalogSelect
        value={sort}
        onChange={onSort}
        label={t.grid.sortBy}
        className="min-w-0 flex-1 sm:w-52 sm:flex-none"
        options={SORT_OPTIONS.map((option) => ({
          value: option.value,
          label: t.grid.sorts[option.value],
          group: t.grid.sortGroups[option.group],
        }))}
      />
      <Button
        type="button"
        variant="outline"
        onClick={onReverse}
        aria-label={t.grid.direction.toggle(label)}
        title={t.grid.direction.toggle(label)}
        size="control"
        className="shrink-0"
      >
        <Icon key={direction} aria-hidden="true" className="sort-direction-icon size-4" />
        <span className="hidden text-sm sm:inline">{label}</span>
      </Button>
    </div>
  );
}
