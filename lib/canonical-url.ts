/*
 * The site's URL rewrite rules, the equivalent of an Apache .htaccess: every
 * variant of a page path resolves to one canonical path, reached with a single
 * permanent redirect. Query strings are kept as they are.
 */

/** Paths served as files or functions, whose case and shape are left alone. */
const UNTOUCHED = /^\/(?:_serverFn|assets|logos|fonts|_build)(?:\/|$)/;

/** Section roots without a page of their own, pointed at their only page. */
const SECTION_ROOTS: Record<string, string> = {
  "/agents": "/agents/coding",
  "/docs": "/docs/api",
};

/** The canonical form of a request path, or null when it is already canonical. */
export function canonicalPath(pathname: string): string | null {
  if (UNTOUCHED.test(pathname)) return null;

  // Fixed segments are lowercase; a model slug keeps its case (AA has "QwQ-32B-Preview"),
  // and its page redirects other spellings to the model's own slug.
  let path = pathname.replace(/\/{2,}/g, "/").split("/").map((segment, index, parts) => (
    index === 2 && parts[1].toLowerCase() === "models" && segment.toLowerCase() !== "page" ? segment : segment.toLowerCase()
  )).join("/");
  // Old static-site addresses: /index.html, /about.html, /about/index.html.
  path = path.replace(/\/index(?:\.html?)?$/, "/").replace(/\.html?$/, "");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  path ||= "/";

  // The first catalogue page is /models; page numbers have no leading zeros.
  const page = path.match(/^\/models\/page\/(\d+)$/);
  if (page) {
    const number = Number(page[1]);
    if (Number.isSafeInteger(number) && number >= 1) path = number === 1 ? "/models" : `/models/page/${number}`;
  }
  path = SECTION_ROOTS[path] ?? path;

  return path === pathname ? null : path;
}

/** A permanent redirect to the canonical URL for GET and HEAD requests, else null. */
export function canonicalRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  const path = canonicalPath(url.pathname);
  if (path === null) return null;
  // A relative Location keeps the host and scheme the proxy received.
  return new Response(null, { status: 308, headers: { Location: `${path}${url.search}` } });
}
