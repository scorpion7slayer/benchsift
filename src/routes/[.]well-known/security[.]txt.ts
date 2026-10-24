import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

// RFC 9116. Renew Expires before it passes.
const BODY = `Contact: mailto:contact@nxtaigen.com
Expires: 2027-10-23T00:00:00.000Z
Preferred-Languages: fr, en
Policy: https://github.com/scorpion7slayer/benchsift/security/policy
Canonical: ${SITE_URL}/.well-known/security.txt
`;

export const Route = createFileRoute("/.well-known/security.txt")({
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
