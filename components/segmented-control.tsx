import { useLayoutEffect, useRef, useState } from "react";
import type { RuneIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * A row of mutually exclusive buttons whose highlight slides to the active
 * option. Each option stays a native button with `aria-pressed`, so keyboard
 * and assistive-technology behavior do not depend on the animation.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "default",
  stretch = false,
  stackOnMobile = false,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string; controls?: string; icon?: RuneIcon }>;
  label: string;
  className?: string;
  size?: "default" | "sm";
  /** Options share the full width in equal columns. */
  stretch?: boolean;
  /** Below `sm`, each icon sits above its label so several options fit a phone. */
  stackOnMobile?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const measure = () => {
      const active = container.querySelector<HTMLElement>('[aria-pressed="true"]');
      setIndicator(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value, options]);

  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      // The track matches the 44px toolbar controls; options fill its height so
      // their touch targets stay 44px while the highlight is inset.
      className={cn(
        "segmented relative inline-flex h-11 max-w-full items-stretch rounded-lg bg-muted/60 px-1 ring-1 ring-input ring-inset",
        stackOnMobile && "max-sm:h-auto",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className="segmented-indicator absolute inset-y-1 rounded-md bg-card shadow-sm ring-1 ring-input"
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width, left: 0 }}
        />
      )}
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-controls={option.controls}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 rounded-md",
              stretch ? "flex-1" : "shrink-0",
              // Stacked options get equal columns on phones; elsewhere none shrinks below its label.
              stackOnMobile && "max-sm:min-w-0",
              "font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              size === "sm" ? "px-3 text-xs" : "px-4 text-sm",
              stackOnMobile && "max-sm:min-h-13 max-sm:px-1 max-sm:py-1.5 max-sm:text-xs",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              // Without a measured indicator (first paint), the active option still reads as selected.
              active && !indicator && "bg-card shadow-sm",
            )}
          >
            <span className={cn("flex items-center justify-center gap-1.5", stackOnMobile && "max-sm:flex-col max-sm:gap-1")}>
              {option.icon && <option.icon aria-hidden="true" className="size-4 shrink-0" />}
              <span className={cn(stackOnMobile && "max-sm:truncate")}>{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
