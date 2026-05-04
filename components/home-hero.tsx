"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompareMenu, type CompareMenuModel } from "@/components/compare-menu";
import { ModelProviderIcon } from "@/components/model-provider-icon-lazy";
import { getProviderKey } from "@/lib/provider-map";
import { useI18n } from "@/lib/i18n";

export interface LatestModelSummary {
  slug: string;
  name: string;
  providerName: string;
  providerSlug: string;
  releaseDate: string | null;
}

function formatReleaseDate(value: string | null, lang: "fr" | "en"): string | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function HomeHero({
  count,
  latestModel,
  compareModels,
}: {
  count: number;
  latestModel: LatestModelSummary | null;
  compareModels: CompareMenuModel[];
}) {
  const { lang, t } = useI18n();
  const latestDate = formatReleaseDate(latestModel?.releaseDate ?? null, lang);

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t.hero.title}</h1>
          <Badge variant="secondary">{count}</Badge>
          <CompareMenu models={compareModels} />
        </div>
        <p className="text-sm text-muted-foreground">{t.hero.description}</p>
      </div>

      {latestModel && (
        <Link
          href={`/models/${latestModel.slug}`}
          className="group w-full shrink-0 rounded-lg border border-primary/20 bg-primary/5 p-3 transition-colors hover:bg-primary/10 sm:max-w-72"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              {t.hero.latestModels}
            </span>
            {latestDate && (
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {latestDate}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background/80">
              <ModelProviderIcon provider={getProviderKey(latestModel.providerSlug)} size={20} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium group-hover:text-primary">
                {latestModel.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {latestModel.providerName}
              </span>
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
