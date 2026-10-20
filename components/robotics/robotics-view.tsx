import { useMemo, useState } from "react";
import { RobotArm, Trophy } from "@/components/icons";
import { Link } from "@/components/link";
import { BenchmarkDisclosure, BenchmarkHeader, ScoreBar, StatTiles } from "@/components/benchmark-page";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { SegmentedControl } from "@/components/segmented-control";
import { TradeoffChart, type ChartScale, type ChartSeries } from "@/components/tradeoff-chart";
import { Badge } from "@/components/ui/badge";
import type { FrontierCodeModelInfo } from "@/lib/frontiercode-catalog";
import { parseRoboticsSearch, type RoboticsData, type RoboticsRow, type RoboticsSearch } from "@/lib/aa-robotics-data";
import { roboticsTaskText } from "@/lib/aa-robotics-fr";
import { RoboticsVideos } from "@/components/robotics/robotics-videos";
import { formatDuration, formatMoney, formatMoneyCompact, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getModelProviderKey, resolveCreatorFromModelSlug } from "@/lib/provider-map";
import { providerColor, shadeIndex } from "@/lib/provider-colors";

const SOURCE_URL = "https://artificialanalysis.ai/articles/aa-robotics";

type XAxis = "cost" | "time" | "firstAction";

const X_VALUE: Record<XAxis, (row: RoboticsRow) => number | null> = {
  cost: (row) => row.cost_per_task_usd,
  time: (row) => (row.minutes_per_task === null ? null : row.minutes_per_task * 60),
  firstAction: (row) => (row.first_action_minutes === null ? null : row.first_action_minutes * 60),
};

const minutes = (value: number | null) => (value === null ? null : value * 60);

/**
 * AA-Robotics results from Artificial Analysis: headline figures, the score
 * against cost or time, a leaderboard, the score of every task and the
 * article's videos.
 */
export function RoboticsView({
  data,
  search,
  onSearchChange,
}: {
  data: RoboticsData & { catalog: Record<string, FrontierCodeModelInfo> };
  search: RoboticsSearch;
  onSearchChange: (search: RoboticsSearch) => void;
}) {
  const { t, lang } = useI18n();
  const copy = t.robotics;
  const colon = lang === "fr" ? " : " : ": ";
  const [xAxis, setXAxis] = useState<XAxis>("cost");
  const [scale, setScale] = useState<ChartScale>("linear");
  const update = (patch: Partial<RoboticsSearch>) => onSearchChange(parseRoboticsSearch({ ...search, ...patch }));

  const creatorOf = (row: RoboticsRow) =>
    data.catalog[row.slug]?.creatorSlug ?? resolveCreatorFromModelSlug(row.slug, row.creator_name ?? row.slug.split("-")[0] ?? "");
  const iconOf = (row: RoboticsRow) => (
    <ModelProviderIcon provider={getModelProviderKey(data.catalog[row.slug]?.slug ?? row.slug, creatorOf(row))} iconUrl={data.catalog[row.slug]?.iconUrl} size={28} />
  );

  const series = useMemo<ChartSeries[]>(() => {
    const shade = shadeIndex();
    return data.rows.flatMap((row) => {
      const x = X_VALUE[xAxis](row);
      if (x === null) return [];
      const creator = creatorOf(row);
      const color = providerColor(creator, shade(creator));
      return [{
        id: row.slug,
        label: row.name,
        color,
        highlights: [{ id: row.slug, color }],
        points: [{ id: row.slug, name: row.name, tag: row.harness, x, y: row.score }],
      }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.rows, data.catalog, xAxis]);

  const source = { href: SOURCE_URL, label: copy.viewOnSource };
  const preview = data.version ? <Badge variant="secondary" className="mt-2">{copy.preview(data.version)}</Badge> : null;
  if (data.rows.length === 0) {
    return (
      <div className="space-y-6">
        <BenchmarkHeader icon={RobotArm} title={copy.title} description={copy.description} source={source} />
        <p role="status" className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{copy.empty}</p>
      </div>
    );
  }

  const top = data.rows[0];
  const cheapest = data.rows.reduce<RoboticsRow | null>(
    (best, row) => row.cost_per_task_usd !== null && (best?.cost_per_task_usd == null || row.cost_per_task_usd < best.cost_per_task_usd) ? row : best,
    null,
  );
  const score = (value: number | null) => (value === null ? "—" : formatNumber(value, lang, 1));

  return (
    <div className="flex flex-col gap-6">
      <BenchmarkHeader icon={RobotArm} title={copy.title} description={copy.description} source={source}>{preview}</BenchmarkHeader>

      <StatTiles
        tiles={[
          { key: "models", label: copy.stats.models, value: formatNumber(data.rows.length, lang, 0) },
          { key: "best", label: copy.stats.best, value: score(top.score), detail: top.name, hint: copy.scoreHint },
          {
            key: "cheapest",
            label: copy.stats.cheapest,
            value: formatMoney(cheapest?.cost_per_task_usd, lang),
            detail: cheapest ? `${cheapest.name} · ${score(cheapest.score)}` : undefined,
          },
          {
            key: "human",
            label: copy.stats.human,
            value: formatDuration(minutes(data.human?.minutes_per_task ?? null), lang),
            detail: data.human?.cost_per_task_usd != null ? copy.humanDetail(formatMoney(data.human.cost_per_task_usd, lang)) : undefined,
          },
        ]}
      />

      <section aria-labelledby="robotics-chart-title" className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 id="robotics-chart-title" className="text-base font-semibold">{copy.chartTitle}</h2>
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
                { value: "firstAction", label: copy.headers.firstAction },
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
          yLabel={`${copy.title} · /100`}
          formatX={(value) => (xAxis === "cost" ? formatMoneyCompact(value, lang) : formatDuration(value, lang))}
          formatY={(value) => formatNumber(value, lang, Number.isInteger(value) ? 0 : 1)}
          better="lower"
          scale={scale}
          efficientLabel={t.tradeoff.efficient}
          legend={false}
          picker
          empty={t.tradeoff.empty}
        />
      </section>

      <ol className="grid grid-cols-1 gap-2 lg:hidden">
        {data.rows.map((row, index) => (
          <li key={row.slug} className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="w-7 shrink-0 pt-1 text-xs font-semibold tabular-nums text-muted-foreground">#{index + 1}</span>
              {iconOf(row)}
              <div className="min-w-0 flex-1">
                <ModelName row={row} info={data.catalog[row.slug]} />
                <p className="mt-0.5 text-xs text-muted-foreground">{row.harness ?? "—"}</p>
              </div>
              <ScoreBar value={row.score / 100} label={score(row.score)} className="w-20" />
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
              <span>{copy.headers.passes}{colon}<span className="font-medium tabular-nums text-foreground">{copy.passes(row.passes, row.attempts)}</span></span>
              <span>{copy.headers.cost}{colon}<span className="font-medium tabular-nums text-foreground">{formatMoney(row.cost_per_task_usd, lang)}</span></span>
              <span>{copy.headers.time}{colon}<span className="font-medium tabular-nums text-foreground">{formatDuration(minutes(row.minutes_per_task), lang)}</span></span>
              <span>{copy.headers.firstAction}{colon}<span className="font-medium tabular-nums text-foreground">{formatDuration(minutes(row.first_action_minutes), lang)}</span></span>
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
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{copy.headers.harness}</th>
              <th scope="col" aria-sort="descending" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.score}</th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.passes}</th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.cost}</th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.time}</th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{copy.headers.firstAction}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => (
              <tr key={row.slug} className="border-b transition-colors duration-150 last:border-b-0 hover:bg-muted/40">
                <td className="px-4 py-3 text-xs font-semibold tabular-nums text-muted-foreground">
                  {row === top ? <Trophy aria-label="#1" className="size-4 text-foreground" /> : index + 1}
                </td>
                <td className="px-2 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {iconOf(row)}
                    <div className="min-w-0">
                      <ModelName row={row} info={data.catalog[row.slug]} />
                      <p className="truncate text-xs text-muted-foreground">{data.catalog[row.slug]?.creatorName ?? row.creator_name ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{row.harness ?? "—"}</td>
                <td className="px-3 py-3 text-right"><ScoreBar value={row.score / 100} label={score(row.score)} className="ml-auto w-24" /></td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">{copy.passes(row.passes, row.attempts)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{formatMoney(row.cost_per_task_usd, lang)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">{formatDuration(minutes(row.minutes_per_task), lang)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted-foreground">{formatDuration(minutes(row.first_action_minutes), lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="robotics-tasks-title" className="min-w-0 rounded-xl border bg-card">
        <div className="p-4 sm:px-6">
          <h2 id="robotics-tasks-title" className="text-base font-semibold">{copy.tasksTitle}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy.tasksHint}</p>
        </div>
        {/* The matrix scrolls inside its card so narrow screens keep the page width. */}
        <div className="overflow-x-auto rounded-b-xl border-t focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" tabIndex={0} role="region" aria-labelledby="robotics-tasks-title">
          <table className="w-full min-w-[640px] text-sm">
            {/* Not sticky: inside a scroll container a sticky header would offset over the first row. */}
            <thead className="border-b bg-muted/30">
              <tr>
                <th scope="col" className="sticky left-0 bg-card px-4 py-2 text-left text-xs font-medium text-muted-foreground">{copy.task}</th>
                {data.rows.map((row) => (
                  <th key={row.slug} scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{row.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((task) => {
                const text = roboticsTaskText(task, lang);
                return (
                  <tr key={task.id} className="border-b last:border-b-0">
                    <th scope="row" className="sticky left-0 bg-card px-4 py-3 text-left font-normal">
                      <span className="block font-medium">{text.short_name}</span>
                      {text.instruction && <span className="block max-w-56 text-xs leading-5 text-muted-foreground">{text.instruction}</span>}
                    </th>
                    {data.rows.map((row) => <TaskScore key={row.slug} value={row.task_scores[task.id] ?? null} />)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <RoboticsVideos data={data} search={search} update={update} />

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

function TaskScore({ value }: { value: number | null }) {
  const { t, lang } = useI18n();
  if (value === null) {
    return <td className="px-3 py-3 text-right text-muted-foreground"><span aria-label={t.robotics.noAttempt}>—</span></td>;
  }
  return (
    <td className={cn("px-3 py-3 text-right tabular-nums", value === 100 ? "font-semibold" : value === 0 ? "text-muted-foreground" : undefined)}>
      <ScoreBar value={value / 100} label={formatNumber(value, lang, 0)} className="ml-auto w-16" />
    </td>
  );
}

function ModelName({ row, info }: { row: RoboticsRow; info: FrontierCodeModelInfo | undefined }) {
  return info ? (
    <Link href={`/models/${info.slug}`} className="block truncate rounded-sm font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {row.name}
    </Link>
  ) : (
    <span className="block truncate font-medium">{row.name}</span>
  );
}
