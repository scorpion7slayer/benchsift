import { useEffect, useMemo, useRef, useState } from "react";
import { Check, GitCompareArrows, Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { getProviderKey } from "@/lib/provider-map";
import { useCompare } from "@/lib/compare-store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { usePageTransition } from "@/components/page-transition-provider";

export interface CompareMenuModel {
  slug: string;
  name: string;
  providerName: string;
  providerSlug: string;
}

export function CompareMenu({
  models,
  variant = "default",
}: {
  models: CompareMenuModel[];
  variant?: "default" | "bubble";
}) {
  const { push } = usePageTransition();
  const { t } = useI18n();
  const { selected, toggle, clear, isSelected, isFull, lastChange } = useCompare();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectionSignature = selected.join("|");
  const isBubble = variant === "bubble";
  const compareHref = selected.length > 0 ? `/compare?models=${selected.join(",")}` : "/compare";

  const selectedModels = useMemo(() => {
    const bySlug = new Map(models.map((model) => [model.slug, model]));
    return selected.map((slug) => bySlug.get(slug)).filter(Boolean) as CompareMenuModel[];
  }, [models, selected]);

  const filteredModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    const candidates = q
      ? models.filter((model) =>
          [model.name, model.providerName, model.slug]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : models;

    return candidates.slice(0, 8);
  }, [models, query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 20);
    return () => window.clearTimeout(id);
  }, [open]);

  function openComparison() {
    push(compareHref);
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      {isBubble ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={t.compare.compare}
          className={cn(
            "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 bg-foreground text-background shadow-lg outline-none transition-all duration-200 hover:bg-foreground/90 hover:shadow-xl focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px motion-safe:hover:-translate-y-0.5",
            open && "scale-[0.96] bg-foreground/90 shadow-md"
          )}
        >
          <GitCompareArrows
            className={cn("size-4 transition-transform duration-200", open && "rotate-12")}
          />
          {selected.length > 0 && (
            <Badge
              variant="default"
              className={cn(
                "absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px] tabular-nums transition-transform duration-200",
                open && "scale-105"
              )}
            >
              {selected.length}
            </Badge>
          )}
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openComparison}
          className="transition-all duration-200 motion-safe:hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <GitCompareArrows data-icon="inline-start" />
          {t.compare.compare}
          {selected.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-4 px-1.5 text-[10px] transition-transform duration-200"
            >
              {selected.length}
            </Badge>
          )}
        </Button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label={t.compare.title}
          className={cn(
            "compare-menu-popover z-50 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg",
            isBubble
              ? "absolute left-0 top-12 w-[calc(100vw-2rem)] max-w-88"
              : "fixed left-4 right-4 top-24 sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 sm:w-88"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.compare.title}</p>
              <p className="text-xs text-muted-foreground">
                {selected.length} {t.compare.select}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div
            key={`compare-selection-${selectionSignature || "empty"}`}
            className="compare-selection-tray mt-3 flex h-8 items-center gap-1.5 overflow-x-auto overflow-y-hidden"
          >
            {selectedModels.map((model) => (
              <button
                key={model.slug}
                type="button"
                onClick={() => toggle(model.slug)}
                className={cn(
                  "compare-chip inline-flex max-w-36 shrink-0 items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted",
                  lastChange?.slug === model.slug && lastChange.type === "add" && "compare-chip-added"
                )}
              >
                <span className="truncate">{model.name}</span>
                <X className="size-3 text-muted-foreground" />
              </button>
            ))}
          </div>

          <div className="compare-search-field mt-3 flex h-8 items-center gap-2 rounded-md border bg-background px-2 text-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.grid.search}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div
            key={`compare-results-${query.trim() || "all"}`}
            className="compare-menu-results mt-2 h-72 overflow-y-auto"
          >
            {filteredModels.map((model, index) => {
              const selectedModel = isSelected(model.slug);
              const disabled = !selectedModel && isFull;

              return (
                <button
                  key={model.slug}
                  type="button"
                  onClick={() => toggle(model.slug)}
                  disabled={disabled}
                  className={cn(
                    "compare-menu-result flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
                    selectedModel && "compare-menu-result-selected bg-muted"
                  )}
                  style={{ animationDelay: `${Math.min(index, 7) * 32}ms` }}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ModelProviderIcon provider={getProviderKey(model.providerSlug)} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{model.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {model.providerName}
                    </span>
                  </span>
                  {selectedModel ? (
                    <Check className="size-4 text-primary transition-transform duration-200" />
                  ) : (
                    <Plus className="size-4 text-muted-foreground transition-transform duration-200" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clear}
              disabled={selected.length === 0}
            >
              {t.compare.clear}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={openComparison}
            >
              <GitCompareArrows data-icon="inline-start" />
              {t.compare.compare}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
