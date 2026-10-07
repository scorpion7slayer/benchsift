import { useMemo } from "react";
import { Combobox, type ComboboxItem } from "@/components/catalog-combobox";
import { CatalogSelect } from "@/components/catalog-select";
import { InfoTip } from "@/components/info-tip";
import { MobileSheet } from "@/components/mobile-sheet";
import { Button } from "@/components/ui/button";
import type { LLMModel } from "@/lib/model-types";
import { THRESHOLD_PRESETS, type CatalogState } from "@/lib/catalog-search";
import { formatMoney, formatSpeed, formatTokens } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { matchesCategory, type CategoryFilter, type WeightAccessFilter } from "@/lib/model-grid-logic";
import { CATEGORY_OPTIONS } from "./catalog-options";

/** Provider, weight access and (in Advanced mode) model type, in a sheet. */
export function CatalogFilters({
  open,
  onOpenChange,
  returnFocus,
  state,
  update,
  onReset,
  providerItems,
  advancedModels,
  resultCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: React.RefObject<HTMLButtonElement | null>;
  state: CatalogState;
  update: <K extends keyof CatalogState>(key: K, value: CatalogState[K]) => void;
  onReset: () => void;
  providerItems: ComboboxItem[];
  advancedModels: LLMModel[] | null;
  resultCount: number;
}) {
  const { t, lang } = useI18n();
  const copy = t.grid.thresholds;
  const categoryCounts = useMemo(() => {
    const counts = {} as Record<CategoryFilter, number>;
    for (const option of CATEGORY_OPTIONS) {
      counts[option.value] = option.value === "all"
        ? (advancedModels?.length ?? 0)
        : (advancedModels?.filter((model) => matchesCategory(model, option.value)).length ?? 0);
    }
    return counts;
  }, [advancedModels]);
  const weightItems: Array<{ value: WeightAccessFilter; label: string }> = [
    { value: "all", label: t.grid.weightAccess.all },
    { value: "open", label: t.grid.weightAccess.open },
    { value: "closed", label: t.grid.weightAccess.closed },
  ];

  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} title={t.mobile.filters} returnFocus={returnFocus}>
      <div className="grid gap-5 p-4">
        {state.viewMode === "advanced" && (
          <div className="grid gap-2 text-sm font-medium">
            <span>{t.mobile.category}</span>
            <CatalogSelect
              value={state.category}
              onChange={(value) => update("category", value)}
              label={t.mobile.category}
              options={CATEGORY_OPTIONS.map((option) => ({
                value: option.value,
                label: `${t.grid.categories[option.value]} (${categoryCounts[option.value] ?? 0})`,
              }))}
            />
          </div>
        )}
        <div className="grid gap-2 text-sm font-medium">
          <span>{t.grid.allProviders}</span>
          <Combobox
            items={providerItems}
            value={state.provider}
            onChange={(value) => update("provider", value)}
            placeholder={t.grid.allProviders}
            withSearch
            width="w-full"
          />
        </div>
        <div className="grid gap-2 text-sm font-medium">
          <span className="flex items-center gap-1">
            {t.grid.weightAccess.label}
            <InfoTip label={`${t.glossary.infoLabel} · ${t.grid.weightAccess.label}`} content={t.glossary.openWeights} />
          </span>
          <CatalogSelect
            value={state.weights}
            onChange={(value) => update("weights", value)}
            label={t.grid.weightAccess.label}
            options={weightItems}
          />
        </div>
        {state.viewMode === "advanced" && (
          <fieldset className="grid gap-3 border-t pt-4">
            <legend className="sr-only">{copy.title}</legend>
            <div>
              <p className="text-sm font-medium">{copy.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{copy.hint}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ThresholdSelect
                label={copy.minScore}
                value={state.minScore}
                presets={THRESHOLD_PRESETS.min}
                format={(value) => `≥ ${value}`}
                any={copy.any}
                onChange={(value) => update("minScore", value)}
              />
              <ThresholdSelect
                label={copy.maxPrice}
                value={state.maxPrice}
                presets={THRESHOLD_PRESETS.price}
                format={(value) => `≤ ${formatMoney(value, lang)}`}
                any={copy.any}
                onChange={(value) => update("maxPrice", value)}
              />
              <ThresholdSelect
                label={copy.minContext}
                value={state.minContext}
                presets={THRESHOLD_PRESETS.ctx}
                format={(value) => `≥ ${formatTokens(value, lang)}`}
                any={copy.any}
                onChange={(value) => update("minContext", value)}
              />
              <ThresholdSelect
                label={copy.minSpeed}
                value={state.minSpeed}
                presets={THRESHOLD_PRESETS.speed}
                format={(value) => `≥ ${formatSpeed(value, lang)}`}
                any={copy.any}
                onChange={(value) => update("minSpeed", value)}
              />
              <div className="grid gap-2 text-sm font-medium sm:col-span-2">
                <span>{copy.reasoning}</span>
                <CatalogSelect
                  value={state.reasoning}
                  onChange={(value) => update("reasoning", value)}
                  label={copy.reasoning}
                  className="sm:w-full"
                  options={[
                    { value: "all", label: copy.any },
                    { value: "yes", label: copy.reasoningYes },
                    { value: "no", label: copy.reasoningNo },
                  ]}
                />
              </div>
            </div>
          </fieldset>
        )}
        <Button variant="ghost" className="min-h-11" onClick={onReset}>{t.trust.resetFilters}</Button>
      </div>
      <div className="sticky bottom-0 border-t bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button className="min-h-12 w-full" onClick={() => onOpenChange(false)}>
          {t.mobile.showResults} · {resultCount}
        </Button>
      </div>
    </MobileSheet>
  );
}

/** A threshold chosen among fixed presets, or none. */
function ThresholdSelect({
  label,
  value,
  presets,
  format,
  any,
  onChange,
}: {
  label: string;
  value: number | null;
  presets: readonly number[];
  format: (value: number) => string;
  any: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <CatalogSelect
        value={value === null ? "any" : String(value)}
        onChange={(next) => onChange(next === "any" ? null : Number(next))}
        label={label}
        className="sm:w-full"
        options={[{ value: "any", label: any }, ...presets.map((preset) => ({ value: String(preset), label: format(preset) }))]}
      />
    </div>
  );
}
