import { useState, type ReactNode } from "react";
import { Link } from "@/components/link";
import type { BenchmarkSummary } from "@/lib/benchmark-summaries";
import type { SummaryPick } from "@/lib/data-summary";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A short paragraph written from the data on the page: the leader, the best
 * score for the money, the fastest and the date of the data. Sentences whose
 * value is unpublished are left out.
 */
export function DataSummary({ data, className }: { data: BenchmarkSummary; className?: string }) {
  const { t, lang } = useI18n();
  const copy = t.summary;
  const { summary } = data;
  // Phones show two lines first; the rest stays in the DOM for screen readers.
  const [expanded, setExpanded] = useState(false);
  if (!summary.leader) return null;

  const name = (pick: SummaryPick): ReactNode =>
    pick.href ? <Link href={pick.href} className="font-medium text-foreground underline-offset-4 hover:underline">{pick.name}</Link>
      : <span className="font-medium text-foreground">{pick.name}</span>;
  const cost = (pick: SummaryPick) => `${formatMoney(pick.cost, lang)} ${copy[data.costUnit]}`;
  const speed = summary.fastest ? data.formatSpeed(summary.fastest, lang) : null;
  const timed = summary.fastest?.time != null;

  const sentences: ReactNode[] = [
    copy.leader(name(summary.leader), `${data.formatScore(summary.leader.score, lang)}${data.scoreLabel ? ` (${data.scoreLabel})` : ""}`, formatNumber(summary.count, lang, 0), data.unit),
  ];
  if (summary.value?.cost != null) {
    sentences.push(data.costUnit === "perScene"
      ? copy.cheapest(name(summary.value), cost(summary.value))
      : copy.value(name(summary.value), data.formatScore(summary.value.score, lang), cost(summary.value)));
  }
  if (summary.fastest && speed) sentences.push(copy.fastest(name(summary.fastest), timed ? `${speed} ${copy.perTaskTime}` : speed));

  return (
    <section aria-label={copy.title} className={cn("max-w-3xl text-sm leading-6 text-muted-foreground", className)}>
      <h2 className="sr-only">{copy.title}</h2>
      <p className={cn(!expanded && "max-sm:line-clamp-2")}>
        {sentences.map((sentence, index) => <span key={index}>{index > 0 && " "}{sentence}</span>)}
      </p>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="-my-2 inline-flex min-h-11 items-center rounded-md text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
      >
        {expanded ? copy.collapse : copy.expand}
      </button>
      <p className={cn("mt-1 text-xs", !expanded && "max-sm:hidden")}>
        {summary.pool < summary.count && (summary.value || summary.fastest) ? `${copy.pool(formatNumber(summary.pool, lang, 0))} ` : ""}
        {data.updatedAt ? copy.updated(formatDate(data.updatedAt, lang)) : null}
      </p>
    </section>
  );
}
