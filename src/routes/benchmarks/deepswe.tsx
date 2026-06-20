import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { fetchDeepSweData } from "@/lib/server-fns";
import { DeepSweTable } from "@/components/deepswe-table";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useI18n } from "@/lib/i18n";
import { absoluteUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/benchmarks/deepswe")({
  head: () =>
    seo({
      title: "DeepSWE - BenchSift",
      description:
        "DeepSWE benchmark leaderboard from Datacurve: compare coding agents on original long-horizon software engineering tasks.",
      path: "/benchmarks/deepswe",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "DeepSWE",
        url: absoluteUrl("/benchmarks/deepswe"),
      },
    }),
  loader: async () => fetchDeepSweData(),
  component: DeepSwePage,
});

function DeepSwePage() {
  const data = Route.useLoaderData();
  const { t } = useI18n();

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Activity className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t.deepSwe.title}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">{t.deepSwe.description}</p>
          </div>
        </div>
        <DeepSweTable data={data} />
      </main>
      <SiteFooter />
    </div>
  );
}
