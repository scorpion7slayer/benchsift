"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Loader2, ChevronDown, Check } from "lucide-react";
import { ModelCard } from "@/components/model-card";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { LLMModel } from "@/lib/api";

type SortKey =
  | "intelligence" | "coding" | "math"
  | "gpqa" | "mmlu_pro" | "hle" | "livecodebench" | "math_500" | "aime_25"
  | "speed" | "ttft"
  | "price_asc" | "price_desc"
  | "newest" | "name";

interface SortOption {
  value: SortKey;
  group: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "intelligence",  group: "Indices AA" },
  { value: "coding",        group: "Indices AA" },
  { value: "math",          group: "Indices AA" },
  { value: "gpqa",          group: "Benchmarks" },
  { value: "mmlu_pro",      group: "Benchmarks" },
  { value: "hle",           group: "Benchmarks" },
  { value: "livecodebench", group: "Benchmarks" },
  { value: "math_500",      group: "Benchmarks" },
  { value: "aime_25",       group: "Benchmarks" },
  { value: "speed",         group: "Performance" },
  { value: "ttft",          group: "Performance" },
  { value: "price_asc",     group: "Prix" },
  { value: "price_desc",    group: "Prix" },
  { value: "newest",        group: "Général" },
  { value: "name",          group: "Général" },
];

function sortModels(models: LLMModel[], key: SortKey): LLMModel[] {
  return [...models].sort((a, b) => {
    switch (key) {
      case "intelligence":
        return (b.evaluations.artificial_analysis_intelligence_index ?? -1) - (a.evaluations.artificial_analysis_intelligence_index ?? -1);
      case "coding":
        return (b.evaluations.artificial_analysis_coding_index ?? -1) - (a.evaluations.artificial_analysis_coding_index ?? -1);
      case "math":
        return (b.evaluations.artificial_analysis_math_index ?? -1) - (a.evaluations.artificial_analysis_math_index ?? -1);
      case "gpqa":
        return (b.evaluations.gpqa ?? -1) - (a.evaluations.gpqa ?? -1);
      case "mmlu_pro":
        return (b.evaluations.mmlu_pro ?? -1) - (a.evaluations.mmlu_pro ?? -1);
      case "hle":
        return (b.evaluations.hle ?? -1) - (a.evaluations.hle ?? -1);
      case "livecodebench":
        return (b.evaluations.livecodebench ?? -1) - (a.evaluations.livecodebench ?? -1);
      case "math_500":
        return (b.evaluations.math_500 ?? -1) - (a.evaluations.math_500 ?? -1);
      case "aime_25":
        return (b.evaluations.aime_25 ?? -1) - (a.evaluations.aime_25 ?? -1);
      case "speed":
        return (b.median_output_tokens_per_second ?? -1) - (a.median_output_tokens_per_second ?? -1);
      case "ttft":
        return (a.median_time_to_first_token_seconds ?? Infinity) - (b.median_time_to_first_token_seconds ?? Infinity);
      case "price_asc":
        return (a.pricing.price_1m_blended_3_to_1 ?? Infinity) - (b.pricing.price_1m_blended_3_to_1 ?? Infinity);
      case "price_desc":
        return (b.pricing.price_1m_blended_3_to_1 ?? -1) - (a.pricing.price_1m_blended_3_to_1 ?? -1);
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (open && withSearch) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open, withSearch]);

  const selectedLabel = items.find((i) => i.value === value)?.label ?? placeholder;

  return (
    <div ref={ref} className={`relative ${width}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full h-9 px-3 py-2 text-sm border rounded-md bg-card shadow-sm hover:bg-muted/70 transition-colors gap-2"
      >
        <span className="truncate text-left flex-1">{selectedLabel}</span>
        <ChevronDown
          className={`size-4 shrink-0 opacity-50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden animate-in fade-in-0 slide-in-from-top-1 duration-150">
          {withSearch && (
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
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
                    onClick={() => { onChange(item.value); setOpen(false); setSearch(""); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/60 transition-colors ${value === item.value ? "font-medium" : ""}`}
                  >
                    <span>{item.label}</span>
                    {value === item.value && <Check className="size-3.5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-center text-muted-foreground">Aucun résultat</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ModelGrid

const BATCH = 48;

const NEW_MODELS_DAYS = 30;
const SEARCH_SWAP_MS = 520;
type GridMotion = "filter" | "search-out" | "search-in";

export function ModelGrid({ models }: { models: LLMModel[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("intelligence");
  const [providerFilter, setProviderFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "new">("all");
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const [gridKey, setGridKey] = useState(0);
  const [gridMotion, setGridMotion] = useState<GridMotion>("filter");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const searchSwapTimerRef = useRef<number | null>(null);
  const previousControlsRef = useRef({
    debouncedQuery: "",
    sort: "intelligence" as SortKey,
    providerFilter: "all",
    categoryFilter: "all" as "all" | "new",
  });

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (searchSwapTimerRef.current) {
      window.clearTimeout(searchSwapTimerRef.current);
      searchSwapTimerRef.current = null;
    }

    const previousControls = previousControlsRef.current;
    const searchChanged = previousControls.debouncedQuery !== debouncedQuery;
    previousControlsRef.current = { debouncedQuery, sort, providerFilter, categoryFilter };

    if (isFirstRender.current) {
      isFirstRender.current = false;
      setAppliedQuery(debouncedQuery);
      return;
    }

    if (searchChanged) {
      setGridMotion("search-out");
      searchSwapTimerRef.current = window.setTimeout(() => {
        setAppliedQuery(debouncedQuery);
        setVisibleCount(BATCH);
        setGridMotion("search-in");
        setGridKey((k) => k + 1);
        searchSwapTimerRef.current = null;
      }, SEARCH_SWAP_MS);
      return;
    }

    setAppliedQuery(debouncedQuery);
    setVisibleCount(BATCH);
    setGridMotion("filter");
    setGridKey((k) => k + 1);
  }, [debouncedQuery, sort, providerFilter, categoryFilter]);

  useEffect(() => {
    return () => {
      if (searchSwapTimerRef.current) window.clearTimeout(searchSwapTimerRef.current);
    };
  }, []);

  const providers = useMemo(() => {
    const unique = new Map<string, string>();
    models.forEach((m) => unique.set(m.model_creator.slug, m.model_creator.name));
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [models]);

  const providerItems = useMemo<ComboboxItem[]>(
    () => [
      { value: "all", label: t.grid.allProviders },
      ...providers.map(([slug, name]) => ({ value: slug, label: name })),
    ],
    [providers, t.grid.allProviders]
  );

  const categoryItems = useMemo<ComboboxItem[]>(
    () => [
      { value: "all", label: t.grid.allModels },
      { value: "new", label: t.grid.newModels },
    ],
    [t.grid.allModels, t.grid.newModels]
  );

  const sortItems = useMemo<ComboboxItem[]>(
    () =>
      SORT_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t.grid.sorts[opt.value],
        group: opt.group,
      })),
    [t.grid.sorts]
  );

  const filtered = useMemo(() => {
    const q = appliedQuery.toLowerCase().trim();
    let base =
      providerFilter !== "all"
        ? models.filter((m) => m.model_creator.slug === providerFilter)
        : models;
    if (categoryFilter === "new") {
      // eslint-disable-next-line react-hooks/purity
      const cutoff = new Date(Date.now() - NEW_MODELS_DAYS * 24 * 60 * 60 * 1000);
      base = base.filter((m) => m.release_date && new Date(m.release_date) >= cutoff);
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

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 items-center h-8 gap-2 rounded-lg border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
          <Search className="size-4 text-muted-foreground shrink-0 pointer-events-none" />
          <input
            placeholder={t.grid.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Effacer"
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
          items={categoryItems}
          value={categoryFilter}
          onChange={(v) => setCategoryFilter(v as "all" | "new")}
          placeholder={t.grid.allModels}
          width="w-full sm:w-48"
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
          gridMotion === "search-out" && "model-grid-search-out",
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
              gridMotion === "search-out" && "model-grid-search-out",
              gridMotion === "search-in" && "model-grid-search-in",
              gridMotion === "filter" && "model-grid-filter-refresh"
            )}
          >
            {visible.map((model, i) => (
              <div
                key={model.id}
                className={gridMotion === "filter" ? "model-grid-filter-item" : undefined}
                style={gridMotion === "filter" ? { animationDelay: `${Math.min(i, 24) * 25}ms` } : undefined}
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
