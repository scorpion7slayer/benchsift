import { useEffect, useMemo, useRef, useState } from "react";
import { Shield, Trophy } from "@/components/icons";
import { BenchmarkDisclosure, BenchmarkHeader, ScoreBar, StatTiles } from "@/components/benchmark-page";
import { CatalogSelect } from "@/components/catalog-select";
import { Link } from "@/components/link";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { SearchField } from "@/components/search-field";
import { SegmentedControl } from "@/components/segmented-control";
import { SortButton } from "@/components/sort-button";
import { TradeoffChart, type ChartScale, type ChartSeries } from "@/components/tradeoff-chart";
import { Badge } from "@/components/ui/badge";
import {
  cyberDefaultDirection,
  cyberOutcomeShares,
  parseCyberSearch,
  selectCyberRows,
  type CyberLeaderboard,
  type CyberLeaderboardRow,
  type CyberSearch,
} from "@/lib/cyber-index";
import { formatMoney, formatMoneyCompact, formatNumber, formatPercent } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { matchesSearch } from "@/lib/model-grid-logic";
import { providerColor, shadeIndex } from "@/lib/provider-colors";
import { getModelProviderKey } from "@/lib/provider-map";
import { cn } from "@/lib/utils";
import { AccessRestrictionBadge } from "@/components/model-availability";
import { PageCat } from "@/components/pixel-art/page-cats";
import { CyberBenchmarkScore, CyberLegend, CyberOutcomeBar, formatCyberScore } from "./cyber-outcome";

const URL_QUERY_DELAY_MS = 300;
const AA_CYBER_URL = "https://artificialanalysis.ai/#cyber-index";

/**
 * Artificial Analysis Cyber Index: headline figures, score against cost per
 * task, then the leaderboard with each configuration's successes, safety
 * blocks and benchmark scores. Ranks always follow the index; the view state
 * (search, availability, sort, chart score) lives in the URL.
 */
export function CyberIndexView({
  data,
  search,
  onSearchChange,
}: {
  data: CyberLeaderboard;
  search: CyberSearch;
  onSearchChange: (search: CyberSearch) => void;
}) {
  const { t, lang } = useI18n();
  const copy = t.cyber;
  const ui = t.benchmarkUi;
  const [query, setQuery] = useState(search.q ?? "");
  const [scale, setScale] = useState<ChartScale>("log");
  const latestSearch = useRef(search);
  useEffect(() => {
    latestSearch.current = search;
  }, [search]);
  // An outside change of the URL (a link back here) resets the search box.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery((current) => (current.trim() === (search.q ?? "") ? current : search.q ?? ""));
  }, [search.q]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const q = query.trim() || undefined;
      if (q !== latestSearch.current.q) onSearchChange(parseCyberSearch({ ...latestSearch.current, q }));
    }, URL_QUERY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [query, onSearchChange]);

  const benchmarkIds = new Set(data.benchmarks.map((benchmark) => benchmark.id));
  const sort = search.sort && (search.sort === "blocks" || search.sort === "cost" || benchmarkIds.has(search.sort)) ? search.sort : "index";
  const direction = search.dir ?? cyberDefaultDirection(sort);
  const chart = search.chart && benchmarkIds.has(search.chart) ? search.chart : "index";
  const publicOnly = search.access === "public";
  const update = (patch: Partial<CyberSearch>) => onSearchChange(parseCyberSearch({ ...search, ...patch }));

  const appliedQuery = query.toLowerCase().trim();
  const rows = useMemo(
    () =>
      selectCyberRows(data.rows, {
        matches: (row) =>
          matchesSearch({ name: row.name, slug: row.slug, model_creator: { name: row.creatorName, slug: row.creatorSlug } }, appliedQuery),
        publicOnly,
        sort,
        direction,
      }),
    [data.rows, appliedQuery, publicOnly, sort, direction],
  );

  const chartLabel = chart === "index" ? copy.headers.index : data.benchmarks.find((benchmark) => benchmark.id === chart)?.label ?? chart;
  const series = useMemo<ChartSeries[]>(() => {
    const shade = shadeIndex();
    return rows.flatMap((row) => {
      const benchmark = chart === "index" ? null : row.result.benchmarks.find((item) => item.id === chart);
      const x = chart === "index" ? row.result.cost_per_task_usd : benchmark?.cost_per_task_usd ?? null;
      const y = chart === "index" ? row.result.score : benchmark?.score == null ? null : benchmark.score * 100;
      if (x == null || y == null) return [];
      const color = providerColor(row.creatorSlug, shade(row.creatorSlug));
      return [{
        id: row.slug,
        label: row.name,
        color,
        highlights: [{ id: row.slug, color }],
        points: [{ id: row.slug, name: row.name, tag: null, x, y }],
      }];
    });
  }, [rows, chart]);

  function sortBy(next: string) {
    update({
      sort: next === "index" ? undefined : next,
      dir: next === sort ? (direction === "asc" ? "desc" : "asc") : undefined,
    });
  }

  const source = { href: AA_CYBER_URL, label: copy.viewOnAA };
  if (data.rows.length === 0) {
    return (
      <div className="space-y-6">
        <BenchmarkHeader icon={Shield} title={copy.title} description={copy.description} source={source} />
        <p role="status" className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{copy.empty}</p>
      </div>
    );
  }

  const top = data.rows[0];
  const topPublic = data.rows.find((row) => row.result.access !== "trusted") ?? null;
  const cheapest = data.rows
    .slice(0, 10)
    .reduce<CyberLeaderboardRow | null>(
      (best, row) =>
        row.result.cost_per_task_usd != null && (best?.result.cost_per_task_usd == null || row.result.cost_per_task_usd < best.result.cost_per_task_usd)
          ? row
          : best,
      null,
    );
  const blockedCount = data.rows.filter((row) => (row.result.safety_block_rate ?? 0) > 0).length;
  const hasTrusted = data.rows.some((row) => row.result.access === "trusted");
  const hasBlocks = data.rows.some((row) => row.result.benchmarks.some((benchmark) => benchmark.safety_blocks));
  const colon = lang === "fr" ? " : " : ": ";
  const directionHint = (key: string) =>
    sort === key ? (direction === "asc" ? t.grid.direction.asc : t.grid.direction.desc) : undefined;
  const headers = [
    { key: "index", label: copy.headers.index },
    { key: "blocks", label: copy.headers.safetyBlocks },
    ...data.benchmarks.map((benchmark) => ({ key: benchmark.id, label: benchmark.label })),
    { key: "cost", label: copy.headers.cost },
  ];

  return (
    <div className="flex flex-col gap-6">
      <BenchmarkHeader icon={Shield} title={copy.title} description={copy.description} source={source}>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {data.version && <Badge variant="outline" className="font-mono text-xs">{copy.version(data.version)}</Badge>}
          {data.benchmarks.map((benchmark) => (
            <Badge key={benchmark.id} variant="secondary" className="font-mono text-xs">{benchmark.label}</Badge>
          ))}
        </div>
      </BenchmarkHeader>

      <div className="relative">
        <PageCat kind="cyber" className="absolute bottom-[calc(100%+1px)] right-6" />
        <StatTiles
          tiles={[
            { key: "configs", label: copy.stats.configs, value: formatNumber(data.rows.length, lang, 0) },
            {
              key: "best",
              label: copy.stats.best,
              value: formatCyberScore(top.result.score, lang),
              detail: top.result.access === "trusted" ? `${top.name} · ${t.card.trustedAccessBadge}` : top.name,
              hint: t.glossary.cyber,
            },
            top.result.access === "trusted" && topPublic
              ? {
                  key: "best-public",
                  label: copy.stats.bestPublic,
                  value: formatCyberScore(topPublic.result.score, lang),
                  detail: topPublic.name,
                }
              : {
                  key: "cheapest",
                  label: ui.cheapestTop,
                  value: formatMoney(cheapest?.result.cost_per_task_usd, lang),
                  detail: cheapest ? `${cheapest.name} · ${formatCyberScore(cheapest.result.score, lang)}` : undefined,
                },
            {
              key: "blocked",
              label: copy.stats.safetyBlocked,
              value: formatNumber(blockedCount, lang, 0),
              detail: copy.stats.safetyBlockedDetail(data.rows.length),
              hint: t.glossary.safetyBlocks,
            },
          ]}
        />
      </div>

      <section aria-labelledby="cyber-chart-title" className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 id="cyber-chart-title" className="text-base font-semibold">{copy.chartTitle}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{copy.chartHint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CatalogSelect
              value={chart}
              onChange={(value) => update({ chart: value === "index" ? undefined : value })}
              label={copy.chartMetric}
              className="sm:w-52"
              options={[
                { value: "index", label: copy.headers.index },
                ...data.benchmarks.map((benchmark) => ({ value: benchmark.id, label: benchmark.label })),
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
          title={copy.chartTitle}
          xLabel={ui.axisCost}
          yLabel={`${chartLabel} · %`}
          formatX={(value) => formatMoneyCompact(value, lang)}
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
        <SearchField value={query} onChange={setQuery} placeholder={t.grid.search} clearLabel={t.compare.clear} className="flex-1" />
        {hasTrusted && (
          <SegmentedControl
            value={publicOnly ? "public" : "all"}
            onChange={(value) => update({ access: value === "public" ? "public" : undefined })}
            label={copy.access.label}
            options={[
              { value: "all", label: copy.access.all },
              { value: "public", label: copy.access.public },
            ]}
          />
        )}
        <p role="status" className="shrink-0 text-xs text-muted-foreground">
          {rows.length} / {data.rows.length} {ui.configurations}
        </p>
      </div>

      <CyberLegend trusted={hasTrusted} />

      {rows.length === 0 ? (
        <p role="status" className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">{t.grid.noResults}</p>
      ) : (
        <>
          <ol className="grid grid-cols-1 gap-2 lg:hidden">
            {rows.map((row) => (
              <li key={row.slug} className="rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 shrink-0 pt-1 text-xs font-semibold tabular-nums text-muted-foreground">#{row.rank}</span>
                  <ModelProviderIcon provider={getModelProviderKey(row.slug, row.creatorSlug)} iconUrl={row.iconUrl} size={28} />
                  <div className="min-w-0 flex-1">
                    <ModelName row={row} />
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.creatorName}</p>
                  </div>
                  <span className="shrink-0 text-right font-semibold tabular-nums">{formatCyberScore(row.result.score, lang)}</span>
                </div>
                <Outcome row={row} className="mt-3" />
                <dl className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs sm:grid-cols-4">
                  {row.result.benchmarks.map((benchmark) => (
                    <div key={benchmark.id} className="min-w-0">
                      <dt className="truncate text-muted-foreground">{benchmark.label}</dt>
                      <dd className="mt-0.5 font-medium tabular-nums"><CyberBenchmarkScore benchmark={benchmark} /></dd>
                    </div>
                  ))}
                  <div className="min-w-0">
                    <dt className="truncate text-muted-foreground">{copy.headers.cost}</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(row.result.cost_per_task_usd, lang)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>

          <div className="hidden overflow-clip rounded-xl border bg-card lg:block">
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
                      <SortButton
                        active={sort === header.key}
                        direction={direction}
                        label={header.label}
                        hint={directionHint(header.key)}
                        onClick={() => sortBy(header.key)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.slug} className="border-b transition-colors duration-150 last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums text-muted-foreground">
                      {row.rank === 1 ? <Trophy aria-label="#1" className="size-4 text-foreground" /> : row.rank}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <ModelProviderIcon provider={getModelProviderKey(row.slug, row.creatorSlug)} iconUrl={row.iconUrl} size={28} />
                        <div className="min-w-0">
                          <ModelName row={row} />
                          <p className="truncate text-xs text-muted-foreground">{row.creatorName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={cn("block tabular-nums", sort === "index" && "font-semibold")}>{formatCyberScore(row.result.score, lang)}</span>
                      <CyberOutcomeBar result={row.result} className="ml-auto mt-1 w-28" />
                    </td>
                    <Cell active={sort === "blocks"}>{formatPercent(row.result.safety_block_rate, lang)}</Cell>
                    {data.benchmarks.map((benchmark) => {
                      const result = row.result.benchmarks.find((item) => item.id === benchmark.id);
                      return (
                        <td key={benchmark.id} className="px-3 py-3 text-right">
                          <ScoreBar
                            value={result?.score ?? null}
                            label={<CyberBenchmarkScore benchmark={result} />}
                            className="ml-auto w-24"
                          />
                        </td>
                      );
                    })}
                    <Cell active={sort === "cost"}>{formatMoney(row.result.cost_per_task_usd, lang)}</Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {hasBlocks && <p className="-mt-3 text-xs text-muted-foreground">{copy.footnote}</p>}

      <div className="grid gap-3 lg:grid-cols-2">
        <BenchmarkDisclosure title={ui.methodology}>
          <p>{copy.methodDescription}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.benchmarks.map((benchmark) => (
              <Badge key={benchmark.id} variant="secondary" className="font-mono text-xs">{benchmark.label}</Badge>
            ))}
          </div>
          <p className="mt-3"><span className="font-medium text-foreground">{copy.legend.safetyBlocks}{colon}</span>{t.glossary.safetyBlocks}</p>
          {hasTrusted && (
            <p className="mt-2"><span className="font-medium text-foreground">{copy.legend.trustedAccess}{colon}</span>{t.glossary.trustedAccess}</p>
          )}
        </BenchmarkDisclosure>
      </div>
      <p className="text-xs text-muted-foreground">{copy.sourceNote}</p>
    </div>
  );
}

function Cell({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <td className={cn("whitespace-nowrap px-3 py-3 text-right tabular-nums", active ? "font-semibold" : "text-muted-foreground")}>{children}</td>;
}

function ModelName({ row }: { row: CyberLeaderboardRow }) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <Link
        href={`/models/${row.slug}`}
        className="truncate rounded-sm font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {row.name}
      </Link>
      {row.result.access === "trusted" && <AccessRestrictionBadge restriction="trusted_access" compact />}
    </span>
  );
}

/** The outcome bar with its values, for the stacked mobile cards. */
function Outcome({ row, className }: { row: CyberLeaderboardRow; className?: string }) {
  const { t, lang } = useI18n();
  const shares = cyberOutcomeShares(row.result);
  return (
    <div className={className}>
      <CyberOutcomeBar result={row.result} />
      <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
        {t.cyber.outcome(formatPercent(shares.successes, lang), shares.safetyBlocks == null ? null : formatPercent(shares.safetyBlocks, lang))}
      </p>
    </div>
  );
}
