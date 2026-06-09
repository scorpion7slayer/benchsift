import { createMiddleware, createStart } from "@tanstack/react-start";

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

export const startInstance = createStart(() => ({
  requestMiddleware: [canonicalHostRedirect],
}));
