import { animateContent } from "@/lib/content-motion";
import { Combobox, type ComboboxItem } from "@/components/catalog-combobox";
import {
  lazy,
  Suspense,
  useState,
  useDeferredValue,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import {
  Search,
  X,
  Loader2,
  ChevronDown,
  Check,
  Type,
  ImageIcon,
  AudioLines,
  Video,
  ArrowUpDown,
  Mic,
  Captions,
  Blocks,
  Sparkles,
  type RuneIcon,
} from "@/components/icons";
import { RankedModelRow } from "@/components/ranked-model-row";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isOpenWeightsModel } from "@/lib/model-metrics";
import {
  hasNormalRankingValue,
  matchesCategory,
  matchesSearch,
  matchesWeightAccess,
  sortHomeModels,
  sortAdvancedModels,
  type CategoryFilter,
  type NormalRankingKey,
  type SortKey,
  type WeightAccessFilter,
} from "@/lib/model-grid-logic";
import {
  getCanonicalCreatorSlug,
  getCreatorDisplayName,
} from "@/lib/provider-map";
import { collapseReasoningVariants } from "@/lib/model-reasoning";
import { fetchModels } from "@/lib/server-fns";
import type { LLMModel } from "@/lib/api";
import type { HomeCatalogModel } from "@/lib/home-catalog";

const ModelCard = lazy(() =>
  import("@/components/model-card").then((module) => ({
    default: module.ModelCard,
  })),
);

type ViewMode = "normal" | "advanced";

const NORMAL_RANKING_OPTIONS = [
  { value: "intelligence", label: "general" },
  { value: "coding", label: "coding" },
  { value: "math", label: "math" },
  { value: "speed", label: "speed" },
  { value: "price_asc", label: "price" },
] as const;

type SortGroup =
  | "indices"
  | "benchmarks"
  | "performance"
  | "openrouter"
  | "pricing"
  | "general";

interface SortOption {
  value: SortKey;
  group: SortGroup;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "intelligence", group: "indices" },
  { value: "coding", group: "indices" },
  { value: "math", group: "indices" },
  { value: "gpqa", group: "benchmarks" },
  { value: "mmlu_pro", group: "benchmarks" },
  { value: "hle", group: "benchmarks" },
  { value: "livecodebench", group: "benchmarks" },
  { value: "math_500", group: "benchmarks" },
  { value: "aime_25", group: "benchmarks" },
  { value: "speed", group: "performance" },
  { value: "ttft", group: "performance" },
  { value: "openrouter_popular", group: "openrouter" },
  { value: "price_asc", group: "pricing" },
  { value: "price_desc", group: "pricing" },
  { value: "newest", group: "general" },
  { value: "name", group: "general" },
];

const CATEGORY_OPTIONS: Array<{ value: CategoryFilter; icon: RuneIcon }> = [
  { value: "all", icon: Blocks },
  { value: "new", icon: Sparkles },
  { value: "text", icon: Type },
  { value: "image", icon: ImageIcon },
  { value: "embeddings", icon: Blocks },
  { value: "audio", icon: AudioLines },
  { value: "video", icon: Video },
  { value: "rerank", icon: ArrowUpDown },
  { value: "speech", icon: Mic },
  { value: "transcription", icon: Captions },
];

// ModelGrid

const BATCH = 32;

const VIEW_MODE_STORAGE_KEY = "benchsift-model-view-mode";

export function ModelGrid({ models }: { models: HomeCatalogModel[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const appliedQuery = useDeferredValue(query);
  const [sort, setSort] = useState<SortKey>("intelligence");
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const [normalRanking, setNormalRanking] =
    useState<NormalRankingKey>("intelligence");
  const [providerFilter, setProviderFilter] = useState("all");
  const [weightAccessFilter, setWeightAccessFilter] =
    useState<WeightAccessFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const resultsRef = useRef<HTMLDivElement>(null);
  const resultsMotion = useRef<Animation | null>(null);
  const [advancedModels, setAdvancedModels] = useState<LLMModel[] | null>(null);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedLoadError, setAdvancedLoadError] = useState(false);
  const [advancedLoadAttempt, setAdvancedLoadAttempt] = useState(0);
  const advancedRequestRef = useRef<Promise<LLMModel[]> | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const categoryBarRef = useRef<HTMLDivElement>(null);
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (stored === "normal" || stored === "advanced") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setViewMode(stored);
      } else if (stored === "nerd") {
        // Migrate the former visible mode name without losing the preference.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setViewMode("advanced");
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, "advanced");
      }
    } catch {
      // The default Normal mode remains available when storage is blocked.
    }
  }, []);

  useEffect(() => {
    if (viewMode !== "advanced" || advancedModels) return;

    let cancelled = false;
    setAdvancedLoading(true);
    setAdvancedLoadError(false);

    const request = advancedRequestRef.current ?? fetchModels();
    advancedRequestRef.current = request;

    void request
      .then((loadedModels) => {
        if (!cancelled)
          setAdvancedModels(collapseReasoningVariants(loadedModels));
      })
      .catch(() => {
        advancedRequestRef.current = null;
        if (!cancelled) setAdvancedLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setAdvancedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [viewMode, advancedModels, advancedLoadAttempt]);

  function changeViewMode(value: string) {
    if (value !== "normal" && value !== "advanced") return;
    setViewMode(value);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, value);
    } catch {
      // The preference remains active for the current session.
    }
  }

  useEffect(() => {
    setVisibleCount(BATCH);
    resultsMotion.current = animateContent(
      resultsRef.current,
      resultsMotion.current,
    );
  }, [
    appliedQuery,
    sort,
    viewMode,
    normalRanking,
    providerFilter,
    weightAccessFilter,
    categoryFilter,
  ]);
  useEffect(() => () => resultsMotion.current?.cancel(), []);

  const providers = useMemo(() => {
    const unique = new Map<string, string>();
    models.forEach((m) => {
      const slug = getCanonicalCreatorSlug(m.model_creator.slug);
      if (!unique.has(slug)) {
        unique.set(slug, getCreatorDisplayName(slug, m.model_creator.name));
      }
    });
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [models]);

  const providerItems = useMemo<ComboboxItem[]>(
    () => [
      { value: "all", label: t.grid.allProviders },
      ...providers.map(([slug, name]) => ({ value: slug, label: name })),
    ],
    [providers, t.grid.allProviders],
  );

  const weightAccessItems = useMemo<ComboboxItem[]>(
    () => [
      { value: "all", label: t.grid.weightAccess.all },
      { value: "open", label: t.grid.weightAccess.open },
      { value: "closed", label: t.grid.weightAccess.closed },
    ],
    [t.grid.weightAccess],
  );

  const categoryCounts = useMemo(
    () =>
      CATEGORY_OPTIONS.reduce<Record<CategoryFilter, number>>(
        (acc, option) => {
          acc[option.value] =
            option.value === "all"
              ? (advancedModels?.length ?? 0)
              : (advancedModels?.filter((model) =>
                  matchesCategory(model, option.value),
                ).length ?? 0);
          return acc;
        },
        {} as Record<CategoryFilter, number>,
      ),
    [advancedModels],
  );

  const [categoryIndicator, setCategoryIndicator] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    const bar = categoryBarRef.current;
    const active = categoryButtonRefs.current[categoryFilter];
    if (!bar || !active) return;
    function measure() {
      if (!bar || !active) return;
      const barRect = bar.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const next = {
        left: activeRect.left - barRect.left - bar.clientLeft + bar.scrollLeft,
        top: activeRect.top - barRect.top - bar.clientTop,
        width: activeRect.width,
        height: activeRect.height,
      };
      setCategoryIndicator((prev) =>
        prev.left === next.left &&
        prev.top === next.top &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next,
      );
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [viewMode, categoryFilter, categoryCounts, t]);

  const sortItems = useMemo<ComboboxItem[]>(
    () =>
      SORT_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t.grid.sorts[opt.value],
        group: t.grid.sortGroups[opt.group],
      })),
    [t.grid.sortGroups, t.grid.sorts],
  );

  const advancedFiltered = useMemo(() => {
    const q = appliedQuery.toLowerCase().trim();
    let base =
      providerFilter !== "all"
        ? (advancedModels ?? []).filter(
            (m) =>
              getCanonicalCreatorSlug(m.model_creator.slug) === providerFilter,
          )
        : (advancedModels ?? []);
    if (categoryFilter !== "all") {
      base = base.filter((m) => matchesCategory(m, categoryFilter));
    }
    base = base.filter((model) =>
      matchesWeightAccess(isOpenWeightsModel(model), weightAccessFilter),
    );
    if (q) {
      base = base.filter((model) => matchesSearch(model, q));
    }
    return sortAdvancedModels(base, sort);
  }, [
    advancedModels,
    appliedQuery,
    sort,
    providerFilter,
    weightAccessFilter,
    categoryFilter,
  ]);

  const normalRanked = useMemo(
    () =>
      sortHomeModels(
        models.filter((model) => hasNormalRankingValue(model, normalRanking)),
        normalRanking,
      ).map((model, index) => ({ model, rank: index + 1 })),
    [models, normalRanking],
  );

  const normalFiltered = useMemo(() => {
    const q = appliedQuery.toLowerCase().trim();
    return normalRanked.filter(({ model }) => {
      if (
        providerFilter !== "all" &&
        getCanonicalCreatorSlug(model.model_creator.slug) !== providerFilter
      ) {
        return false;
      }
      if (!matchesWeightAccess(model.is_open_weights, weightAccessFilter)) {
        return false;
      }
      return matchesSearch(model, q);
    });
  }, [normalRanked, appliedQuery, providerFilter, weightAccessFilter]);

  const activeLength =
    viewMode === "normal" ? normalFiltered.length : advancedFiltered.length;
  const activeTotal =
    viewMode === "normal"
      ? normalRanked.length
      : (advancedModels?.length ?? models.length);
  const visibleModels = advancedFiltered.slice(0, visibleCount);
  const visibleRanked = normalFiltered.slice(0, visibleCount);
  const hasMore = visibleCount < activeLength;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((v) => Math.min(v + BATCH, activeLength));
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, activeLength, visibleCount]);

  if (models.length === 0) {
    return (
      <div
        role="status"
        className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 text-center"
      >
        <Blocks className="size-8 text-muted-foreground" />
        <div className="flex max-w-md flex-col gap-1">
          <p className="font-medium">{t.grid.unavailableTitle}</p>
          <p className="text-sm text-muted-foreground">
            {t.grid.unavailableDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {t.grid.viewModes.label}
          </p>
          <p className="sr-only sm:mt-0.5 sm:not-sr-only sm:text-sm">
            {viewMode === "normal"
              ? t.grid.viewModes.normalDescription
              : t.grid.viewModes.advancedDescription}
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={changeViewMode}
          variant="outline"
          size="lg"
          spacing={0}
          aria-label={t.grid.viewModes.label}
          className="w-full sm:w-auto"
        >
          <ToggleGroupItem
            value="normal"
            className="touch-target flex-1 px-4 sm:min-w-24 sm:flex-none"
          >
            {t.grid.viewModes.normal}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="advanced"
            className="touch-target flex-1 px-4 sm:min-w-24 sm:flex-none"
          >
            {t.grid.viewModes.advanced}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {viewMode === "normal" ? (
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-sm font-medium">{t.grid.ranking.label}</p>
            <p className="sr-only">{t.grid.ranking.description}</p>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <ToggleGroup
              type="single"
              value={normalRanking}
              onValueChange={(value) => {
                if (value) setNormalRanking(value as NormalRankingKey);
              }}
              variant="outline"
              size="lg"
              aria-label={t.grid.ranking.label}
              className="w-full flex-wrap justify-start sm:w-auto"
            >
              {NORMAL_RANKING_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className="touch-target px-2 sm:px-4"
                >
                  {t.grid.ranking[option.label]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      ) : (
        <div className="relative -mx-4 sm:mx-0">
          <div
            ref={categoryBarRef}
            className="model-category-bar relative flex flex-nowrap items-center gap-1 overflow-x-auto px-4 py-1 sm:flex-wrap sm:overflow-x-clip sm:rounded-xl sm:border sm:border-border/60 sm:bg-muted/30 sm:p-1 dark:sm:bg-muted/20"
          >
            <span
              aria-hidden
              className="model-category-indicator pointer-events-none absolute left-0 top-0 hidden rounded-lg border border-border/60 bg-card sm:block"
              style={{
                width: categoryIndicator.width,
                height: categoryIndicator.height,
                transform: `translate3d(${categoryIndicator.left}px, ${categoryIndicator.top}px, 0)`,
              }}
            />
            {CATEGORY_OPTIONS.filter(
              (option) =>
                option.value === "all" || categoryCounts[option.value] > 0,
            ).map((option) => {
              const Icon = option.icon;
              const active = categoryFilter === option.value;
              return (
                <button
                  key={option.value}
                  ref={(node) => {
                    categoryButtonRefs.current[option.value] = node;
                  }}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategoryFilter(option.value)}
                  className={cn(
                    "touch-target relative z-10 inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors sm:h-9",
                    active
                      ? "border-border/70 bg-card text-foreground shadow-sm sm:border-transparent sm:bg-transparent sm:shadow-none"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 transition-colors",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  />
                  <span>{t.grid.categories[option.value]}</span>
                  <span
                    className={cn(
                      "ml-0.5 inline-flex min-w-5 items-center justify-center rounded-md px-1 text-[10px] font-medium tabular-nums transition-colors",
                      active
                        ? "bg-foreground/[0.06] text-foreground/70 dark:bg-foreground/10"
                        : "bg-foreground/[0.04] text-muted-foreground/70 dark:bg-foreground/[0.06]",
                    )}
                  >
                    {categoryCounts[option.value]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-3">
        <div className="col-span-full flex h-11 flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 sm:h-9 dark:bg-input/30">
          <Search className="size-4 text-muted-foreground shrink-0 pointer-events-none" />
          <input
            type="search"
            placeholder={t.grid.search}
            aria-label={t.grid.search}
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="touch-target -mr-2 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t.compare.clear}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Combobox
          items={providerItems}
          value={providerFilter}
          onChange={setProviderFilter}
          placeholder={t.grid.allProviders}
          withSearch
          width="w-full sm:w-52"
        />
        {viewMode === "advanced" && (
          <Combobox
            items={sortItems}
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            placeholder={t.grid.sortBy}
            width="w-full sm:w-56"
          />
        )}
        <Combobox
          items={weightAccessItems}
          value={weightAccessFilter}
          onChange={(value) =>
            setWeightAccessFilter(value as WeightAccessFilter)
          }
          placeholder={t.grid.weightAccess.label}
          width={
            viewMode === "advanced"
              ? "col-span-full w-full sm:w-52"
              : "w-full sm:w-52"
          }
        />
      </div>

      {viewMode === "advanced" && !advancedModels ? (
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 text-center"
        >
          {advancedLoadError ? (
            <>
              <Blocks className="size-7 text-muted-foreground" />
              <div className="flex max-w-md flex-col gap-1">
                <p className="font-medium">{t.grid.unavailableTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {t.grid.unavailableDescription}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  advancedRequestRef.current = null;
                  setAdvancedLoadAttempt((attempt) => attempt + 1);
                }}
              >
                {t.error.retry}
              </Button>
            </>
          ) : (
            <>
              <Loader2
                className={cn(
                  "size-5 text-muted-foreground",
                  advancedLoading && "animate-spin",
                )}
              />
              <p className="text-sm text-muted-foreground">
                {t.grid.loadingDetails}
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Compteur */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {t.grid.results(activeLength, activeTotal)}
            </p>
            {(query ||
              providerFilter !== "all" ||
              weightAccessFilter !== "all" ||
              categoryFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setProviderFilter("all");
                  setWeightAccessFilter("all");
                  setCategoryFilter("all");
                }}
              >
                {t.trust.resetFilters}
              </Button>
            )}
          </div>

          {viewMode === "normal" && (
            <p className="text-xs text-muted-foreground">
              {t.trust.catalogNote}
            </p>
          )}
          {/* Stable keys preserve focus and mounted cards during filtering. */}
          <div ref={resultsRef} aria-busy={query !== appliedQuery}>
            {activeLength > 0 ? (
              <>
                {viewMode === "normal" ? (
                  <ol className="overflow-hidden rounded-xl border border-border/70 bg-card">
                    {visibleRanked.map(({ model, rank }) => (
                      <RankedModelRow
                        key={model.slug}
                        model={model}
                        rank={rank}
                      />
                    ))}
                  </ol>
                ) : (
                  <Suspense
                    fallback={
                      <div
                        role="status"
                        className="flex min-h-48 items-center justify-center"
                      >
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    }
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                      {visibleModels.map((model) => (
                        <div key={model.id} className="model-grid-item">
                          <ModelCard model={model} />
                        </div>
                      ))}
                    </div>
                  </Suspense>
                )}

                <div ref={sentinelRef} className="h-px" />

                {hasMore && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleCount((count) => Math.min(count + BATCH, activeLength))}
                    >
                      {t.grid.showMore}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="model-grid-empty-refresh flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground">{t.grid.noResults}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
