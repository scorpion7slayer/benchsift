import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

const BODY = `User-agent: Googlebot
Allow: /
Disallow: /api/

User-agent: Googlebot-Image
Allow: /
Disallow: /api/

User-agent: Googlebot-News
Allow: /
Disallow: /api/

User-agent: Bingbot
Allow: /
Disallow: /api/

User-agent: DuckDuckBot
Allow: /
Disallow: /api/

User-agent: Applebot
Allow: /
Disallow: /api/

User-agent: Slurp
Allow: /
Disallow: /api/

User-agent: YandexBot
Allow: /
Disallow: /api/

User-agent: Baiduspider
Allow: /
Disallow: /api/

User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(BODY, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        }),
    },
  },
});
