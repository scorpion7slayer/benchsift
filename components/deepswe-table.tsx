import { Activity, DollarSign, ExternalLink, Info, Timer, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { getModelProviderKey, resolveCreatorFromModelSlug } from "@/lib/provider-map";
import { useI18n } from "@/lib/i18n";
import type { DeepSweLeaderboard, DeepSweRow } from "@/lib/deepswe";

function fmtPct(value: number | null): string {
  if (value == null) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function fmtConfidence(row: DeepSweRow): string {
  if (row.ci_lo == null || row.ci_hi == null) return "-";
  return `${(row.ci_lo * 100).toFixed(1)}-${(row.ci_hi * 100).toFixed(1)}%`;
}

function fmtCost(value: number | null): string {
  if (value == null) return "-";
  return `$${value.toFixed(2)}`;
}

function fmtTime(seconds: number | null): string {
  if (seconds == null) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function fmtTokens(value: number | null): string {
  if (value == null) return "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(Math.round(value));
}

function fmtDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function displayModelName(slug: string): string {
  return slug
    .replace(/^gpt-(\d+)-(\d+)/, "GPT-$1.$2")
    .replace(/^claude-(opus|sonnet|haiku)-(\d+)-(\d+)/, "Claude $1 $2.$3")
    .replace(/^gemini-(\d+)-(\d+)/, "Gemini $1.$2")
    .replace(/^deepseek-v(\d+)-/, "DeepSeek V$1 ")
    .replace(/^glm-(\d+)-(\d+)/, "GLM $1.$2")
    .replace(/^kimi-k(\d+)-(\d+)/, "Kimi K$1.$2")
    .replace(/^qwen(\d+)-(\d+)/, "Qwen$1.$2")
    .replace(/^minimax-m(\d+)-(\d+)/, "MiniMax M$1.$2")
    .replace(/^mimo-v(\d+)-(\d+)-/, "MiMo V$1.$2 ")
    .replace(/^grok-build-(\d+)-(\d+)/, "Grok Build $1.$2")
    .split("-")
    .map((part) => part.length <= 3 && /^[a-z]+$/.test(part) ? part.toUpperCase() : part)
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bV(\d)\b/g, "V$1");
}

function providerFor(row: DeepSweRow): string {
  const creator = resolveCreatorFromModelSlug(row.model, row.model.split("-")[0] ?? "");
  return getModelProviderKey(row.model, creator);
}

function effortLabel(row: DeepSweRow): string {
  return row.reasoning_effort ?? "default";
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</p>
        </div>
        <div className="size-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export function DeepSweTable({ leaderboard }: { leaderboard: DeepSweLeaderboard }) {
  const { t } = useI18n();
  const rows = leaderboard.rows;
  const top = rows[0] ?? null;

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-sm text-muted-foreground">{t.deepSwe.empty}</p>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://deepswe.datacurve.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1.5"
              >
                <ExternalLink className="size-3.5" />
                {t.deepSwe.viewOnDeepSwe}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t.deepSwe.stats.configs}
          value={String(rows.length)}
          icon={<Activity className="size-4" />}
        />
        <StatCard
          title={t.deepSwe.stats.tasks}
          value={leaderboard.n_tasks_in_set != null ? String(leaderboard.n_tasks_in_set) : "-"}
          icon={<Info className="size-4" />}
        />
        <StatCard
          title={t.deepSwe.stats.best}
          value={fmtPct(top?.pass_at_1 ?? null)}
          icon={<Trophy className="size-4" />}
        />
        <StatCard
          title={t.deepSwe.stats.updated}
          value={fmtDate(leaderboard.generated_at)}
          icon={<Timer className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Info className="size-4 text-muted-foreground" />
            {t.deepSwe.methodLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{t.deepSwe.methodDescription}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="font-mono text-xs">pass@1</Badge>
            <Badge variant="secondary" className="font-mono text-xs">pass@4</Badge>
            <Badge variant="secondary" className="font-mono text-xs">mini-swe-agent</Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              {leaderboard.n_tasks_in_set ?? "-"} tasks
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:hidden">
        {rows.map((row, index) => (
          <Card key={`${row.config}-${index}`} className="overflow-hidden p-0">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground">
                  #{index + 1}
                </span>
                <div className="size-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <ModelProviderIcon provider={providerFor(row)} size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium leading-tight">{displayModelName(row.model)}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {row.harness} / {effortLabel(row)}
                  </p>
                </div>
                <Badge
                  variant={index === 0 ? "default" : "outline"}
                  className="shrink-0 font-mono"
                >
                  {index === 0 && <Trophy className="mr-1 size-3" />}
                  {fmtPct(row.pass_at_1)}
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-muted-foreground">pass@4</p>
                  <p className="font-mono">{fmtPct(row.pass_at_4)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.deepSwe.headers.cost}</p>
                  <p className="font-mono">{fmtCost(row.mean_cost_usd)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.deepSwe.headers.time}</p>
                  <p className="font-mono">{fmtTime(row.mean_duration_seconds)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fmtTokens(row.mean_output_tokens)} out</span>
                <span>{fmtTokens(row.mean_input_tokens)} in</span>
                <span>{fmtConfidence(row)} CI</span>
                <span>{row.n_runs ?? row.n_attempted ?? "-"} runs</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="w-12 px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">{t.deepSwe.headers.model}</th>
                <th className="px-4 py-3 text-left">{t.deepSwe.headers.effort}</th>
                <th className="px-4 py-3 text-right">pass@1</th>
                <th className="px-4 py-3 text-right">{t.deepSwe.headers.confidence}</th>
                <th className="px-4 py-3 text-right">pass@4</th>
                <th className="px-4 py-3 text-right">{t.deepSwe.headers.cost}</th>
                <th className="px-4 py-3 text-right">{t.deepSwe.headers.time}</th>
                <th className="px-4 py-3 text-right">{t.deepSwe.headers.outputTokens}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.config}-${index}`}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <ModelProviderIcon provider={providerFor(row)} size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">{displayModelName(row.model)}</p>
                        <p className="font-mono text-xs text-muted-foreground">{row.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {effortLabel(row)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge
                      variant={index === 0 ? "default" : "outline"}
                      className="font-mono"
                    >
                      {index === 0 && <Trophy className="mr-1 size-3" />}
                      {fmtPct(row.pass_at_1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{fmtConfidence(row)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{fmtPct(row.pass_at_4)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <span className="inline-flex items-center justify-end gap-1">
                      <DollarSign className="size-3 text-muted-foreground" />
                      {fmtCost(row.mean_cost_usd).replace("$", "")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{fmtTime(row.mean_duration_seconds)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{fmtTokens(row.mean_output_tokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="text-xs text-muted-foreground">{t.deepSwe.sourceNote}</p>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://deepswe.datacurve.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="gap-1.5"
          >
            <ExternalLink className="size-3.5" />
            {t.deepSwe.viewOnDeepSwe}
          </a>
        </Button>
      </div>
    </div>
  );
}
