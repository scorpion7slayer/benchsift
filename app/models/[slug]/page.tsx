import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getLLMModelBasic, scrapeModelCapabilities } from "@/lib/api";
import { ModelDetailClient } from "@/components/model-detail-client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!/^[a-z0-9\-_.]+$/i.test(slug)) return {};
  const model = await getLLMModelBasic(slug);
  if (!model) return {};
  return {
    title: `${model.name} — Nxt AI Card`,
    description: `${model.name} by ${model.model_creator.name} — benchmarks, performance and pricing.`,
  };
}

async function ModelContent({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9\-_.]+$/i.test(slug)) notFound();
  const model = await getLLMModelBasic(slug);
  if (!model) notFound();
  // Scraping démarre en parallèle — ne bloque pas le rendu
  const capabilitiesPromise = scrapeModelCapabilities(slug);
  return <ModelDetailClient model={model} capabilitiesPromise={capabilitiesPromise} />;
}

export default function ModelPage({ params }: Props) {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader backHref="/" />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm">Chargement…</p>
          </div>
        }>
          <ModelContent params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
