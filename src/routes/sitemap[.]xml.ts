import { createFileRoute } from "@tanstack/react-router";
import { getLLMModels } from "@/lib/api";

const BASE = "https://nxtaicard.nxtaigen.com";

interface SitemapEntry {
  url: string;
  changeFrequency: string;
  priority: number;
}

function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${e.url}</loc>\n    <changefreq>${e.changeFrequency}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const models = await getLLMModels();

        const entries: SitemapEntry[] = [
          { url: BASE, changeFrequency: "daily", priority: 1 },
          { url: `${BASE}/compare`, changeFrequency: "weekly", priority: 0.8 },
          ...models.map((model) => ({
            url: `${BASE}/models/${model.slug}`,
            changeFrequency: "weekly",
            priority: 0.7,
          })),
        ];

        return new Response(renderSitemap(entries), {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
