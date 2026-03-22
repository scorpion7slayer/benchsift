"use client";

import Link from "next/link";
import { Zap, Timer, DollarSign, ChevronRight, Plus, Check, Brain, ImageIcon, Video, Mic, Type } from "lucide-react";
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
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { getProviderKey } from "@/lib/provider-map";
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

const NEW_BADGE_DAYS = 30;

export function ModelCard({ model }: { model: LLMModel }) {
  const { t } = useI18n();
  const { toggle, isSelected, isFull } = useCompare();
  const {
    name, slug, release_date, model_creator, evaluations, pricing,
    median_output_tokens_per_second, median_time_to_first_token_seconds,
    context_window_tokens, reasoning_model,
  } = model;

  const providerKey = getProviderKey(model_creator.slug);
  const intelligence = evaluations.artificial_analysis_intelligence_index;
  const selected = isSelected(slug);
  const ctxLabel = fmtCtx(context_window_tokens ?? null);

  const isNew = Boolean(
    release_date &&
    new Date(release_date) >= new Date(Date.now() - NEW_BADGE_DAYS * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="group relative h-full">
      <Link href={`/models/${slug}`} className="block h-full">
        <Card className={`h-full transition-shadow hover:shadow-md cursor-pointer ${selected ? "ring-2 ring-primary" : ""}`}>
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
            <ScoreRow label={t.card.intelligence} value={evaluations.artificial_analysis_intelligence_index} />
            <ScoreRow label={t.card.coding} value={evaluations.artificial_analysis_coding_index} />
            <ScoreRow label={t.card.math} value={evaluations.artificial_analysis_math_index} />
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
              {pricing.price_1m_blended_3_to_1 !== null
                ? `${fmt(pricing.price_1m_blended_3_to_1, 2)}/1M`
                : "—"}
            </span>
            <ChevronRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardFooter>
        </Card>
      </Link>

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
