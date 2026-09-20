import { useState, useRef, useId, useMemo, useEffect } from "react";
import { Search, ChevronDown, Check } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

// Generic combobox / Combobox générique

export interface ComboboxItem {
  value: string;
  label: string;
  group?: string;
}

export function Combobox({
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const filtered = useMemo(
    () =>
      search.trim()
        ? items.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase()),
          )
        : items,
    [items, search],
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
        if (ref.current?.contains(document.activeElement))
          triggerRef.current?.focus();
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
    if (!open) return;
    const id = window.setTimeout(() => {
      if (withSearch) inputRef.current?.focus({ preventScroll: true });
      else
        (
          ref.current?.querySelector<HTMLButtonElement>(
            '[role="option"][aria-selected="true"]',
          ) ?? ref.current?.querySelector<HTMLButtonElement>('[role="option"]')
        )?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, withSearch]);

  const selectedLabel =
    items.find((i) => i.value === value)?.label ?? placeholder;

  return (
    <div
      ref={ref}
      className={cn("relative", width)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setSearch("");
        }
      }}
      onKeyDown={(event) => {
        if (
          !open ||
          !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
        )
          return;
        if (
          event.target === inputRef.current &&
          ["Home", "End"].includes(event.key)
        )
          return;
        event.preventDefault();
        const options = Array.from(
          ref.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ??
            [],
        );
        const index = options.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? options.length - 1
              : index < 0
                ? event.key === "ArrowUp"
                  ? options.length - 1
                  : 0
                : (index +
                    (event.key === "ArrowUp" ? -1 : 1) +
                    options.length) %
                  options.length;
        options[next]?.focus();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${placeholder}: ${selectedLabel}`}
        onKeyDown={(event) => {
          if (!open && ["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        className="touch-target flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted/70 sm:h-9"
      >
        <span className="truncate text-left flex-1">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 opacity-50 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border bg-popover shadow-lg animate-in fade-in-0 slide-in-from-top-1 duration-150 motion-reduce:animate-none">
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

          <div
            id={listboxId}
            role="listbox"
            aria-label={placeholder}
            className="max-h-64 overflow-y-auto"
          >
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
                    tabIndex={-1}
                    aria-selected={value === item.value}
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                      setSearch("");
                      triggerRef.current?.focus();
                    }}
                    className={cn(
                      "touch-target flex min-h-10 w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2",
                      value === item.value && "font-medium",
                    )}
                  >
                    <span>{item.label}</span>
                    {value === item.value && (
                      <Check className="size-3.5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t.grid.noOptions}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
