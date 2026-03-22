import { Suspense } from "react";
import { getLLMModels } from "@/lib/api";
import { ModelGrid } from "@/components/model-grid";
import { SiteHeader } from "@/components/site-header";
import { HomeHero } from "@/components/home-hero";
import { SiteFooter } from "@/components/site-footer";
import { CompareBar } from "@/components/compare-bar";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Nxt AI Card",
  description: "Compare AI models — benchmarks, performance and pricing",
};

export default async function HomePage() {
  const models = await getLLMModels();

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader modelCount={models.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <HomeHero count={models.length} />
        <Separator className="mb-6" />
        <Suspense>
          <ModelGrid models={models} />
        </Suspense>
      </main>

      <SiteFooter />
      <Suspense>
        <CompareBar models={models} />
      </Suspense>
    </div>
  );
}
