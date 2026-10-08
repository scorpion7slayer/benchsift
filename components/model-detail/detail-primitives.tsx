import type { ReactNode } from "react";
import { InfoTip } from "@/components/info-tip";
import type { RuneIcon } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import type { MetricRank } from "@/lib/model-insights";
import { cn } from "@/lib/utils";

export function DetailCard({
  icon: Icon,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: {
  icon: RuneIcon;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="border-b border-border/70">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
      {footer}
    </Card>
  );
}

function Label({ label, tooltip }: { label: string; tooltip?: string }) {
  const { t } = useI18n();
  return (
    <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
      <span className="min-w-0">{label}</span>
      {tooltip && <InfoTip label={`${t.glossary.infoLabel} · ${label}`} content={tooltip} />}
    </span>
  );
}

/**
 * Where the model stands among the catalogue models measured on the same
 * metric. The top tenth reads in the foreground so leaders stand out.
 */
export function RankNote({ rank, className }: { rank: MetricRank; className?: string }) {
  const { t } = useI18n();
  const leading = rank.total >= 10 && rank.rank <= Math.max(1, Math.ceil(rank.total / 10));
  return (
    <span
      title={t.detail.rankHint}
      className={cn("text-[11px] tabular-nums", leading ? "font-medium text-foreground" : "text-muted-foreground", className)}
    >
      <span aria-hidden="true">{t.detail.rankOf(rank.rank, rank.total)}</span>
      <span className="sr-only">{t.detail.rankLabel(rank.rank, rank.total)}</span>
    </span>
  );
}

/** A label and its value on one line, for specifications and prices. */
export function StatRow({ label, value, tooltip, rank }: { label: string; value: ReactNode; tooltip?: string; rank?: MetricRank }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <Label label={label} tooltip={tooltip} />
      <span className="flex shrink-0 flex-col items-end text-right">
        <span className="font-medium tabular-nums">{value}</span>
        {rank && <RankNote rank={rank} />}
      </span>
    </div>
  );
}

/**
 * Bar colour from the model's rank among measured models, never from a fixed
 * score threshold (a "good" score differs from one benchmark to another):
 * green for the top tenth, blue for the top third, neutral otherwise.
 */
function rankTone(rank: MetricRank | undefined): string {
  if (!rank || rank.total < 10) return "color-mix(in oklch, var(--foreground) 55%, transparent)";
  const share = rank.rank / rank.total;
  if (share <= 0.1) return "var(--chart-1)";
  if (share <= 1 / 3) return "var(--chart-2)";
  return "color-mix(in oklch, var(--foreground) 45%, transparent)";
}

/** A score with a bar on its own scale (0–100 for indices and percentages). */
export function BenchmarkRow({
  label,
  value,
  share,
  tooltip,
  rank,
}: {
  label: string;
  value: ReactNode;
  share: number;
  tooltip?: string;
  rank?: MetricRank;
}) {
  const clamped = Math.min(Math.max(share, 0), 1);
  return (
    <div className="flex min-w-0 flex-col gap-2 border-b border-border/70 py-3 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
      <div className="flex items-center justify-between gap-3 text-sm">
        <Label label={label} tooltip={tooltip} />
        <span className="shrink-0 font-medium tabular-nums">{value}</span>
      </div>
      <span aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-muted">
        <span
          className="compare-bar block h-full w-full origin-left rounded-full"
          style={{ transform: `scaleX(${clamped})`, background: rankTone(rank) }}
        />
      </span>
      {rank && <RankNote rank={rank} className="-mt-1 self-end" />}
    </div>
  );
}

export function TwoColumnRows({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-x-8 sm:grid-cols-2", className)}>{children}</div>;
}
