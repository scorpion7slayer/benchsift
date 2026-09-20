import { useId, useMemo, useRef, useState } from "react";
import { Search, X } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { getModelProviderKey } from "@/lib/provider-map";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { CompareModelOption } from "@/lib/compare-model";

export function CompareModelSearch({
  options,
  selected,
  onAdd,
  disabled,
  inputRef,
}: {
  options: CompareModelOption[];
  selected: string[];
  onAdd: (slug: string) => void;
  disabled: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { t } = useI18n();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const results = useMemo(
    () =>
      options
        .filter(
          (model) =>
            !selected.includes(model.slug) &&
            `${model.name} ${model.model_creator.name}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
        )
        .slice(0, 8),
    [options, selected, query],
  );
  const activeIndex = Math.min(active, results.length - 1);
  const expanded = open && !disabled;
  function choose(slug: string) {
    setQuery("");
    setOpen(false);
    setActive(-1);
    onAdd(slug);
  }
  function move(index: number) {
    const next = (index + results.length) % results.length;
    setActive(next);
    document
      .getElementById(`${id}-${next}`)
      ?.scrollIntoView({ block: "nearest" });
  }
  return (
    <div
      ref={root}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Search
        className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        role="combobox"
        aria-label={t.compare.addModel}
        aria-expanded={expanded}
        aria-controls={expanded ? id : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          expanded && activeIndex >= 0 ? `${id}-${activeIndex}` : undefined
        }
        disabled={disabled}
        autoComplete="off"
        value={query}
        placeholder={t.compareWorkspace.search}
        className="h-11 bg-background pl-9 pr-11"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            event.preventDefault();
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            if (results.length)
              move(
                activeIndex < 0
                  ? event.key === "ArrowDown"
                    ? 0
                    : results.length - 1
                  : activeIndex + (event.key === "ArrowDown" ? 1 : -1),
              );
          }
          if (event.key === "Enter" && expanded && results[activeIndex]) {
            event.preventDefault();
            choose(results[activeIndex].slug);
          }
        }}
      />
      {query && (
        <button
          type="button"
          className="absolute right-0 top-0 flex size-11 items-center justify-center"
          aria-label={t.compare.clear}
          onClick={() => {
            setQuery("");
            setActive(-1);
            inputRef.current?.focus();
          }}
        >
          <X className="size-4" />
        </button>
      )}
      {expanded && (
        <div className="compare-picker absolute inset-x-0 top-full z-40 mt-2 rounded-xl border bg-popover text-popover-foreground shadow-lg">
          <div
            id={id}
            role="listbox"
            aria-label={t.compare.addModel}
            className="max-h-80 overflow-y-auto p-1"
          >
            {results.map((model, index) => (
              <button
                id={`${id}-${index}`}
                key={model.slug}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(model.slug)}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted",
                  activeIndex === index && "bg-muted",
                )}
              >
                <ModelProviderIcon
                  provider={getModelProviderKey(
                    model.slug,
                    model.model_creator.slug,
                  )}
                  iconUrl={model.provider_icon_url}
                  size={22}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {model.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {model.model_creator.name}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {!results.length && (
            <p role="status" className="p-4 text-sm text-muted-foreground">
              {t.grid.noResults}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
