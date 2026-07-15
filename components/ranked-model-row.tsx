import { Check, Plus } from "lucide-react";
import { Link } from "@/components/link";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/lib/compare-store";
import { useI18n } from "@/lib/i18n";
import { getModelProviderKey } from "@/lib/provider-map";
import type { HomeCatalogModel } from "@/lib/home-catalog";

export function RankedModelRow({
  model,
  rank,
}: {
  model: HomeCatalogModel;
  rank: number;
}) {
  const { t } = useI18n();
  const { toggle, isSelected, isFull } = useCompare();
  const selected = isSelected(model.slug);
  const providerKey = getModelProviderKey(model.slug, model.model_creator.slug);

  return (
    <li
      value={rank}
      data-selected={selected ? "true" : undefined}
      className="grid min-h-16 grid-cols-[2.25rem_2.5rem_minmax(0,1fr)_2.75rem] items-center gap-2 border-b px-2 py-2 last:border-b-0 data-[selected=true]:bg-primary/[0.035] sm:min-h-14 sm:grid-cols-[3rem_2.25rem_minmax(0,1fr)_2.75rem] sm:gap-3 sm:px-3"
    >
      <span
        className="text-center text-sm font-semibold tabular-nums text-muted-foreground sm:text-base"
        aria-label={t.grid.ranking.rank(rank)}
      >
        #{rank}
      </span>

      <span className="flex size-10 items-center justify-center rounded-lg bg-muted sm:size-9 sm:rounded-md">
        <ModelProviderIcon
          provider={providerKey}
          size={20}
          iconUrl={model.provider_icon_url}
        />
      </span>

      <Link
        href={`/models/${model.slug}`}
        className="min-w-0 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="block truncate text-sm font-medium sm:text-[15px]">
          {model.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {model.model_creator.name}
        </span>
      </Link>

      <Button
        type="button"
        variant={selected ? "default" : "ghost"}
        size="icon-sm"
        onClick={() => toggle(model.slug)}
        disabled={!selected && isFull}
        aria-pressed={selected}
        aria-label={selected ? t.card.removeCompare : t.card.addCompare}
        title={!selected && isFull ? t.compare.maxReached : selected ? t.card.removeCompare : t.card.addCompare}
        className="touch-target size-11 justify-self-end sm:size-7"
      >
        {selected ? <Check /> : <Plus />}
      </Button>
    </li>
  );
}
