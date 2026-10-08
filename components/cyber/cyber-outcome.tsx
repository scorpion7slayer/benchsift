import { cyberOutcomeShares, type CyberBenchmarkResult, type CyberIndexResult } from "@/lib/cyber-index";
import { formatPercent, type DisplayLang } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** The index is a share of solved tasks, so it reads as a percentage. */
export function formatCyberScore(score: number | null | undefined, lang: DisplayLang): string {
  return formatPercent(score == null ? null : score / 100, lang);
}

/**
 * Successes, safety blocks and failures of the index tasks on one bar. The
 * values are printed beside it; the bar itself is decorative.
 */
export function CyberOutcomeBar({
  result,
  className,
}: {
  result: Pick<CyberIndexResult, "score" | "safety_block_rate" | "access">;
  className?: string;
}) {
  const shares = cyberOutcomeShares(result);
  return (
    <span aria-hidden="true" className={cn("block h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <span className="compare-bar flex h-full w-full origin-left">
        <span
          className={cn("h-full bg-foreground/70", result.access === "trusted" && "cyber-trusted")}
          style={{ width: `${shares.successes * 100}%` }}
        />
        {shares.safetyBlocks ? (
          <span className="cyber-safety-blocks h-full" style={{ width: `${shares.safetyBlocks * 100}%` }} />
        ) : null}
      </span>
    </span>
  );
}

function Swatch({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-3 shrink-0 rounded-sm border border-foreground/20", className)} />;
}

/** Key to the outcome bars; the trusted-access entry appears only when used. */
export function CyberLegend({ trusted = false, className }: { trusted?: boolean; className?: string }) {
  const { t } = useI18n();
  const legend = t.cyber.legend;
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)}>
      <li className="flex items-center gap-1.5"><Swatch className="bg-foreground/70" />{legend.successes}</li>
      <li className="flex items-center gap-1.5"><Swatch className="cyber-safety-blocks bg-muted" />{legend.safetyBlocks}</li>
      <li className="flex items-center gap-1.5"><Swatch className="bg-muted" />{legend.failures}</li>
      {trusted && <li className="flex items-center gap-1.5"><Swatch className="cyber-trusted bg-foreground/70" />{legend.trustedAccess}</li>}
    </ul>
  );
}

/** A benchmark score, starred when some of its tasks were declined on safety grounds. */
export function CyberBenchmarkScore({ benchmark }: { benchmark: Pick<CyberBenchmarkResult, "score" | "safety_blocks"> | undefined }) {
  const { t, lang } = useI18n();
  return (
    <>
      {formatPercent(benchmark?.score, lang)}
      {benchmark?.safety_blocks && (
        <>
          <span aria-hidden="true">*</span>
          <span className="sr-only"> ({t.cyber.blocked})</span>
        </>
      )}
    </>
  );
}
