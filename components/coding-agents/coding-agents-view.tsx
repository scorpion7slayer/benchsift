import { useMemo, useState } from "react";
import { Terminal, Trophy } from "@/components/icons";
import { SearchField } from "@/components/search-field";
import { BenchmarkHeader, ScoreBar, StatTiles } from "@/components/benchmark-page";
import { HarnessIcon } from "@/components/harness-icon";
import { InfoTip } from "@/components/info-tip";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { SegmentedControl } from "@/components/segmented-control";
import { SortButton } from "@/components/sort-button";
import { TradeoffChart, type ChartScale, type ChartSeries } from "@/components/tradeoff-chart";
import { splitEffort, type CodingAgent } from "@/lib/coding-agents";
import { formatDuration, formatMoney, formatMoneyCompact, formatNumber, formatPercent, formatTokens } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { providerColor, shadeIndex } from "@/lib/provider-colors";
import { cn } from "@/lib/utils";
import { PageCat } from "@/components/pixel-art/page-cats";

type SortKey = "index" | "cost" | "time" | "tokens" | `bench:${string}`;
type Direction = "asc" | "desc";
type XAxis = "cost" | "time";

const LOWER_IS_BETTER = new Set<SortKey>(["cost", "time", "tokens"]);

function sortValue(agent: CodingAgent, key: SortKey): number | null {
  if (key === "index") return agent.coding_agent_index;
  if (key === "cost") return agent.cost_per_task_usd;
  if (key === "time") return agent.time_per_task_seconds;
  if (key === "tokens") return agent.output_tokens_per_task;
  return agent.benchmark_scores.find((score) => `bench:${score.id}` === key)?.value ?? null;
}

/** Harness and model family of a configuration, without its effort level. */
function configurationKey(agent: CodingAgent): string {
  return `${agent.agent_name}|${agent.models.map((model) => splitEffort(model.name).base).join("+")}`;
}

/**
 * Artificial Analysis Coding Agent Index: headline figures, the index against
 * cost chart (one line per harness and model across effort levels) and the
 * sortable table. Ranks always follow the index, whatever the order shown.
 */
export function CodingAgentsView({ agents }: { agents: CodingAgent[] }) {
  const { t, lang } = useI18n();
  const copy = t.agents;
  const ui = t.benchmarkUi;
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("index");
  const [direction, setDirection] = useState<Direction>("desc");
  const [xAxis, setXAxis] = useState<XAxis>("cost");
  const [scale, setScale] = useState<ChartScale>("log");

  const ranked = useMemo(
    () => [...agents].sort((a, b) => (b.coding_agent_index ?? -1) - (a.coding_agent_index ?? -1)),
    [agents],
  );
  const ranks = useMemo(() => new Map(ranked.map((agent, index) => [agent.id, index + 1])), [ranked]);
  const benchmarks = useMemo(
    () => [...new Map(agents.flatMap((agent) => agent.benchmark_scores).map((item) => [item.id, item])).values()],
    [agents],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sign = direction === "asc" ? 1 : -1;
    return ranked
      .filter((agent) => `${agent.agent_name} ${agent.model_name} ${agent.models.map((model) => model.name).join(" ")}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        const left = sortValue(a, sort);
        const right = sortValue(b, sort);
        if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
        return sign * (left - right);
      });
  }, [ranked, query, sort, direction]);

  const series = useMemo<ChartSeries[]>(() => {
    const visible = new Set(rows.map(configurationKey));
    const groups = new Map<string, CodingAgent[]>();
    for (const agent of ranked) {
      const key = configurationKey(agent);
      if (visible.has(key)) groups.set(key, [...(groups.get(key) ?? []), agent]);
    }
    const shade = shadeIndex();
    return [...groups.entries()].map(([key, group]) => {
      const best = group[0];
      const color = providerColor(best.model_creator_slug, shade(best.model_creator_slug));
      const label = `${best.models.map((model) => splitEffort(model.name).base).join(" + ")} · ${best.agent_name}`;
      return {
        id: key,
        label,
        color,
        highlights: [{ id: best.id, color }],
        points: group.flatMap((agent) => {
          const x = xAxis === "cost" ? agent.cost_per_task_usd : agent.time_per_task_seconds;
          const effort = agent.models.map((model) => splitEffort(model.name).effort).find(Boolean) ?? null;
          return x == null || agent.coding_agent_index == null
            ? []
            : [{ id: agent.id, name: `${agent.agent_name} · ${agent.models.map((model) => model.name).join(" + ")}`, tag: effort, x, y: agent.coding_agent_index }];
        }),
      };
    });
  }, [rows, ranked, xAxis]);

  const source = { href: "https://artificialanalysis.ai/agents/coding-agents", label: copy.viewOnAA };
  if (!agents.length) {
    return (
      <div className="space-y-6">
        <BenchmarkHeader icon={Terminal} title={copy.title} description={copy.description} source={source} />
        <p role="status" className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{copy.empty}</p>
      </div>
    );
  }

  const top = ranked[0];
  const cheapest = ranked.slice(0, 10).reduce<CodingAgent | null>(
    (best, agent) => (agent.cost_per_task_usd != null && (best?.cost_per_task_usd == null || agent.cost_per_task_usd < best.cost_per_task_usd) ? agent : best),
    null,
  );
  const describe = (agent: CodingAgent) => `${agent.agent_name} · ${agent.models.map((model) => model.name).join(" + ")}`;

  function sortBy(next: SortKey) {
    setDirection(next === sort ? (direction === "asc" ? "desc" : "asc") : LOWER_IS_BETTER.has(next) ? "asc" : "desc");
    setSort(next);
  }
  const directionHint = (key: SortKey) => (sort === key ? (direction === "asc" ? t.grid.direction.asc : t.grid.direction.desc) : undefined);
  const columns: Array<{ key: SortKey; label: string }> = [
    ...benchmarks.map((item) => ({ key: `bench:${item.id}` as SortKey, label: item.label })),
    { key: "cost", label: copy.headers.cost },
    { key: "time", label: copy.headers.time },
    { key: "tokens", label: copy.metrics.outputTokens },
  ];
  const cellValue = (agent: CodingAgent, key: SortKey) => {
    const value = sortValue(agent, key);
    if (key === "cost") return formatMoney(value, lang);
    if (key === "time") return formatDuration(value, lang);
    if (key === "tokens") return formatTokens(value, lang);
    return formatPercent(value, lang);
  };

  return (
    <div className="flex flex-col gap-6">
      <BenchmarkHeader icon={Terminal} title={copy.title} description={copy.description} source={source}>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-foreground">
            {copy.indexLabel}
            <InfoTip label={copy.indexLabel} content={copy.indexTooltip} />
          </span>
          <span aria-hidden="true">=</span>
          {benchmarks.map((item, index) => (
            <span key={item.id} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">+</span>}
              <span className="rounded-md border bg-card px-1.5 py-0.5">{item.label}</span>
            </span>
          ))}
        </div>
      </BenchmarkHeader>

      <div className="relative">
        <PageCat kind="agents" className="absolute bottom-[calc(100%+1px)] right-6" />
        <StatTiles
          tiles={[
            { key: "configs", label: copy.stats.configs, value: formatNumber(agents.length, lang, 0) },
            { key: "harnesses", label: copy.stats.harnesses, value: formatNumber(new Set(agents.map((agent) => agent.agent_name)).size, lang, 0) },
            { key: "best", label: copy.stats.best, value: formatNumber(top.coding_agent_index, lang), detail: describe(top) },
            { key: "cheapest", label: ui.cheapestTop, value: formatMoney(cheapest?.cost_per_task_usd, lang), detail: cheapest ? describe(cheapest) : undefined },
          ]}
        />
      </div>

      <section aria-labelledby="agents-chart-title" className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 id="agents-chart-title" className="text-base font-semibold">{ui.chartTitle}</h2>
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
          yLabel={copy.indexLabel}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField value={query} onChange={setQuery} placeholder={ui.search} clearLabel={t.compare.clear} className="flex-1" />
        <p role="status" className="shrink-0 text-xs text-muted-foreground">
          {rows.length} / {agents.length} {ui.configurations}
        </p>
      </div>

      {rows.length === 0 ? (
        <p role="status" className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">{t.grid.noResults}</p>
      ) : (
        <>
          <ol className="grid grid-cols-1 gap-2 md:hidden">
            {rows.map((agent) => (
              <li key={agent.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 shrink-0 pt-1 text-xs font-semibold tabular-nums text-muted-foreground">#{ranks.get(agent.id)}</span>
                  <HarnessIcon slug={agent.agent_slug} creator={agent.agent_creator_slug} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{agent.agent_name}</p>
                    <AgentModels agent={agent} />
                  </div>
                  <ScoreBar value={agent.coding_agent_index == null ? null : agent.coding_agent_index / 100} label={formatNumber(agent.coding_agent_index, lang)} className="w-16" />
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                  {columns.map((column) => (
                    <div key={column.key} className="min-w-0">
                      <dt className="truncate text-muted-foreground" title={column.label}>{column.label}</dt>
                      <dd className="mt-0.5 font-medium tabular-nums">{cellValue(agent, column.key)}</dd>
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
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">{copy.headers.harness}</th>
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">{copy.headers.model}</th>
                  {[{ key: "index" as SortKey, label: copy.headers.index }, ...columns].map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={sort === column.key ? (direction === "asc" ? "ascending" : "descending") : undefined}
                      className="px-2 py-1.5 text-right text-xs font-medium text-muted-foreground"
                    >
                      <SortButton active={sort === column.key} direction={direction} label={column.label} hint={directionHint(column.key)} onClick={() => sortBy(column.key)} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((agent) => (
                  <tr key={agent.id} className="border-b transition-colors duration-150 last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums text-muted-foreground">
                      {agent === top ? <Trophy aria-label="#1" className="size-4 text-foreground" /> : ranks.get(agent.id)}
                    </td>
                    <th scope="row" className="px-2 py-3 text-left font-medium">
                      <span className="flex items-center gap-2.5">
                        <HarnessIcon slug={agent.agent_slug} creator={agent.agent_creator_slug} size={24} />
                        <span className="min-w-0">{agent.agent_name}</span>
                      </span>
                    </th>
                    <td className="px-2 py-3"><AgentModels agent={agent} /></td>
                    <td className="px-3 py-3 text-right">
                      <ScoreBar value={agent.coding_agent_index == null ? null : agent.coding_agent_index / 100} label={formatNumber(agent.coding_agent_index, lang)} className="ml-auto w-20" />
                    </td>
                    {columns.map((column) => (
                      <td key={column.key} className={cn("whitespace-nowrap px-3 py-3 text-right tabular-nums", sort === column.key ? "font-semibold" : "text-muted-foreground")}>
                        {cellValue(agent, column.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground">{copy.sourceNote}</p>
    </div>
  );
}

function AgentModels({ agent }: { agent: CodingAgent }) {
  return (
    <span className="mt-1 flex flex-col gap-1">
      {agent.models.map((model, index) => {
        const { base, effort } = splitEffort(model.name);
        return (
          <span key={`${index}-${model.name}`} className="flex min-w-0 items-center gap-2 text-sm">
            <ModelProviderIcon provider={model.creator ?? agent.model_creator_slug} size={18} />
            <span className="truncate">{base}</span>
            {effort && <span className="rounded border bg-muted px-1 font-mono text-[10px] uppercase text-muted-foreground">{effort}</span>}
          </span>
        );
      })}
    </span>
  );
}
