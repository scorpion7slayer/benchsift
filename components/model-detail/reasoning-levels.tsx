import { useState } from "react";
import { Link as RouterLink, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal, TrendingUp } from "@/components/icons";
import { TradeoffChart, type ChartScale } from "@/components/tradeoff-chart";
import {
  AXIS_BETTER,
  TradeoffControls,
  availableAxes,
  availableScores,
  formatAxis,
  formatScore,
  pointTag,
} from "@/components/tradeoff/tradeoff-options";
import { formatNumber } from "@/lib/format";
import { useI18n, type Translations } from "@/lib/i18n";
import type { FamilyPoint, TradeoffAxis, TradeoffScore } from "@/lib/model-insights";
import type { ModelReasoningVariantOption } from "@/lib/model-reasoning";
import { cn } from "@/lib/utils";
import { DetailCard } from "./detail-primitives";

export function reasoningVariantLabel(
  variant: ModelReasoningVariantOption,
  labels: Translations["detail"]["reasoningLevels"],
): string {
  const effort = variant.effort ? labels[variant.effort] : null;
  const withEffort = (base: string) => (effort ? `${base} · ${effort}` : base);
  switch (variant.mode) {
    case "non-reasoning":
      return withEffort(labels.nonReasoning);
    case "default":
      return labels.default;
    case "adaptive-reasoning":
      return withEffort(labels.adaptiveReasoning);
    case "thinking":
      return withEffort(labels.thinking);
    default:
      return effort ?? labels.reasoning;
  }
}

/**
 * Every reasoning level of the family as a link, with its Intelligence Index
 * so the gain of each level reads before opening it.
 */
export function ReasoningLevelPicker({
  variants,
  points,
  currentSlug,
}: {
  variants: ModelReasoningVariantOption[];
  points: FamilyPoint[];
  currentSlug: string;
}) {
  const { t, lang } = useI18n();
  const scores = new Map(points.map((point) => [point.slug, point.scores.intelligence]));
  return (
    <nav aria-label={t.detail.reasoningConfiguration} className="grid gap-2.5 border-t pt-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <SlidersHorizontal aria-hidden="true" className="size-4 text-muted-foreground" />
        {t.detail.reasoningConfiguration}
        <span className="hidden font-normal text-muted-foreground md:inline">· {t.detail.reasoningConfigurationDescription}</span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const current = variant.slug === currentSlug;
          const score = scores.get(variant.slug);
          return (
            <li key={variant.slug}>
              <RouterLink
                to="/models/$slug"
                params={{ slug: variant.slug }}
                replace
                resetScroll={false}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "reasoning-level inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11",
                  current
                    ? "border-foreground bg-foreground text-background"
                    : "bg-background/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {reasoningVariantLabel(variant, t.detail.reasoningLevels)}
                {score != null && (
                  <span className={cn("tabular-nums text-xs", current ? "text-background/70" : "text-muted-foreground")}>
                    {formatNumber(score, lang)}
                  </span>
                )}
              </RouterLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** How score and cost move across the reasoning levels of this model. */
export function ReasoningLevelsCard({ points, currentSlug }: { points: FamilyPoint[]; currentSlug: string }) {
  const { t, lang } = useI18n();
  const copy = t.tradeoff;
  const navigate = useNavigate();
  const [chosenScore, setScore] = useState<TradeoffScore>("intelligence");
  const [chosenAxis, setAxis] = useState<TradeoffAxis | null>(null);
  const [scale, setScale] = useState<ChartScale>("linear");

  const scores = availableScores(points, 2);
  const score = scores.includes(chosenScore) ? chosenScore : scores[0];
  const axes = score ? availableAxes(points, score, 2) : [];
  const axis = chosenAxis && axes.includes(chosenAxis) ? chosenAxis : axes[0];
  if (!score || !axis) return null;

  return (
    <DetailCard icon={TrendingUp} title={copy.familyTitle} description={copy.familyHint} contentClassName="space-y-4">
      <TradeoffControls
        axis={axis}
        axes={axes}
        onAxis={setAxis}
        score={score}
        scores={scores}
        onScore={setScore}
        scale={scale}
        onScale={setScale}
      />
      <TradeoffChart
        series={[{
          id: "family",
          label: copy.familyTitle,
          color: "var(--foreground)",
          highlights: [{ id: currentSlug, color: "var(--foreground)" }],
          points: points.flatMap((point) => {
            const x = point.axes[axis];
            const y = point.scores[score];
            return x == null || y == null ? [] : [{ id: point.slug, name: point.name, tag: pointTag(point, t), x, y }];
          }),
        }]}
        labelMode="points"
        title={copy.familyTitle}
        xLabel={copy.axes[axis]}
        yLabel={copy.scores[score]}
        formatX={(value) => formatAxis(axis, value, lang)}
        formatY={(value) => formatScore(value, lang)}
        better={AXIS_BETTER[axis]}
        scale={scale}
        efficientLabel={copy.efficient}
        onSelectPoint={(_, slug) => void navigate({ to: "/models/$slug", params: { slug }, replace: true, resetScroll: false })}
        selectHint={copy.openVariant}
        empty={copy.empty}
      />
    </DetailCard>
  );
}
