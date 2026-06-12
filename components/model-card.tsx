import { Link } from "@/components/link";
import { Zap, Timer, DollarSign, ChevronRight, Plus, Check, Brain, ImageIcon, Video, Mic, Type, BarChart3, Trophy, Unlock, ExternalLink } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useCompare } from "@/lib/compare-store";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { getModelProviderKey } from "@/lib/provider-map";
import {
  hasAAIndexBenchmarks,
  isOpenWeightsModel,
  mediaBenchmarkValues,
  textMetricValue,
} from "@/lib/model-metrics";
import type { LLMModel } from "@/lib/api";

function fmt(val: number | null | undefined, decimals = 1): string {
  if (val == null || isNaN(val)) return "—";
  return val.toFixed(decimals);
}

function fmtCtx(tokens: number | null): string {
  if (!tokens) return "";
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

function fmtCompact(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function fmtPrice(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—";
  if (value === 0) return "0";
  if (value < 0.01) return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  if (value < 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(2).replace(/\.00$/, "");
}

function compactUnit(unit: string): string {
  return unit
    .replace(/^per /, "/")
    .replace("/M text tokens", "/1M")
    .replace("/M audio tokens", "/1M audio")
    .replace("/M tokens", "/1M")
    .replace("per 1M characters", "/1M chars");
}

function cardPriceLabel(pricing: LLMModel["pricing"]): string {
  const unitRows = pricing.openrouter_display_prices?.filter((row) => row.kind === "unit");
  const displayRow = unitRows?.[0];
  if (displayRow) return `${fmtPrice(displayRow.price)} ${compactUnit(displayRow.unit)}`.trim();
  if (pricing.price_1m_blended_3_to_1 !== null) return `${fmt(pricing.price_1m_blended_3_to_1, 2)}/1M`;
  return "—";
}

function scoreBg(val: number | null): string {
  if (val === null) return "bg-muted";
  if (val >= 75) return "bg-emerald-500";
  if (val >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function scoreBadgeClass(val: number | null): string {
  if (val === null) return "";
  if (val >= 75)
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
  if (val >= 50)
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
  return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
}

function ScoreRow({ label, value }: { label: string; value: number | null | undefined }) {
  const pct = (value != null && !isNaN(value)) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">{fmt(value)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${scoreBg(value ?? null)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ModalityChips({ model }: { model: LLMModel }) {
  const chips: { icon: React.ReactNode; label: string }[] = [];

  if (model.input_modality_image || model.output_modality_image)
    chips.push({ icon: <ImageIcon className="size-2.5" />, label: "Image" });
  if (model.input_modality_video || model.output_modality_video)
    chips.push({ icon: <Video className="size-2.5" />, label: "Vidéo" });
  if (model.input_modality_speech || model.output_modality_speech)
    chips.push({ icon: <Mic className="size-2.5" />, label: "Audio" });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 pt-0.5">
      {chips.map(({ icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] leading-none bg-muted text-muted-foreground border"
        >
          {icon}
          {label}
        </span>
      ))}
    </div>
  );
}

function HuggingFaceStats({ model }: { model: LLMModel }) {
  const { t } = useI18n();
  const downloads = model.huggingface_downloads;
  const likes = model.huggingface_likes;
  const inferenceProviders = model.huggingface_inference_providers?.length ?? 0;
  if (downloads == null && likes == null && inferenceProviders === 0) return null;

  return (
    <div className="rounded-md border bg-muted/30 px-2 py-1.5 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
        <BarChart3 className="size-3" />
        {t.card.huggingface}
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
        {downloads != null && <span>{fmtCompact(downloads)} dl</span>}
        {likes != null && <span>{fmtCompact(likes)} ♥</span>}
        {inferenceProviders > 0 && <span>{inferenceProviders} API</span>}
      </div>
    </div>
  );
}

function OpenRouterStats({ model }: { model: LLMModel }) {
  const { t } = useI18n();
  const daBenchmarks = Object.entries(model.evaluations)
    .filter(([key, value]) => key.startsWith("openrouter_da_") && key.endsWith("_win_rate") && typeof value === "number")
    .map(([key, value]) => ({ key, value: value as number }))
    .sort((a, b) => b.value - a.value);
  const bestDA = daBenchmarks[0];
  const hasUsage =
    model.openrouter_weekly_rank != null ||
    model.openrouter_weekly_tokens != null ||
    model.openrouter_weekly_requests != null;

  if (!bestDA && !hasUsage) return null;

  return (
    <div className="rounded-md border bg-muted/30 px-2 py-1.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[10px] font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <BarChart3 className="size-3" />
          {t.card.openrouter}
        </span>
        {model.openrouter_weekly_rank != null && (
          <span className="inline-flex items-center gap-1 rounded bg-background px-1.5 py-0.5 text-foreground">
            <Trophy className="size-2.5" />
            #{model.openrouter_weekly_rank}
          </span>
        )}
      </div>
      {bestDA && (
        <div className="rounded bg-background px-1.5 py-1 text-[10px] text-muted-foreground">
          {t.card.designArena}: <span className="font-medium text-foreground">{fmt(bestDA.value)}%</span>
        </div>
      )}
      {hasUsage && (
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
          {model.openrouter_weekly_tokens != null && (
            <span>{fmtCompact(model.openrouter_weekly_tokens)} {t.card.weeklyTokens}</span>
          )}
          {model.openrouter_weekly_requests != null && (
            <span>{fmtCompact(model.openrouter_weekly_requests)} {t.card.weeklyRequests}</span>
          )}
        </div>
      )}
    </div>
  );
}

function MediaBenchmarkStats({ model }: { model: LLMModel }) {
  const { t, lang } = useI18n();
  const rows = mediaBenchmarkValues(model);
  const best = rows[0];
  if (!best) return null;

  return (
    <div className="rounded-md border bg-muted/30 px-2 py-1.5 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
        <BarChart3 className="size-3" />
        {t.detail.mediaBenchmarks}
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
        <span className="font-medium text-foreground">
          {best.label[lang]}: {fmt(best.elo, 0)}
        </span>
        {best.rank != null && <span>#{fmt(best.rank, 0)}</span>}
      </div>
    </div>
  );
}

const NEW_BADGE_DAYS = 30;

export function ModelCard({ model }: { model: LLMModel }) {
  const { t } = useI18n();
  const { toggle, isSelected, isFull } = useCompare();
  const {
    name, slug, release_date, model_creator, evaluations, pricing,
    median_output_tokens_per_second, median_time_to_first_token_seconds,
    context_window_tokens, reasoning_model,
    is_open_weights, huggingface_url, huggingface_official,
  } = model;

  const providerKey = getModelProviderKey(slug, model_creator.slug);
  const intelligence = textMetricValue(model, "artificial_analysis_intelligence_index");
  const selected = isSelected(slug);
  const ctxLabel = fmtCtx(context_window_tokens ?? null);
  const officialHuggingFaceUrl = huggingface_official === true ? huggingface_url : null;

  const isNew = Boolean(
    release_date &&
    // eslint-disable-next-line react-hooks/purity
    new Date(release_date) >= new Date(Date.now() - NEW_BADGE_DAYS * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="group relative h-full">
      <Link href={`/models/${slug}`} className="block h-full">
        <Card className={`h-full transition-shadow hover:shadow-md cursor-pointer ${selected ? "compare-card-selected ring-2 ring-primary" : ""}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="shrink-0 size-8 rounded-md flex items-center justify-center bg-muted">
                <ModelProviderIcon provider={providerKey} size={20} />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {isNew && (
                  <Badge className="text-xs px-1.5 py-0 font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                    {t.card.newBadge}
                  </Badge>
                )}
                {reasoning_model && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 gap-1 font-medium">
                    <Brain className="size-2.5" />
                    {t.card.thinkingBadge}
                  </Badge>
                )}
                {isOpenWeightsModel(model) && (
                  <Badge
                    variant="outline"
                    className="text-xs px-1.5 py-0 gap-1 font-medium bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
                  >
                    <Unlock className="size-2.5" />
                    {t.card.openWeightsBadge}
                  </Badge>
                )}
                {intelligence !== null && (
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs shrink-0 ${scoreBadgeClass(intelligence)}`}
                  >
                    {fmt(intelligence)}
                  </Badge>
                )}
              </div>
            </div>
            <CardTitle className="leading-snug line-clamp-2 text-sm">{name}</CardTitle>
            <CardDescription className="truncate">{model_creator.name}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-2.5 flex-1">
            {(() => {
              if (!hasAAIndexBenchmarks(model)) return null;
              const ii = textMetricValue(model, "artificial_analysis_intelligence_index");
              const ic = textMetricValue(model, "artificial_analysis_coding_index");
              const im = textMetricValue(model, "artificial_analysis_math_index");
              return (
                <>
                  <ScoreRow label={t.card.intelligence} value={ii} />
                  <ScoreRow label={t.card.coding} value={ic} />
                  <ScoreRow label={t.card.math} value={im} />
                </>
              );
            })()}
            <MediaBenchmarkStats model={model} />
            <OpenRouterStats model={model} />
            <HuggingFaceStats model={model} />
            <ModalityChips model={model} />
          </CardContent>

          <CardFooter className="gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Zap className="size-3" />
              {median_output_tokens_per_second !== null
                ? `${fmt(median_output_tokens_per_second, 0)} t/s`
                : "—"}
            </span>
            <span className="flex items-center gap-1">
              <Timer className="size-3" />
              {median_time_to_first_token_seconds !== null
                ? `${fmt(median_time_to_first_token_seconds, 2)}s`
                : "—"}
            </span>
            {ctxLabel && (
              <span className="flex items-center gap-1">
                <Type className="size-3" />
                {ctxLabel}
              </span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <DollarSign className="size-3" />
              {cardPriceLabel(pricing)}
            </span>
            <ChevronRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardFooter>
        </Card>
      </Link>

      {officialHuggingFaceUrl && (
        <a
          href={officialHuggingFaceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          aria-label={t.card.viewOnHuggingFace}
          title={t.card.viewOnHuggingFace}
          className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100 z-10"
        >
          <ExternalLink className="size-3" />
        </a>
      )}

      {/* Bouton comparer */}
      <button
        onClick={() => toggle(slug)}
        disabled={!selected && isFull}
        aria-label={selected ? t.card.removeCompare : t.card.addCompare}
        className={`
          absolute top-2 left-2 size-6 rounded-md border flex items-center justify-center
          transition-all text-xs z-10
          ${selected
            ? "bg-primary text-primary-foreground border-primary opacity-100"
            : "bg-background border-border opacity-0 group-hover:opacity-100 hover:bg-muted"
          }
          ${!selected && isFull ? "cursor-not-allowed opacity-30" : ""}
        `}
      >
        {selected ? <Check className="size-3" /> : <Plus className="size-3" />}
      </button>
    </div>
  );
}
