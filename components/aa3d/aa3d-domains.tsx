import { useState, type CSSProperties } from "react";
import { SegmentedControl } from "@/components/segmented-control";
import type { Aa3dDomain, Aa3dDomainResult, Aa3dRow } from "@/lib/aa3d-data";
import { formatNumber, formatPercent } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Mode = "raw" | "balanced";

/**
 * Win rate by task domain as a heat map: one row per visible model, one
 * column per domain. Cells AA flags as low-sample are hatched, never hidden.
 */
export function Aa3dDomains({
  rows,
  domains,
  panelVotes,
  name,
}: {
  rows: readonly Aa3dRow[];
  domains: readonly Aa3dDomain[];
  panelVotes: number | null;
  name: (row: Aa3dRow) => string;
}) {
  const { t, lang } = useI18n();
  const copy = t.aa3d.domains;
  const [mode, setMode] = useState<Mode>("raw");
  const visible = rows.filter((row) => Object.keys(row.domains).length > 0);
  if (domains.length === 0 || visible.length === 0) return null;

  const label = (domain: Aa3dDomain) => copy.names[domain.id] ?? domain.label;
  const value = (result: Aa3dDomainResult | undefined) =>
    result ? (mode === "raw" ? result.win_rate : result.win_rate_balanced) : null;

  return (
    <section aria-labelledby="aa3d-domains-title" className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 id="aa3d-domains-title" className="text-base font-semibold">{copy.title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
            {copy.hint} {mode === "raw" ? copy.rawHint : copy.balancedHint}
            {panelVotes !== null && <> {copy.panelVotes(formatNumber(panelVotes, lang, 0))}</>}
          </p>
        </div>
        <SegmentedControl
          value={mode}
          onChange={setMode}
          label={copy.mode}
          size="sm"
          className="self-start"
          options={[
            { value: "raw", label: copy.raw },
            { value: "balanced", label: copy.balanced },
          ]}
        />
      </div>
      {/* Scrolls inside its own frame on phones; `relative` keeps the cells' screen-reader text inside it too. */}
      <div
        className="relative -mx-4 overflow-x-auto px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mx-0 sm:px-0"
        tabIndex={0}
        role="region"
        aria-labelledby="aa3d-domains-title"
      >
        <table className="w-full min-w-[42rem] border-separate border-spacing-1 text-xs">
          <caption className="sr-only">{copy.title}</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-card px-2 py-1 text-left font-medium text-muted-foreground">{t.aa3d.headers.model}</th>
              {domains.map((domain) => (
                <th key={domain.id} scope="col" className="w-[11%] px-1 py-1 text-center align-bottom font-medium leading-4 text-muted-foreground">
                  {label(domain)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.slug}>
                <th scope="row" className="sticky left-0 z-10 max-w-44 truncate bg-card px-2 py-1 text-left font-medium" title={row.name}>
                  {name(row)}
                </th>
                {domains.map((domain) => {
                  const result = row.domains[domain.id];
                  const fraction = value(result);
                  const lowSample = Boolean(result && (result.too_few_scenes || result.too_few_opponents));
                  const reasons = result
                    ? [
                        result.too_few_scenes ? copy.tooFewScenes(formatNumber(result.scenes, lang, 0)) : null,
                        result.too_few_opponents ? copy.tooFewOpponents(formatNumber(result.opponents, lang, 0)) : null,
                      ].filter(Boolean).join(" · ")
                    : copy.noVotes;
                  return (
                    <td
                      key={domain.id}
                      title={reasons || undefined}
                      className={cn(
                        "aa3d-heat h-9 rounded-md px-1 text-center tabular-nums",
                        fraction === null ? "text-muted-foreground" : fraction >= 0.6 ? "font-semibold text-foreground" : "text-foreground",
                        lowSample && "aa3d-heat-low text-muted-foreground",
                      )}
                      style={{ "--heat": fraction === null ? 0 : Math.round(fraction * 100) } as CSSProperties}
                    >
                      {formatPercent(fraction, lang)}
                      {lowSample && <span className="sr-only"> ({copy.lowSample}{reasons ? `, ${reasons}` : ""})</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
