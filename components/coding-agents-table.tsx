import { Info, Trophy, Zap, DollarSign, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { HarnessIcon } from "@/components/harness-icon-lazy";
import { getModelProviderKey } from "@/lib/provider-map";
import { useI18n } from "@/lib/i18n";
import { CODING_AGENT_HARNESSES, type CodingAgent } from "@/lib/coding-agents";

function fmt(v: number | null, decimals = 1): string {
  if (v == null) return "—";
  return v.toFixed(decimals);
}
function fmtPct(v: number | null): string {
  if (v == null) return "—";
  return `${(v <= 1 ? v * 100 : v).toFixed(1)}%`;
}
function fmtCost(v: number | null): string {
  if (v == null) return "—";
  return `$${v.toFixed(2)}`;
}
function fmtTime(v: number | null): string {
  if (v == null) return "—";
  if (v >= 60) return `${Math.floor(v / 60)}m ${Math.round(v % 60)}s`;
  return `${v.toFixed(1)}s`;
}
function fmtTokens(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function harnessIconKey(slug: string): string {
  const cfg = CODING_AGENT_HARNESSES[slug];
  return cfg?.icon ?? slug;
}
function harnessName(slug: string, fallback: string): string {
  const cfg = CODING_AGENT_HARNESSES[slug];
  return cfg?.name ?? fallback;
}

export function CodingAgentsTable({ agents }: { agents: CodingAgent[] }) {
  const { t } = useI18n();

  if (agents.length === 0) {
    // Fallback: AA's coding-agents page is rendered client-side and there's no public API yet.
    // We show the known harnesses with their icons and link to the official AA leaderboard.
    const harnesses = Object.entries(CODING_AGENT_HARNESSES);
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Info className="size-4 text-muted-foreground" />
              {t.agents.indexLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>{t.agents.indexTooltip}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="secondary" className="font-mono text-xs">{t.agents.benchmarks.deep_swe}</Badge>
              <Badge variant="secondary" className="font-mono text-xs">{t.agents.benchmarks.terminal_bench_v2}</Badge>
              <Badge variant="secondary" className="font-mono text-xs">{t.agents.benchmarks.swe_atlas_qna}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t.agents.knownHarnesses}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {harnesses.map(([slug, cfg]) => (
                <div
                  key={slug}
                  className="flex items-center gap-2.5 rounded-lg border bg-card/50 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <HarnessIcon slug={cfg.icon} size={20} />
                  </div>
                  <span className="font-medium text-sm truncate">{cfg.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t.agents.previewNotice}
            </p>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://artificialanalysis.ai/agents/coding-agents"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1.5"
              >
                <ExternalLink className="size-3.5" />
                {t.agents.viewOnAA}
              </a>
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">{t.agents.sourceNote}</p>
      </div>
    );
  }

  const sorted = [...agents].sort(
    (a, b) => (b.coding_agent_index ?? -1) - (a.coding_agent_index ?? -1)
  );
  const bestIndex = sorted[0]?.coding_agent_index ?? null;

  return (
    <div className="space-y-6">
      {/* Benchmarks composition card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Info className="size-4 text-muted-foreground" />
            {t.agents.indexLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t.agents.indexTooltip}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary" className="font-mono text-xs">{t.agents.benchmarks.deep_swe}</Badge>
            <Badge variant="secondary" className="font-mono text-xs">{t.agents.benchmarks.terminal_bench_v2}</Badge>
            <Badge variant="secondary" className="font-mono text-xs">{t.agents.benchmarks.swe_atlas_qna}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {sorted.map((a, i) => (
          <Card key={a.id} className="p-0 overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">#{i + 1}</span>
                <div className="size-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <HarnessIcon slug={harnessIconKey(a.agent_slug)} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-tight truncate">
                    {harnessName(a.agent_slug, a.agent_name)}
                  </p>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                    <ModelProviderIcon provider={getModelProviderKey(a.model_slug, a.model_creator_slug)} size={12} />
                    <span className="truncate">{a.model_short || a.model_name}</span>
                  </div>
                </div>
                {a.coding_agent_index !== null && (
                  <Badge variant={a.coding_agent_index === bestIndex ? "default" : "outline"} className="font-mono shrink-0">
                    {a.coding_agent_index === bestIndex && <Trophy className="size-3 mr-1" />}
                    {fmt(a.coding_agent_index)}
                  </Badge>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-muted-foreground mb-0.5 truncate">DeepSWE</p>
                  <p className="font-mono">{fmtPct(a.deep_swe)}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground mb-0.5">Terminal v2</p>
                  <p className="font-mono">{fmtPct(a.terminal_bench_v2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground mb-0.5">SWE-Atlas</p>
                  <p className="font-mono">{fmtPct(a.swe_atlas_qna)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="size-3" />
                  {fmtCost(a.cost_per_task_usd)}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="size-3" />
                  {fmtTime(a.time_per_task_seconds)}
                </span>
                <span>{fmtTokens(a.output_tokens_per_task)} out</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4 text-left w-12">#</th>
                <th className="py-3 px-4 text-left">{t.agents.headers.harness}</th>
                <th className="py-3 px-4 text-left">{t.agents.headers.model}</th>
                <th className="py-3 px-4 text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">{t.agents.headers.index}</span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64 text-xs">{t.agents.indexTooltip}</TooltipContent>
                  </Tooltip>
                </th>
                <th className="py-3 px-4 text-right hidden lg:table-cell">DeepSWE</th>
                <th className="py-3 px-4 text-right hidden lg:table-cell">Terminal v2</th>
                <th className="py-3 px-4 text-right hidden lg:table-cell">SWE-Atlas</th>
                <th className="py-3 px-4 text-right">{t.agents.headers.cost}</th>
                <th className="py-3 px-4 text-right">{t.agents.headers.time}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a, i) => {
                const isBest = a.coding_agent_index === bestIndex && bestIndex !== null;
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <HarnessIcon slug={harnessIconKey(a.agent_slug)} size={20} />
                        </div>
                        <span className="font-medium">
                          {harnessName(a.agent_slug, a.agent_name)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <ModelProviderIcon provider={getModelProviderKey(a.model_slug, a.model_creator_slug)} size={14} />
                        <span className="text-muted-foreground">{a.model_short || a.model_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant={isBest ? "default" : "outline"}
                        className="font-mono"
                      >
                        {isBest && <Trophy className="size-3 mr-1" />}
                        {fmt(a.coding_agent_index)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs hidden lg:table-cell">{fmtPct(a.deep_swe)}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs hidden lg:table-cell">{fmtPct(a.terminal_bench_v2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs hidden lg:table-cell">{fmtPct(a.swe_atlas_qna)}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs">{fmtCost(a.cost_per_task_usd)}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs">{fmtTime(a.time_per_task_seconds)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">{t.agents.sourceNote}</p>
    </div>
  );
}
