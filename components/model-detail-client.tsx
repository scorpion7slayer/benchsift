import { use, Suspense } from "react";
import {
  Zap, DollarSign, BarChart3, TrendingUp, GitCompareArrows,
  Brain, ImageIcon, Video, Mic, Type, Lock, Unlock, BookOpen, Info,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { useI18n } from "@/lib/i18n";
import { useCompare } from "@/lib/compare-store";
import { getProviderKey } from "@/lib/provider-map";
import { usePageTransition } from "@/components/page-transition-provider";
import type { LLMModel } from "@/lib/api";

type Caps = Partial<LLMModel>;

// Streamed sections (scraped data) / Sections streamées (données scrapées)

function ScrapedBadges({ promise, t }: { promise: Promise<Caps>; t: { reasoning: string; openWeights: string; closedWeights: string } }) {
  const caps = use(promise);
  return (
    <>
      {caps.reasoning_model && (
        <Badge variant="secondary" className="gap-1">
          <Brain className="size-3" />
          {t.reasoning}
        </Badge>
      )}
      {caps.is_open_weights ? (
        <Badge variant="outline" className="gap-1 text-xs">
          <Unlock className="size-3" />{t.openWeights}
        </Badge>
      ) : caps.is_open_weights === false ? (
        <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
          <Lock className="size-3" />{t.closedWeights}
        </Badge>
      ) : null}
    </>
  );
}

function fmtParams(b: number): string {
  if (b >= 1000) return `${(b / 1000).toFixed(1)}T`;
  if (b >= 1) return `${b % 1 === 0 ? b : b.toFixed(1)}B`;
  return `${Math.round(b * 1000)}M`;
}

interface CapsTranslations {
  capabilities: string;
  contextWindow: string;
  modalities: string;
  inputModality: string;
  outputModality: string;
  totalParams: string;
  activeParams: string;
  knowledgeCutoff: string;
  knowledgeCutoffTooltip: string;
  opennessIndex: string;
  opennessTooltip: string;
  modalityLabels: { text: string; image: string; speech: string; video: string };
}

function CapabilitiesSection({ promise, t }: { promise: Promise<Caps>; t: CapsTranslations }) {
  const caps = use(promise);

  const modalityIcon = (key: string) => {
    if (key === "text") return <Type className="size-3.5" />;
    if (key === "image") return <ImageIcon className="size-3.5" />;
    if (key === "speech") return <Mic className="size-3.5" />;
    if (key === "video") return <Video className="size-3.5" />;
  };

  const inputMods = ["text", "image", "speech", "video"].filter(
    (k) => caps[`input_modality_${k}` as keyof LLMModel]
  );
  const outputMods = ["text", "image", "speech", "video"].filter(
    (k) => caps[`output_modality_${k}` as keyof LLMModel]
  );

  const hasContent =
    caps.context_window_tokens ||
    caps.total_parameters_b ||
    caps.knowledge_cutoff ||
    caps.openness_index != null ||
    inputMods.length > 0 ||
    outputMods.length > 0;
  if (!hasContent) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BookOpen className="size-4 text-muted-foreground" />
          {t.capabilities}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {caps.context_window_tokens && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t.contextWindow}</span>
            <span className="font-mono tabular-nums">
              {caps.context_window_tokens >= 1_000_000
                ? `${(caps.context_window_tokens / 1_000_000).toFixed(1)}M tokens`
                : `${Math.round(caps.context_window_tokens / 1_000)}K tokens`}
            </span>
          </div>
        )}
        {caps.knowledge_cutoff && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-muted-foreground">
              {t.knowledgeCutoff}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
                </TooltipTrigger>
                <TooltipContent className="max-w-64 text-xs">{t.knowledgeCutoffTooltip}</TooltipContent>
              </Tooltip>
            </span>
            <span className="font-mono tabular-nums">{caps.knowledge_cutoff}</span>
          </div>
        )}
        {caps.total_parameters_b != null && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t.totalParams}</span>
            <span className="font-mono tabular-nums">{fmtParams(caps.total_parameters_b)}</span>
          </div>
        )}
        {caps.active_parameters_b != null && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t.activeParams}</span>
            <span className="font-mono tabular-nums">{fmtParams(caps.active_parameters_b)}</span>
          </div>
        )}
        {caps.openness_index != null && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-muted-foreground">
              {t.opennessIndex}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
                </TooltipTrigger>
                <TooltipContent className="max-w-64 text-xs">{t.opennessTooltip}</TooltipContent>
              </Tooltip>
            </span>
            <span className="font-mono tabular-nums">{caps.openness_index.toFixed(0)} / 100</span>
          </div>
        )}
        {(inputMods.length > 0 || outputMods.length > 0) && (
          <div className="space-y-2">
            {inputMods.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.inputModality}</span>
                <div className="flex gap-1.5">
                  {inputMods.map((k) => (
                    <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-muted border">
                      {modalityIcon(k)}{t.modalityLabels[k as keyof typeof t.modalityLabels]}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {outputMods.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.outputModality}</span>
                <div className="flex gap-1.5">
                  {outputMods.map((k) => (
                    <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-muted border">
                      {modalityIcon(k)}{t.modalityLabels[k as keyof typeof t.modalityLabels]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Meta-evaluation card (Intelligence Index tokens used + cost) / Carte méta-éval
function MetaEvalSection({ promise, t }: {
  promise: Promise<Caps>;
  t: {
    metaInfo: string;
    intelligenceTokens: string;
    intelligenceTokensTooltip: string;
    intelligenceCost: string;
    intelligenceCostTooltip: string;
  };
}) {
  const caps = use(promise);
  const tokens = caps.intelligence_index_tokens;
  const cost = caps.intelligence_index_cost_usd;
  if (tokens == null && cost == null) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-muted-foreground" />
          {t.metaInfo}
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {tokens != null && (
          <StatRow
            label={t.intelligenceTokens}
            value={fmtTokens(tokens)}
            tooltip={t.intelligenceTokensTooltip}
          />
        )}
        {cost != null && (
          <StatRow
            label={t.intelligenceCost}
            value={`$${cost.toFixed(2)}`}
            tooltip={t.intelligenceCostTooltip}
          />
        )}
      </CardContent>
    </Card>
  );
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Helpers

const AA_INDEX_KEYS = new Set([
  "artificial_analysis_intelligence_index",
  "artificial_analysis_coding_index",
  "artificial_analysis_math_index",
  "intelligence_index",
  "coding_index",
  "math_index",
  "agentic_index",
]);

const KNOWN_BENCHMARK_KEYS = new Set([
  "mmlu_pro", "gpqa", "hle", "livecodebench", "scicode",
  "math_500", "aime", "aime_25", "aime25", "ifbench", "lcr",
  "terminalbench_hard", "tau2",
  "humaneval", "omniscience", "multilingual_aa", "mmmu_pro", "critpt", "gdpval",
  "apex_agents", "omniscience_non_hallucination",
]);

function fmt(val: number | null | undefined, decimals = 1) {
  if (val == null || isNaN(val)) return "—";
  return val.toFixed(decimals);
}

function fmtCtx(tokens: number | null): string {
  if (!tokens) return "—";
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M tokens`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K tokens`;
  return `${tokens} tokens`;
}

function pct(val: number | null | undefined): number | null {
  if (val == null || isNaN(val)) return null;
  return Math.round(val * 1000) / 10;
}

/** Dynamic format: if >1 → raw score, if ≤1 → %. / Si >1 → score brut, si ≤1 → %. */
function fmtDynamic(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return "—";
  if (val > 1) return val.toFixed(1);
  return `${(val * 100).toFixed(1)}%`;
}

function formatBenchmarkKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function scoreBg(val: number | null) {
  if (val === null) return "bg-muted";
  if (val >= 75) return "bg-emerald-500";
  if (val >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function scoreBadgeClass(val: number | null) {
  if (val === null) return "";
  if (val >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
  if (val >= 50) return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
  return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
}

// Sub-components / Sous-composants

function BenchmarkRow({
  label, displayValue, barPct,
}: {
  label: string; displayValue: string; barPct: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium tabular-nums text-xs">{displayValue}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${scoreBg(barPct > 0 ? barPct : null)}`}
          style={{ width: `${Math.min(barPct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function StatRow({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="flex items-center gap-1 text-muted-foreground">
        {label}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-xs">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}

/** Modality icon chip — active = opaque, inactive = very transparent. / active = opaque, inactive = très transparente. */
function ModalityChip({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <span
      title={label}
      className={`inline-flex items-center justify-center size-7 rounded-md border transition-colors ${
        active
          ? "bg-muted text-foreground border-border"
          : "text-muted-foreground/20 border-border/20"
      }`}
    >
      {icon}
    </span>
  );
}

// Main component / Composant principal

export function ModelDetailClient({ model, capabilitiesPromise }: { model: LLMModel; capabilitiesPromise?: Promise<Caps> }) {
  const { t } = useI18n();
  const { toggle, isSelected } = useCompare();
  const { push } = usePageTransition();
  const {
    name, model_creator, evaluations: ev, pricing,
    median_output_tokens_per_second, median_time_to_first_token_seconds,
    median_time_to_first_answer_token, release_date,
  } = model;

  const providerKey = getProviderKey(model_creator.slug);
  const intelligence = ev.artificial_analysis_intelligence_index;
  const isComp = isSelected(model.slug);


  // Known benchmarks as % / Benchmarks connus en %
  const benchmarksPct = {
    mmlu_pro: pct(ev.mmlu_pro),
    gpqa: pct(ev.gpqa),
    hle: pct(ev.hle),
    livecodebench: pct(ev.livecodebench),
    scicode: pct(ev.scicode),
    math_500: pct(ev.math_500),
    aime: pct(ev.aime),
    aime_25: pct(ev.aime_25),
    ifbench: pct(ev.ifbench),
    lcr: pct(ev.lcr),
    terminalbench_hard: pct(ev.terminalbench_hard),
    tau2: pct(ev.tau2),
    humaneval: pct(ev.humaneval),
    omniscience: pct(ev.omniscience),
    multilingual_aa: pct(ev.multilingual_aa),
    mmmu_pro: pct(ev.mmmu_pro),
    critpt: pct(ev.critpt),
    apex_agents: pct(ev.apex_agents),
    omniscience_non_hallucination: pct(ev.omniscience_non_hallucination),
  };

  // Unknown additional benchmarks / Benchmarks supplémentaires non connus
  const extraBenchmarks = Object.entries(ev)
    .filter(([key, val]) =>
      !AA_INDEX_KEYS.has(key) &&
      !KNOWN_BENCHMARK_KEYS.has(key) &&
      val !== null
    )
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex items-start gap-4">
        <div className="size-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <ModelProviderIcon provider={providerKey} size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{model_creator.name}</p>
          <h1 className="text-xl font-semibold tracking-tight break-words leading-tight mt-0.5">{name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {intelligence !== null && (
              <Badge variant="outline" className={`font-mono ${scoreBadgeClass(intelligence)}`}>
                {fmt(intelligence)} {t.detail.intelligenceIndex}
              </Badge>
            )}
            {release_date && (
              <Badge variant="secondary" className="font-mono text-xs">
                {release_date}
              </Badge>
            )}
            {capabilitiesPromise && (
              <Suspense>
                <ScrapedBadges
                  promise={capabilitiesPromise}
                  t={{ reasoning: t.detail.reasoning, openWeights: t.detail.openWeights, closedWeights: t.detail.closedWeights }}
                />
              </Suspense>
            )}
          </div>
        </div>
        <Button
          variant={isComp ? "default" : "outline"}
          size="sm"
          onClick={() => { toggle(model.slug); push(`/compare?models=${model.slug}`); }}
          className="shrink-0 gap-1.5"
        >
          <GitCompareArrows className="size-4" />
          {t.compare.compare}
        </Button>
      </div>

      <Separator />

      {capabilitiesPromise && (
        <Suspense>
          <CapabilitiesSection
            promise={capabilitiesPromise}
            t={{
              capabilities: t.detail.capabilities,
              contextWindow: t.detail.contextWindow,
              modalities: t.detail.modalities,
              inputModality: t.detail.inputModality,
              outputModality: t.detail.outputModality,
              totalParams: t.detail.totalParams,
              activeParams: t.detail.activeParams,
              knowledgeCutoff: t.detail.knowledgeCutoff,
              knowledgeCutoffTooltip: t.detail.knowledgeCutoffTooltip,
              opennessIndex: t.detail.opennessIndex,
              opennessTooltip: t.detail.opennessTooltip,
              modalityLabels: t.detail.modalityLabels,
            }}
          />
        </Suspense>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: benchmarks */}
        <div className="space-y-6">
          {/* AA Indices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="size-4 text-muted-foreground" />
                {t.detail.aaIndices}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BenchmarkRow label={t.benchmarks.intelligence} displayValue={fmt(ev.artificial_analysis_intelligence_index)} barPct={ev.artificial_analysis_intelligence_index ?? 0} />
              <BenchmarkRow label={t.benchmarks.coding}       displayValue={fmt(ev.artificial_analysis_coding_index)}       barPct={ev.artificial_analysis_coding_index ?? 0} />
              <BenchmarkRow label={t.benchmarks.math}         displayValue={fmt(ev.artificial_analysis_math_index)}         barPct={ev.artificial_analysis_math_index ?? 0} />
              {ev.agentic_index !== null && ev.agentic_index !== undefined && (
                <BenchmarkRow label={t.benchmarks.agentic} displayValue={fmt(ev.agentic_index)} barPct={ev.agentic_index ?? 0} />
              )}
            </CardContent>
          </Card>

          {/* Standard benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="size-4 text-muted-foreground" />
                {t.detail.standardBenchmarks}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BenchmarkRow label={t.benchmarks.mmlu_pro}           displayValue={benchmarksPct.mmlu_pro !== null ? `${fmt(benchmarksPct.mmlu_pro)}%` : "—"} barPct={benchmarksPct.mmlu_pro ?? 0} />
              <BenchmarkRow label={t.benchmarks.gpqa}               displayValue={benchmarksPct.gpqa !== null ? `${fmt(benchmarksPct.gpqa)}%` : "—"} barPct={benchmarksPct.gpqa ?? 0} />
              <BenchmarkRow label={t.benchmarks.hle}                displayValue={benchmarksPct.hle !== null ? `${fmt(benchmarksPct.hle)}%` : "—"} barPct={benchmarksPct.hle ?? 0} />
              <BenchmarkRow label={t.benchmarks.livecodebench}      displayValue={benchmarksPct.livecodebench !== null ? `${fmt(benchmarksPct.livecodebench)}%` : "—"} barPct={benchmarksPct.livecodebench ?? 0} />
              <BenchmarkRow label={t.benchmarks.scicode}            displayValue={benchmarksPct.scicode !== null ? `${fmt(benchmarksPct.scicode)}%` : "—"} barPct={benchmarksPct.scicode ?? 0} />
              <BenchmarkRow label={t.benchmarks.math_500}           displayValue={benchmarksPct.math_500 !== null ? `${fmt(benchmarksPct.math_500)}%` : "—"} barPct={benchmarksPct.math_500 ?? 0} />
              <BenchmarkRow label={t.benchmarks.aime}               displayValue={benchmarksPct.aime !== null ? `${fmt(benchmarksPct.aime)}%` : "—"} barPct={benchmarksPct.aime ?? 0} />
              <BenchmarkRow label={t.benchmarks.aime_25}            displayValue={benchmarksPct.aime_25 !== null ? `${fmt(benchmarksPct.aime_25)}%` : "—"} barPct={benchmarksPct.aime_25 ?? 0} />
              <BenchmarkRow label={t.benchmarks.ifbench}            displayValue={benchmarksPct.ifbench !== null ? `${fmt(benchmarksPct.ifbench)}%` : "—"} barPct={benchmarksPct.ifbench ?? 0} />
              <BenchmarkRow label={t.benchmarks.lcr}                displayValue={benchmarksPct.lcr !== null ? `${fmt(benchmarksPct.lcr)}%` : "—"} barPct={benchmarksPct.lcr ?? 0} />
              <BenchmarkRow label={t.benchmarks.terminalbench_hard} displayValue={benchmarksPct.terminalbench_hard !== null ? `${fmt(benchmarksPct.terminalbench_hard)}%` : "—"} barPct={benchmarksPct.terminalbench_hard ?? 0} />
              <BenchmarkRow label={t.benchmarks.tau2}               displayValue={benchmarksPct.tau2 !== null ? `${fmt(benchmarksPct.tau2)}%` : "—"} barPct={benchmarksPct.tau2 ?? 0} />
              {benchmarksPct.humaneval !== null && (
                <BenchmarkRow label={t.benchmarks.humaneval} displayValue={`${fmt(benchmarksPct.humaneval)}%`} barPct={benchmarksPct.humaneval ?? 0} />
              )}
              {benchmarksPct.omniscience !== null && (
                <BenchmarkRow label={t.benchmarks.omniscience} displayValue={`${fmt(benchmarksPct.omniscience)}%`} barPct={benchmarksPct.omniscience ?? 0} />
              )}
              {benchmarksPct.multilingual_aa !== null && (
                <BenchmarkRow label={t.benchmarks.multilingual} displayValue={`${fmt(benchmarksPct.multilingual_aa)}%`} barPct={benchmarksPct.multilingual_aa ?? 0} />
              )}
              {benchmarksPct.mmmu_pro !== null && (
                <BenchmarkRow label={t.benchmarks.mmmu_pro} displayValue={`${fmt(benchmarksPct.mmmu_pro)}%`} barPct={benchmarksPct.mmmu_pro ?? 0} />
              )}
              {benchmarksPct.critpt !== null && (
                <BenchmarkRow label={t.benchmarks.critpt} displayValue={`${fmt(benchmarksPct.critpt)}%`} barPct={benchmarksPct.critpt ?? 0} />
              )}
              {ev.gdpval !== null && ev.gdpval !== undefined && (
                <BenchmarkRow label={t.benchmarks.gdpval} displayValue={ev.gdpval.toFixed(0)} barPct={Math.min((ev.gdpval / 2000) * 100, 100)} />
              )}
              {benchmarksPct.apex_agents !== null && (
                <BenchmarkRow label={t.benchmarks.apex_agents} displayValue={`${fmt(benchmarksPct.apex_agents)}%`} barPct={benchmarksPct.apex_agents ?? 0} />
              )}
              {benchmarksPct.omniscience_non_hallucination !== null && (
                <BenchmarkRow label={t.benchmarks.omniscience_non_hallucination} displayValue={`${fmt(benchmarksPct.omniscience_non_hallucination)}%`} barPct={benchmarksPct.omniscience_non_hallucination ?? 0} />
              )}
            </CardContent>
          </Card>

          {/* Additional benchmarks (dynamic) / Supplémentaires dynamiques */}
          {extraBenchmarks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="size-4 text-muted-foreground" />
                  {t.detail.extraBenchmarks}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {extraBenchmarks.map(([key, val]) => {
                  const numVal = val as number;
                  const barPct = numVal > 1 ? numVal : numVal * 100;
                  return (
                    <BenchmarkRow
                      key={key}
                      label={formatBenchmarkKey(key)}
                      displayValue={fmtDynamic(numVal)}
                      barPct={barPct}
                    />
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: perf + pricing */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Zap className="size-4 text-muted-foreground" />{t.detail.performance}
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <StatRow label={t.detail.outputSpeed}  value={median_output_tokens_per_second !== null ? `${fmt(median_output_tokens_per_second, 0)} tokens/s` : "—"} />
              <StatRow label={t.detail.ttft}         value={median_time_to_first_token_seconds !== null ? `${fmt(median_time_to_first_token_seconds, 2)} s` : "—"} />
              <StatRow label={t.detail.firstAnswer}  value={median_time_to_first_answer_token !== null ? `${fmt(median_time_to_first_answer_token, 2)} s` : "—"} />
              {model.end_to_end_response_time_seconds != null && (
                <StatRow
                  label={t.detail.endToEnd}
                  tooltip={t.detail.endToEndTooltip}
                  value={`${fmt(model.end_to_end_response_time_seconds, 1)} s`}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="size-4 text-muted-foreground" />{t.detail.pricing}
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <StatRow label={t.detail.inputTokens}  value={pricing.price_1m_input_tokens !== null ? `$${fmt(pricing.price_1m_input_tokens, 2)}` : "—"} />
              {pricing.price_1m_cache_hit_tokens != null && (
                <StatRow
                  label={t.detail.cacheHit}
                  tooltip={t.detail.cacheHitTooltip}
                  value={`$${fmt(pricing.price_1m_cache_hit_tokens, 3)}`}
                />
              )}
              <StatRow label={t.detail.outputTokens} value={pricing.price_1m_output_tokens !== null ? `$${fmt(pricing.price_1m_output_tokens, 2)}` : "—"} />
              <StatRow label={t.detail.blended} tooltip={t.detail.blendedTooltip} value={pricing.price_1m_blended_3_to_1 !== null ? `$${fmt(pricing.price_1m_blended_3_to_1, 2)}` : "—"} />
              {pricing.price_1m_blended_7_2_1 != null && (
                <StatRow
                  label={t.detail.blended721}
                  tooltip={t.detail.blended721Tooltip}
                  value={`$${fmt(pricing.price_1m_blended_7_2_1, 2)}`}
                />
              )}
            </CardContent>
          </Card>

          {capabilitiesPromise && (
            <Suspense>
              <MetaEvalSection
                promise={capabilitiesPromise}
                t={{
                  metaInfo: t.detail.metaInfo,
                  intelligenceTokens: t.detail.intelligenceTokens,
                  intelligenceTokensTooltip: t.detail.intelligenceTokensTooltip,
                  intelligenceCost: t.detail.intelligenceCost,
                  intelligenceCostTooltip: t.detail.intelligenceCostTooltip,
                }}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
