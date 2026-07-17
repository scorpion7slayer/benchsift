import { use, Suspense } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Zap, DollarSign, BarChart3, TrendingUp, GitCompareArrows,
  Brain, ImageIcon, Video, Mic, Type, Lock, Unlock, BookOpen, Info,
  Sparkles, ExternalLink, SlidersHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, type ProgressTone } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { ModelAvailabilityBadge, ModelAvailabilityNotice } from "@/components/model-availability";
import { useI18n } from "@/lib/i18n";
import { useCompare } from "@/lib/compare-store";
import { getModelProviderKey } from "@/lib/provider-map";
import { cn } from "@/lib/utils";
import { isModelCurrentlyUnavailable } from "@/lib/model-availability";
import {
  applicableExtraBenchmarkEntries,
  hasAAIndexBenchmarks,
  hasPricingData,
  mediaBenchmarkValues,
  textMetricValue,
} from "@/lib/model-metrics";
import type { LLMModel } from "@/lib/api";
import type { ModelReasoningVariantOption } from "@/lib/model-reasoning";

type Caps = Partial<LLMModel>;

// Streamed sections (scraped data) / Sections streamées (données scrapées)

function ScrapedBadges({
  promise,
  availabilityStatus,
  t,
}: {
  promise: Promise<Caps>;
  availabilityStatus: LLMModel["availability_status"];
  t: { reasoning: string; openWeights: string; closedWeights: string };
}) {
  const caps = use(promise);
  return (
    <>
      {availabilityStatus == null && (
        <ModelAvailabilityBadge model={{ availability_status: caps.availability_status }} />
      )}
      {caps.reasoning_model && (
        <Badge variant="secondary">
          <Brain data-icon="inline-start" />
          {t.reasoning}
        </Badge>
      )}
      {caps.is_open_weights ? (
        <Badge variant="outline" className="text-xs">
          <Unlock data-icon="inline-start" />{t.openWeights}
        </Badge>
      ) : caps.is_open_weights === false ? (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          <Lock data-icon="inline-start" />{t.closedWeights}
        </Badge>
      ) : null}
    </>
  );
}

function StreamedAvailabilityNotice({
  promise,
  slug,
}: {
  promise: Promise<Caps>;
  slug: string;
}) {
  const caps = use(promise);
  return (
    <ModelAvailabilityNotice
      model={{ slug, availability_status: caps.availability_status }}
    />
  );
}

function HuggingFaceAnchor({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ExternalLink className="size-3" />
      {label}
    </a>
  );
}

function StreamedHuggingFaceLink({ promise, label }: { promise: Promise<Caps>; label: string }) {
  const caps = use(promise);
  if (caps.huggingface_official !== true || !caps.huggingface_url) return null;
  return <HuggingFaceAnchor url={caps.huggingface_url} label={label} />;
}

function fmtParams(b: number): string {
  if (b >= 1000) return `${(b / 1000).toFixed(1)}T`;
  if (b >= 1) return `${b % 1 === 0 ? b : b.toFixed(1)}B`;
  return `${Math.round(b * 1000)}M`;
}

interface CapsTranslations {
  capabilities: string;
  contextWindow: string;
  maxOutputTokens: string;
  supportedParameters: string;
  deprecationDate: string;
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
    caps.openrouter_max_completion_tokens ||
    caps.openrouter_expiration_date ||
    (caps.openrouter_supported_parameters?.length ?? 0) > 0 ||
    caps.total_parameters_b ||
    caps.knowledge_cutoff ||
    caps.openness_index != null ||
    inputMods.length > 0 ||
    outputMods.length > 0;
  if (!hasContent) return null;

  return (
    <Card>
      <CardHeader className="border-b border-border/70">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BookOpen className="size-4 text-muted-foreground" />
          {t.capabilities}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
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
        {caps.openrouter_max_completion_tokens && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t.maxOutputTokens}</span>
            <span className="font-mono tabular-nums">
              {fmtCtx(caps.openrouter_max_completion_tokens)}
            </span>
          </div>
        )}
        {caps.openrouter_expiration_date && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t.deprecationDate}</span>
            <span className="font-mono tabular-nums">{caps.openrouter_expiration_date}</span>
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
        {(caps.openrouter_supported_parameters?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground">{t.supportedParameters}</span>
            <div className="flex flex-wrap gap-1">
              {caps.openrouter_supported_parameters?.map((parameter) => (
                <Badge key={parameter} variant="secondary" className="font-mono text-[10px]">
                  {parameter}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {(inputMods.length > 0 || outputMods.length > 0) && (
          <div className="flex flex-col gap-2">
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
      <CardHeader className="border-b border-border/70">
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

function fmt(val: number | null | undefined, decimals = 1) {
  if (val == null || isNaN(val)) return "—";
  return val.toFixed(decimals);
}

function fmtPrice(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—";
  if (value === 0) return "0";
  if (value < 0.01) return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  if (value < 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(2).replace(/\.00$/, "");
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
  const title = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  if (key.startsWith("openrouter_benchmark_")) {
    return `OpenRouter ${title(key.replace("openrouter_benchmark_", ""))}`;
  }
  if (key.startsWith("openrouter_da_")) {
    return `OpenRouter DA ${title(key.replace("openrouter_da_", "").replace(/_win_rate$/, ""))} Win Rate`;
  }
  return title(key);
}

function reasoningVariantLabel(
  variant: ModelReasoningVariantOption,
  labels: ReturnType<typeof useI18n>["t"]["detail"]["reasoningLevels"],
): string {
  const effort = variant.effort ? labels[variant.effort] : null;
  if (variant.mode === "non-reasoning") {
    return effort ? `${labels.nonReasoning} · ${effort}` : labels.nonReasoning;
  }
  if (variant.mode === "default") return labels.default;
  if (variant.mode === "adaptive-reasoning") {
    return effort ? `${labels.adaptiveReasoning} · ${effort}` : labels.adaptiveReasoning;
  }
  if (variant.mode === "thinking") {
    return effort ? `${labels.thinking} · ${effort}` : labels.thinking;
  }
  return effort ?? labels.reasoning;
}

// Sub-components / Sous-composants

function benchmarkTone(value: number): ProgressTone {
  if (value >= 75) return "strong";
  if (value >= 50) return "good";
  if (value >= 25) return "moderate";
  return "low";
}

function BenchmarkRow({
  label, displayValue, barPct,
}: {
  label: string; displayValue: string; barPct: number;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-b border-border/70 py-3 last:border-b-0">
      <div className="flex items-center justify-between text-sm">
        <span className="min-w-0 pr-3 text-muted-foreground">{label}</span>
        <span className="shrink-0 font-mono text-sm font-medium tabular-nums">{displayValue}</span>
      </div>
      <Progress
        value={Math.min(Math.max(barPct, 0), 100)}
        tone={benchmarkTone(barPct)}
        aria-label={`${label}: ${displayValue}`}
        className="h-1"
      />
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
      className={cn("inline-flex size-7 items-center justify-center rounded-md border transition-colors",
        active
          ? "bg-muted text-foreground border-border"
          : "text-muted-foreground/20 border-border/20"
      )}
    >
      {icon}
    </span>
  );
}

function MediaBenchmarksSection({
  model,
  t,
  lang,
}: {
  model: LLMModel;
  t: ReturnType<typeof useI18n>["t"];
  lang: ReturnType<typeof useI18n>["lang"];
}) {
  const rows = mediaBenchmarkValues(model);
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="border-b border-border/70">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="size-4 text-chart-2" />
          {t.detail.mediaBenchmarks}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-x-6 sm:grid-cols-2">
        {rows.map((row) => {
          const rank = row.rank != null ? ` · #${fmt(row.rank, 0)}` : "";
          const appearances =
            row.appearances != null ? ` · ${fmtTokens(row.appearances)} ${t.detail.appearances}` : "";
          return (
            <BenchmarkRow
              key={row.eloKey}
              label={row.label[lang]}
              displayValue={`${fmt(row.elo, 0)} ELO${rank}${appearances}`}
              barPct={Math.min(100, Math.max(0, (row.elo / 1400) * 100))}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function NoBenchmarksCard({ t }: { t: ReturnType<typeof useI18n>["t"] }) {
  return (
    <Card>
      <CardHeader className="border-b border-border/70">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="size-4 text-muted-foreground" />
          {t.detail.noBenchmarks}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{t.detail.noBenchmarksDescription}</p>
      </CardContent>
    </Card>
  );
}

// Main component / Composant principal

export function ModelDetailClient({
  model,
  familyName,
  variants,
  capabilitiesPromise,
}: {
  model: LLMModel;
  familyName: string;
  variants: ModelReasoningVariantOption[];
  capabilitiesPromise?: Promise<Caps>;
}) {
  const { t, lang } = useI18n();
  const { replace, isSelected, isFull, selected } = useCompare();
  const navigate = useNavigate();
  const {
    slug, model_creator, evaluations: ev, pricing,
    median_output_tokens_per_second, median_time_to_first_token_seconds,
    median_time_to_first_answer_token, release_date,
  } = model;

  const providerKey = getModelProviderKey(slug, model_creator.slug);
  const intelligence = textMetricValue(model, "artificial_analysis_intelligence_index");
  const isComp = isSelected(model.slug);
  const openRouterDisplayPrices = pricing.openrouter_display_prices ?? [];
  const usesOpenRouterDisplayPrices = openRouterDisplayPrices.length > 0;
  const officialHuggingFaceUrl =
    model.huggingface_official === true ? model.huggingface_url : null;
  const selectedVariant = variants.find((variant) => variant.slug === model.slug) ?? variants[0];
  const selectedVariantLabel = selectedVariant
    ? reasoningVariantLabel(selectedVariant, t.detail.reasoningLevels)
    : t.detail.reasoningLevels.default;


  // Known benchmarks as % / Benchmarks connus en %
  const benchmarksPct = {
    mmlu_pro: pct(textMetricValue(model, "mmlu_pro")),
    gpqa: pct(textMetricValue(model, "gpqa")),
    hle: pct(textMetricValue(model, "hle")),
    livecodebench: pct(textMetricValue(model, "livecodebench")),
    scicode: pct(textMetricValue(model, "scicode")),
    math_500: pct(textMetricValue(model, "math_500")),
    aime: pct(textMetricValue(model, "aime")),
    aime_25: pct(textMetricValue(model, "aime_25")),
    ifbench: pct(textMetricValue(model, "ifbench")),
    lcr: pct(textMetricValue(model, "lcr")),
    terminalbench_hard: pct(textMetricValue(model, "terminalbench_hard")),
    terminalbench_v2_1: pct(textMetricValue(model, "terminalbench_v2_1")),
    tau2: pct(textMetricValue(model, "tau2")),
    tau_banking: pct(textMetricValue(model, "tau_banking")),
    humaneval: pct(textMetricValue(model, "humaneval")),
    omniscience: pct(textMetricValue(model, "omniscience")),
    multilingual_aa: pct(textMetricValue(model, "multilingual_aa")),
    mmmu_pro: pct(textMetricValue(model, "mmmu_pro")),
    critpt: pct(textMetricValue(model, "critpt")),
    gdpval_normalized: pct(textMetricValue(model, "gdpval_normalized")),
    apex_agents: pct(textMetricValue(model, "apex_agents")),
    itbench_aa: pct(textMetricValue(model, "itbench_aa")),
    omniscience_non_hallucination: pct(textMetricValue(model, "omniscience_non_hallucination")),
  };

  const standardBenchmarkRows = [
    { key: "mmlu_pro", label: t.benchmarks.mmlu_pro, value: benchmarksPct.mmlu_pro },
    { key: "gpqa", label: t.benchmarks.gpqa, value: benchmarksPct.gpqa },
    { key: "hle", label: t.benchmarks.hle, value: benchmarksPct.hle },
    { key: "livecodebench", label: t.benchmarks.livecodebench, value: benchmarksPct.livecodebench },
    { key: "scicode", label: t.benchmarks.scicode, value: benchmarksPct.scicode },
    { key: "math_500", label: t.benchmarks.math_500, value: benchmarksPct.math_500 },
    { key: "aime", label: t.benchmarks.aime, value: benchmarksPct.aime },
    { key: "aime_25", label: t.benchmarks.aime_25, value: benchmarksPct.aime_25 },
    { key: "ifbench", label: t.benchmarks.ifbench, value: benchmarksPct.ifbench },
    { key: "lcr", label: t.benchmarks.lcr, value: benchmarksPct.lcr },
    { key: "terminalbench_hard", label: t.benchmarks.terminalbench_hard, value: benchmarksPct.terminalbench_hard },
    { key: "terminalbench_v2_1", label: t.benchmarks.terminalbench_v2_1, value: benchmarksPct.terminalbench_v2_1 },
    { key: "tau2", label: t.benchmarks.tau2, value: benchmarksPct.tau2 },
    { key: "tau_banking", label: t.benchmarks.tau_banking, value: benchmarksPct.tau_banking },
    { key: "humaneval", label: t.benchmarks.humaneval, value: benchmarksPct.humaneval },
    { key: "omniscience", label: t.benchmarks.omniscience, value: benchmarksPct.omniscience },
    { key: "multilingual_aa", label: t.benchmarks.multilingual, value: benchmarksPct.multilingual_aa },
    { key: "mmmu_pro", label: t.benchmarks.mmmu_pro, value: benchmarksPct.mmmu_pro },
    { key: "critpt", label: t.benchmarks.critpt, value: benchmarksPct.critpt },
    { key: "gdpval_normalized", label: t.benchmarks.gdpval_normalized, value: benchmarksPct.gdpval_normalized },
    { key: "apex_agents", label: t.benchmarks.apex_agents, value: benchmarksPct.apex_agents },
    { key: "itbench_aa", label: t.benchmarks.itbench_aa, value: benchmarksPct.itbench_aa },
    { key: "omniscience_non_hallucination", label: t.benchmarks.omniscience_non_hallucination, value: benchmarksPct.omniscience_non_hallucination },
  ].flatMap((row) => row.value == null
    ? []
    : [{
        key: row.key,
        label: row.label,
        displayValue: `${fmt(row.value)}%`,
        barPct: row.value,
      }]);

  if (ev.gdpval != null) {
    standardBenchmarkRows.push({
      key: "gdpval",
      label: t.benchmarks.gdpval,
      displayValue: ev.gdpval.toFixed(0),
      barPct: Math.min((ev.gdpval / 2000) * 100, 100),
    });
  }

  // Unknown additional benchmarks / Benchmarks supplémentaires non connus
  const extraBenchmarks = applicableExtraBenchmarkEntries(model);
  const showAAIndices = hasAAIndexBenchmarks(model);
  const showStandardBenchmarks = standardBenchmarkRows.length > 0;
  const showMediaBenchmarks = mediaBenchmarkValues(model).length > 0;
  const showNoBenchmarks = !showAAIndices && !showStandardBenchmarks && !showMediaBenchmarks && extraBenchmarks.length === 0;
  const showPerformance = [
    median_output_tokens_per_second,
    median_time_to_first_token_seconds,
    median_time_to_first_answer_token,
    model.end_to_end_response_time_seconds,
    model.openrouter_weekly_rank,
    model.openrouter_weekly_tokens,
    model.openrouter_weekly_requests,
    model.openrouter_weekly_tool_calls,
    model.openrouter_weekly_images,
    model.openrouter_weekly_audio_inputs,
  ].some((value) => value != null);
  const showPricing = hasPricingData(model);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="flex flex-col gap-5 rounded-xl border border-border/70 bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted">
              <ModelProviderIcon provider={providerKey} size={32} iconUrl={model.provider_icon_url} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-muted-foreground">{model_creator.name}</p>
              <h1 className="mt-0.5 break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {familyName}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {intelligence !== null && (
                  <Badge variant="outline" className="font-mono tabular-nums">
                    {fmt(intelligence)} {t.detail.intelligenceIndex}
                  </Badge>
                )}
                {release_date && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {release_date}
                  </Badge>
                )}
                <ModelAvailabilityBadge model={model} />
                {capabilitiesPromise && (
                  <Suspense>
                    <ScrapedBadges
                      promise={capabilitiesPromise}
                      availabilityStatus={model.availability_status}
                      t={{ reasoning: t.detail.reasoning, openWeights: t.detail.openWeights, closedWeights: t.detail.closedWeights }}
                    />
                  </Suspense>
                )}
                {officialHuggingFaceUrl ? (
                  <HuggingFaceAnchor url={officialHuggingFaceUrl} label={t.card.huggingface} />
                ) : capabilitiesPromise ? (
                  <Suspense>
                    <StreamedHuggingFaceLink promise={capabilitiesPromise} label={t.card.huggingface} />
                  </Suspense>
                ) : null}
              </div>
            </div>
          </div>
          <Button
            variant={isComp ? "default" : "outline"}
            size="sm"
            disabled={!isComp && isFull}
            onClick={() => {
              const nextSelection = isComp
                ? selected.filter((selectedSlug) => selectedSlug !== model.slug)
                : [...selected, model.slug];
              replace(nextSelection);
              void navigate({
                to: "/compare",
                search: nextSelection.length > 0
                  ? { models: nextSelection.join(",") }
                  : {},
              });
            }}
            className="touch-target w-full shrink-0 sm:w-auto"
          >
            <GitCompareArrows data-icon="inline-start" />
            {t.compare.compare}
          </Button>
        </div>

        {variants.length > 1 && (
          <>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_18rem] sm:items-end">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <SlidersHorizontal className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t.detail.reasoningConfiguration}</p>
                  <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
                    {t.detail.reasoningConfigurationDescription}
                  </p>
                </div>
              </div>
              <Select
                value={model.slug}
                onValueChange={(nextSlug) => {
                  if (nextSlug === model.slug) return;
                  void navigate({
                    to: "/models/$slug",
                    params: { slug: nextSlug },
                    replace: true,
                  });
                }}
              >
                <SelectTrigger
                  aria-label={t.detail.reasoningConfiguration}
                  className="touch-target w-full"
                >
                  <SelectValue>{selectedVariantLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectGroup>
                    {variants.map((variant) => (
                      <SelectItem key={variant.slug} value={variant.slug}>
                        {reasoningVariantLabel(variant, t.detail.reasoningLevels)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </section>

      <ModelAvailabilityNotice model={model} />
      {capabilitiesPromise && !isModelCurrentlyUnavailable(model) && (
        <Suspense>
          <StreamedAvailabilityNotice promise={capabilitiesPromise} slug={model.slug} />
        </Suspense>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        {/* Left: benchmarks */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* AA Indices */}
          {showAAIndices && (
            <Card>
              <CardHeader className="border-b border-border/70">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="size-4 text-chart-1" />
                  {t.detail.aaIndices}
                </CardTitle>
                <CardDescription>{selectedVariantLabel}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-x-6 sm:grid-cols-2">
                {textMetricValue(model, "artificial_analysis_intelligence_index") != null && (
                  <BenchmarkRow label={t.benchmarks.intelligence} displayValue={fmt(textMetricValue(model, "artificial_analysis_intelligence_index"))} barPct={textMetricValue(model, "artificial_analysis_intelligence_index") ?? 0} />
                )}
                {textMetricValue(model, "artificial_analysis_coding_index") != null && (
                  <BenchmarkRow label={t.benchmarks.coding} displayValue={fmt(textMetricValue(model, "artificial_analysis_coding_index"))} barPct={textMetricValue(model, "artificial_analysis_coding_index") ?? 0} />
                )}
                {textMetricValue(model, "artificial_analysis_math_index") != null && (
                  <BenchmarkRow label={t.benchmarks.math} displayValue={fmt(textMetricValue(model, "artificial_analysis_math_index"))} barPct={textMetricValue(model, "artificial_analysis_math_index") ?? 0} />
                )}
                {textMetricValue(model, "agentic_index") != null && (
                  <BenchmarkRow label={t.benchmarks.agentic} displayValue={fmt(textMetricValue(model, "agentic_index"))} barPct={textMetricValue(model, "agentic_index") ?? 0} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Standard benchmarks */}
          {showStandardBenchmarks && (
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="size-4 text-chart-2" />
                {t.detail.standardBenchmarks}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-6 sm:grid-cols-2">
              {standardBenchmarkRows.map((row) => (
                <BenchmarkRow
                  key={row.key}
                  label={row.label}
                  displayValue={row.displayValue}
                  barPct={row.barPct}
                />
              ))}
            </CardContent>
          </Card>
          )}

          <MediaBenchmarksSection model={model} t={t} lang={lang} />

          {/* Additional benchmarks (dynamic) / Supplémentaires dynamiques */}
          {extraBenchmarks.length > 0 && (
            <Card>
              <CardHeader className="border-b border-border/70">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="size-4 text-chart-3" />
                  {t.detail.extraBenchmarks}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-x-6 sm:grid-cols-2">
                {extraBenchmarks.map(([key, val]) => {
                  const numVal = val as number;
                  const isPercentScore = key.startsWith("openrouter_da_");
                  const barPct = isPercentScore ? numVal : numVal > 1 ? numVal : numVal * 100;
                  return (
                    <BenchmarkRow
                      key={key}
                      label={formatBenchmarkKey(key)}
                      displayValue={isPercentScore ? `${fmt(numVal)}%` : fmtDynamic(numVal)}
                      barPct={barPct}
                    />
                  );
                })}
              </CardContent>
            </Card>
          )}

          {showNoBenchmarks && <NoBenchmarksCard t={t} />}
        </div>

        {/* Right: perf + pricing */}
        <div className="flex min-w-0 flex-col gap-6">
          {capabilitiesPromise && (
            <Suspense>
              <CapabilitiesSection
                promise={capabilitiesPromise}
                t={{
                  capabilities: t.detail.capabilities,
                  contextWindow: t.detail.contextWindow,
                  maxOutputTokens: t.detail.maxOutputTokens,
                  supportedParameters: t.detail.supportedParameters,
                  deprecationDate: t.detail.deprecationDate,
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

          {showPerformance && (
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Zap className="size-4 text-muted-foreground" />{t.detail.performance}
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {median_output_tokens_per_second !== null && (
                <StatRow label={t.detail.outputSpeed} value={`${fmt(median_output_tokens_per_second, 0)} tokens/s`} />
              )}
              {median_time_to_first_token_seconds !== null && (
                <StatRow label={t.detail.ttft} value={`${fmt(median_time_to_first_token_seconds, 2)} s`} />
              )}
              {median_time_to_first_answer_token !== null && (
                <StatRow label={t.detail.firstAnswer} value={`${fmt(median_time_to_first_answer_token, 2)} s`} />
              )}
              {model.openrouter_weekly_rank != null && (
                <StatRow label={t.detail.openrouterWeeklyRank} value={`#${model.openrouter_weekly_rank}`} />
              )}
              {model.openrouter_weekly_tokens != null && (
                <StatRow label={t.detail.openrouterWeeklyTokens} value={fmtTokens(model.openrouter_weekly_tokens)} />
              )}
              {model.openrouter_weekly_requests != null && (
                <StatRow label={t.detail.openrouterWeeklyRequests} value={fmtTokens(model.openrouter_weekly_requests)} />
              )}
              {model.openrouter_weekly_tool_calls != null && model.openrouter_weekly_tool_calls > 0 && (
                <StatRow label={t.detail.openrouterWeeklyToolCalls} value={fmtTokens(model.openrouter_weekly_tool_calls)} />
              )}
              {model.openrouter_weekly_images != null && model.openrouter_weekly_images > 0 && (
                <StatRow label={t.detail.openrouterWeeklyImages} value={fmtTokens(model.openrouter_weekly_images)} />
              )}
              {model.openrouter_weekly_audio_inputs != null && model.openrouter_weekly_audio_inputs > 0 && (
                <StatRow label={t.detail.openrouterWeeklyAudioInputs} value={fmtTokens(model.openrouter_weekly_audio_inputs)} />
              )}
              {model.end_to_end_response_time_seconds != null && (
                <StatRow
                  label={t.detail.endToEnd}
                  tooltip={t.detail.endToEndTooltip}
                  value={`${fmt(model.end_to_end_response_time_seconds, 1)} s`}
                />
              )}
            </CardContent>
          </Card>
          )}

          {showPricing && (
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="size-4 text-muted-foreground" />{t.detail.pricing}
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {openRouterDisplayPrices.map((row) => (
                <StatRow
                  key={`${row.label}-${row.unit}-${row.price}`}
                  label={row.label}
                  value={`$${fmtPrice(row.price)} ${row.unit}`.trim()}
                />
              ))}
              {!usesOpenRouterDisplayPrices && (
                <>
                  <StatRow label={t.detail.inputTokens}  value={pricing.price_1m_input_tokens !== null ? `$${fmt(pricing.price_1m_input_tokens, 2)}` : "—"} />
                  {pricing.price_1m_cache_hit_tokens != null && (
                    <StatRow
                      label={t.detail.cacheHit}
                      tooltip={t.detail.cacheHitTooltip}
                      value={`$${fmt(pricing.price_1m_cache_hit_tokens, 3)}`}
                    />
                  )}
                  {pricing.price_1m_cache_write_tokens != null && (
                    <StatRow
                      label={t.detail.cacheWrite}
                      value={`$${fmt(pricing.price_1m_cache_write_tokens, 3)}`}
                    />
                  )}
                  {pricing.price_1m_reasoning_tokens != null && (
                    <StatRow
                      label={t.detail.reasoningTokens}
                      value={`$${fmt(pricing.price_1m_reasoning_tokens, 3)}`}
                    />
                  )}
                  {pricing.price_web_search != null && (
                    <StatRow
                      label={t.detail.webSearch}
                      value={`$${fmtPrice(pricing.price_web_search)} / op`}
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
                </>
              )}
            </CardContent>
          </Card>
          )}

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
