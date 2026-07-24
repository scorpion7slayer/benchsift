import { createFileRoute } from "@tanstack/react-router";
import { getLLMModels } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";
import {
  getIndexableCatalogModels,
  MODEL_CATALOG_PAGE_SIZE,
} from "@/lib/model-catalog";

interface SitemapEntry {
  url: string;
  changeFrequency: string;
  lastModified?: string;
  priority: number;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}

function toIsoDate(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString().slice(0, 10);
}

function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${escapeXml(e.url)}</loc>${e.lastModified ? `\n    <lastmod>${e.lastModified}</lastmod>` : ""}\n    <changefreq>${e.changeFrequency}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const models = await getLLMModels();
        const indexableModels = getIndexableCatalogModels(models);
        const catalogPages = Math.max(
          1,
          Math.ceil(indexableModels.length / MODEL_CATALOG_PAGE_SIZE),
        );
        const today = new Date().toISOString().slice(0, 10);

        const entries: SitemapEntry[] = [
          {
            url: absoluteUrl("/"),
            lastModified: today,
            changeFrequency: "daily",
            priority: 1,
          },
          {
            url: absoluteUrl("/models"),
            lastModified: today,
            changeFrequency: "daily",
            priority: 0.9,
          },
          {
            url: absoluteUrl("/about"),
            lastModified: today,
            changeFrequency: "monthly",
            priority: 0.7,
          },
          ...Array.from({ length: catalogPages - 1 }, (_, index) => ({
            url: absoluteUrl(`/models/page/${index + 2}`),
            lastModified: today,
            changeFrequency: "daily",
            priority: 0.8,
          })),
          {
            url: absoluteUrl("/agents/coding"),
            lastModified: today,
            changeFrequency: "daily",
            priority: 0.8,
          },
          {
            url: absoluteUrl("/benchmarks/deepswe"),
            lastModified: today,
            changeFrequency: "daily",
            priority: 0.8,
          },
          ...indexableModels.map((model) => ({
            url: absoluteUrl(`/models/${encodeURIComponent(model.slug)}`),
            lastModified: model.release_date ? toIsoDate(model.release_date, today) : undefined,
            changeFrequency: "weekly",
            priority: 0.7,
          })),
        ];

        return new Response(renderSitemap(entries), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
