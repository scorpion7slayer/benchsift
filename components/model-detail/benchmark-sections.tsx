import { useState } from "react";
import { CyberBenchmarkScore, CyberOutcomeBar, formatCyberScore } from "@/components/cyber/cyber-outcome";
import { ArrowRight, BarChart3, Blocks, ChevronDown, Shield, TrendingUp } from "@/components/icons";
import { InfoTip } from "@/components/info-tip";
import { Link } from "@/components/link";
import { Button } from "@/components/ui/button";
import type { LLMModel } from "@/lib/model-types";
import { cyberIndexResult, cyberOutcomeShares } from "@/lib/cyber-index";
import { formatMoney, formatNumber, formatPercent, formatTokens } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import {
  applicableExtraBenchmarkEntries,
  capabilityIndexValues,
  FRACTION_BENCHMARK_KEYS,
  mediaBenchmarkValues,
  numericEval,
  textMetricValue,
} from "@/lib/model-metrics";
import type { ModelInsights } from "@/lib/model-insights";
import { BenchmarkRow, DetailCard, RankNote, StatRow, TwoColumnRows } from "./detail-primitives";

type Translations = ReturnType<typeof useI18n>["t"];
type Ranks = ModelInsights["ranks"];

const INDEX_ROWS = [
  { key: "artificial_analysis_intelligence_index", label: "intelligence", hint: "intelligence" },
  { key: "artificial_analysis_coding_index", label: "coding", hint: "coding" },
  { key: "artificial_analysis_math_index", label: "math", hint: "math" },
  { key: "agentic_index", label: "agentic", hint: "agentic" },
] as const;

const COLLAPSED_BENCHMARKS = 8;
const GDPVAL_SCALE = 2000;
const MEDIA_ELO_SCALE = 1400;

function benchmarkLabel(key: string, t: Translations): string {
  const labels = t.benchmarks as unknown as Record<string, string>;
  return labels[key === "multilingual_aa" ? "multilingual" : key] ?? key;
}

export function AAIndicesCard({ model, variantLabel, ranks }: { model: LLMModel; variantLabel?: string; ranks: Ranks }) {
  const { t, lang } = useI18n();
  const rows = INDEX_ROWS.flatMap((row) => {
    const value = textMetricValue(model, row.key);
    return value == null ? [] : [{ ...row, value }];
  });
  if (!rows.length) return null;
  return (
    <DetailCard icon={TrendingUp} title={t.detail.aaIndices} description={variantLabel}>
      <TwoColumnRows>
        {rows.map((row) => (
          <BenchmarkRow
            key={row.key}
            label={t.benchmarks[row.label]}
            tooltip={t.glossary[row.hint]}
            value={formatNumber(row.value, lang)}
            share={row.value / 100}
            rank={ranks[row.key]}
          />
        ))}
      </TwoColumnRows>
    </DetailCard>
  );
}

/** "artificial_analysis_legal_index" → the "legal" label. */
function capabilityLabel(key: string, t: Translations): string {
  return benchmarkLabel(key.replace(/^artificial_analysis_/, "").replace(/_index$/, ""), t);
}

export function CapabilityIndexesCard({ model, ranks }: { model: LLMModel; ranks: Ranks }) {
  const { t, lang } = useI18n();
  const rows = capabilityIndexValues(model);
  if (!rows.length) return null;
  return (
    <DetailCard icon={Blocks} title={t.detail.capabilityIndexes} description={t.detail.capabilityIndexesDescription}>
      <TwoColumnRows>
        {rows.map((row) => (
          <BenchmarkRow
            key={row.key}
            label={capabilityLabel(row.key, t)}
            tooltip={t.glossary.capabilityIndexes}
            value={formatNumber(row.value, lang)}
            share={row.value / 100}
            rank={ranks[row.key]}
          />
        ))}
      </TwoColumnRows>
    </DetailCard>
  );
}

/**
 * AA Cyber Index of the configuration: the index split into successes,
 * safety blocks and failures, then each benchmark and the cost per task.
 * A trusted-access configuration links to its public version and back.
 */
export function CyberIndexCard({
  model,
  ranks,
  counterparts,
}: {
  model: LLMModel;
  ranks: Ranks;
  counterparts: ModelInsights["cyberCounterparts"];
}) {
  const { t, lang } = useI18n();
  const result = cyberIndexResult(model);
  if (!result || textMetricValue(model, "cyber_index") === null) return null;
  const shares = cyberOutcomeShares(result);
  const rank = ranks.cyber_index;
  const blocked = result.benchmarks.some((benchmark) => benchmark.safety_blocks);
  const outcomes = [
    [t.cyber.legend.successes, formatPercent(shares.successes, lang)],
    [t.cyber.legend.safetyBlocks, formatPercent(shares.safetyBlocks, lang)],
    [t.cyber.legend.failures, formatPercent(shares.failures, lang)],
  ] as const;
  return (
    <DetailCard
      icon={Shield}
      title={t.detail.cyberIndex}
      description={t.detail.cyberSource(result.version)}
      footer={(
        <div className="border-t px-4 py-2">
          <Button variant="ghost" asChild>
            <Link href="/benchmarks/cyber">
              {t.detail.cyberLeaderboard}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    >
      <div className="flex flex-col gap-2 border-b border-border/70 pb-3">
        <div className="flex items-start justify-between gap-3 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            {t.benchmarks.cyber}
            <InfoTip label={`${t.glossary.infoLabel} · ${t.benchmarks.cyber}`} content={t.glossary.cyber} />
          </span>
          <span className="flex flex-col items-end">
            <span className="text-lg font-semibold tabular-nums">{formatCyberScore(result.score, lang)}</span>
            {rank && <RankNote rank={rank} />}
          </span>
        </div>
        <CyberOutcomeBar result={result} />
        <dl className="grid grid-cols-3 gap-2 text-xs">
          {outcomes.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="truncate text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <TwoColumnRows>
        {result.benchmarks.map((benchmark) => (
          <BenchmarkRow
            key={benchmark.id}
            label={benchmark.label}
            value={<CyberBenchmarkScore benchmark={benchmark} />}
            share={benchmark.score ?? 0}
          />
        ))}
      </TwoColumnRows>
      <StatRow label={t.detail.costPerTask} value={formatMoney(result.cost_per_task_usd, lang)} />
      {blocked && <p className="pt-1 text-xs text-muted-foreground">{t.cyber.footnote}</p>}
      {counterparts.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2 border-t border-border/70 pt-3">
          {counterparts.map((counterpart) => (
            <li key={counterpart.slug} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">
                  {counterpart.access === "trusted" ? t.detail.cyberCounterpartTrusted : t.detail.cyberCounterpartPublic}
                </span>
                <Link
                  href={`/models/${counterpart.slug}`}
                  className="rounded-sm font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {counterpart.name}
                </Link>
              </span>
              <span className="shrink-0 font-medium tabular-nums">{formatCyberScore(counterpart.score, lang)}</span>
            </li>
          ))}
        </ul>
      )}
    </DetailCard>
  );
}

export function StandardBenchmarksCard({ model, ranks }: { model: LLMModel; ranks: Ranks }) {
  const { t, lang } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const rows: Array<{ key: string; label: string; value: string; share: number }> = FRACTION_BENCHMARK_KEYS.flatMap((key) => {
    const value = textMetricValue(model, key);
    return value == null ? [] : [{ key, label: benchmarkLabel(key, t), value: formatPercent(value, lang), share: value }];
  });
  const gdpval = numericEval(model.evaluations, "gdpval");
  if (gdpval != null) {
    rows.push({ key: "gdpval", label: t.benchmarks.gdpval, value: formatNumber(gdpval, lang, 0), share: gdpval / GDPVAL_SCALE });
  }
  if (!rows.length) return null;
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_BENCHMARKS);
  return (
    <DetailCard
      icon={BarChart3}
      title={t.detail.standardBenchmarks}
      footer={rows.length > COLLAPSED_BENCHMARKS && (
        <div className="border-t px-4 py-2">
          <Button variant="ghost" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? t.detail.showFewerBenchmarks : t.detail.viewAllBenchmarks}
            <ChevronDown aria-hidden="true" className={expanded ? "size-4 rotate-180 transition-transform duration-200" : "size-4 transition-transform duration-200"} />
          </Button>
        </div>
      )}
    >
      <TwoColumnRows>
        {visible.map((row) => <BenchmarkRow key={row.key} label={row.label} value={row.value} share={row.share} rank={ranks[row.key]} />)}
      </TwoColumnRows>
    </DetailCard>
  );
}

export function MediaBenchmarksCard({ model }: { model: LLMModel }) {
  const { t, lang } = useI18n();
  const rows = mediaBenchmarkValues(model);
  if (!rows.length) return null;
  return (
    <DetailCard icon={BarChart3} title={t.detail.mediaBenchmarks}>
      <TwoColumnRows>
        {rows.map((row) => {
          const details = [
            `${formatNumber(row.elo, lang, 0)} Elo`,
            row.rank != null ? `#${row.rank}` : null,
            row.appearances != null ? `${formatTokens(row.appearances, lang)} ${t.detail.appearances}` : null,
          ].filter(Boolean);
          return <BenchmarkRow key={row.eloKey} label={row.label[lang]} value={details.join(" · ")} share={row.elo / MEDIA_ELO_SCALE} />;
        })}
      </TwoColumnRows>
    </DetailCard>
  );
}

function extraBenchmarkLabel(key: string): string {
  const title = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  if (key.startsWith("openrouter_benchmark_")) return `OpenRouter ${title(key.replace("openrouter_benchmark_", ""))}`;
  if (key.startsWith("openrouter_da_")) {
    return `Design Arena · ${title(key.replace("openrouter_da_", "").replace(/_win_rate$/, ""))}`;
  }
  return title(key);
}

/** Source fields BenchSift does not label yet; units follow the source convention. */
export function ExtraBenchmarks({ model }: { model: LLMModel }) {
  const { t, lang } = useI18n();
  const entries = applicableExtraBenchmarkEntries(model);
  if (!entries.length) return null;
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <BarChart3 aria-hidden="true" className="size-4 text-muted-foreground" />
        {t.detail.extraBenchmarks}
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{entries.length}</span>
        <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <TwoColumnRows className="disclosure-content border-t px-4 pb-2">
        {entries.map(([key, raw]) => {
          const value = raw as number;
          const points = key.startsWith("openrouter_da_");
          const fraction = !points && value <= 1;
          return (
            <BenchmarkRow
              key={key}
              label={extraBenchmarkLabel(key)}
              value={points ? formatPercent(value / 100, lang) : fraction ? formatPercent(value, lang) : formatNumber(value, lang)}
              share={points || !fraction ? value / 100 : value}
            />
          );
        })}
      </TwoColumnRows>
    </details>
  );
}

export function NoBenchmarksCard() {
  const { t } = useI18n();
  return (
    <DetailCard icon={BarChart3} title={t.detail.noBenchmarks}>
      <p className="text-sm text-muted-foreground">{t.detail.noBenchmarksDescription}</p>
    </DetailCard>
  );
}
