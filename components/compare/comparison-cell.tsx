import { Check } from "@/components/icons";
import { formatRatio } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  comparisonPriceRatio,
  comparisonShare,
  formatComparisonValue,
  type ComparisonRow,
  type ComparisonValue,
} from "@/lib/comparison-rows";

/** One measured value: the figure, a best-value mark, and a bar scaled to the best. */
export function ComparisonCell({
  row,
  value,
  best,
  align = "start",
}: {
  row: ComparisonRow;
  value: ComparisonValue;
  best: number | null;
  align?: "start" | "end";
}) {
  const { t, lang } = useI18n();
  const copy = t.compareWorkspace;
  const winner = best !== null && value === best;
  const share = comparisonShare(row, value);
  const ratio = comparisonPriceRatio(row, value);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", align === "end" && "items-end")}>
      <span className={cn("flex min-w-0 flex-wrap items-baseline gap-x-1.5 tabular-nums", align === "end" && "justify-end")}>
        {winner && (
          <>
            <Check aria-hidden="true" className="size-3.5 shrink-0 self-center text-chart-1" />
            <span className="sr-only">{t.compare.best}: </span>
          </>
        )}
        <span className={cn("break-words", winner ? "font-semibold" : value === null && "text-muted-foreground")}>
          {formatComparisonValue(value, row, lang, copy)}
        </span>
        {ratio !== null && (
          <span className="text-xs text-muted-foreground" title={copy.ratioHint}>
            {formatRatio(ratio, lang)}
            <span className="sr-only"> {copy.ratioHint}</span>
          </span>
        )}
      </span>
      {share !== null && (
        <span aria-hidden="true" className={cn("h-1 overflow-hidden rounded-full bg-muted", align === "end" ? "w-24" : "w-full max-w-40")}>
          <span
            className={cn(
              "compare-bar block h-full w-full rounded-full",
              align === "end" ? "origin-right" : "origin-left",
              winner ? "bg-chart-1" : "bg-foreground/35",
            )}
            style={{ transform: `scaleX(${share})` }}
          />
        </span>
      )}
    </div>
  );
}
