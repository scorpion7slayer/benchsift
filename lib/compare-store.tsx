"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const MAX_COMPARE = 4;
const STORAGE_KEY = "compare-models";

interface CompareCtx {
  selected: string[];
  toggle: (slug: string) => void;
  clear: () => void;
  isSelected: (slug: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareCtx>({
  selected: [],
  toggle: () => {},
  clear: () => {},
  isSelected: () => false,
  isFull: false,
});

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setSelected(JSON.parse(stored));
    } catch {}
  }, []);

  const toggle = useCallback((slug: string) => {
    setSelected((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < MAX_COMPARE
        ? [...prev, slug]
        : prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelected([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      selected,
      toggle,
      clear,
      isSelected: (s: string) => selected.includes(s),
      isFull: selected.length >= MAX_COMPARE,
    }),
    [selected, toggle, clear]
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
