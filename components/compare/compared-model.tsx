import { Link } from "@/components/link";
import { X } from "@/components/icons";
import { ModelProviderIcon } from "@/components/model-provider-icon";
import { Button } from "@/components/ui/button";
import type { LLMModel } from "@/lib/model-types";
import { useI18n } from "@/lib/i18n";
import { getModelProviderKey } from "@/lib/provider-map";
import { cn } from "@/lib/utils";

/** One colour per comparison column, shared by the markers and the chart lines. */
export const SERIES_COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"] as const;

export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

/** The numbered marker shared by table columns, stacked rows and the chart legend. */
export function ModelMarker({ index, color = seriesColor(index), className }: { index: number; color?: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ background: color }}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums text-card",
        className,
      )}
    >
      {index + 1}
    </span>
  );
}

/** Identity of a compared model with its remove action. */
export function ComparedModel({
  model,
  index,
  disabled,
  onRemove,
  className,
}: {
  model: LLMModel;
  index: number;
  disabled: boolean;
  onRemove: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={cn("flex min-w-0 items-start gap-2.5", className)}>
      <span className="relative shrink-0">
        <ModelProviderIcon
          provider={getModelProviderKey(model.slug, model.model_creator.slug)}
          iconUrl={model.provider_icon_url}
          size={32}
        />
        <ModelMarker index={index} className="absolute -bottom-1 -right-1.5 size-4 text-[10px] ring-2 ring-card" />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={`/models/${model.slug}`}
          title={model.name}
          className="line-clamp-2 rounded-sm text-sm font-medium leading-5 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {model.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">{model.model_creator.name}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        aria-label={`${t.compare.remove} ${model.name}`}
        onClick={onRemove}
        className="-mr-1 -mt-0.5 size-8 shrink-0 text-muted-foreground hover:text-foreground pointer-coarse:size-11"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
