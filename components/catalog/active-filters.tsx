import { X } from "@/components/icons";
import type { CatalogState } from "@/lib/catalog-search";
import { formatMoney, formatSpeed, formatTokens } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type FilterKey = "provider" | "weights" | "category" | "minScore" | "maxPrice" | "minContext" | "minSpeed" | "reasoning";

/**
 * The filters applied from the sheet, visible beside the results so each can
 * be removed without reopening it.
 */
export function ActiveFilters({
  state,
  providerLabel,
  onRemove,
}: {
  state: CatalogState;
  providerLabel: string | undefined;
  onRemove: (key: FilterKey) => void;
}) {
  const { t, lang } = useI18n();
  const copy = t.grid.thresholds;
  const chips: Array<{ key: FilterKey; label: string }> = [];
  if (state.category !== "all") chips.push({ key: "category", label: t.grid.categories[state.category] });
  if (state.provider !== "all") chips.push({ key: "provider", label: providerLabel ?? state.provider });
  if (state.weights !== "all") chips.push({ key: "weights", label: t.grid.weightAccess[state.weights] });
  if (state.viewMode === "advanced") {
    if (state.minScore !== null) chips.push({ key: "minScore", label: copy.chipScore(String(state.minScore)) });
    if (state.maxPrice !== null) chips.push({ key: "maxPrice", label: copy.chipPrice(formatMoney(state.maxPrice, lang)) });
    if (state.minContext !== null) chips.push({ key: "minContext", label: copy.chipContext(formatTokens(state.minContext, lang)) });
    if (state.minSpeed !== null) chips.push({ key: "minSpeed", label: copy.chipSpeed(formatSpeed(state.minSpeed, lang)) });
    if (state.reasoning !== "all") chips.push({ key: "reasoning", label: state.reasoning === "yes" ? copy.reasoningYes : copy.reasoningNo });
  }
  if (!chips.length) return null;

  return (
    <ul aria-label={t.grid.activeFilters} className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip.key} className="filter-chip">
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            aria-label={t.grid.removeFilter(chip.label)}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border bg-card py-1 pl-3 pr-2 text-xs font-medium transition-[background-color,border-color,transform] duration-150 hover:border-foreground/25 hover:bg-muted active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11"
          >
            {chip.label}
            <X aria-hidden="true" className="size-3.5 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  );
}
