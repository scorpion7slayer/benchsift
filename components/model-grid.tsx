import { useState, useMemo, useEffect, useId, useLayoutEffect, useRef } from "react";
import {
  Search, X, Loader2, ChevronDown, Check, Type, ImageIcon, AudioLines,
  Video, ArrowUpDown, Mic, Captions, Blocks, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { ModelCard } from "@/components/model-card";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isOpenWeightsModel, outputModalities, textMetricValue } from "@/lib/model-metrics";
import { getCanonicalCreatorSlug, getCreatorDisplayName } from "@/lib/provider-map";
import type { LLMModel } from "@/lib/api";

type SortKey =
  | "intelligence" | "coding" | "math"
  | "gpqa" | "mmlu_pro" | "hle" | "livecodebench" | "math_500" | "aime_25"
  | "speed" | "ttft"
  | "openrouter_popular"
  | "open_weights"
  | "price_asc" | "price_desc"
  | "newest" | "name";

type CategoryFilter =
  | "all"
  | "new"
  | "text"
  | "image"
  | "embeddings"
  | "audio"
  | "video"
  | "rerank"
  | "speech"
  | "transcription";

type SortGroup =
  | "indices"
  | "benchmarks"
  | "performance"
  | "openrouter"
  | "filters"
  | "pricing"
  | "general";

interface SortOption {
  value: SortKey;
  group: SortGroup;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "intelligence",  group: "indices" },
  { value: "coding",        group: "indices" },
  { value: "math",          group: "indices" },
  { value: "gpqa",          group: "benchmarks" },
  { value: "mmlu_pro",      group: "benchmarks" },
  { value: "hle",           group: "benchmarks" },
  { value: "livecodebench", group: "benchmarks" },
  { value: "math_500",      group: "benchmarks" },
  { value: "aime_25",       group: "benchmarks" },
  { value: "speed",         group: "performance" },
  { value: "ttft",          group: "performance" },
  { value: "openrouter_popular", group: "openrouter" },
  { value: "open_weights",  group: "filters" },
  { value: "price_asc",     group: "pricing" },
  { value: "price_desc",    group: "pricing" },
  { value: "newest",        group: "general" },
  { value: "name",          group: "general" },
];

const CATEGORY_OPTIONS: Array<{ value: CategoryFilter; icon: LucideIcon }> = [
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

function sortablePrice(model: LLMModel): number | null {
  if (model.pricing.price_1m_blended_3_to_1 != null) {
    return model.pricing.price_1m_blended_3_to_1;
  }
  const prices = (model.pricing.openrouter_display_prices ?? [])
    .map((row) => row.price)
    .filter((price): price is number => Number.isFinite(price));
  return prices.length > 0 ? Math.min(...prices) : null;
}

function sortModels(models: LLMModel[], key: SortKey): LLMModel[] {
  return [...models].sort((a, b) => {
    switch (key) {
      case "intelligence":
        return (textMetricValue(b, "artificial_analysis_intelligence_index") ?? -1) - (textMetricValue(a, "artificial_analysis_intelligence_index") ?? -1);
      case "coding":
        return (textMetricValue(b, "artificial_analysis_coding_index") ?? -1) - (textMetricValue(a, "artificial_analysis_coding_index") ?? -1);
      case "math":
        return (textMetricValue(b, "artificial_analysis_math_index") ?? -1) - (textMetricValue(a, "artificial_analysis_math_index") ?? -1);
      case "gpqa":
        return (textMetricValue(b, "gpqa") ?? -1) - (textMetricValue(a, "gpqa") ?? -1);
      case "mmlu_pro":
        return (textMetricValue(b, "mmlu_pro") ?? -1) - (textMetricValue(a, "mmlu_pro") ?? -1);
      case "hle":
        return (textMetricValue(b, "hle") ?? -1) - (textMetricValue(a, "hle") ?? -1);
      case "livecodebench":
        return (textMetricValue(b, "livecodebench") ?? -1) - (textMetricValue(a, "livecodebench") ?? -1);
      case "math_500":
        return (textMetricValue(b, "math_500") ?? -1) - (textMetricValue(a, "math_500") ?? -1);
      case "aime_25":
        return (textMetricValue(b, "aime_25") ?? -1) - (textMetricValue(a, "aime_25") ?? -1);
      case "speed":
        return (b.median_output_tokens_per_second ?? -1) - (a.median_output_tokens_per_second ?? -1);
      case "ttft":
        return (a.median_time_to_first_token_seconds ?? Infinity) - (b.median_time_to_first_token_seconds ?? Infinity);
      case "openrouter_popular":
        return (a.openrouter_weekly_rank ?? Infinity) - (b.openrouter_weekly_rank ?? Infinity);
      case "open_weights":
        return (textMetricValue(b, "artificial_analysis_intelligence_index") ?? -1) - (textMetricValue(a, "artificial_analysis_intelligence_index") ?? -1);
      case "price_asc":
        return (sortablePrice(a) ?? Infinity) - (sortablePrice(b) ?? Infinity);
      case "price_desc":
        return (sortablePrice(b) ?? -1) - (sortablePrice(a) ?? -1);
      case "newest":
        if (!a.release_date && !b.release_date) return 0;
        if (!a.release_date) return 1;
        if (!b.release_date) return -1;
        return b.release_date.localeCompare(a.release_date);
      case "name":
        return a.name.localeCompare(b.name);
    }
  });
}

function hasOutputModality(model: LLMModel, modality: string): boolean {
  const out = outputModalities(model);
  return out.has(modality);
}

function matchesCategory(model: LLMModel, category: CategoryFilter): boolean {
  if (category === "all") return true;
  if (category === "new") {
    if (!model.release_date) return false;
    // eslint-disable-next-line react-hooks/purity
    return new Date(model.release_date) >= new Date(Date.now() - NEW_MODELS_DAYS * 24 * 60 * 60 * 1000);
  }
  if (category === "text") return hasOutputModality(model, "text");
  if (category === "image") return hasOutputModality(model, "image");
  if (category === "audio") return outputModalities(model).has("audio") || outputModalities(model).has("speech");
  if (category === "video") return hasOutputModality(model, "video");
  if (category === "embeddings") return outputModalities(model).has("embeddings");
  if (category === "rerank") return outputModalities(model).has("rerank");
  if (category === "speech") return outputModalities(model).has("speech");
  if (category === "transcription") return outputModalities(model).has("transcription");
  return true;
}

// Generic combobox / Combobox générique

interface ComboboxItem {
  value: string;
  label: string;
  group?: string;
}

function Combobox({
  items,
  value,
  onChange,
  placeholder,
  withSearch = false,
  width = "w-full sm:w-52",
}: {
  items: ComboboxItem[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  withSearch?: boolean;
  width?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const filtered = useMemo(
    () =>
      search.trim()
        ? items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
        : items,
    [items, search]
  );

  // Display groups / Groupes pour l'affichage
  const groups = useMemo(() => {
    const map = new Map<string, ComboboxItem[]>();
    filtered.forEach((item) => {
      const g = item.group ?? "";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    });
    return map;
  }, [filtered]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open || !withSearch) return;
    const id = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 10);
    return () => window.clearTimeout(id);
  }, [open, withSearch]);

  const selectedLabel = items.find((i) => i.value === value)?.label ?? placeholder;

  return (
    <div ref={ref} className={`relative ${width}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        className="touch-target flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted/70 sm:h-9"
      >
        <span className="truncate text-left flex-1">{selectedLabel}</span>
        <ChevronDown
          className={`size-4 shrink-0 opacity-50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={placeholder}
          className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border bg-popover shadow-lg animate-in fade-in-0 slide-in-from-top-1 duration-150"
        >
          {withSearch && (
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={placeholder}
                  aria-label={placeholder}
                  autoComplete="off"
                  className="w-full h-8 pl-8 pr-3 text-sm bg-background border rounded-md outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {[...groups.entries()].map(([group, groupItems]) => (
              <div key={group}>
                {group && (
                  <p className="px-3 pt-2.5 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                )}
                {groupItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="option"
                    aria-selected={value === item.value}
                    onClick={() => { onChange(item.value); setOpen(false); setSearch(""); }}
                    className={`flex min-h-10 w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted/60 ${value === item.value ? "font-medium" : ""}`}
                  >
                    <span>{item.label}</span>
                    {value === item.value && <Check className="size-3.5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">{t.grid.noOptions}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ModelGrid

const BATCH = 32;

const NEW_MODELS_DAYS = 30;
const SEARCH_DEBOUNCE_MS = 120;
type GridMotion = "filter" | "search-in";

export function ModelGrid({ models }: { models: LLMModel[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("intelligence");
  const [providerFilter, setProviderFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const [gridKey, setGridKey] = useState(0);
  const [gridMotion, setGridMotion] = useState<GridMotion>("filter");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const categoryBarRef = useRef<HTMLDivElement>(null);
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isFirstRender = useRef(true);
  const previousControlsRef = useRef({
    debouncedQuery: "",
    sort: "intelligence" as SortKey,
    providerFilter: "all",
    categoryFilter: "all" as CategoryFilter,
  });

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const previousControls = previousControlsRef.current;
    const searchChanged = previousControls.debouncedQuery !== debouncedQuery;
    previousControlsRef.current = { debouncedQuery, sort, providerFilter, categoryFilter };

    if (isFirstRender.current) {
      isFirstRender.current = false;
      setAppliedQuery(debouncedQuery);
      return;
    }

    setAppliedQuery(debouncedQuery);
    setVisibleCount(BATCH);
    setGridMotion(searchChanged ? "search-in" : "filter");
    setGridKey((k) => k + 1);
  }, [debouncedQuery, sort, providerFilter, categoryFilter]);

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
    [providers, t.grid.allProviders]
  );

  const categoryCounts = useMemo(
    () =>
      CATEGORY_OPTIONS.reduce<Record<CategoryFilter, number>>((acc, option) => {
        acc[option.value] = option.value === "all"
          ? models.length
          : models.filter((model) => matchesCategory(model, option.value)).length;
        return acc;
      }, {} as Record<CategoryFilter, number>),
    [models]
  );

  const [categoryIndicator, setCategoryIndicator] = useState({ left: 0, top: 0, width: 0, height: 0, row: 0 });

  useLayoutEffect(() => {
    const bar = categoryBarRef.current;
    const active = categoryButtonRefs.current[categoryFilter];
    if (!bar || !active) return;
    function measure() {
      if (!bar || !active) return;
      const barRect = bar.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const next = {
        left: activeRect.left - barRect.left,
        top: activeRect.top - barRect.top,
        width: activeRect.width,
        height: activeRect.height,
        row: Math.round(activeRect.top - barRect.top),
      };
      setCategoryIndicator((prev) =>
        prev.left === next.left && prev.top === next.top && prev.width === next.width && prev.height === next.height && prev.row === next.row
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
  }, [categoryFilter, categoryCounts]);

  const sortItems = useMemo<ComboboxItem[]>(
    () =>
      SORT_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t.grid.sorts[opt.value],
        group: t.grid.sortGroups[opt.group],
      })),
    [t.grid.sortGroups, t.grid.sorts]
  );

  const filtered = useMemo(() => {
    const q = appliedQuery.toLowerCase().trim();
    let base =
      providerFilter !== "all"
        ? models.filter(
            (m) => getCanonicalCreatorSlug(m.model_creator.slug) === providerFilter,
          )
        : models;
    if (categoryFilter !== "all") {
      base = base.filter((m) => matchesCategory(m, categoryFilter));
    }
    if (sort === "open_weights") {
      base = base.filter(isOpenWeightsModel);
    }
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      base = base.filter((m) => {
        const haystack = [
          m.name.toLowerCase(),
          m.model_creator.name.toLowerCase(),
          // slug with hyphens replaced by spaces so "nemotron" finds "nvidia-nemotron-..."
          m.slug.toLowerCase().replace(/-/g, " "),
        ].join(" ");
        return tokens.every((token) => haystack.includes(token));
      });
    }
    return sortModels(base, sort);
  }, [models, appliedQuery, sort, providerFilter, categoryFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((v) => Math.min(v + BATCH, filtered.length));
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, filtered.length]);

  if (models.length === 0) {
    return (
      <div
        role="status"
        className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 text-center"
      >
        <Blocks className="size-8 text-muted-foreground" />
        <div className="flex max-w-md flex-col gap-1">
          <p className="font-medium">{t.grid.unavailableTitle}</p>
          <p className="text-sm text-muted-foreground">{t.grid.unavailableDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <div
          ref={categoryBarRef}
          className="model-category-bar relative flex flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1 shadow-sm dark:bg-muted/20"
        >
          <span
            aria-hidden
            key={`row-${categoryIndicator.row}`}
            className="model-category-indicator pointer-events-none absolute rounded-lg border border-border/60 bg-card shadow-sm ring-1 ring-foreground/[0.03]"
            style={{
              width: categoryIndicator.width,
              height: categoryIndicator.height,
              transform: `translate3d(${categoryIndicator.left}px, ${categoryIndicator.top}px, 0)`,
            }}
          />
          {CATEGORY_OPTIONS.filter((option) => option.value === "all" || categoryCounts[option.value] > 0).map((option) => {
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
                  "touch-target relative z-10 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 transition-colors",
                    active ? "text-cyan-500 dark:text-cyan-400" : "text-muted-foreground/80"
                  )}
                />
                <span>{t.grid.categories[option.value]}</span>
                <span
                  className={cn(
                    "ml-0.5 inline-flex min-w-5 items-center justify-center rounded-md px-1 text-[10px] font-medium tabular-nums transition-colors",
                    active
                      ? "bg-foreground/[0.06] text-foreground/70 dark:bg-foreground/10"
                      : "bg-foreground/[0.04] text-muted-foreground/70 dark:bg-foreground/[0.06]"
                  )}
                >
                  {categoryCounts[option.value]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 sm:h-9 dark:bg-input/30">
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
        <Combobox
          items={sortItems}
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          placeholder={t.grid.sortBy}
          width="w-full sm:w-56"
        />
      </div>

      {/* Compteur */}
      <div
        className={cn(
          "flex items-center justify-between",
          gridMotion === "search-in" && "model-grid-search-in"
        )}
      >
        <p className="text-sm text-muted-foreground">
          {t.grid.results(filtered.length, models.length)}
        </p>
      </div>

      {/* Grille avec animation */}
      {filtered.length > 0 ? (
        <>
          <div
            key={`${gridKey}-${gridMotion}`}
            className={cn(
              "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              gridMotion === "search-in" && "model-grid-search-in",
              gridMotion === "filter" && "model-grid-filter-refresh"
            )}
          >
            {visible.map((model, i) => (
              <div
                key={model.id}
                className={cn(
                  "model-grid-item",
                  gridMotion === "filter" && "model-grid-filter-item",
                )}
                style={gridMotion === "filter" ? { animationDelay: `${Math.min(i, 12) * 16}ms` } : undefined}
              >
                <ModelCard model={model} />
              </div>
            ))}
          </div>

          <div ref={sentinelRef} className="h-px" />

          {hasMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      ) : (
        <div className="model-grid-empty-refresh flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">{t.grid.noResults}</p>
        </div>
      )}
    </div>
  );
}
