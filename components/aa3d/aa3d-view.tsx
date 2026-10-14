import { useMemo, useState } from "react";
import { Boxes, ChevronDown, Trophy } from "@/components/icons";
import { SearchField } from "@/components/search-field";
import { Link } from "@/components/link";
import { BenchmarkHeader, ScoreBar, StatTiles } from "@/components/benchmark-page";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { CreatorMark } from "@/components/creator-mark";
import { Aa3dAgent } from "@/components/aa3d/aa3d-agent";
import { Aa3dDomains } from "@/components/aa3d/aa3d-domains";
import { Aa3dTasks, type Aa3dSceneModel } from "@/components/aa3d/aa3d-tasks";
import { SegmentedControl } from "@/components/segmented-control";
import { TradeoffChart, type ChartScale, type ChartSeries } from "@/components/tradeoff-chart";
import { Badge } from "@/components/ui/badge";
import type { FrontierCodeModelInfo } from "@/lib/frontiercode-catalog";
import { selectAa3dRows, type Aa3dData, type Aa3dRow, type Aa3dSort } from "@/lib/aa3d-data";
import { formatDate, formatMoney, formatMoneyCompact, formatNumber, formatTokens } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getModelLogoKey, resolveCreatorFromModelSlug } from "@/lib/provider-map";
import { providerColor, shadeIndex } from "@/lib/provider-colors";

const SOURCE_URL = "https://artificialanalysis.ai/evaluations/aa-3d";

type XAxis = "cost" | "tokens" | "turns";

const X_VALUE: Record<XAxis, (row: Aa3dRow) => number | null> = {
  cost: (row) => row.cost_per_scene_usd,
  tokens: (row) => row.output_tokens_per_scene,
  turns: (row) => row.median_turns,
};

/**
 * AA-3D leaderboard from Artificial Analysis: headline figures, an Elo
 * trade-off chart and a searchable table; win rates by domain and agent
 * behavior follow the same search, then comes the task explorer. Ranks follow the full source
 * order, so filters never renumber them.
 */
export function Aa3dView({ data }: { data: Aa3dData & { catalog: Record<string, FrontierCodeModelInfo> } }) {
  const { t, lang } = useI18n();
  const copy = t.aa3d;
  const colon = lang === "fr" ? " : " : ": ";
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<Aa3dSort>("elo");
  const [xAxis, setXAxis] = useState<XAxis>("cost");
  // Costs per scene span two orders of magnitude, so the log scale keeps cheap models apart.
  const [scale, setScale] = useState<ChartScale>("log");

  const creatorOf = (row: Aa3dRow) =>
    data.catalog[row.slug]?.creatorSlug ?? row.creator_slug ?? resolveCreatorFromModelSlug(row.slug, row.slug.split("-")[0] ?? "");
  const creatorName = (row: Aa3dRow) => data.catalog[row.slug]?.creatorName ?? row.creator_name;

  const ranks = useMemo(() => new Map(data.rows.map((row, index) => [row, index + 1])), [data.rows]);
  const rows = useMemo(
    () => selectAa3dRows(data.rows, { query, openOnly, sort }),
    [data.rows, query, openOnly, sort],
  );
  // Elo has no fixed bounds: bars span the lowest to highest published value on the board.
  const bounds = useMemo(() => {
    const values = data.rows.flatMap((row) => [row.elo, row.elo_lower ?? row.elo, row.elo_upper ?? row.elo]);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [data.rows]);
  const share = (value: number) => (bounds.max > bounds.min ? (value - bounds.min) / (bounds.max - bounds.min) : 1);
  const sceneModels = useMemo(
    () => new Map<string, Aa3dSceneModel>(data.rows.map((row) => [row.slug, {
      name: row.name,
      logoKey: getModelLogoKey(data.catalog[row.slug]?.slug ?? row.slug, creatorOf(row)),
      iconUrl: data.catalog[row.slug]?.iconUrl,
    }])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.rows, data.catalog],
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
        points: [{ id: row.slug, name: row.name, tag: row.configuration, x, y: row.elo }],
      }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, data.rows, data.catalog, xAxis]);

  const source = { href: SOURCE_URL, label: copy.viewOnSource };
  if (data.rows.length === 0) {
    return (
      <div className="space-y-6">
        <BenchmarkHeader icon={Boxes} title={copy.title} description={copy.description} source={source} />
        <p role="status" className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{copy.empty}</p>
      </div>
    );
  }

  const top = data.rows[0];
  const topOpen = data.rows.find((row) => row.is_open_weights === true) ?? null;
  const cheapestTop = data.rows.slice(0, 5).reduce<Aa3dRow | null>(
    (best, row) => (row.cost_per_scene_usd != null && (best?.cost_per_scene_usd == null || row.cost_per_scene_usd < best.cost_per_scene_usd) ? row : best),
    null,
  );
  const elo = (value: number) => formatNumber(value, lang, 0);
  const formatTurns = (value: number | null) => (value == null ? "—" : formatNumber(value, lang, Number.isInteger(value) ? 0 : 1));

  return (
    <div className="flex flex-col gap-6">
      <BenchmarkHeader icon={Boxes} title={copy.title} description={copy.description} source={source} />

      <StatTiles
        tiles={[
          { key: "models", label: copy.stats.models, value: formatNumber(data.rows.length, lang, 0) },
          { key: "best", label: copy.stats.best, value: elo(top.elo), detail: top.name, hint: copy.eloHint },
          { key: "open", label: copy.stats.bestOpen, value: topOpen ? elo(topOpen.elo) : "—", detail: topOpen?.name },
          {
            key: "cheapest",
            label: copy.stats.cheapestTop,
            value: formatMoney(cheapestTop?.cost_per_scene_usd, lang),
            detail: cheapestTop ? `${cheapestTop.name} · ${elo(cheapestTop.elo)}` : undefined,
          },
        ]}
      />

      <section aria-labelledby="aa3d-chart-title" className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 id="aa3d-chart-title" className="text-base font-semibold">{copy.chartTitle}</h2>
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
                { value: "tokens", label: copy.headers.tokens },
                { value: "turns", label: copy.headers.turns },
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
          yLabel="AA-3D · Elo"
          formatX={(value) => (xAxis === "cost" ? formatMoneyCompact(value, lang) : xAxis === "tokens" ? formatTokens(value, lang) : formatTurns(value))}
          formatY={(value) => elo(value)}
          better="lower"
          scale={scale}
          efficientLabel={t.tradeoff.efficient}
          legend={false}
          picker
          yFromData
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
            { value: "elo", label: copy.headers.elo },
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
                  <div className="flex w-24 shrink-0 flex-col items-end gap-1">
                    <EloBar row={row} share={share} />
                    <Interval row={row} />
                  </div>
                </div>
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
                  <span>{copy.headers.release}{colon}<span className="font-medium tabular-nums text-foreground">{formatDate(row.release_date, lang)}</span></span>
                  <span>{copy.headers.cost}{colon}<span className="font-medium tabular-nums text-foreground">{formatMoney(row.cost_per_scene_usd, lang)}</span></span>
                  <span>{copy.headers.tokens}{colon}<span className="font-medium tabular-nums text-foreground">{formatTokens(row.output_tokens_per_scene, lang)}</span></span>
                  <span>{copy.headers.turns}{colon}<span className="font-medium tabular-nums text-foreground">{formatTurns(row.median_turns)}</span></span>
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
                  <th scope="col" aria-sort={sort === "elo" ? "descending" : undefined} className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.elo}</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.cost}</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.tokens}</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.turns}</th>
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
                    <td className={cn("px-3 py-3 text-right", sort !== "elo" && "text-muted-foreground")}>
                      <div className="ml-auto flex w-28 flex-col items-end gap-1">
                        <EloBar row={row} share={share} />
                        <Interval row={row} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{formatMoney(row.cost_per_scene_usd, lang)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">{formatTokens(row.output_tokens_per_scene, lang)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">{formatTurns(row.median_turns)}</td>
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

      <Aa3dDomains rows={rows} domains={data.domains} panelVotes={data.panel_votes} name={(row) => row.name} />
      <Aa3dAgent rows={rows} name={(row) => row.name} />
      <Aa3dTasks tasks={data.tasks} domains={data.domains} models={sceneModels} modelCount={data.rows.length} />

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

function EloBar({ row, share }: { row: Aa3dRow; share: (value: number) => number }) {
  const { lang } = useI18n();
  const interval = row.elo_lower != null && row.elo_upper != null && !row.is_anchor
    ? { low: share(row.elo_lower), high: share(row.elo_upper) }
    : null;
  return <ScoreBar value={share(row.elo)} label={formatNumber(row.elo, lang, 0)} interval={interval} className="w-full" />;
}

/** The 95% interval under the Elo, or the reference mark for the anchored model. */
function Interval({ row }: { row: Aa3dRow }) {
  const { t, lang } = useI18n();
  if (row.is_anchor) {
    return <span className="text-[11px] text-muted-foreground" title={t.aa3d.anchorHint}>{t.aa3d.anchor}</span>;
  }
  if (row.elo_lower == null || row.elo_upper == null) return null;
  const label = t.aa3d.interval(formatNumber(row.elo_lower, lang, 0), formatNumber(row.elo_upper, lang, 0));
  return (
    <span className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
      <span className="sr-only">{t.aa3d.headers.interval}{lang === "fr" ? " : " : ": "}</span>
      {label}
    </span>
  );
}

function ModelName({ row, info }: { row: Aa3dRow; info: FrontierCodeModelInfo | undefined }) {
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

function Traits({ row }: { row: Aa3dRow }) {
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
