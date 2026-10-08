import { useMemo, useState } from "react";
import { Activity, Trophy } from "@/components/icons";
import { SearchField } from "@/components/search-field";
import { Link } from "@/components/link";
import { BenchmarkDisclosure as Disclosure, BenchmarkHeader, ScoreBar, StatTiles } from "@/components/benchmark-page";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { SegmentedControl } from "@/components/segmented-control";
import { SortButton } from "@/components/sort-button";
import { TradeoffChart, type ChartScale, type ChartSeries } from "@/components/tradeoff-chart";
import { Badge } from "@/components/ui/badge";
import { deepSweCatalogKey, type DeepSweModelInfo } from "@/lib/deepswe-catalog";
import {
  DEEPSWE_DEFAULT_DIRECTION,
  selectDeepSweRows,
  type DeepSweData,
  type DeepSweRow,
  type DeepSweSort,
  type DeepSweSortDirection,
  type DeepSweVersion,
} from "@/lib/deepswe-data";
import { formatDate, formatDuration, formatMoney, formatMoneyCompact, formatNumber, formatPercent, formatTokens } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { providerColor, shadeIndex } from "@/lib/provider-colors";
import { getModelProviderKey, resolveCreatorFromModelSlug } from "@/lib/provider-map";
import { cn } from "@/lib/utils";
import { PageCat } from "@/components/pixel-art/page-cats";

type XAxis = "cost" | "time";

/** Readable name for a DeepSWE slug the catalogue does not list. */
function fallbackName(slug: string): string {
  return slug
    .split("-")
    .map((part, index, parts) => {
      // "5-6" → "5.6" inside version numbers.
      if (/^\d+$/.test(part) && /^\d+$/.test(parts[index - 1] ?? "")) return `.${part}`;
      if (/^(gpt|glm|gpt\d.*)$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ")
    .replace(/ \./g, ".");
}

/**
 * DeepSWE leaderboard: headline figures, the score against cost chart (one
 * line per model across its effort levels), then the sortable table.
 */
export function DeepSweView({ data }: { data: DeepSweData & { catalog: Record<string, DeepSweModelInfo> } }) {
  const { t, lang } = useI18n();
  const copy = t.deepSwe;
  const ui = t.benchmarkUi;
  const [version, setVersion] = useState<DeepSweVersion>(
    data.leaderboards.find((entry) => entry.rows.length > 0)?.version ?? "v1.1",
  );
  const leaderboard = data.leaderboards.find((entry) => entry.version === version) ?? data.leaderboards[0];
  const [query, setQuery] = useState("");
  const [bestOnly, setBestOnly] = useState(true);
  const [sort, setSort] = useState<DeepSweSort>("score");
  const [direction, setDirection] = useState<DeepSweSortDirection>("desc");
  const [xAxis, setXAxis] = useState<XAxis>("cost");
  // Costs span two orders of magnitude, so the log scale keeps cheap models apart.
  const [scale, setScale] = useState<ChartScale>("log");

  const info = (row: DeepSweRow) => data.catalog[deepSweCatalogKey(row.model, row.reasoning_effort)];
  const nameOf = (row: DeepSweRow) => info(row)?.name ?? fallbackName(row.model);
  const creatorOf = (row: DeepSweRow) =>
    info(row)?.creatorSlug ?? row.provider ?? resolveCreatorFromModelSlug(row.model, row.model.split("-")[0] ?? "");

  const rows = useMemo(
    () => selectDeepSweRows(leaderboard.rows, { query, bestOnly, sort, direction, searchText: (row) => nameOf(row) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leaderboard.rows, query, bestOnly, sort, direction, data.catalog],
  );
  const ranks = useMemo(() => new Map(leaderboard.rows.map((row, index) => [row, index + 1])), [leaderboard.rows]);
  const top = leaderboard.rows[0] ?? null;

  // Every effort level of the visible models, one line per model and harness.
  const series = useMemo<ChartSeries[]>(() => {
    const visible = new Set(rows.map((row) => JSON.stringify([row.provider, row.model, row.harness])));
    const groups = new Map<string, DeepSweRow[]>();
    for (const row of leaderboard.rows) {
      const key = JSON.stringify([row.provider, row.model, row.harness]);
      if (!visible.has(key)) continue;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    const shade = shadeIndex();
    return [...groups.entries()].map(([key, group]) => {
      const best = group.reduce((a, b) => ((b.pass_at_1 ?? -1) > (a.pass_at_1 ?? -1) ? b : a));
      const creator = creatorOf(best);
      const color = providerColor(creator, shade(creator));
      return {
        id: key,
        label: nameOf(best),
        color,
        highlights: [{ id: best.config, color }],
        points: group.flatMap((row) => {
          const x = xAxis === "cost" ? row.mean_cost_usd : row.mean_duration_seconds;
          return x == null || row.pass_at_1 == null
            ? []
            : [{ id: row.config, name: `${nameOf(row)} · ${row.reasoning_effort ?? "default"}`, tag: row.reasoning_effort, x, y: row.pass_at_1 * 100 }];
        }),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, leaderboard.rows, xAxis, data.catalog]);

  function sortBy(next: DeepSweSort) {
    setDirection(next === sort ? (direction === "asc" ? "desc" : "asc") : DEEPSWE_DEFAULT_DIRECTION[next]);
    setSort(next);
  }

  const source = { href: "https://deepswe.datacurve.ai/", label: copy.viewOnDeepSwe };
  if (data.leaderboards.every((entry) => entry.rows.length === 0)) {
    return (
      <div className="space-y-6">
        <BenchmarkHeader icon={Activity} title={copy.title} description={copy.description} source={source} />
        <p role="status" className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{copy.empty}</p>
      </div>
    );
  }

  // The cheapest of the ten best configurations: a useful price for a top score.
  const cheapest = leaderboard.rows
    .slice(0, 10)
    .reduce<DeepSweRow | null>(
      (best, row) => (row.mean_cost_usd != null && (best?.mean_cost_usd == null || row.mean_cost_usd < best.mean_cost_usd) ? row : best),
      null,
    );
  const directionHint = (key: DeepSweSort) =>
    sort === key ? (direction === "asc" ? t.grid.direction.asc : t.grid.direction.desc) : undefined;
  const headers: Array<{ key: DeepSweSort; label: string }> = [
    { key: "score", label: "pass@1" },
    { key: "pass4", label: ui.byPass4 },
    { key: "cost", label: copy.headers.cost },
    { key: "time", label: copy.headers.time },
    { key: "tokens", label: copy.headers.outputTokens },
  ];

  return (
    <div className="flex flex-col gap-6">
      <BenchmarkHeader icon={Activity} title={copy.title} description={copy.description} source={source}>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SegmentedControl
            value={version}
            onChange={setVersion}
            label={copy.versions}
            size="sm"
            options={data.leaderboards.map((entry) => ({ value: entry.version, label: entry.version }))}
          />
          <p className="text-xs text-muted-foreground">
            {leaderboard.scoring === "node-id" ? copy.scoringNodeId : copy.scoringExitCode}
          </p>
        </div>
      </BenchmarkHeader>

      <div className="relative">
        <PageCat kind="deepswe" className="absolute bottom-[calc(100%+1px)] right-6" />
        <StatTiles
          tiles={[
            { key: "configs", label: copy.stats.configs, value: formatNumber(leaderboard.rows.length, lang, 0) },
            { key: "tasks", label: copy.stats.tasks, value: formatNumber(leaderboard.n_tasks_in_set, lang, 0) },
            {
              key: "best",
              label: copy.stats.best,
              value: formatPercent(top?.pass_at_1, lang),
              detail: top ? `${nameOf(top)} · ${top.reasoning_effort ?? "default"}` : undefined,
              hint: ui.passAt1Tooltip,
            },
            {
              key: "cheapest",
              label: ui.cheapestTop,
              value: formatMoney(cheapest?.mean_cost_usd, lang),
              detail: cheapest ? `${nameOf(cheapest)} · ${formatPercent(cheapest.pass_at_1, lang)}` : undefined,
            },
          ]}
        />
      </div>

      <section aria-labelledby="deepswe-chart-title" className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 id="deepswe-chart-title" className="text-base font-semibold">{ui.chartTitle}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{ui.chartHint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SegmentedControl
              value={xAxis}
              onChange={setXAxis}
              label={ui.xAxis}
              size="sm"
              options={[
                { value: "cost", label: copy.headers.cost },
                { value: "time", label: copy.headers.time },
              ]}
            />
            <SegmentedControl
              value={scale}
              onChange={setScale}
              label={t.tradeoff.scale}
              size="sm"
              options={[
                { value: "linear", label: t.tradeoff.linear },
                { value: "log", label: t.tradeoff.log },
              ]}
            />
          </div>
        </div>
        <TradeoffChart
          series={series}
          title={ui.chartTitle}
          xLabel={xAxis === "cost" ? ui.axisCost : ui.axisTime}
          yLabel={`DeepSWE ${version} · pass@1`}
          formatX={(value) => (xAxis === "cost" ? formatMoneyCompact(value, lang) : formatDuration(value, lang))}
          formatY={(value) => `${formatNumber(value, lang, Number.isInteger(value) ? 0 : 1)} %`}
          better="lower"
          scale={scale}
          efficientLabel={t.tradeoff.efficient}
          legend={false}
          picker
          empty={t.tradeoff.empty}
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField value={query} onChange={setQuery} placeholder={ui.search} clearLabel={t.compare.clear} className="flex-1" />
        <SegmentedControl
          value={bestOnly ? "best" : "all"}
          onChange={(value) => setBestOnly(value === "best")}
          label={ui.bestOnly}
          options={[
            { value: "best", label: ui.bestOnly },
            { value: "all", label: ui.allEfforts },
          ]}
        />
        <p role="status" className="shrink-0 text-xs text-muted-foreground">
          {rows.length} / {leaderboard.rows.length} {ui.configurations}
        </p>
      </div>

      {rows.length === 0 ? (
        <p role="status" className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">{t.grid.noResults}</p>
      ) : (
        <>
          <ol className="grid grid-cols-1 gap-2 md:hidden">
            {rows.map((row) => (
              <li key={row.config} className="rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 shrink-0 pt-1 text-xs font-semibold tabular-nums text-muted-foreground">#{ranks.get(row)}</span>
                  <ModelProviderIcon provider={getModelProviderKey(info(row)?.slug ?? row.model, creatorOf(row))} iconUrl={info(row)?.iconUrl} size={28} />
                  <div className="min-w-0 flex-1">
                    <ModelName row={row} info={info(row)} name={nameOf(row)} />
                    <p className="mt-0.5 text-xs text-muted-foreground">{row.harness ?? "—"}</p>
                  </div>
                  <ScoreBar value={row.pass_at_1} label={formatPercent(row.pass_at_1, lang)} className="w-20" />
                </div>
                <dl className="mt-3 grid grid-cols-4 gap-2 border-t pt-3 text-xs">
                  {[
                    [ui.byPass4, formatPercent(row.pass_at_4, lang)],
                    [copy.headers.cost, formatMoney(row.mean_cost_usd, lang)],
                    [copy.headers.time, formatDuration(row.mean_duration_seconds, lang)],
                    [copy.headers.outputTokens, formatTokens(row.mean_output_tokens, lang)],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="truncate text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ol>

          <div className="hidden overflow-clip rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{copy.title}</caption>
              <thead className="model-table-head">
                <tr>
                  <th scope="col" className="w-12 px-4 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">{copy.headers.model}</th>
                  {headers.map((header) => (
                    <th
                      key={header.key}
                      scope="col"
                      aria-sort={sort === header.key ? (direction === "asc" ? "ascending" : "descending") : undefined}
                      className="px-2 py-1.5 text-right text-xs font-medium text-muted-foreground"
                    >
                      <SortButton active={sort === header.key} direction={direction} label={header.label} hint={directionHint(header.key)} onClick={() => sortBy(header.key)} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.config} className="border-b transition-colors duration-150 last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums text-muted-foreground">
                      {row === top ? <Trophy aria-label="#1" className="size-4 text-foreground" /> : ranks.get(row)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <ModelProviderIcon provider={getModelProviderKey(info(row)?.slug ?? row.model, creatorOf(row))} iconUrl={info(row)?.iconUrl} size={28} />
                        <div className="min-w-0">
                          <ModelName row={row} info={info(row)} name={nameOf(row)} />
                          <p className="truncate text-xs text-muted-foreground">{info(row)?.creatorName ?? row.harness ?? row.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ScoreBar
                        value={row.pass_at_1}
                        label={formatPercent(row.pass_at_1, lang)}
                        interval={row.ci_lo != null && row.ci_hi != null ? { low: row.ci_lo, high: row.ci_hi } : null}
                        className="ml-auto w-24"
                      />
                      {row.ci_lo != null && row.ci_hi != null && (
                        <span className="mt-1 block text-[11px] tabular-nums text-muted-foreground" title={copy.headers.confidence}>
                          {formatPercent(row.ci_lo, lang)}–{formatPercent(row.ci_hi, lang)}
                        </span>
                      )}
                    </td>
                    <Cell active={sort === "pass4"}>{formatPercent(row.pass_at_4, lang)}</Cell>
                    <Cell active={sort === "cost"}>{formatMoney(row.mean_cost_usd, lang)}</Cell>
                    <Cell active={sort === "time"}>{formatDuration(row.mean_duration_seconds, lang)}</Cell>
                    <Cell active={sort === "tokens"}>{formatTokens(row.mean_output_tokens, lang)}</Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {version === "v1.1" && data.comparison && <VersionComparison comparison={data.comparison} nameOf={(model) => nameOf({ model, reasoning_effort: null } as DeepSweRow)} />}
        <Disclosure title={t.benchmarkUi.methodology}>
          <p>{copy.methodDescription}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["pass@1", "pass@4", ...new Set(leaderboard.rows.map((row) => row.harness).filter((value): value is string => Boolean(value)))].map((item) => (
              <Badge key={item} variant="secondary" className="font-mono text-xs">{item}</Badge>
            ))}
          </div>
          {leaderboard.generated_at && (
            <p className="mt-3 text-xs">{copy.stats.updated} : {formatDate(leaderboard.generated_at, lang)}</p>
          )}
        </Disclosure>
        {rows.some((row) => row.cost_basis) && (
          <Disclosure title={t.benchmarkUi.costBasis}>
            <ul className="space-y-2">
              {rows.filter((row) => row.cost_basis).map((row) => (
                <li key={row.config}>
                  <span className="font-medium text-foreground">{nameOf(row)} · {row.reasoning_effort ?? "default"} : </span>
                  {row.cost_basis}
                </li>
              ))}
            </ul>
          </Disclosure>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{copy.sourceNote}</p>
    </div>
  );
}

function Cell({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <td className={cn("whitespace-nowrap px-3 py-3 text-right tabular-nums", active ? "font-semibold" : "text-muted-foreground")}>{children}</td>;
}

function ModelName({ row, info, name }: { row: DeepSweRow; info: DeepSweModelInfo | undefined; name: string }) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {info ? (
        <Link href={`/models/${info.slug}`} className="truncate rounded-sm font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {name}
        </Link>
      ) : (
        <span className="truncate font-medium" title={row.model}>{name}</span>
      )}
      {row.reasoning_effort && <Badge variant="secondary" className="font-mono text-[10px] uppercase">{row.reasoning_effort}</Badge>}
    </span>
  );
}

function VersionComparison({
  comparison,
  nameOf,
}: {
  comparison: NonNullable<DeepSweData["comparison"]>;
  nameOf: (model: string) => string;
}) {
  const { t, lang } = useI18n();
  const copy = t.deepSwe;
  const points = (value: number | null) =>
    value == null ? "—" : `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value * 100), lang)} pts`;
  const pooledDelta = comparison.pooled.current != null && comparison.pooled.v1 != null
    ? comparison.pooled.current - comparison.pooled.v1
    : null;
  return (
    <Disclosure title={copy.comparison}>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["v1", formatPercent(comparison.pooled.v1, lang)],
          ["v1.1", formatPercent(comparison.pooled.current, lang)],
          [copy.delta, points(pooledDelta)],
          [copy.sharedConfigs, formatNumber(comparison.n_shared_configs, lang, 0)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-background/60 p-2.5">
            <dt>{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      {comparison.scope && <p className="mt-3">{comparison.scope}</p>}
      <table className="mt-3 w-full">
        <thead>
          <tr className="border-b text-left">
            <th scope="col" className="py-1.5 font-medium">{copy.headers.model}</th>
            <th scope="col" className="py-1.5 text-right font-medium">v1</th>
            <th scope="col" className="py-1.5 text-right font-medium">v1.1</th>
            <th scope="col" className="py-1.5 text-right font-medium">{copy.delta}</th>
          </tr>
        </thead>
        <tbody>
          {comparison.configs.map((row) => (
            <tr key={row.config} className="border-b last:border-b-0">
              <td className="py-1.5 text-foreground">
                {nameOf(row.model)} <span className="font-mono text-[10px] uppercase text-muted-foreground">{row.reasoning_effort ?? ""}</span>
              </td>
              <td className="py-1.5 text-right tabular-nums">{formatPercent(row.v1, lang)}</td>
              <td className="py-1.5 text-right tabular-nums">{formatPercent(row.current, lang)}</td>
              <td className={cn("py-1.5 text-right tabular-nums", (row.delta ?? 0) !== 0 && "text-foreground")}>{points(row.delta)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Disclosure>
  );
}
