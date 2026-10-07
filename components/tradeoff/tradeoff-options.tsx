import { CatalogSelect } from "@/components/catalog-select";
import { SegmentedControl } from "@/components/segmented-control";
import type { ChartScale } from "@/components/tradeoff-chart";
import { formatMoneyCompact, formatNumber, formatSpeed, type DisplayLang } from "@/lib/format";
import { useI18n, type Translations } from "@/lib/i18n";
import type { FamilyPoint, TradeoffAxis, TradeoffScore } from "@/lib/model-insights";

export const AXIS_ORDER: readonly TradeoffAxis[] = ["cost_per_task", "index_cost", "price", "speed"];
export const SCORE_ORDER: readonly TradeoffScore[] = ["intelligence", "coding", "agentic"];

/** Costs are better low and run right to left; speed is better high. */
export const AXIS_BETTER: Record<TradeoffAxis, "lower" | "higher"> = {
  cost_per_task: "lower",
  index_cost: "lower",
  price: "lower",
  speed: "higher",
};

export function formatAxis(axis: TradeoffAxis, value: number, lang: DisplayLang): string {
  return axis === "speed" ? formatSpeed(value, lang) : formatMoneyCompact(value, lang);
}

export function formatScore(value: number, lang: DisplayLang): string {
  return formatNumber(value, lang, Number.isInteger(value) ? 0 : 1);
}

/**
 * The small-capitals tag of a reasoning level. Efforts keep the providers'
 * parameter names (max, xhigh…), as in published charts; modes are translated.
 */
export function pointTag(point: FamilyPoint, t: Translations): string | null {
  if (point.effort) return point.effort;
  const levels = t.detail.reasoningLevels;
  switch (point.mode) {
    case "non-reasoning":
      return levels.nonReasoning;
    case "adaptive-reasoning":
      return levels.adaptiveReasoning;
    case "thinking":
      return levels.thinking;
    case "reasoning":
      return levels.reasoning;
    default:
      return null;
  }
}

/** Axes for which at least `minimum` of the given points carry both values. */
export function availableAxes(points: FamilyPoint[], score: TradeoffScore, minimum: number): TradeoffAxis[] {
  return AXIS_ORDER.filter(
    (axis) => points.filter((point) => point.axes[axis] != null && point.scores[score] != null).length >= minimum,
  );
}

export function availableScores(points: FamilyPoint[], minimum: number): TradeoffScore[] {
  return SCORE_ORDER.filter((score) => points.filter((point) => point.scores[score] != null).length >= minimum);
}

/** Axis pickers and the linear/log switch shared by the trade-off charts. */
export function TradeoffControls({
  axis,
  axes,
  onAxis,
  score,
  scores,
  onScore,
  scale,
  onScale,
}: {
  axis: TradeoffAxis;
  axes: readonly TradeoffAxis[];
  onAxis: (axis: TradeoffAxis) => void;
  score: TradeoffScore;
  scores: readonly TradeoffScore[];
  onScore: (score: TradeoffScore) => void;
  scale: ChartScale;
  onScale: (scale: ChartScale) => void;
}) {
  const { t } = useI18n();
  const copy = t.tradeoff;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {scores.length > 1 && (
        <CatalogSelect
          value={score}
          onChange={onScore}
          label={copy.yAxis}
          className="sm:w-44"
          options={scores.map((value) => ({ value, label: copy.scores[value] }))}
        />
      )}
      {axes.length > 1 && (
        <CatalogSelect
          value={axis}
          onChange={onAxis}
          label={copy.xAxis}
          className="sm:w-56"
          options={axes.map((value) => ({ value, label: copy.axes[value] }))}
        />
      )}
      <SegmentedControl
        value={scale}
        onChange={onScale}
        label={copy.scale}
        size="sm"
        options={[
          { value: "linear", label: copy.linear },
          { value: "log", label: copy.log },
        ]}
      />
    </div>
  );
}
