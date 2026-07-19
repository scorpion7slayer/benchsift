import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const MAX_COMPARE = 4;
const STORAGE_KEY = "compare-models";

type CompareChange = {
  id: number;
  type: "add" | "remove" | "clear";
  slug?: string;
};

interface CompareCtx {
  selected: string[];
  toggle: (slug: string) => void;
  replace: (slugs: string[]) => void;
  clear: () => void;
  isSelected: (slug: string) => boolean;
  isFull: boolean;
  lastChange: CompareChange | null;
}

const CompareContext = createContext<CompareCtx>({
  selected: [],
  toggle: () => {},
  replace: () => {},
  clear: () => {},
  isSelected: () => false,
  isFull: false,
  lastChange: null,
});

interface CompareState {
  selected: string[];
  lastChange: CompareChange | null;
}

function normalizeSelected(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return [...new Set(
    value
      .filter((slug): slug is string => typeof slug === "string")
      .map((slug) => slug.trim())
      .filter(Boolean),
  )].slice(0, MAX_COMPARE);
}

function persistSelected(selected: string[]) {
  try {
    if (selected.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
  } catch {
    // Storage can be unavailable in private or hardened browsing contexts.
    // Comparison still works for the current session.
  }
}

function sameSelection(left: string[], right: string[]) {
  return left.length === right.length && left.every((slug, index) => slug === right[index]);
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CompareState>({ selected: [], lastChange: null });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) {
        const selected = normalizeSelected(JSON.parse(stored));
        setState({ selected, lastChange: null });
        persistSelected(selected);
      }
    } catch {
      // Remove malformed persisted JSON; storage failures remain best-effort.
      persistSelected([]);
    }
  }, []);

  const toggle = useCallback((slug: string) => {
    setState((prevState) => {
      const selected = prevState.selected;
      const exists = selected.includes(slug);
      const next = exists
        ? selected.filter((s) => s !== slug)
        : selected.length < MAX_COMPARE
        ? [...selected, slug]
        : selected;

      if (next === selected) return prevState;

      persistSelected(next);
      return {
        selected: next,
        lastChange: {
          id: Date.now(),
          type: exists ? "remove" : "add",
          slug,
        },
      };
    });
  }, []);

  const replace = useCallback((slugs: string[]) => {
    const next = normalizeSelected(slugs);
    setState((prevState) => {
      if (sameSelection(prevState.selected, next)) return prevState;

      const added = next.find((slug) => !prevState.selected.includes(slug));
      const removed = prevState.selected.find((slug) => !next.includes(slug));
      persistSelected(next);

      return {
        selected: next,
        lastChange: {
          id: Date.now(),
          type: added ? "add" : next.length === 0 ? "clear" : "remove",
          slug: added ?? removed,
        },
      };
    });
  }, []);

  const clear = useCallback(() => {
    setState({
      selected: [],
      lastChange: { id: Date.now(), type: "clear" },
    });
    persistSelected([]);
  }, []);

  const selected = state.selected;
  const lastChange = state.lastChange;

  const value = useMemo(
    () => ({
      selected,
      toggle,
      replace,
      clear,
      isSelected: (s: string) => selected.includes(s),
      isFull: selected.length >= MAX_COMPARE,
      lastChange,
    }),
    [selected, toggle, replace, clear, lastChange]
  );

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
