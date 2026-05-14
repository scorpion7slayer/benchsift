import { createFileRoute, notFound } from "@tanstack/react-router";
import { fetchModelBasic, fetchModelCapabilities } from "@/lib/server-fns";
import { ModelDetailClient } from "@/components/model-detail-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/models/$slug")({
  loader: async ({ params }) => {
    const model = await fetchModelBasic({ data: params.slug });
    if (!model) throw notFound();
    // Capabilities scraping starts in parallel — the promise is streamed to
    // the client and consumed there, so it never blocks the initial render.
    const capabilitiesPromise = fetchModelCapabilities({ data: params.slug });
    return { model, capabilitiesPromise };
  },
  head: ({ loaderData }) => {
    const model = loaderData?.model;
    if (!model) return {};
    return {
      meta: [
        { title: `${model.name} — Nxt AI Card` },
        {
          name: "description",
          content: `${model.name} by ${model.model_creator.name} — benchmarks, performance and pricing.`,
        },
      ],
    };
  },
  component: ModelPage,
});

function ModelPage() {
  const { model, capabilitiesPromise } = Route.useLoaderData();

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader backHref="/" />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <ModelDetailClient model={model} capabilitiesPromise={capabilitiesPromise} />
      </main>
      <SiteFooter />
    </div>
  );
}
