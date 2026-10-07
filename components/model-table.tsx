import { directionLabel } from "@/components/catalog/sort-controls";
import { columnLabel, columnValue } from "@/components/catalog/table-columns";
import type { ColumnKey } from "@/lib/catalog-columns";
import { Check, Plus } from "@/components/icons";
import { SortButton } from "@/components/sort-button";
import { Link } from "@/components/link";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { StealthBadge } from "@/components/stealth-history";
import { Button } from "@/components/ui/button";
import type { LLMModel } from "@/lib/model-types";
import { useCompare } from "@/lib/compare-store";
import { useI18n } from "@/lib/i18n";
import type { SortDirection, SortKey } from "@/lib/model-grid-logic";
import { isOpenWeightsModel } from "@/lib/model-metrics";
import { getModelProviderKey } from "@/lib/provider-map";
import { cn } from "@/lib/utils";

interface Column {
  key: ColumnKey;
  label: string;
  sort: SortKey;
  value: (model: LLMModel) => string;
}

/**
 * Advanced catalogue on wide screens: one row per model with the chosen
 * measurements. A header sorts by its column; activating it again reverses
 * the order. The header row stays visible below the site header.
 */
export function ModelTable({
  models,
  columns: columnKeys,
  sort,
  direction,
  onSort,
}: {
  models: LLMModel[];
  columns: ColumnKey[];
  sort: SortKey;
  direction: SortDirection;
  onSort: (sort: SortKey) => void;
}) {
  const { t, lang } = useI18n();
  const { toggle, isSelected, isFull } = useCompare();
  const columns: Column[] = columnKeys.map((key) => ({
    key,
    label: columnLabel(key, t),
    sort: key,
    value: (model) => columnValue(model, key, lang),
  }));
  // Wider columns for long values (prices with units, Elo scores, dates).
  const wide = new Set<ColumnKey>(["intelligence", "agentic", "livecodebench", "price", "input_price", "output_price", "newest", "cost_per_task"]);
  const sortedBy = (column: Column) => column.sort === sort;

  return (
    // overflow-clip (not hidden) rounds the corners without breaking the sticky header.
    <div className="hidden overflow-clip rounded-xl border bg-card lg:block">
      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">{t.grid.viewModes.advanced}</caption>
        <colgroup>
          <col />
          {columns.map((column) => (
            <col key={column.key} className={wide.has(column.key) ? "w-28 xl:w-32" : "w-20 xl:w-24"} />
          ))}
          <col className="w-12" />
        </colgroup>
        <thead className="model-table-head">
          <tr>
            <th scope="col" aria-sort={sort === "name" ? (direction === "asc" ? "ascending" : "descending") : undefined} className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">
              <SortButton active={sort === "name"} direction={direction} label={t.grid.modelColumn} hint={sort === "name" ? directionLabel("name", direction, t) : undefined} onClick={() => onSort("name")} align="start" />
            </th>
            {columns.map((column) => {
              const active = sortedBy(column);
              return (
                <th key={column.key} scope="col" aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : undefined} className="px-2 py-1.5 text-right text-xs font-medium text-muted-foreground">
                  <SortButton active={active} direction={direction} label={column.label} hint={active ? directionLabel(column.sort, direction, t) : undefined} onClick={() => onSort(column.sort)} />
                </th>
              );
            })}
            <th scope="col"><span className="sr-only">{t.compare.compare}</span></th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => {
            const selected = isSelected(model.slug);
            return (
              <tr key={model.id} data-selected={selected || undefined} className="border-b transition-colors duration-150 last:border-b-0 hover:bg-muted/40 data-[selected=true]:bg-primary/[0.04]">
                <td className="px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <ModelProviderIcon provider={getModelProviderKey(model.slug, model.model_creator.slug)} size={28} iconUrl={model.provider_icon_url} />
                    <div className="min-w-0">
                      <Link href={`/models/${model.slug}`} className="block truncate rounded-sm font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title={model.name}>
                        {model.name}
                      </Link>
                      <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <span className="truncate">{model.model_creator.slug === "stealth" ? t.stealth.unknownCreator : model.model_creator.name}</span>
                        {model.reasoning_model && <span className="shrink-0">· {t.detail.reasoning}</span>}
                        {isOpenWeightsModel(model) && <span className="shrink-0">· {t.card.openWeightsBadge}</span>}
                      </p>
                      <StealthBadge model={model} />
                    </div>
                  </div>
                </td>
                {columns.map((column) => {
                  const value = column.value(model);
                  return (
                    <td key={column.key} className={cn("px-3 py-2.5 text-right tabular-nums [overflow-wrap:anywhere]", sortedBy(column) ? "font-semibold" : value === "—" && "text-muted-foreground")}>
                      {value}
                    </td>
                  );
                })}
                <td className="pr-3 text-right">
                  <Button
                    type="button"
                    variant={selected ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => toggle(model.slug)}
                    disabled={!selected && isFull}
                    aria-pressed={selected}
                    aria-label={`${selected ? t.card.removeCompare : t.card.addCompare} · ${model.name}`}
                    title={!selected && isFull ? t.compare.maxReached : undefined}
                    className="selection-button size-8"
                  >
                    {selected ? <Check /> : <Plus />}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

