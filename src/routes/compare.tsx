import { createFileRoute } from "@tanstack/react-router";
import { fetchCompareData } from "@/lib/server-fns";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompareTable } from "@/components/compare-table";

interface CompareSearch {
  models?: string;
}

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>): CompareSearch => ({
    models: typeof search.models === "string" ? search.models : undefined,
  }),
  loaderDeps: ({ search }) => ({ models: search.models }),
  loader: async ({ deps }) => {
    const slugs = (deps.models ?? "").split(",").filter(Boolean).slice(0, 4);
    return fetchCompareData({ data: slugs });
  },
  head: () => ({
    meta: [{ title: "Comparateur de modèles — Nxt AI Card" }],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { allModels, selected } = Route.useLoaderData();

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompareTable models={selected} allModels={allModels} />
      </main>
      <SiteFooter />
    </div>
  );
}
