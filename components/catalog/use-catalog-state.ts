import { useEffect, useRef, useState } from "react";
import { DEFAULT_SORT_DIRECTION, type SortKey } from "@/lib/model-grid-logic";
import {
  catalogStateFromSearch,
  sameCatalogSearch,
  searchFromCatalogState,
  type CatalogSearch,
  type CatalogState,
} from "@/lib/catalog-search";

const VIEW_MODE_STORAGE_KEY = "benchsift-model-view-mode";
const URL_QUERY_DELAY_MS = 300;

/**
 * Catalogue controls mirrored in the URL. Typing waits briefly before writing
 * the query; any other change is written at once with history replacement,
 * and an external URL change (such as a link back to "/") resets the controls.
 */
export function useCatalogState(search: CatalogSearch, onSearchChange: (search: CatalogSearch) => void) {
  const [state, setState] = useState<CatalogState>(() => catalogStateFromSearch(search));
  const [urlQuery, setUrlQuery] = useState(state.query);
  const written = useRef(search);
  const initialView = useRef(search.view);

  useEffect(() => {
    if (sameCatalogSearch(search, written.current)) return;
    written.current = search;
    const next = catalogStateFromSearch(search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(next);
    setUrlQuery(next.query);
  }, [search]);

  // The last explicit choice of mode is remembered, unless the URL names one.
  useEffect(() => {
    if (initialView.current) return;
    try {
      const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (stored === "advanced" || stored === "nerd") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState((current) => ({ ...current, viewMode: "advanced" }));
        // "nerd" was the former name of Advanced mode.
        if (stored === "nerd") localStorage.setItem(VIEW_MODE_STORAGE_KEY, "advanced");
      }
    } catch {
      // Normal mode stays available when storage is blocked.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setUrlQuery(state.query), URL_QUERY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [state.query]);

  useEffect(() => {
    const next = searchFromCatalogState({ ...state, query: urlQuery });
    if (sameCatalogSearch(next, written.current)) return;
    written.current = next;
    onSearchChange(next);
    // `state.query` is written through the debounced `urlQuery` instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery, state.viewMode, state.ranking, state.sort, state.direction, state.provider, state.weights, state.availability, state.category, state.minScore, state.maxPrice, state.minContext, state.minSpeed, state.reasoning, onSearchChange]);

  function update<K extends keyof CatalogState>(key: K, value: CatalogState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  /**
   * Choosing the active sort again reverses it; another sort starts in its
   * natural direction (best value first).
   */
  function sortBy(sort: SortKey, { toggle = false }: { toggle?: boolean } = {}) {
    setState((current) => ({
      ...current,
      sort,
      direction: toggle && current.sort === sort
        ? current.direction === "asc" ? "desc" : "asc"
        : DEFAULT_SORT_DIRECTION[sort],
    }));
  }

  function reverseSort() {
    setState((current) => ({ ...current, direction: current.direction === "asc" ? "desc" : "asc" }));
  }

  function setViewMode(viewMode: CatalogState["viewMode"]) {
    // Model types exist only in Advanced mode, so Normal mode always shows all of them.
    setState((current) => ({ ...current, viewMode, category: viewMode === "normal" ? "all" : current.category }));
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    } catch {
      // The choice still applies to this visit.
    }
  }

  /** Clears the filters; the filter sheet also restores the default ordering, the results bar the search. */
  function resetFilters({ query = false, ordering = false }: { query?: boolean; ordering?: boolean } = {}) {
    setState((current) => ({
      ...current,
      query: query ? "" : current.query,
      provider: "all",
      weights: "all",
      availability: "all",
      category: "all",
      minScore: null,
      maxPrice: null,
      minContext: null,
      minSpeed: null,
      reasoning: "all",
      sort: ordering ? "intelligence" : current.sort,
      direction: ordering ? DEFAULT_SORT_DIRECTION.intelligence : current.direction,
      ranking: ordering ? "intelligence" : current.ranking,
    }));
  }

  const thresholdCount = state.viewMode === "advanced"
    ? [state.minScore, state.maxPrice, state.minContext, state.minSpeed].filter((value) => value !== null).length
      + (state.reasoning === "all" ? 0 : 1)
      + (state.availability === "all" ? 0 : 1)
    : 0;
  const activeFilterCount = [state.provider, state.weights, state.category].filter((value) => value !== "all").length + thresholdCount;

  return { state, update, sortBy, reverseSort, setViewMode, resetFilters, activeFilterCount };
}
