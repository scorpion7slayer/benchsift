import { use, type ReactNode } from "react";
import { BookOpen, DollarSign, ImageIcon, Info, Mic, Route, Type, Video, Zap } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import type { LLMModel } from "@/lib/model-types";
import {
  formatMoney,
  formatNumber,
  formatParameters,
  formatSeconds,
  formatSpeed,
  formatTokens,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { hasPricingData } from "@/lib/model-metrics";
import type { MetricRank, ModelInsights } from "@/lib/model-insights";
import { DetailCard, StatRow } from "./detail-primitives";

type Caps = Partial<LLMModel>;
type Modality = "text" | "image" | "speech" | "video" | "decisions";

/** A specification line; rows whose value is missing are not rendered. */
interface Spec {
  key: string;
  label: string;
  hint?: string;
  value: ReactNode | null | undefined;
  rank?: MetricRank;
}

function SpecRows({ specs }: { specs: Spec[] }) {
  return specs
    .filter((spec) => spec.value != null && spec.value !== false)
    .map((spec) => <StatRow key={spec.key} label={spec.label} tooltip={spec.hint} value={spec.value} rank={spec.rank} />);
}

/** Formats a present value, or returns null so the row is skipped. */
function when<T>(value: T | null | undefined, format: (value: T) => ReactNode): ReactNode | null {
  return value == null ? null : format(value);
}

const MODALITIES = ["text", "image", "speech", "video"] as const;
const MODALITY_ICONS: Record<Modality, typeof Type> = {
  text: Type,
  image: ImageIcon,
  speech: Mic,
  video: Video,
  decisions: Route,
};

function ModalityBadges({ modalities }: { modalities: Modality[] }) {
  const { t } = useI18n();
  if (!modalities.length) return null;
  return (
    <span className="flex flex-wrap justify-end gap-1.5">
      {modalities.map((modality) => {
        const Icon = MODALITY_ICONS[modality];
        return (
          <span key={modality} className="inline-flex items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 text-xs font-normal">
            <Icon aria-hidden="true" className="size-3.5" />
            {t.detail.modalityLabels[modality]}
          </span>
        );
      })}
    </span>
  );
}

/** Context, limits, parameters and modalities, merged from OpenRouter and the AA page. */
export function CapabilitiesCard({ promise, model }: { promise: Promise<Caps>; model: LLMModel }) {
  const { t, lang } = useI18n();
  const caps = use(promise);
  const input: Modality[] = MODALITIES.filter((key) => caps[`input_modality_${key}`]);
  const output: Modality[] = MODALITIES.filter((key) => caps[`output_modality_${key}`]);
  if (caps.openrouter_output_modalities?.includes("decisions")) output.push("decisions");
  const parameters = caps.openrouter_supported_parameters ?? [];
  const tokens = (value: number) => `${formatTokens(value, lang)} tokens`;

  const specs: Spec[] = [
    { key: "context", label: t.detail.contextWindow, hint: t.glossary.contextWindow, value: when(caps.context_window_tokens ?? model.context_window_tokens, tokens) },
    { key: "max-output", label: t.detail.maxOutputTokens, value: when(caps.openrouter_max_completion_tokens, tokens) },
    { key: "expiry", label: t.detail.deprecationDate, value: caps.openrouter_expiration_date },
    { key: "cutoff", label: t.detail.knowledgeCutoff, hint: t.detail.knowledgeCutoffTooltip, value: caps.knowledge_cutoff },
    { key: "total", label: t.detail.totalParams, value: when(caps.total_parameters_b, (value) => formatParameters(value, lang)) },
    { key: "active", label: t.detail.activeParams, value: when(caps.active_parameters_b, (value) => formatParameters(value, lang)) },
    { key: "openness", label: t.detail.opennessIndex, hint: t.detail.opennessTooltip, value: when(caps.openness_index, (value) => `${formatNumber(value, lang, 0)} / 100`) },
    { key: "input", label: t.detail.inputModality, value: input.length ? <ModalityBadges modalities={input} /> : null },
    { key: "output", label: t.detail.outputModality, value: output.length ? <ModalityBadges modalities={output} /> : null },
  ];
  if (!specs.some((spec) => spec.value != null) && !parameters.length) return null;

  return (
    <DetailCard icon={BookOpen} title={t.detail.capabilities} contentClassName="divide-y">
      <SpecRows specs={specs} />
      {parameters.length > 0 && (
        <details className="group py-2.5 text-sm">
          <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 rounded-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {t.detail.supportedParameters}
            <span className="tabular-nums text-foreground">{parameters.length}</span>
          </summary>
          <div className="disclosure-content mt-2 flex flex-wrap gap-1">
            {parameters.map((parameter) => (
              <Badge key={parameter} variant="secondary" className="font-mono text-[10px]">{parameter}</Badge>
            ))}
          </div>
        </details>
      )}
    </DetailCard>
  );
}

export function PerformanceCard({ model, ranks }: { model: LLMModel; ranks: ModelInsights["ranks"] }) {
  const { t, lang } = useI18n();
  const seconds = (value: number) => formatSeconds(value, lang);
  const specs: Spec[] = [
    { key: "speed", label: t.detail.outputSpeed, hint: t.glossary.outputSpeed, value: when(model.median_output_tokens_per_second, (value) => formatSpeed(value, lang)), rank: ranks.speed },
    { key: "ttft", label: t.detail.ttft, hint: t.glossary.ttft, value: when(model.median_time_to_first_token_seconds, seconds), rank: ranks.ttft },
    { key: "first-answer", label: t.detail.firstAnswer, hint: t.glossary.firstAnswer, value: when(model.median_time_to_first_answer_token, seconds) },
    { key: "end-to-end", label: t.detail.endToEnd, hint: t.detail.endToEndTooltip, value: when(model.end_to_end_response_time_seconds, seconds) },
    { key: "rank", label: t.detail.openrouterWeeklyRank, hint: t.glossary.openrouterRank, value: when(model.openrouter_weekly_rank, (value) => `#${value}`) },
  ];
  if (!specs.some((spec) => spec.value != null)) return null;
  return (
    <DetailCard icon={Zap} title={t.detail.performance} contentClassName="divide-y">
      <SpecRows specs={specs} />
    </DetailCard>
  );
}

export function PricingCard({ model, ranks }: { model: LLMModel; ranks: ModelInsights["ranks"] }) {
  const { t, lang } = useI18n();
  if (!hasPricingData(model)) return null;
  const { pricing } = model;
  const money = (value: number) => formatMoney(value, lang);
  const unitPrices = pricing.openrouter_display_prices ?? [];

  // Media models are billed per unit (image, minute…); token prices do not apply to them.
  const specs: Spec[] = unitPrices.length
    ? unitPrices.map((row) => ({ key: `${row.label}-${row.unit}`, label: row.label, value: `${money(row.price)} ${row.unit}`.trim() }))
    : [
        // Input, output and blended stay visible as "—" when absent: they frame the other prices.
        { key: "input", label: t.detail.inputTokens, value: formatMoney(pricing.price_1m_input_tokens, lang) },
        { key: "output", label: t.detail.outputTokens, value: formatMoney(pricing.price_1m_output_tokens, lang) },
        { key: "cache-hit", label: t.detail.cacheHit, hint: t.detail.cacheHitTooltip, value: when(pricing.price_1m_cache_hit_tokens, money) },
        { key: "cache-write", label: t.detail.cacheWrite, value: when(pricing.price_1m_cache_write_tokens, money) },
        { key: "reasoning", label: t.detail.reasoningTokens, value: when(pricing.price_1m_reasoning_tokens, money) },
        { key: "web-search", label: t.detail.webSearch, value: when(pricing.price_web_search, (value) => `${money(value)} / op`) },
        { key: "blended", label: t.detail.blended, hint: t.detail.blendedTooltip, value: formatMoney(pricing.price_1m_blended_3_to_1, lang), rank: ranks.price },
        { key: "blended-721", label: t.detail.blended721, hint: t.detail.blended721Tooltip, value: when(pricing.price_1m_blended_7_2_1, money) },
      ];

  return (
    <DetailCard
      icon={DollarSign}
      title={t.detail.pricing}
      description={unitPrices.length ? undefined : t.detail.pricePerMillion}
      contentClassName="divide-y"
    >
      <SpecRows specs={specs} />
    </DetailCard>
  );
}

/** Tokens and cost Artificial Analysis spent running its Intelligence Index. */
export function MetaEvalCard({ promise, model }: { promise: Promise<Caps>; model: LLMModel }) {
  const { t, lang } = useI18n();
  const caps = use(promise);
  const money = (value: number) => formatMoney(value, lang);
  const specs: Spec[] = [
    { key: "cost-per-task", label: t.detail.costPerTask, hint: t.detail.costPerTaskTooltip, value: when(model.intelligence_index_cost_per_task_usd ?? caps.intelligence_index_cost_per_task_usd, money) },
    { key: "tokens", label: t.detail.intelligenceTokens, hint: t.detail.intelligenceTokensTooltip, value: when(model.intelligence_index_tokens ?? caps.intelligence_index_tokens, (value) => formatTokens(value, lang)) },
    { key: "cost", label: t.detail.intelligenceCost, hint: t.detail.intelligenceCostTooltip, value: when(model.intelligence_index_cost_usd ?? caps.intelligence_index_cost_usd, money) },
  ];
  if (!specs.some((spec) => spec.value != null)) return null;
  return (
    <DetailCard icon={Info} title={t.detail.metaInfo} contentClassName="divide-y">
      <SpecRows specs={specs} />
    </DetailCard>
  );
}
