"use client";

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
  clear: () => void;
  isSelected: (slug: string) => boolean;
  isFull: boolean;
  lastChange: CompareChange | null;
}

const CompareContext = createContext<CompareCtx>({
  selected: [],
  toggle: () => {},
  clear: () => {},
  isSelected: () => false,
  isFull: false,
  lastChange: null,
});

interface CompareState {
  selected: string[];
  lastChange: CompareChange | null;
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CompareState>({ selected: [], lastChange: null });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setState({ selected: JSON.parse(stored), lastChange: null });
    } catch {}
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

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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

  const clear = useCallback(() => {
    setState({
      selected: [],
      lastChange: { id: Date.now(), type: "clear" },
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const selected = state.selected;
  const lastChange = state.lastChange;

  const value = useMemo(
    () => ({
      selected,
      toggle,
      clear,
      isSelected: (s: string) => selected.includes(s),
      isFull: selected.length >= MAX_COMPARE,
      lastChange,
    }),
    [selected, toggle, clear, lastChange]
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
