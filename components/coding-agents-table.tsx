import { useMemo, useState } from "react";
import { ExternalLink, Search } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { HarnessIcon } from "@/components/harness-icon";
import { useI18n } from "@/lib/i18n";
import { CODING_AGENT_HARNESSES, type CodingAgent } from "@/lib/coding-agents";

const fmt = (v: number | null) => (v === null ? "—" : v.toFixed(1));
const pct = (v: number | null) =>
  v === null ? "—" : `${(v * 100).toFixed(1)}%`;
const cost = (v: number | null) => (v === null ? "—" : `$${v.toFixed(2)}`);
const time = (v: number | null) =>
  v === null ? "—" : `${(v / 60).toFixed(1)} min`;

export function CodingAgentsTable({ agents }: { agents: CodingAgent[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("score");
  const ranked = useMemo(
    () =>
      [...agents].sort(
        (a, b) => (b.coding_agent_index ?? -1) - (a.coding_agent_index ?? -1),
      ),
    [agents],
  );
  const ranks = new Map(ranked.map((row, index) => [row.id, index + 1]));
  const benchmarks = [
    ...new Map(
      agents
        .flatMap((agent) => agent.benchmark_scores)
        .map((item) => [item.id, item]),
    ).values(),
  ];
  const rows = ranked.filter((agent) =>
    `${agent.agent_name} ${agent.model_name} ${agent.model_short}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  if (sort !== "score") {
    const key = sort === "cost" ? "cost_per_task_usd" : "time_per_task_seconds";
    rows.sort((a, b) => (a[key] ?? Infinity) - (b[key] ?? Infinity));
  }
  const sourceLink = (
    <Button variant="outline" asChild className="touch-target">
      <a
        href="https://artificialanalysis.ai/agents/coding-agents"
        target="_blank"
        rel="noreferrer"
      >
        {t.agents.viewOnAA}
        <ExternalLink className="size-4" />
      </a>
    </Button>
  );
  if (!agents.length)
    return (
      <section className="rounded-xl border bg-card p-8 text-center">
        <p className="mb-4 text-muted-foreground">{t.agents.empty}</p>
        {sourceLink}
      </section>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t.agents.indexLabel}</p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
            {t.agents.indexTooltip}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {benchmarks.map((item) => (
              <Badge key={item.id} variant="secondary">
                {item.label}
              </Badge>
            ))}
          </div>
        </div>
        {sourceLink}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-3.5 size-4 text-muted-foreground"
          />
          <Input
            className="h-11 pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t.benchmarkUi.search}
            placeholder={t.benchmarkUi.search}
          />
        </div>
        <select
          aria-label={t.benchmarkUi.sort}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-11 rounded-lg border bg-background px-3 text-sm"
        >
          <option value="score">{t.benchmarkUi.byScore}</option>
          <option value="cost">{t.benchmarkUi.byCost}</option>
          <option value="time">{t.benchmarkUi.byTime}</option>
        </select>
        <p className="text-xs text-muted-foreground" role="status">
          {rows.length} / {agents.length} {t.benchmarkUi.configurations}
        </p>
      </div>
      {!rows.length && (
        <p
          role="status"
          className="py-8 text-center text-sm text-muted-foreground"
        >
          {t.grid.noResults}
        </p>
      )}
      <div className="grid gap-3 md:hidden">
        {rows.map((agent) => (
          <article key={agent.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="font-mono text-xs text-muted-foreground">
                #{ranks.get(agent.id)}
              </span>
              <HarnessIcon
                slug={
                  CODING_AGENT_HARNESSES[agent.agent_slug]?.icon ??
                  agent.agent_slug
                }
                size={22}
                creator={agent.agent_creator_slug}
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-medium">{agent.agent_name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  <AgentModels agent={agent} />
                </p>
              </div>
              <Badge variant="secondary" className="font-mono">
                {fmt(agent.coding_agent_index)}
              </Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              {agent.benchmark_scores.map((item) => (
                <div key={item.id}>
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="mt-1 font-mono">{pct(item.value)}</dd>
                </div>
              ))}
              <div>
                <dt className="text-muted-foreground">
                  {t.agents.metrics.costPerTask}
                </dt>
                <dd className="mt-1 font-mono">
                  {cost(agent.cost_per_task_usd)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t.agents.metrics.timePerTask}
                </dt>
                <dd className="mt-1 font-mono">
                  {time(agent.time_per_task_seconds)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div
        className="hidden max-w-full overflow-x-auto rounded-xl border md:block"
        tabIndex={0}
        role="region"
        aria-label={t.agents.title}
      >
        <table className="w-full text-sm">
          <caption className="sr-only">{t.agents.title}</caption>
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th scope="col" className="p-3">
                #
              </th>
              <th scope="col" className="p-3">
                {t.agents.headers.harness}
              </th>
              <th scope="col" className="p-3">
                {t.agents.headers.model}
              </th>
              <th scope="col" className="p-3 text-right">
                {t.agents.headers.index}
              </th>
              {benchmarks.map((item) => (
                <th
                  key={item.id}
                  scope="col"
                  className="whitespace-nowrap p-3 text-right"
                >
                  {item.label}
                </th>
              ))}
              <th scope="col" className="p-3 text-right">
                {t.agents.headers.cost}
              </th>
              <th scope="col" className="p-3 text-right">
                {t.agents.headers.time}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((agent) => (
              <tr
                key={agent.id}
                className="border-b bg-card transition-colors last:border-0 hover:bg-muted/30"
              >
                <td className="p-3 font-mono text-xs text-muted-foreground">
                  {ranks.get(agent.id)}
                </td>
                <th scope="row" className="p-3 text-left font-medium">
                  <span className="flex items-center gap-2">
                    <HarnessIcon
                      slug={
                        CODING_AGENT_HARNESSES[agent.agent_slug]?.icon ??
                        agent.agent_slug
                      }
                      size={20}
                      creator={agent.agent_creator_slug}
                    />
                    {agent.agent_name}
                  </span>
                </th>
                <td className="min-w-48 p-3">
                  <span className="flex items-center gap-2">
                    <AgentModels agent={agent} />
                  </span>
                </td>
                <td className="p-3 text-right font-mono font-medium">
                  {fmt(agent.coding_agent_index)}
                </td>
                {benchmarks.map((item) => (
                  <td
                    key={item.id}
                    className="p-3 text-right font-mono text-xs"
                  >
                    {pct(
                      agent.benchmark_scores.find(
                        (score) => score.id === item.id,
                      )?.value ?? null,
                    )}
                  </td>
                ))}
                <td className="p-3 text-right font-mono text-xs">
                  {cost(agent.cost_per_task_usd)}
                </td>
                <td className="p-3 text-right font-mono text-xs">
                  {time(agent.time_per_task_seconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{t.agents.sourceNote}</p>
    </div>
  );
}

function AgentModels({ agent }: { agent: CodingAgent }) {
  return (
    <span className="flex flex-col gap-1.5">
      {agent.models.map((model, index) => (
        <span
          key={`${index}-${model.name}`}
          className="flex items-center gap-2"
        >
          <ModelProviderIcon provider={model.creator ?? ""} size={18} />
          <span>{model.name}</span>
        </span>
      ))}
    </span>
  );
}
