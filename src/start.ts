import { createMiddleware, createStart } from "@tanstack/react-start";
import { canonicalRedirect } from "@/lib/canonical-url";
import { serveWithHtmlCache } from "@/lib/html-cache";

const LEGACY_HOST = "nxtaicard.nxtaigen.com";
const CANONICAL_HOST = "benchsift.nxtaigen.com";

function requestHost(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0];
  const host = forwardedHost ?? request.headers.get("host") ?? new URL(request.url).host;
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

const canonicalHostRedirect = createMiddleware().server(({ request, next }) => {
  if (requestHost(request) !== LEGACY_HOST) return next();

  const target = new URL(request.url);
  target.protocol = "https:";
  target.hostname = CANONICAL_HOST;
  target.port = "";
  return Response.redirect(target, 308);
});

/** One permanent redirect from any variant of a path to its canonical form. */
const canonicalPathRedirect = createMiddleware().server(({ request, next }) => canonicalRedirect(request) ?? next());

/** Anonymous model pages come from the server-side render cache. */
const modelPageCache = createMiddleware().server(({ request, next }) =>
  serveWithHtmlCache(request, async () => (await next()).response));

export const startInstance = createStart(() => ({
  requestMiddleware: [canonicalHostRedirect, canonicalPathRedirect, modelPageCache],
}));
