import type { CSSProperties } from "react";
import type { Aa3dRow, Aa3dToolCalls } from "@/lib/aa3d-data";
import { formatNumber, formatPercent } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

const TOOL_KINDS = ["browser_test", "code", "assets", "image_views", "other"] as const satisfies ReadonlyArray<keyof Aa3dToolCalls>;
const TOOL_COLORS: Record<(typeof TOOL_KINDS)[number], string> = {
  browser_test: "var(--chart-2)",
  code: "var(--chart-1)",
  assets: "var(--chart-3)",
  image_views: "var(--chart-4)",
  other: "var(--chart-5)",
};
/** AA stops a run after 250 turns, the most a scene can take. */
const TURN_LIMIT = 250;

function toolTotal(calls: Aa3dToolCalls): number {
  return TOOL_KINDS.reduce((sum, kind) => sum + calls[kind], 0);
}

/**
 * How each visible model works through its scenes: the spread of agent
 * turns, the mix of tool calls, and two shares AA publishes per model.
 */
export function Aa3dAgent({ rows, name }: { rows: readonly Aa3dRow[]; name: (row: Aa3dRow) => string }) {
  const { t, lang } = useI18n();
  const copy = t.aa3d.agent;
  const visible = rows.filter((row) => row.turns || row.tool_calls || row.first_look_share !== null || row.asset_library_share !== null);
  if (visible.length === 0) return null;

  // Shared scales so bars compare across models: turns up to the largest 95th percentile, calls up to the largest total.
  const turnMax = Math.min(TURN_LIMIT, Math.ceil(Math.max(...visible.map((row) => row.turns?.p95 ?? 0), 1) / 50) * 50);
  const callMax = Math.max(...visible.map((row) => (row.tool_calls ? toolTotal(row.tool_calls) : 0)), 1);
  const number = (value: number) => formatNumber(value, lang, Number.isInteger(value) ? 0 : 1);

  const turns = (row: Aa3dRow) => <TurnRange row={row} max={turnMax} />;
  const tools = (row: Aa3dRow) => <ToolMix row={row} max={callMax} />;

  return (
    <section aria-labelledby="aa3d-agent-title" className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <div className="min-w-0">
        <h2 id="aa3d-agent-title" className="text-base font-semibold">{copy.title}</h2>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{copy.hint}</p>
      </div>
      <dl className="grid gap-x-6 gap-y-2 text-xs text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="font-medium text-foreground">{copy.turns}</dt>
          <dd className="mt-0.5 leading-5">{copy.turnsHint}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{copy.tools}</dt>
          <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {TOOL_KINDS.map((kind) => (
              <span key={kind} className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: TOOL_COLORS[kind] }} />
                {copy.toolKinds[kind]}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <ol className="grid grid-cols-1 gap-2 lg:hidden">
        {visible.map((row) => (
          <li key={row.slug} className="rounded-lg border p-3">
            <p className="truncate text-sm font-medium" title={row.name}>{name(row)}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">{copy.turns}</p>
            {turns(row)}
            <p className="mt-2 text-[11px] text-muted-foreground">{copy.tools}</p>
            {tools(row)}
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span title={copy.firstLookHint}>{copy.firstLook}{lang === "fr" ? " : " : ": "}<span className="font-medium tabular-nums text-foreground">{formatPercent(row.first_look_share, lang)}</span></span>
              <span title={copy.assetLibraryHint}>{copy.assetLibrary}{lang === "fr" ? " : " : ": "}<span className="font-medium tabular-nums text-foreground">{formatPercent(row.asset_library_share, lang)}</span></span>
            </p>
          </li>
        ))}
      </ol>

      <div className="hidden lg:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{copy.title}</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">{t.aa3d.headers.model}</th>
              <th scope="col" className="w-[30%] px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                {copy.turns}
                <span className="ml-1 font-normal tabular-nums">(0–{number(turnMax)})</span>
              </th>
              <th scope="col" className="w-[30%] px-3 py-2 text-left text-xs font-medium text-muted-foreground">{copy.tools}</th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground" title={copy.firstLookHint}>{copy.firstLook}</th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground" title={copy.assetLibraryHint}>{copy.assetLibrary}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.slug} className="border-b last:border-b-0">
                <th scope="row" className="max-w-56 truncate px-2 py-2.5 text-left font-medium" title={row.name}>{name(row)}</th>
                <td className="px-3 py-2.5">{turns(row)}</td>
                <td className="px-3 py-2.5">{tools(row)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{formatPercent(row.first_look_share, lang)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{formatPercent(row.asset_library_share, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Box plot of turns per scene: 5th–95th percentile line, 25th–75th bar, median mark. */
function TurnRange({ row, max }: { row: Aa3dRow; max: number }) {
  const { t, lang } = useI18n();
  if (!row.turns) return <span className="text-xs text-muted-foreground">—</span>;
  const { p5, p25, p50, p75, p95 } = row.turns;
  const at = (value: number) => `${Math.min(100, (value / max) * 100)}%`;
  const number = (value: number) => formatNumber(value, lang, Number.isInteger(value) ? 0 : 1);
  return (
    <span className="flex items-center gap-2">
      <span
        role="img"
        aria-label={t.aa3d.agent.turnsRange(number(p5), number(p25), number(p50), number(p75), number(p95))}
        className="relative block h-4 flex-1 rounded-sm bg-muted/60"
      >
        <span aria-hidden="true" className="absolute top-1/2 h-px -translate-y-1/2 bg-muted-foreground/60" style={{ left: at(p5), right: `calc(100% - ${at(p95)})` }} />
        <span aria-hidden="true" className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-sm bg-chart-2/45" style={{ left: at(p25), right: `calc(100% - ${at(p75)})` }} />
        <span aria-hidden="true" className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full bg-foreground" style={{ left: at(p50) }} />
      </span>
      <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums">{number(p50)}</span>
    </span>
  );
}

/** Stacked bar of the average tool calls per scene, scaled to the busiest model. */
function ToolMix({ row, max }: { row: Aa3dRow; max: number }) {
  const { t, lang } = useI18n();
  if (!row.tool_calls) return <span className="text-xs text-muted-foreground">—</span>;
  const calls = row.tool_calls;
  const total = toolTotal(calls);
  const colon = lang === "fr" ? " : " : ": ";
  const label = TOOL_KINDS.map((kind) => `${t.aa3d.agent.toolKinds[kind]}${colon}${formatNumber(calls[kind], lang, 1)}`).join(", ");
  return (
    <span className="flex items-center gap-2">
      <span role="img" aria-label={label} title={label} className="flex h-3 flex-1 overflow-hidden rounded-sm bg-muted/60">
        {TOOL_KINDS.map((kind) => (
          <span
            key={kind}
            aria-hidden="true"
            className="h-full"
            style={{ width: `${(calls[kind] / max) * 100}%`, background: TOOL_COLORS[kind] } as CSSProperties}
          />
        ))}
      </span>
      <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums">{formatNumber(total, lang, 0)}</span>
    </span>
  );
}
