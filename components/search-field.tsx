import { Search, X } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Search box with the same 44px height and surface as the toolbar controls. */
export function SearchField({
  value,
  onChange,
  placeholder,
  clearLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Shows a clear button while the field has text. */
  clearLabel?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex h-11 min-w-0 items-center gap-2.5 rounded-lg border border-input bg-card px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className,
      )}
    >
      <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        // 16px on phones prevents iOS from zooming into the field.
        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
      />
      {clearLabel && value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={clearLabel}
          className="touch-target -mr-2 flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </label>
  );
}
