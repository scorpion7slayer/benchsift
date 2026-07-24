import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  Check,
  CircleDollarSign,
  Cpu,
  ExternalLink,
  Gauge,
  Heart,
  Route as RouteIcon,
} from "lucide-react";
import { Link } from "@/components/link";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { absoluteUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    seo({
      title: "About BenchSift - Independent AI Model Comparison",
      description:
        "Learn why BenchSift offers a simpler way to compare AI models, where its data comes from, and why it is an alternative rather than a competitor to Artificial Analysis.",
      path: "/about",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "About BenchSift",
        url: absoluteUrl("/about"),
        description:
          "BenchSift is an independent interface for comparing AI models using attributed data from Artificial Analysis, OpenRouter, and Hugging Face.",
      },
    }),
  component: AboutPage,
});

const sourceLinks = {
  artificialAnalysis: "https://artificialanalysis.ai",
  openRouter: "https://openrouter.ai",
  huggingFace: "https://huggingface.co",
} as const;

function AboutPage() {
  const { t } = useI18n();
  const sources = [
    {
      name: "Artificial Analysis",
      href: sourceLinks.artificialAnalysis,
      description: t.about.sources.artificialAnalysis,
      icon: Gauge,
    },
    {
      name: "OpenRouter",
      href: sourceLinks.openRouter,
      description: t.about.sources.openRouter,
      icon: RouteIcon,
    },
    {
      name: "Hugging Face",
      href: sourceLinks.huggingFace,
      description: t.about.sources.huggingFace,
      icon: Boxes,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <article className="space-y-14 sm:space-y-16">
          <header className="max-w-3xl">
            <div className="mb-5 flex size-11 items-center justify-center rounded-xl border bg-card shadow-sm">
              <BrandMark className="size-6" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t.about.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {t.about.lead}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/models">
                  {t.about.browseModels}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/compare">{t.about.compareModels}</Link>
              </Button>
            </div>
          </header>

          <section
            aria-labelledby="what-is-benchsift"
            className="grid gap-10 border-t pt-10 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]"
          >
            <div className="space-y-8">
              <div>
                <h2 id="what-is-benchsift" className="text-2xl font-semibold tracking-tight">
                  {t.about.definitionTitle}
                </h2>
                <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                  {t.about.definitionBody}
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{t.about.whyTitle}</h2>
                <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                  {t.about.whyBody}
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
              <ul className="space-y-5">
                {t.about.differences.map((difference) => (
                  <li key={difference.title} className="flex gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-medium">{difference.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {difference.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="data-sources">
            <div className="max-w-3xl">
              <h2 id="data-sources" className="text-2xl font-semibold tracking-tight">
                {t.about.sourcesTitle}
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">{t.about.sourcesLead}</p>
            </div>

            <div className="mt-7 divide-y overflow-hidden rounded-xl border bg-card">
              {sources.map((source) => {
                const Icon = source.icon;
                return (
                  <div
                    key={source.name}
                    className="grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-medium">{source.name}</h3>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {source.description}
                      </p>
                    </div>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-1.5 justify-self-start rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:justify-self-end"
                      aria-label={`${t.about.visitSource}: ${source.name}`}
                    >
                      {t.about.visitSource}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="benchmark-limits"
            className="grid gap-8 border-y py-10 sm:py-12 lg:grid-cols-2 lg:gap-12"
          >
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <CircleDollarSign className="size-5" aria-hidden="true" />
              </div>
              <h2 id="benchmark-limits" className="text-2xl font-semibold tracking-tight">
                {t.about.limitsTitle}
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">{t.about.limitsBody}</p>
            </div>
            <div className="lg:pt-14">
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Cpu className="size-5" aria-hidden="true" />
              </div>
              <p className="leading-7 text-muted-foreground">{t.about.openWeightsBody}</p>
            </div>
          </section>

          <section aria-labelledby="alternative-not-competitor" className="rounded-xl bg-muted/45 p-6 sm:p-8">
            <Heart className="size-6 text-primary" aria-hidden="true" />
            <h2 id="alternative-not-competitor" className="mt-5 text-2xl font-semibold tracking-tight">
              {t.about.relationshipTitle}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              {t.about.relationshipBody}
            </p>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              {t.about.gratitudeBody}
            </p>
            <a
              href={sourceLinks.artificialAnalysis}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-10 items-center gap-1.5 rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Artificial Analysis
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </section>

          <footer className="flex flex-col gap-5 border-t pt-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl leading-7 text-muted-foreground">{t.about.alternativeToLead}</p>
            <Button variant="outline" asChild className="shrink-0">
              <a
                href="https://alternativeto.net/software/nxtaicard/about/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.about.alternativeToCta}
                <ExternalLink data-icon="inline-end" />
              </a>
            </Button>
          </footer>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
