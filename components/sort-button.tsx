import { ArrowUp, ArrowUpDown } from "@/components/icons";
import type { SortDirection } from "@/lib/model-grid-logic";
import { cn } from "@/lib/utils";

/**
 * A table header that sorts by its column. The active column shows its
 * direction; others reveal a neutral hint on hover or focus.
 */
export function SortButton({
  active,
  direction,
  label,
  hint,
  onClick,
  align = "end",
}: {
  active: boolean;
  direction: SortDirection;
  label: string;
  /** Spoken direction of the active column, e.g. "Descending". */
  hint?: string;
  onClick: () => void;
  align?: "start" | "end";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={cn(
        "group inline-flex min-h-8 max-w-full items-center gap-1 rounded-md px-1.5 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        align === "start" && "-ml-1.5 flex-row-reverse justify-end",
        active && "text-foreground",
      )}
    >
      {active ? (
        <ArrowUp
          aria-hidden="true"
          className={cn("size-3 shrink-0 transition-transform duration-200 ease-out", direction === "desc" && "rotate-180")}
        />
      ) : (
        <ArrowUpDown aria-hidden="true" className="size-3 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-50 group-focus-visible:opacity-50" />
      )}
      <span className="truncate">{label}</span>
      {hint && <span className="sr-only">, {hint}</span>}
    </button>
  );
}
