import { createFileRoute } from "@tanstack/react-router";
import { localizedUrl } from "@/lib/seo";
import { LOCALES } from "@/lib/locale";
import { readModelsCacheSummary } from "@/lib/cron-cache";

interface SitemapEntry {
  /** Unprefixed page path; each language gets its own <url>. */
  path: string;
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

/** Each version lists every language version, itself included, and the x-default. */
function alternates(path: string): string {
  return [
    ...LOCALES.map((locale) => `\n    <xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(localizedUrl(path, locale))}"/>`),
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(localizedUrl(path, "en"))}"/>`,
  ].join("");
}

function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .flatMap((e) => LOCALES.map((locale) =>
      `  <url>\n    <loc>${escapeXml(localizedUrl(e.path, locale))}</loc>${alternates(e.path)}${e.lastModified ? `\n    <lastmod>${e.lastModified}</lastmod>` : ""}\n    <changefreq>${e.changeFrequency}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
    ))
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const updated = await catalogueDate();
        // Catalogue pages carry the refresh date. Pages fed by separate live
        // sources or static text have no tracked date, so they omit lastmod
        // rather than claim today.
        const catalogue = (path: string, priority: number, changeFrequency = "daily"): SitemapEntry => ({
          path,
          lastModified: updated,
          changeFrequency,
          priority,
        });
        const live = (path: string): SitemapEntry => ({ path, changeFrequency: "daily", priority: 0.8 });

        // Pillar pages only, until Search Console reports them indexed. Model
        // pages, comparison pairs and legal pages stay crawlable through
        // internal links but are left out, so the crawl budget goes to the
        // pages that lead to them.
        const entries: SitemapEntry[] = [
          catalogue("/", 1),
          catalogue("/models", 0.9),
          { path: "/compare", changeFrequency: "monthly", priority: 0.8 },
          { path: "/about", changeFrequency: "monthly", priority: 0.6 },
          live("/agents/coding"),
          live("/benchmarks/deepswe"),
          live("/benchmarks/frontiercode"),
          live("/benchmarks/aa-3d"),
          live("/benchmarks/decision-index"),
          catalogue("/benchmarks/cyber", 0.8),
          live("/benchmarks/robotics"),
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
