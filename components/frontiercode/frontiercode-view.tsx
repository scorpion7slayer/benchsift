import { useMemo, useState } from "react";
import { ChevronDown, Gauge, Trophy } from "@/components/icons";
import { SearchField } from "@/components/search-field";
import { Link } from "@/components/link";
import { BenchmarkHeader, ScoreBar, StatTiles } from "@/components/benchmark-page";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { CreatorMark } from "@/components/creator-mark";
import { SegmentedControl } from "@/components/segmented-control";
import { PageCat } from "@/components/pixel-art/page-cats";
import { TradeoffChart, type ChartScale, type ChartSeries } from "@/components/tradeoff-chart";
import { Badge } from "@/components/ui/badge";
import type { FrontierCodeModelInfo } from "@/lib/frontiercode-catalog";
import {
  selectFrontierCodeRows,
  type FrontierCodeData,
  type FrontierCodeRow,
  type FrontierCodeSort,
} from "@/lib/frontiercode-data";
import { formatDate, formatDuration, formatMoney, formatMoneyCompact, formatNumber, formatPercent, formatTokens } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getModelLogoKey, resolveCreatorFromModelSlug } from "@/lib/provider-map";
import { providerColor, shadeIndex } from "@/lib/provider-colors";

const SOURCE_URL = "https://artificialanalysis.ai/evaluations/frontiercode";

type XAxis = "cost" | "time" | "tokens";

const X_VALUE: Record<XAxis, (row: FrontierCodeRow) => number | null> = {
  cost: (row) => row.cost_per_task_usd,
  time: (row) => row.time_per_task_seconds,
  tokens: (row) => row.output_tokens_per_task,
};

/**
 * FrontierCode leaderboard from Artificial Analysis: headline figures, then a
 * searchable table. Ranks follow the full source order, so filters never
 * renumber them.
 */
export function FrontierCodeView({ data }: { data: FrontierCodeData & { catalog: Record<string, FrontierCodeModelInfo> } }) {
  const { t, lang } = useI18n();
  const copy = t.frontierCode;
  const colon = lang === "fr" ? " : " : ": ";
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<FrontierCodeSort>("score");
  const [xAxis, setXAxis] = useState<XAxis>("cost");
  // Costs span two orders of magnitude, so the log scale keeps cheap models apart.
  const [scale, setScale] = useState<ChartScale>("log");

  const creatorOf = (row: FrontierCodeRow) =>
    data.catalog[row.slug]?.creatorSlug ?? row.creator_slug ?? resolveCreatorFromModelSlug(row.slug, row.slug.split("-")[0] ?? "");
  const creatorName = (row: FrontierCodeRow) => data.catalog[row.slug]?.creatorName ?? row.creator_name;

  const ranks = useMemo(() => new Map(data.rows.map((row, index) => [row, index + 1])), [data.rows]);
  const rows = useMemo(
    () => selectFrontierCodeRows(data.rows, { query, openOnly, sort }),
    [data.rows, query, openOnly, sort],
  );

  // One point per visible model, best first so the leaders keep their labels.
  const series = useMemo<ChartSeries[]>(() => {
    const visible = new Set(rows);
    const shade = shadeIndex();
    return data.rows.flatMap((row) => {
      const x = X_VALUE[xAxis](row);
      if (!visible.has(row) || x === null) return [];
      const creator = creatorOf(row);
      const color = providerColor(creator, shade(creator));
      return [{
        id: row.slug,
        label: row.family_name,
        color,
        highlights: [{ id: row.slug, color }],
        points: [{ id: row.slug, name: row.name, tag: row.configuration, x, y: row.score * 100 }],
      }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, data.rows, data.catalog, xAxis]);

  const source = { href: SOURCE_URL, label: copy.viewOnSource };
  if (data.rows.length === 0) {
    return (
      <div className="space-y-6">
        <BenchmarkHeader icon={Gauge} title={copy.title} description={copy.description} source={source} />
        <p role="status" className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{copy.empty}</p>
      </div>
    );
  }

  const top = data.rows[0];
  const topOpen = data.rows.find((row) => row.is_open_weights === true) ?? null;
  const newest = data.rows.reduce<FrontierCodeRow | null>((best, row) => {
    const time = row.release_date ? Date.parse(row.release_date) : Number.NaN;
    if (Number.isNaN(time)) return best;
    return best === null || time > Date.parse(best.release_date!) ? row : best;
  }, null);

  return (
    <div className="flex flex-col gap-6">
      <BenchmarkHeader icon={Gauge} title={copy.title} description={copy.description} source={source} />

      <div className="relative">
        <PageCat kind="frontiercode" className="absolute bottom-[calc(100%+1px)] right-6" />
        <StatTiles
          tiles={[
            { key: "models", label: copy.stats.models, value: formatNumber(data.rows.length, lang, 0) },
            {
              key: "best",
              label: copy.stats.best,
              value: formatPercent(top.score, lang),
              detail: top.name,
              hint: copy.scoreHint,
            },
            {
              key: "open",
              label: copy.stats.bestOpen,
              value: formatPercent(topOpen?.score, lang),
              detail: topOpen?.name,
            },
            {
              key: "newest",
              label: copy.stats.newest,
              value: newest?.family_name ?? "—",
              detail: newest ? `${formatDate(newest.release_date, lang)} · ${formatPercent(newest.score, lang)}` : undefined,
            },
          ]}
        />
      </div>

      <section aria-labelledby="frontiercode-chart-title" className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 id="frontiercode-chart-title" className="text-base font-semibold">{copy.chartTitle}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{copy.chartHint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SegmentedControl
              value={xAxis}
              onChange={setXAxis}
              label={t.tradeoff.xAxis}
              size="sm"
              options={[
                { value: "cost", label: copy.headers.cost },
                { value: "time", label: copy.headers.time },
                { value: "tokens", label: copy.headers.tokens },
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
          xLabel={copy.axes[xAxis]}
          yLabel="FrontierCode 1.1 · %"
          formatX={(value) => (xAxis === "cost" ? formatMoneyCompact(value, lang) : xAxis === "time" ? formatDuration(value, lang) : formatTokens(value, lang))}
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
        <SearchField value={query} onChange={setQuery} placeholder={copy.search} clearLabel={t.compare.clear} className="flex-1" />
        <SegmentedControl
          value={openOnly ? "open" : "all"}
          onChange={(value) => setOpenOnly(value === "open")}
          label={copy.openOnly}
          options={[
            { value: "all", label: copy.allModels },
            { value: "open", label: copy.openOnly },
          ]}
        />
        <SegmentedControl
          value={sort}
          onChange={setSort}
          label={copy.sortBy}
          options={[
            { value: "score", label: copy.headers.score },
            { value: "release", label: copy.headers.release },
          ]}
        />
        <p role="status" className="shrink-0 text-xs text-muted-foreground">
          {rows.length} / {data.rows.length} {copy.models}
        </p>
      </div>

      {rows.length === 0 ? (
        <p role="status" className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">{t.grid.noResults}</p>
      ) : (
        <>
          <ol className="grid grid-cols-1 gap-2 lg:hidden">
            {rows.map((row) => (
              <li key={row.slug} className="rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 shrink-0 pt-1 text-xs font-semibold tabular-nums text-muted-foreground">#{ranks.get(row)}</span>
                  <ModelProviderIcon provider={getModelLogoKey(data.catalog[row.slug]?.slug ?? row.slug, creatorOf(row))} iconUrl={data.catalog[row.slug]?.iconUrl} size={28} />
                  <div className="min-w-0 flex-1">
                    <ModelName row={row} info={data.catalog[row.slug]} />
                    <p className="mt-0.5 text-xs text-muted-foreground"><CreatorMark slug={creatorName(row) ? creatorOf(row) : null} />{creatorName(row) ?? "—"}</p>
                  </div>
                  <ScoreBar value={row.score} label={formatPercent(row.score, lang)} className="w-20" />
                </div>
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
                  <span>{copy.headers.release}{colon}<span className="font-medium tabular-nums text-foreground">{formatDate(row.release_date, lang)}</span></span>
                  <span>{copy.headers.cost}{colon}<span className="font-medium tabular-nums text-foreground">{formatMoney(row.cost_per_task_usd, lang)}</span></span>
                  <span>{copy.headers.time}{colon}<span className="font-medium tabular-nums text-foreground">{formatDuration(row.time_per_task_seconds, lang)}</span></span>
                  <span>{copy.headers.tokens}{colon}<span className="font-medium tabular-nums text-foreground">{formatTokens(row.output_tokens_per_task, lang)}</span></span>
                  <Traits row={row} />
                </p>
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
                  <th scope="col" aria-sort={sort === "score" ? "descending" : undefined} className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.score}</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.cost}</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.time}</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.tokens}</th>
                  <th scope="col" aria-sort={sort === "release" ? "descending" : undefined} className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.release}</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{copy.headers.traits}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.slug} className="border-b transition-colors duration-150 last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums text-muted-foreground">
                      {row === top ? <Trophy aria-label="#1" className="size-4 text-foreground" /> : ranks.get(row)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <ModelProviderIcon provider={getModelLogoKey(data.catalog[row.slug]?.slug ?? row.slug, creatorOf(row))} iconUrl={data.catalog[row.slug]?.iconUrl} size={28} />
                        <div className="min-w-0">
                          <ModelName row={row} info={data.catalog[row.slug]} />
                          <p className="truncate text-xs text-muted-foreground"><CreatorMark slug={creatorName(row) ? creatorOf(row) : null} />{creatorName(row) ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className={cn("px-3 py-3 text-right", sort !== "score" && "text-muted-foreground")}>
                      <ScoreBar value={row.score} label={formatPercent(row.score, lang)} className="ml-auto w-24" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{formatMoney(row.cost_per_task_usd, lang)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">{formatDuration(row.time_per_task_seconds, lang)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">{formatTokens(row.output_tokens_per_task, lang)}</td>
                    <td className={cn("whitespace-nowrap px-3 py-3 text-right tabular-nums", sort === "release" ? "font-semibold" : "text-muted-foreground")}>
                      {formatDate(row.release_date, lang)}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground"><span className="flex flex-wrap gap-1.5"><Traits row={row} /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <details className="group rounded-xl border bg-card">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 text-sm font-medium transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          {t.benchmarkUi.methodology}
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="disclosure-content border-t px-4 py-3 text-xs leading-5 text-muted-foreground">
          <p>{copy.methodDescription}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-4">
            {Object.values(copy.method).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </details>
      <p className="text-xs text-muted-foreground">{copy.sourceNote}</p>
    </div>
  );
}

function ModelName({ row, info }: { row: FrontierCodeRow; info: FrontierCodeModelInfo | undefined }) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {info ? (
        <Link href={`/models/${info.slug}`} className="truncate rounded-sm font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {row.family_name}
        </Link>
      ) : (
        <span className="truncate font-medium" title={row.name}>{row.family_name}</span>
      )}
      {row.configuration && <Badge variant="secondary" className="font-mono text-[10px] uppercase">{row.configuration}</Badge>}
    </span>
  );
}

function Traits({ row }: { row: FrontierCodeRow }) {
  const { t } = useI18n();
  const traits = [
    row.is_reasoning === true ? t.frontierCode.traits.reasoning : null,
    row.is_open_weights === true ? t.frontierCode.traits.openWeights : null,
  ].filter((value): value is string => value !== null);
  if (traits.length === 0) return <span aria-hidden="true">—</span>;
  return (
    <>
      {traits.map((trait) => (
        <Badge key={trait} variant="outline" className="text-[10px]">{trait}</Badge>
      ))}
    </>
  );
}
