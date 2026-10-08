import { Suspense, use, useState } from "react";
import {
  AAIndicesCard,
  CapabilityIndexesCard,
  CyberIndexCard,
  ExtraBenchmarks,
  MediaBenchmarksCard,
  NoBenchmarksCard,
  StandardBenchmarksCard,
} from "@/components/model-detail/benchmark-sections";
import { ModelHero } from "@/components/model-detail/model-hero";
import { ReasoningLevelsCard, reasoningVariantLabel } from "@/components/model-detail/reasoning-levels";
import { SimilarModelsCard } from "@/components/model-detail/similar-models";
import { CapabilitiesCard, MetaEvalCard, PerformanceCard, PricingCard } from "@/components/model-detail/spec-sections";
import { ModelAvailabilityNotice } from "@/components/model-availability";
import { SegmentedControl } from "@/components/segmented-control";
import { StealthHistory } from "@/components/stealth-history";
import type { LLMModel } from "@/lib/model-types";
import { useI18n } from "@/lib/i18n";
import { modelAccessRestriction } from "@/lib/model-availability";
import { hasAnyBenchmarkData } from "@/lib/model-metrics";
import type { ModelInsights } from "@/lib/model-insights";
import type { ModelReasoningVariantOption } from "@/lib/model-reasoning";
import { cn } from "@/lib/utils";

type Caps = Partial<LLMModel>;
type Section = "benchmarks" | "specifications";

function StreamedAvailabilityNotice({ promise, slug }: { promise: Promise<Caps>; slug: string }) {
  const caps = use(promise);
  return <ModelAvailabilityNotice model={{ slug, availability_status: caps.availability_status }} />;
}

/**
 * Model page. Desktop shows benchmarks beside specifications; smaller screens
 * switch between the two panels with the same content and order.
 */
export function ModelDetailClient({
  model,
  familyName,
  variants,
  insights,
  capabilitiesPromise,
}: {
  model: LLMModel;
  familyName: string;
  variants: ModelReasoningVariantOption[];
  insights: ModelInsights;
  capabilitiesPromise?: Promise<Caps>;
}) {
  const { t } = useI18n();
  const [section, setSection] = useState<Section>("benchmarks");
  const selectedVariant = variants.find((variant) => variant.slug === model.slug) ?? variants[0];
  const variantLabel = selectedVariant
    ? reasoningVariantLabel(selectedVariant, t.detail.reasoningLevels)
    : t.detail.reasoningLevels.default;
  const panel = (key: Section) => cn("detail-panel min-w-0 flex-col gap-4 sm:gap-6 lg:flex", section === key ? "flex" : "hidden");

  return (
    <div className="flex flex-col gap-4 pb-20 sm:gap-6 sm:pb-0">
      <ModelHero
        model={model}
        familyName={familyName}
        variants={variants}
        points={insights.familyPoints}
        ranks={insights.ranks}
        capabilitiesPromise={capabilitiesPromise}
      />

      <ModelAvailabilityNotice model={model} />
      <StealthHistory model={model} />
      {capabilitiesPromise && !modelAccessRestriction(model) && (
        <Suspense>
          <StreamedAvailabilityNotice promise={capabilitiesPromise} slug={model.slug} />
        </Suspense>
      )}

      <SegmentedControl
        value={section}
        onChange={setSection}
        label={t.compareWorkspace.metrics}
        stretch
        className="sticky top-[calc(var(--site-header-height)+0.5rem)] z-10 flex w-full bg-muted shadow-sm lg:hidden"
        options={[
          { value: "benchmarks", label: t.mobile.overview, controls: "detail-benchmarks" },
          { value: "specifications", label: t.mobile.specifications, controls: "detail-specifications" },
        ]}
      />

      <div className="grid min-w-0 items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)]">
        <div id="detail-benchmarks" className={panel("benchmarks")}>
          <AAIndicesCard model={model} variantLabel={variants.length > 1 ? variantLabel : undefined} ranks={insights.ranks} />
          {variants.length > 1 && <ReasoningLevelsCard points={insights.familyPoints} currentSlug={model.slug} />}
          <CapabilityIndexesCard model={model} ranks={insights.ranks} />
          <CyberIndexCard model={model} ranks={insights.ranks} counterparts={insights.cyberCounterparts} />
          <StandardBenchmarksCard model={model} ranks={insights.ranks} />
          <MediaBenchmarksCard model={model} />
          <ExtraBenchmarks model={model} />
          {!hasAnyBenchmarkData(model) && <NoBenchmarksCard />}
        </div>

        <aside id="detail-specifications" aria-label={t.mobile.specifications} className={panel("specifications")}>
          <PricingCard model={model} ranks={insights.ranks} />
          <PerformanceCard model={model} ranks={insights.ranks} />
          {capabilitiesPromise && (
            <Suspense>
              <CapabilitiesCard promise={capabilitiesPromise} model={model} />
              <MetaEvalCard promise={capabilitiesPromise} model={model} />
            </Suspense>
          )}
        </aside>
      </div>

      <SimilarModelsCard model={model} similar={insights.similar} />
    </div>
  );
}
