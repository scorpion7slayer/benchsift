import { createFileRoute } from "@tanstack/react-router";

const BASE = "https://nxtaicard.nxtaigen.com";

const BODY = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${BASE}/sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(BODY, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        }),
    },
  },
});
