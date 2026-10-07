import type { ReactNode } from "react";
import { ExternalLink, type RuneIcon } from "@/components/icons";
import { InfoTip } from "@/components/info-tip";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Title block shared by the external benchmark pages, with the source link. */
export function BenchmarkHeader({
  icon: Icon,
  title,
  description,
  source,
  children,
}: {
  icon: RuneIcon;
  title: string;
  description: string;
  source: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card text-muted-foreground">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          {children}
        </div>
      </div>
      <Button variant="outline" asChild className="touch-target shrink-0 self-start">
        <a href={source.href} target="_blank" rel="noopener noreferrer" className="gap-1.5">
          {source.label}
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      </Button>
    </header>
  );
}

export interface StatTile {
  key: string;
  label: string;
  value: string;
  detail?: string;
  hint?: string;
}

/** A row of headline figures; each value comes straight from the source. */
export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  const { t } = useI18n();
  return (
    <dl className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.key} className="flex min-w-0 flex-col rounded-xl border bg-card p-3 sm:p-4">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate">{tile.label}</span>
            {tile.hint && <InfoTip label={`${t.glossary.infoLabel} · ${tile.label}`} content={tile.hint} />}
          </dt>
          <dd className="mt-1 truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl" title={tile.value}>{tile.value}</dd>
          {tile.detail && <dd className="mt-0.5 truncate text-xs text-muted-foreground" title={tile.detail}>{tile.detail}</dd>}
        </div>
      ))}
    </dl>
  );
}

/**
 * A score with a thin bar on a 0–1 scale and, when published, its confidence
 * interval drawn as a whisker over the bar.
 */
export function ScoreBar({
  value,
  label,
  interval,
  className,
}: {
  value: number | null;
  label: string;
  interval?: { low: number; high: number } | null;
  className?: string;
}) {
  const clamp = (number: number) => Math.min(Math.max(number, 0), 1);
  return (
    <span className={cn("flex min-w-0 flex-col items-end gap-1", className)}>
      <span className="font-semibold tabular-nums">{label}</span>
      {value != null && (
        <span aria-hidden="true" className="relative h-1 w-full max-w-24 rounded-full bg-muted">
          <span
            className="compare-bar absolute inset-y-0 left-0 block w-full origin-left rounded-full bg-foreground/60"
            style={{ transform: `scaleX(${clamp(value)})` }}
          />
          {interval && (
            <span
              className="absolute -inset-y-0.5 rounded-full border-x border-foreground/70"
              style={{ left: `${clamp(interval.low) * 100}%`, width: `${Math.max(1, (clamp(interval.high) - clamp(interval.low)) * 100)}%` }}
            />
          )}
        </span>
      )}
    </span>
  );
}
