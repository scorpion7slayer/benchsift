import { useMemo, useState } from "react";
import { Route, Trophy } from "@/components/icons";
import { SearchField } from "@/components/search-field";
import { Link } from "@/components/link";
import { BenchmarkDisclosure, BenchmarkHeader, ScoreBar, StatTiles } from "@/components/benchmark-page";
import { InfoTip } from "@/components/info-tip";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { CreatorMark } from "@/components/creator-mark";
import { SegmentedControl } from "@/components/segmented-control";
import { PageCat } from "@/components/pixel-art/page-cats";
import { TradeoffChart, type ChartScale, type ChartSeries } from "@/components/tradeoff-chart";
import { Badge } from "@/components/ui/badge";
import type { DecisionIndexModelInfo } from "@/lib/decision-index-catalog";
import {
  DECISION_SCORE_KEYS,
  selectDecisionIndexRows,
  type DecisionIndexData,
  type DecisionIndexRow,
  type DecisionKindFilter,
} from "@/lib/decision-index-data";
import { formatMoney, formatMoneyCompact, formatNumber, formatSeconds } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { getModelLogoKey } from "@/lib/provider-map";
import { providerColor, shadeIndex } from "@/lib/provider-colors";

const SOURCE_URL = "https://artificialanalysis.ai/evaluations/artificial-analysis-decision-index";
/** AA charts cost per million tasks; a single decision costs fractions of a cent. */
const TASKS_PER_COST = 1_000_000;

type XAxis = "cost" | "time";

const X_VALUE: Record<XAxis, (row: DecisionIndexRow) => number | null> = {
  cost: (row) => (row.cost_per_task_usd === null ? null : row.cost_per_task_usd * TASKS_PER_COST),
  time: (row) => row.time_per_task_seconds,
};

type Data = DecisionIndexData & { catalog: Record<string, DecisionIndexModelInfo> };

/**
 * Artificial Analysis Decision Index: headline figures, an index/cost chart,
 * then every measured configuration. Ranks follow the full source order, so
 * filters never renumber them.
 */
export function DecisionIndexView({ data }: { data: Data }) {
  const { t, lang } = useI18n();
  const copy = t.decisionIndex;
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<DecisionKindFilter>("all");
  const [xAxis, setXAxis] = useState<XAxis>("cost");
  // Costs span three orders of magnitude, so the log scale keeps cheap models apart.
  const [scale, setScale] = useState<ChartScale>("log");

  const creatorOf = (row: DecisionIndexRow) => data.catalog[row.id]?.creatorSlug ?? row.creator_slug ?? "";
  const creatorName = (row: DecisionIndexRow) => data.catalog[row.id]?.creatorName ?? row.creator_name;

  const ranks = useMemo(() => new Map(data.rows.map((row, index) => [row, index + 1])), [data.rows]);
  const rows = useMemo(() => selectDecisionIndexRows(data.rows, { query, kind }), [data.rows, query, kind]);

  // One point per visible configuration, best first so the leaders keep their labels.
  const series = useMemo<ChartSeries[]>(() => {
    const visible = new Set(rows);
    const shade = shadeIndex();
    return data.rows.flatMap((row) => {
      const x = X_VALUE[xAxis](row);
      if (!visible.has(row) || x === null) return [];
      const creator = creatorOf(row);
      const color = providerColor(creator, shade(creator));
      return [{
        id: row.id,
        label: row.name,
        color,
        highlights: [{ id: row.id, color }],
        points: [{ id: row.id, name: row.name, tag: copy.kindTags[row.kind], x, y: row.index }],
      }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, data.rows, data.catalog, xAxis, copy]);

  const source = { href: SOURCE_URL, label: copy.viewOnSource };
  if (data.rows.length === 0) {
    return (
      <div className="space-y-6">
        <BenchmarkHeader icon={Route} title={copy.title} description={copy.description} source={source} />
        <p role="status" className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{copy.empty}</p>
      </div>
    );
  }

  const top = data.rows[0];
  const topDecision = data.rows.find((row) => row.kind === "decision") ?? null;
  const fastest = data.rows.reduce<DecisionIndexRow | null>((best, row) => {
    if (row.time_per_task_seconds === null) return best;
    return best === null || row.time_per_task_seconds < best.time_per_task_seconds! ? row : best;
  }, null);
  const formatIndex = (value: number | null | undefined) => formatNumber(value, lang, 1);

  return (
    <div className="flex flex-col gap-6">
      <BenchmarkHeader icon={Route} title={copy.title} description={copy.description} source={source} />

      <div className="relative">
        <PageCat kind="decision" className="absolute bottom-[calc(100%+1px)] right-6" />
        <StatTiles
          tiles={[
            { key: "models", label: copy.stats.models, value: formatNumber(data.rows.length, lang, 0) },
            { key: "best", label: copy.stats.best, value: formatIndex(top.index), detail: top.name, hint: copy.indexHint },
            { key: "decision", label: copy.stats.bestDecision, value: formatIndex(topDecision?.index), detail: topDecision?.name },
            {
              key: "fastest",
              label: copy.stats.fastest,
              value: formatSeconds(fastest?.time_per_task_seconds, lang),
              detail: fastest ? `${fastest.name} · ${formatIndex(fastest.index)}` : undefined,
            },
          ]}
        />
      </div>

      <section aria-labelledby="decision-chart-title" className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 id="decision-chart-title" className="text-base font-semibold">{copy.chartTitle}</h2>
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
          yLabel="Decision Index"
          formatX={(value) => (xAxis === "cost" ? formatMoneyCompact(value, lang) : formatSeconds(value, lang))}
          formatY={(value) => formatNumber(value, lang, Number.isInteger(value) ? 0 : 1)}
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
          value={kind}
          onChange={setKind}
          label={copy.kindLabel}
          options={[
            { value: "all", label: copy.kinds.all },
            { value: "decision", label: copy.kinds.decision },
            { value: "llm", label: copy.kinds.llm },
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
          <ol className="grid grid-cols-1 gap-2 xl:hidden">
            {rows.map((row) => (
              <li key={row.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 shrink-0 pt-1 text-xs font-semibold tabular-nums text-muted-foreground">#{ranks.get(row)}</span>
                  <ModelProviderIcon provider={getModelLogoKey(data.catalog[row.id]?.slug ?? row.model_slug, creatorOf(row))} iconUrl={data.catalog[row.id]?.iconUrl} size={28} />
                  <div className="min-w-0 flex-1">
                    <ModelName row={row} info={data.catalog[row.id]} />
                    <Origin row={row} creator={creatorName(row)} creatorSlug={creatorOf(row)} />
                  </div>
                  <ScoreBar value={row.index / 100} label={formatIndex(row.index)} className="w-20" />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-3 text-xs sm:grid-cols-4">
                  {DECISION_SCORE_KEYS.map((key) => (
                    <div key={key} className="flex min-w-0 justify-between gap-2">
                      <dt className="truncate text-muted-foreground" title={copy.scores[key].label}>{copy.scores[key].short}</dt>
                      <dd className="font-medium tabular-nums">{formatIndex(row.scores[key])}</dd>
                    </div>
                  ))}
                  <div className="col-span-2 flex min-w-0 justify-between gap-2">
                    <dt className="truncate text-muted-foreground">{copy.headers.cost}</dt>
                    <dd className="font-medium tabular-nums">{formatMoney(X_VALUE.cost(row), lang)}</dd>
                  </div>
                  <div className="col-span-2 flex min-w-0 justify-between gap-2 sm:col-span-1">
                    <dt className="truncate text-muted-foreground">{copy.headers.time}</dt>
                    <dd className="font-medium tabular-nums">{formatSeconds(row.time_per_task_seconds, lang)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>

          <div className="hidden overflow-clip rounded-xl border bg-card xl:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{copy.title}</caption>
              <thead className="model-table-head">
                <tr>
                  <th scope="col" className="w-12 px-4 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">{copy.headers.model}</th>
                  <th scope="col" aria-sort="descending" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      {copy.headers.index}
                      <InfoTip label={`${t.glossary.infoLabel} · ${copy.headers.index}`} content={copy.indexHint} />
                    </span>
                  </th>
                  {DECISION_SCORE_KEYS.map((key) => (
                    <th key={key} scope="col" className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <abbr title={copy.scores[key].label} className="no-underline">{copy.scores[key].short}</abbr>
                        <InfoTip label={`${t.glossary.infoLabel} · ${copy.scores[key].label}`} content={copy.scores[key].hint} />
                      </span>
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.cost}</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.time}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b transition-colors duration-150 last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums text-muted-foreground">
                      {row === top ? <Trophy aria-label="#1" className="size-4 text-foreground" /> : ranks.get(row)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <ModelProviderIcon provider={getModelLogoKey(data.catalog[row.id]?.slug ?? row.model_slug, creatorOf(row))} iconUrl={data.catalog[row.id]?.iconUrl} size={28} />
                        <div className="min-w-0">
                          <ModelName row={row} info={data.catalog[row.id]} />
                          <Origin row={row} creator={creatorName(row)} creatorSlug={creatorOf(row)} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ScoreBar value={row.index / 100} label={formatIndex(row.index)} className="ml-auto w-20" />
                    </td>
                    {DECISION_SCORE_KEYS.map((key) => (
                      <td key={key} className="whitespace-nowrap px-2 py-3 text-right tabular-nums text-muted-foreground">{formatIndex(row.scores[key])}</td>
                    ))}
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{formatMoney(X_VALUE.cost(row), lang)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">{formatSeconds(row.time_per_task_seconds, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <BenchmarkDisclosure title={t.benchmarkUi.methodology}>
        <p>{copy.methodDescription}</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-4">
          {Object.values(copy.method).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </BenchmarkDisclosure>
      <p className="text-xs text-muted-foreground">{copy.sourceNote}</p>
    </div>
  );
}

function ModelName({ row, info }: { row: DecisionIndexRow; info: DecisionIndexModelInfo | undefined }) {
  const { t } = useI18n();
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {info ? (
        <Link href={`/models/${info.slug}`} className="min-w-0 rounded-sm font-medium [overflow-wrap:anywhere] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {row.name}
        </Link>
      ) : (
        <span className="min-w-0 font-medium [overflow-wrap:anywhere]">{row.name}</span>
      )}
      <Badge variant={row.kind === "decision" ? "secondary" : "outline"} className="text-[10px]">
        {t.decisionIndex.kindTags[row.kind]}
      </Badge>
    </span>
  );
}

/** Creator, and the host AA called when it differs (an inference provider or router). */
function Origin({ row, creator, creatorSlug }: { row: DecisionIndexRow; creator: string | null; creatorSlug: string }) {
  const host = row.host_name && row.host_name !== creator && row.host_name !== row.creator_name ? row.host_name : null;
  return (
    <p className="mt-0.5 truncate text-xs text-muted-foreground">
      {creator && <CreatorMark slug={creatorSlug} />}
      {creator ?? "—"}
      {host && <> · {host}</>}
    </p>
  );
}
