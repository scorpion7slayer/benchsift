import { Suspense } from "react";
import { connection } from "next/server";
import { getLLMModels, type LLMModel } from "@/lib/api";
import { ModelGrid } from "@/components/model-grid";
import { SiteHeader } from "@/components/site-header";
import { HomeHero, type LatestModelSummary } from "@/components/home-hero";
import { SiteFooter } from "@/components/site-footer";
import { Separator } from "@/components/ui/separator";
import { ScrollToTop } from "@/components/scroll-to-top";

export const metadata = {
  title: "Nxt AI Card",
  description: "Compare AI models — benchmarks, performance and pricing",
};

function getLatestModelSummary(models: LLMModel[]): LatestModelSummary | null {
  const latest = models.reduce<LLMModel | null>((current, model) => {
    if (!model.release_date) return current;
    if (!current?.release_date) return model;
    return model.release_date > current.release_date ? model : current;
  }, null);

  if (!latest) return null;

  return {
    slug: latest.slug,
    name: latest.name,
    providerName: latest.model_creator.name,
    providerSlug: latest.model_creator.slug,
    releaseDate: latest.release_date,
  };
}

async function PageContent() {
  await connection();
  const models = await getLLMModels();
  const latestModel = getLatestModelSummary(models);
  const compareModels = models.map((model) => ({
    slug: model.slug,
    name: model.name,
    providerName: model.model_creator.name,
    providerSlug: model.model_creator.slug,
  }));

  return (
    <>
      <SiteHeader modelCount={models.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <HomeHero count={models.length} latestModel={latestModel} compareModels={compareModels} />
        <Separator className="mb-6" />
        <Suspense>
          <ModelGrid models={models} />
        </Suspense>
      </main>

      <SiteFooter />
    </>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      <Suspense>
        <PageContent />
      </Suspense>
      <ScrollToTop />
    </div>
  );
}
