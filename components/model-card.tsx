import { Link } from "@/components/link";
import { Zap, Timer, DollarSign, ChevronRight, ChevronDown, Plus, Check, Brain, ImageIcon, Video, Mic, Type, BarChart3, Trophy, Unlock, ExternalLink } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useCompare } from "@/lib/compare-store";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { ModelAvailabilityBadge } from "@/components/model-availability";
import { getModelProviderKey } from "@/lib/provider-map";
import { cn } from "@/lib/utils";
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
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">{fmt(value)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${scoreBg(value ?? null)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ModalityChips({ model }: { model: LLMModel }) {
  const { t } = useI18n();
  const chips: { icon: React.ReactNode; label: string }[] = [];

  if (model.input_modality_image || model.output_modality_image)
    chips.push({ icon: <ImageIcon className="size-2.5" />, label: t.grid.categories.image });
  if (model.input_modality_video || model.output_modality_video)
    chips.push({ icon: <Video className="size-2.5" />, label: t.grid.categories.video });
  if (model.input_modality_speech || model.output_modality_speech)
    chips.push({ icon: <Mic className="size-2.5" />, label: t.grid.categories.audio });

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
    <div className="flex flex-col gap-1 rounded-md border bg-muted/30 px-2 py-1.5">
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
    <div className="flex flex-col gap-1.5 rounded-md border bg-muted/30 px-2 py-1.5">
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
    <div className="flex flex-col gap-1 rounded-md border bg-muted/30 px-2 py-1.5">
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

function ModelStatusBadges({
  model,
  isNew,
}: {
  model: LLMModel;
  isNew: boolean;
}) {
  const { t } = useI18n();

  return (
    <>
      {isNew && (
        <Badge className="bg-blue-50 px-1.5 py-0 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
          {t.card.newBadge}
        </Badge>
      )}
      {model.reasoning_model && (
        <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-xs font-medium">
          <Brain className="size-2.5" />
          {t.card.thinkingBadge}
        </Badge>
      )}
      {isOpenWeightsModel(model) && (
        <Badge
          variant="outline"
          className="gap-1 border-amber-200 bg-amber-50 px-1.5 py-0 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <Unlock className="size-2.5" />
          {t.card.openWeightsBadge}
        </Badge>
      )}
      <ModelAvailabilityBadge model={model} />
    </>
  );
}

function ModelBenchmarks({ model }: { model: LLMModel }) {
  const { t } = useI18n();

  return (
    <>
      {hasAAIndexBenchmarks(model) && (
        <div className="flex flex-col gap-2.5">
          <ScoreRow
            label={t.card.intelligence}
            value={textMetricValue(model, "artificial_analysis_intelligence_index")}
          />
          <ScoreRow
            label={t.card.coding}
            value={textMetricValue(model, "artificial_analysis_coding_index")}
          />
          <ScoreRow
            label={t.card.math}
            value={textMetricValue(model, "artificial_analysis_math_index")}
          />
        </div>
      )}
      <MediaBenchmarkStats model={model} />
      <OpenRouterStats model={model} />
      <HuggingFaceStats model={model} />
      <ModalityChips model={model} />
    </>
  );
}

export function ModelCard({ model }: { model: LLMModel }) {
  const { t } = useI18n();
  const { toggle, isSelected, isFull } = useCompare();
  const {
    name, slug, release_date, model_creator, pricing,
    median_output_tokens_per_second, median_time_to_first_token_seconds,
    context_window_tokens, huggingface_url, huggingface_official,
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
      <Card
        size="sm"
        data-selected={selected ? "true" : undefined}
        className="relative h-full border-border/70 sm:hidden data-[selected=true]:border-primary"
      >
        <CardHeader className="pb-0">
          <div className="flex items-start gap-3">
            <Link
              href={`/models/${slug}`}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <ModelProviderIcon provider={providerKey} size={22} iconUrl={model.provider_icon_url} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{name}</span>
                <span className="block truncate text-xs text-muted-foreground">{model_creator.name}</span>
              </span>
            </Link>
            <Button
              type="button"
              variant={selected ? "default" : "outline"}
              size="icon-lg"
              onClick={() => toggle(slug)}
              disabled={!selected && isFull}
              aria-pressed={selected}
              aria-label={selected ? t.card.removeCompare : t.card.addCompare}
              title={!selected && isFull ? t.compare.maxReached : selected ? t.card.removeCompare : t.card.addCompare}
              className="touch-target shrink-0"
            >
              {selected ? <Check /> : <Plus />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <ModelStatusBadges model={model} isNew={isNew} />
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-3 gap-2">
          <div className="flex min-w-0 flex-col gap-0.5 rounded-md bg-muted/45 px-2 py-2">
            <span className="truncate text-[10px] text-muted-foreground">{t.card.intelligence}</span>
            <span className="font-mono text-sm font-medium tabular-nums">{fmt(intelligence)}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 rounded-md bg-muted/45 px-2 py-2">
            <span className="truncate text-[10px] text-muted-foreground">{t.card.speed}</span>
            <span className="text-sm font-medium tabular-nums">
              {median_output_tokens_per_second !== null
                ? `${fmt(median_output_tokens_per_second, 0)} t/s`
                : "—"}
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 rounded-md bg-muted/45 px-2 py-2">
            <span className="truncate text-[10px] text-muted-foreground">{t.card.price1m}</span>
            <span className="truncate text-sm font-medium tabular-nums">{cardPriceLabel(pricing)}</span>
          </div>
        </CardContent>

        <CardFooter className="block p-0 group-data-[size=sm]/card:p-0">
          <details className="group/details">
            <summary className="touch-target flex min-h-11 list-none items-center justify-between gap-3 px-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <span>{t.grid.sortGroups.benchmarks}</span>
              <ChevronDown className="size-4 text-muted-foreground transition-transform duration-150 group-open/details:rotate-180" />
            </summary>
            <div className="flex flex-col gap-2.5 border-t px-3 pb-3 pt-3">
              <ModelBenchmarks model={model} />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
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
                {officialHuggingFaceUrl && (
                  <a
                    href={officialHuggingFaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-medium text-foreground"
                  >
                    {t.card.huggingface}
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          </details>
        </CardFooter>
      </Card>

      <Card
        data-selected={selected ? "true" : undefined}
        className="relative hidden h-full cursor-pointer border-border/70 transition-colors hover:border-foreground/25 focus-within:border-foreground/25 sm:flex data-[selected=true]:border-primary"
      >
          <CardHeader className="pb-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex shrink-0 items-center">
                <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                  <ModelProviderIcon provider={providerKey} size={20} iconUrl={model.provider_icon_url} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <ModelStatusBadges model={model} isNew={isNew} />
                {intelligence !== null && (
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 font-mono text-xs", scoreBadgeClass(intelligence))}
                  >
                    {fmt(intelligence)}
                  </Badge>
                )}
                {officialHuggingFaceUrl && (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-xs"
                    className="touch-target relative z-10 text-muted-foreground"
                  >
                    <a
                      href={officialHuggingFaceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.card.viewOnHuggingFace}
                      title={t.card.viewOnHuggingFace}
                    >
                      <ExternalLink />
                    </a>
                  </Button>
                )}
                <Button
                  type="button"
                  variant={selected ? "default" : "ghost"}
                  size="icon-xs"
                  onClick={() => toggle(slug)}
                  disabled={!selected && isFull}
                  aria-pressed={selected}
                  aria-label={selected ? t.card.removeCompare : t.card.addCompare}
                  title={!selected && isFull ? t.compare.maxReached : selected ? t.card.removeCompare : t.card.addCompare}
                  className={cn(
                    "touch-target relative z-10",
                    !selected && "text-muted-foreground",
                  )}
                >
                  {selected ? <Check /> : <Plus />}
                </Button>
              </div>
            </div>
            <CardTitle className="leading-snug text-sm">
              <Link
                href={`/models/${slug}`}
                className="line-clamp-2 rounded-sm after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {name}
              </Link>
            </CardTitle>
            <CardDescription className="truncate">{model_creator.name}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-2.5">
            <ModelBenchmarks model={model} />
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
            <ChevronRight className="size-3 opacity-40 transition-opacity group-hover:opacity-100" />
          </CardFooter>
      </Card>
    </div>
  );
}
