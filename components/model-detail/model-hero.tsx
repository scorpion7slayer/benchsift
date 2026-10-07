import { Suspense, use } from "react";
import { useNavigate } from "@tanstack/react-router";
import { StealthBadge } from "@/components/stealth-history";
import { Brain, ExternalLink, GitCompareArrows, Lock, Unlock, Check } from "@/components/icons";
import { InfoTip } from "@/components/info-tip";
import { ModelAvailabilityBadge } from "@/components/model-availability";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LLMModel } from "@/lib/model-types";
import { useCompare } from "@/lib/compare-store";
import { formatDate, formatMoney, formatNumber, formatSpeed, formatTokens } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { textMetricValue } from "@/lib/model-metrics";
import type { FamilyPoint, MetricRank, ModelInsights, RankedMetric } from "@/lib/model-insights";
import type { ModelReasoningVariantOption } from "@/lib/model-reasoning";
import { getModelProviderKey } from "@/lib/provider-map";
import { RankNote } from "./detail-primitives";
import { ReasoningLevelPicker } from "./reasoning-levels";
import { PageCat } from "@/components/pixel-art/page-cats";

type Caps = Partial<LLMModel>;

function ScrapedBadges({ promise, availabilityStatus }: { promise: Promise<Caps>; availabilityStatus: LLMModel["availability_status"] }) {
  const { t } = useI18n();
  const caps = use(promise);
  return (
    <>
      {availabilityStatus == null && <ModelAvailabilityBadge model={{ availability_status: caps.availability_status }} />}
      {caps.reasoning_model && <Badge variant="secondary"><Brain data-icon="inline-start" />{t.detail.reasoning}</Badge>}
      {caps.is_open_weights === true && <Badge variant="outline"><Unlock data-icon="inline-start" />{t.detail.openWeights}</Badge>}
      {caps.is_open_weights === false && <Badge variant="outline" className="text-muted-foreground"><Lock data-icon="inline-start" />{t.detail.closedWeights}</Badge>}
    </>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ExternalLink aria-hidden="true" className="size-3" />
      {label}
    </a>
  );
}

function StreamedHuggingFaceLink({ promise, label }: { promise: Promise<Caps>; label: string }) {
  const caps = use(promise);
  return caps.huggingface_official === true && caps.huggingface_url ? <SourceLink href={caps.huggingface_url} label={label} /> : null;
}

/** The handful of figures most people look for first, when they are published. */
function KeyFigures({ model, ranks }: { model: LLMModel; ranks: ModelInsights["ranks"] }) {
  const { t, lang } = useI18n();
  const unitPrice = model.pricing.openrouter_display_prices?.find((row) => row.kind === "unit");
  const figures: Array<{ key: string; label: string; hint?: string; value: number | null | undefined; format: (value: number) => string; rank?: RankedMetric }> = [
    { key: "intelligence", label: t.card.intelligence, hint: t.glossary.intelligence, value: textMetricValue(model, "artificial_analysis_intelligence_index"), format: (v) => formatNumber(v, lang), rank: "artificial_analysis_intelligence_index" },
    { key: "coding", label: t.card.coding, hint: t.glossary.coding, value: textMetricValue(model, "artificial_analysis_coding_index"), format: (v) => formatNumber(v, lang), rank: "artificial_analysis_coding_index" },
    { key: "speed", label: t.detail.outputSpeed, hint: t.glossary.outputSpeed, value: model.median_output_tokens_per_second, format: (v) => formatSpeed(v, lang), rank: "speed" },
    unitPrice
      ? { key: "price", label: unitPrice.label, value: unitPrice.price, format: (v) => `${formatMoney(v, lang)} ${unitPrice.unit}` }
      : { key: "price", label: t.card.price1m, hint: t.detail.blendedTooltip, value: model.pricing.price_1m_blended_3_to_1, format: (v) => formatMoney(v, lang), rank: "price" },
    { key: "context", label: t.detail.contextWindow, hint: t.glossary.contextWindow, value: model.context_window_tokens ?? null, format: (v) => formatTokens(v, lang), rank: "context" },
    { key: "task", label: t.detail.costPerTask, hint: t.detail.costPerTaskTooltip, value: model.intelligence_index_cost_per_task_usd ?? null, format: (v) => formatMoney(v, lang), rank: "cost_per_task" },
  ];
  const shown = figures.filter((figure) => figure.value != null);
  if (!shown.length) return null;
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]">
      {shown.map((figure) => {
        const rank: MetricRank | undefined = figure.rank ? ranks[figure.rank] : undefined;
        return (
          <div key={figure.key} className="key-figure flex min-w-0 flex-col rounded-lg border bg-background/60 p-3">
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="line-clamp-2">{figure.label}</span>
              {figure.hint && <InfoTip label={`${t.glossary.infoLabel} · ${figure.label}`} content={figure.hint} />}
            </dt>
            <dd className="mt-1 text-lg font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{figure.format(figure.value!)}</dd>
            {rank && <dd className="mt-auto pt-1"><RankNote rank={rank} /></dd>}
          </div>
        );
      })}
    </dl>
  );
}

function splitTitle(familyName: string): { title: string; qualifier: string | null } {
  // Long configuration names keep the parenthesised qualifier on its own line.
  const start = familyName.length > 52 ? familyName.indexOf(" (") : -1;
  if (start <= 0) return { title: familyName, qualifier: null };
  const qualifier = familyName.slice(start + 2, familyName.endsWith(")") ? -1 : undefined);
  return { title: familyName.slice(0, start), qualifier };
}

export function ModelHero({
  model,
  familyName,
  variants,
  points,
  ranks,
  capabilitiesPromise,
}: {
  model: LLMModel;
  familyName: string;
  variants: ModelReasoningVariantOption[];
  points: FamilyPoint[];
  ranks: ModelInsights["ranks"];
  capabilitiesPromise?: Promise<Caps>;
}) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { replace, isSelected, isFull, selected } = useCompare();
  const inComparison = isSelected(model.slug);
  const { title, qualifier } = splitTitle(familyName);
  const officialHuggingFace = model.huggingface_official === true ? model.huggingface_url : null;

  function openComparison() {
    const next = inComparison ? selected : [...selected, model.slug];
    replace(next);
    void navigate({ to: "/compare", search: next.length ? { models: next.join(",") } : {} });
  }

  return (
    <section className="relative mt-3 flex flex-col gap-5 rounded-xl border bg-card p-4 sm:p-6">
      <PageCat kind="detail" className="absolute bottom-[calc(100%+1px)] right-8 sm:right-12" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border bg-muted">
            <ModelProviderIcon provider={getModelProviderKey(model.slug, model.model_creator.slug)} size={44} iconUrl={model.provider_icon_url} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted-foreground">{model.model_creator.name}</p>
            <h1 className="mt-0.5 text-balance break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h1>
            {qualifier && <p className="mt-1 text-sm leading-5 text-muted-foreground">{qualifier}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {model.release_date && formatDate(model.release_date, lang) !== "—" && (
                <Badge variant="secondary" title={t.detail.releaseDate}>
                  <time dateTime={model.release_date}>{formatDate(model.release_date, lang)}</time>
                </Badge>
              )}
              <ModelAvailabilityBadge model={model} />
              <StealthBadge model={model} />
              {capabilitiesPromise && (
                <Suspense>
                  <ScrapedBadges promise={capabilitiesPromise} availabilityStatus={model.availability_status} />
                </Suspense>
              )}
              {model.models_dev_url && <SourceLink href={model.models_dev_url} label="Models.dev" />}
              {officialHuggingFace ? (
                <SourceLink href={officialHuggingFace} label={t.card.huggingface} />
              ) : capabilitiesPromise ? (
                <Suspense><StreamedHuggingFaceLink promise={capabilitiesPromise} label={t.card.huggingface} /></Suspense>
              ) : null}
            </div>
          </div>
        </div>
        <Button
          variant={inComparison ? "default" : "outline"}
          disabled={!inComparison && isFull}
          title={!inComparison && isFull ? t.compare.maxReached : undefined}
          onClick={openComparison}
          // The floating mobile button stays opaque when disabled so content never shows through it.
          className="touch-target fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 h-12 shadow-lg max-sm:bg-primary! max-sm:text-primary-foreground! max-sm:hover:bg-primary/90! disabled:opacity-100 disabled:text-muted-foreground max-sm:disabled:bg-muted! max-sm:disabled:text-muted-foreground! sm:static sm:h-9 sm:w-auto sm:shadow-none"
        >
          {inComparison ? <Check data-icon="inline-start" /> : <GitCompareArrows data-icon="inline-start" />}
          {!inComparison && isFull ? t.compare.maxReached : t.compare.compare}
        </Button>
      </div>

      <KeyFigures model={model} ranks={ranks} />

      {variants.length > 1 && <ReasoningLevelPicker variants={variants} points={points} currentSlug={model.slug} />}
    </section>
  );
}
