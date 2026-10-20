import { createFileRoute } from "@tanstack/react-router";
import { getLLMModels } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";
import { readModelsCacheSummary } from "@/lib/cron-cache";
import { getIndexableCatalogModels } from "@/lib/model-catalog";

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

/** Day of the last successful catalogue refresh, the date its pages' data changed. */
async function catalogueDate(): Promise<string | undefined> {
  const summary = await readModelsCacheSummary().catch(() => null);
  return summary?.refreshedAtMs ? new Date(summary.refreshedAtMs).toISOString().slice(0, 10) : undefined;
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
        const [models, updated] = await Promise.all([getLLMModels(), catalogueDate()]);
        const indexableModels = getIndexableCatalogModels(models);
        // Catalogue pages carry the refresh date. Pages fed by separate live
        // sources or static text have no tracked date, so they omit lastmod
        // rather than claim today.
        const catalogue = (url: string, priority: number, changeFrequency = "daily"): SitemapEntry => ({
          url: absoluteUrl(url),
          lastModified: updated,
          changeFrequency,
          priority,
        });
        const live = (url: string): SitemapEntry => ({ url: absoluteUrl(url), changeFrequency: "daily", priority: 0.8 });

        const entries: SitemapEntry[] = [
          catalogue("/", 1),
          catalogue("/models", 0.9),
          { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.7 },
          ...["/privacy", "/legal", "/accessibility"].map((pathname) => ({
            url: absoluteUrl(pathname), changeFrequency: "monthly", priority: 0.2,
          })),
          live("/agents/coding"),
          live("/benchmarks/deepswe"),
          live("/benchmarks/frontiercode"),
          live("/benchmarks/aa-3d"),
          live("/benchmarks/decision-index"),
          catalogue("/benchmarks/cyber", 0.8),
          live("/benchmarks/robotics"),
          ...indexableModels.map((model) => catalogue(`/models/${encodeURIComponent(model.slug)}`, 0.7, "weekly")),
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
