import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Combobox, type ComboboxItem } from "@/components/catalog-combobox";
import { CatalogSelect } from "@/components/catalog-select";
import { Blocks, Loader2, SlidersHorizontal } from "@/components/icons";
import { SearchField } from "@/components/search-field";
import { MobileCompareBar } from "@/components/mobile-compare-bar";
import { ModelTable } from "@/components/model-table";
import { RankedListHeader, RankedModelRow } from "@/components/ranked-model-row";
import { SegmentedControl } from "@/components/segmented-control";
import { Button } from "@/components/ui/button";
import type { CatalogSearch } from "@/lib/catalog-search";
import { animateContent } from "@/lib/content-motion";
import type { HomeCatalogModel } from "@/lib/home-catalog";
import { useI18n } from "@/lib/i18n";
import {
  advancedSortValue,
  hasNormalRankingValue,
  normalRankingValue,
  matchesCategory,
  matchesSearch,
  matchesThresholds,
  matchesWeightAccess,
  sortAdvancedModels,
  sortHomeModels,
} from "@/lib/model-grid-logic";
import { isOpenWeightsModel } from "@/lib/model-metrics";
import { getCanonicalCreatorSlug, getCreatorDisplayName } from "@/lib/provider-map";
import { cn } from "@/lib/utils";
import { CatalogFilters } from "./catalog/catalog-filters";
import { ActiveFilters } from "./catalog/active-filters";
import { NORMAL_RANKING_OPTIONS } from "./catalog/catalog-options";
import { SortControls } from "./catalog/sort-controls";
import { ColumnPicker, ExportCsvButton, useTableColumns } from "./catalog/table-columns";
import { useAdvancedModels } from "./catalog/use-advanced-models";
import { useCatalogState } from "./catalog/use-catalog-state";

const ModelCard = lazy(() => import("@/components/model-card").then((module) => ({ default: module.ModelCard })));

const BATCH = 32;

type RankedEntry = { model: HomeCatalogModel; rank?: number };

function matchesProvider(provider: string, creatorSlug: string): boolean {
  return provider === "all" || getCanonicalCreatorSlug(creatorSlug) === provider;
}

function StatusPanel({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 text-center">
      {children}
    </div>
  );
}

/**
 * Home catalogue. Normal mode ranks models on one measure; Advanced mode lists
 * the full catalogue (a table on desktop, cards below). Every control is
 * mirrored in the URL through `useCatalogState`.
 */
export function ModelGrid({
  models,
  search,
  onSearchChange,
}: {
  models: HomeCatalogModel[];
  search: CatalogSearch;
  onSearchChange: (search: CatalogSearch) => void;
}) {
  const { t } = useI18n();
  const { state, update, sortBy, reverseSort, setViewMode, resetFilters, activeFilterCount } = useCatalogState(search, onSearchChange);
  const appliedQuery = useDeferredValue(state.query).toLowerCase().trim();
  const { minScore, maxPrice, minContext, minSpeed, reasoning } = state;
  const thresholds = useMemo(
    () => ({ minScore, maxPrice, minContext, minSpeed, reasoning }),
    [minScore, maxPrice, minContext, minSpeed, reasoning],
  );
  const advanced = state.viewMode === "advanced";
  const advancedData = useAdvancedModels(advanced);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columns, setColumns] = useTableColumns();
  const filtersButton = useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const resultsRef = useRef<HTMLDivElement>(null);
  const resultsMotion = useRef<Animation | null>(null);

  // Any change to the result set restarts paging and briefly marks the update.
  useEffect(() => {
    setVisibleCount(BATCH);
    resultsMotion.current = animateContent(resultsRef.current, resultsMotion.current);
  }, [appliedQuery, state.sort, state.direction, state.viewMode, state.ranking, state.provider, state.weights, state.category, thresholds]);
  useEffect(() => () => resultsMotion.current?.cancel(), []);

  const providerItems = useMemo<ComboboxItem[]>(() => {
    const names = new Map<string, string>();
    for (const model of models) {
      const slug = getCanonicalCreatorSlug(model.model_creator.slug);
      if (!names.has(slug)) {
        names.set(slug, slug === "stealth" ? t.stealth.unknownCreator : getCreatorDisplayName(slug, model.model_creator.name));
      }
    }
    const sorted = [...names.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    return [{ value: "all", label: t.grid.allProviders }, ...sorted.map(([value, label]) => ({ value, label }))];
  }, [models, t.stealth.unknownCreator, t.grid.allProviders]);

  const advancedResults = useMemo(() => {
    const filtered = (advancedData.models ?? []).filter(
      (model) =>
        matchesProvider(state.provider, model.model_creator.slug) &&
        (state.category === "all" || matchesCategory(model, state.category)) &&
        matchesWeightAccess(isOpenWeightsModel(model), state.weights) &&
        matchesThresholds(model, thresholds) &&
        matchesSearch(model, appliedQuery),
    );
    return sortAdvancedModels(filtered, state.sort, state.direction);
  }, [advancedData.models, appliedQuery, state.sort, state.direction, state.provider, state.weights, state.category, thresholds]);
  const missingSortValue = useMemo(
    () => state.sort === "name" ? 0 : advancedResults.filter((model) => advancedSortValue(model, state.sort) === null).length,
    [advancedResults, state.sort],
  );

  // Global ranks are computed before filtering, so filters never renumber them.
  const ranked = useMemo<RankedEntry[]>(
    () =>
      sortHomeModels(models.filter((model) => hasNormalRankingValue(model, state.ranking)), state.ranking)
        .map((model, index) => ({ model, rank: index + 1 })),
    [models, state.ranking],
  );

  const rankingBest = ranked[0] ? normalRankingValue(ranked[0].model, state.ranking) : null;
  const normalResults = useMemo(() => {
    // A search also finds unranked models, listed after the ranking without a rank.
    const unranked: RankedEntry[] = appliedQuery
      ? models.filter((model) => !hasNormalRankingValue(model, state.ranking)).map((model) => ({ model }))
      : [];
    return [...ranked, ...unranked].filter(
      ({ model }) =>
        matchesProvider(state.provider, model.model_creator.slug) &&
        matchesWeightAccess(model.is_open_weights === true, state.weights) &&
        matchesSearch(model, appliedQuery),
    );
  }, [ranked, models, state.ranking, appliedQuery, state.provider, state.weights]);

  const resultCount = advanced ? advancedResults.length : normalResults.length;
  const totalCount = advanced
    ? (advancedData.models?.length ?? models.length)
    : appliedQuery ? models.length : ranked.length;
  const hasMore = visibleCount < resultCount;
  const filtersApplied = Boolean(state.query) || activeFilterCount > 0;

  if (models.length === 0) {
    return (
      <StatusPanel>
        <Blocks aria-hidden="true" className="size-8 text-muted-foreground" />
        <p className="font-medium">{t.grid.unavailableTitle}</p>
        <p className="max-w-md text-sm text-muted-foreground">{t.grid.unavailableDescription}</p>
      </StatusPanel>
    );
  }

  // Wide screens keep the two most used filters in view, as the sheet does on mobile.
  const inlineFilters = (
    <div className="hidden items-center gap-2 lg:flex">
      <Combobox
        items={providerItems}
        value={state.provider}
        onChange={(value) => update("provider", value)}
        placeholder={t.grid.allProviders}
        withSearch
        width="w-56"
      />
      <CatalogSelect
        value={state.weights}
        onChange={(value) => update("weights", value)}
        label={t.grid.weightAccess.label}
        className="w-44"
        options={[
          { value: "all", label: t.grid.weightAccess.all },
          { value: "open", label: t.grid.weightAccess.open },
          { value: "closed", label: t.grid.weightAccess.closed },
        ]}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[minmax(12rem,1fr)_auto_auto]">
        <SearchField
          value={state.query}
          onChange={(value) => update("query", value)}
          placeholder={t.grid.search}
          clearLabel={t.compare.clear}
          className="col-span-2 sm:col-span-1"
        />
        <SegmentedControl
          value={state.viewMode}
          onChange={setViewMode}
          label={t.grid.viewModes.label}
          options={[
            { value: "normal", label: t.grid.viewModes.normal },
            { value: "advanced", label: t.grid.viewModes.advanced },
          ]}
        />
        <Button
          ref={filtersButton}
          variant="outline"
          size="control"
          onClick={() => setFiltersOpen(true)}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          {t.catalogUi.filters}
          {activeFilterCount > 0 && <span className="rounded bg-muted px-1.5 text-xs tabular-nums">{activeFilterCount}</span>}
        </Button>
      </div>

      {advanced ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {inlineFilters}
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto lg:ml-auto">
            <SortControls sort={state.sort} direction={state.direction} onSort={(value) => sortBy(value)} onReverse={reverseSort} />
            <ColumnPicker columns={columns} onChange={setColumns} />
            <ExportCsvButton models={advancedResults} columns={columns} />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full min-w-0 sm:w-auto">
          <span className="mb-2 block text-xs font-medium text-muted-foreground">{t.grid.ranking.label}</span>
          <SegmentedControl
            value={state.ranking}
            onChange={(value) => update("ranking", value)}
            label={t.grid.ranking.label}
            stretch
            stackOnMobile
            className="flex w-full sm:inline-flex sm:w-auto"
            options={NORMAL_RANKING_OPTIONS.map((option) => ({ value: option.value, label: t.grid.ranking[option.label], icon: option.icon }))}
          />
        </div>
        {inlineFilters}
        </div>
      )}

      <CatalogFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        returnFocus={filtersButton}
        state={state}
        update={update}
        onReset={() => resetFilters({ ordering: true })}
        providerItems={providerItems}
        advancedModels={advancedData.models}
        resultCount={resultCount}
      />
      <MobileCompareBar />

      {advanced && !advancedData.models ? (
        <StatusPanel>
          {advancedData.failed ? (
            <>
              <Blocks aria-hidden="true" className="size-7 text-muted-foreground" />
              <p className="font-medium">{t.grid.unavailableTitle}</p>
              <p className="max-w-md text-sm text-muted-foreground">{t.grid.unavailableDescription}</p>
              <Button type="button" variant="outline" size="sm" onClick={advancedData.retry}>{t.errors.actions.retry}</Button>
            </>
          ) : (
            <>
              <Loader2 aria-hidden="true" className={cn("size-5 text-muted-foreground", advancedData.loading && "animate-spin")} />
              <p className="text-sm text-muted-foreground">{t.grid.loadingDetails}</p>
            </>
          )}
        </StatusPanel>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                {t.grid.results(resultCount, totalCount)}
              </p>
              <ActiveFilters
                state={state}
                providerLabel={providerItems.find((item) => item.value === state.provider)?.label}
                onRemove={(key) =>
                  key === "provider" || key === "weights" || key === "category" || key === "reasoning"
                    ? update(key, "all")
                    : update(key, null)}
              />
            </div>
            {filtersApplied && (
              <Button variant="ghost" size="sm" onClick={() => resetFilters({ query: true })}>{t.trust.resetFilters}</Button>
            )}
          </div>
          {advanced && missingSortValue > 0 && missingSortValue < resultCount && (
            <p className="-mt-2 text-xs text-muted-foreground">{t.grid.missingLast(missingSortValue)}</p>
          )}
          {!advanced && <p className="hidden text-xs text-muted-foreground sm:block">{t.trust.catalogNote}</p>}

          {/* Stable keys keep focus and mounted rows while the filters change. */}
          <div ref={resultsRef} aria-busy={state.query.toLowerCase().trim() !== appliedQuery}>
            {resultCount === 0 ? (
              <div className="model-grid-empty-refresh flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground">{t.grid.noResults}</p>
              </div>
            ) : advanced ? (
              <>
                <ModelTable
                  models={advancedResults.slice(0, visibleCount)}
                  columns={columns}
                  sort={state.sort}
                  direction={state.direction}
                  onSort={(value) => sortBy(value, { toggle: true })}
                />
                <Suspense fallback={<StatusPanel><Loader2 aria-hidden="true" className="size-5 animate-spin text-muted-foreground" /></StatusPanel>}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
                    {advancedResults.slice(0, visibleCount).map((model) => (
                      <div key={model.id} className="model-grid-item">
                        <ModelCard model={model} sort={state.sort} />
                      </div>
                    ))}
                  </div>
                </Suspense>
              </>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
                <RankedListHeader metric={state.ranking} />
                <ol>
                  {normalResults.slice(0, visibleCount).map(({ model, rank }) => (
                    <RankedModelRow key={model.slug} model={model} rank={rank} metric={state.ranking} best={rankingBest} />
                  ))}
                </ol>
              </div>
            )}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button variant="outline" onClick={() => setVisibleCount((count) => Math.min(count + BATCH, resultCount))}>
                  {t.grid.showMore}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
