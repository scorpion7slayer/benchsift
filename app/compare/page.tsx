import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getLLMModels, getLLMModel } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompareTable } from "@/components/compare-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparateur de modèles — Nxt AI Card",
};

interface Props {
  searchParams: Promise<{ models?: string }>;
}

async function CompareContent({ searchParams }: Props) {
  const { models: slugsParam } = await searchParams;
  const slugs = (slugsParam ?? "").split(",").filter(Boolean).slice(0, 4);

  const [allModels, ...selectedModels] = await Promise.all([
    getLLMModels(),
    ...slugs.map((slug) => getLLMModel(slug)),
  ]);

  const selected = selectedModels.filter((m): m is NonNullable<typeof m> => m != null);

  return <CompareTable models={selected} allModels={allModels} />;
}

function CompareLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
      <Loader2 className="size-8 animate-spin" />
      <p className="text-sm">Chargement des modèles…</p>
    </div>
  );
}

export default function ComparePage({ searchParams }: Props) {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<CompareLoading />}>
          <CompareContent searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
