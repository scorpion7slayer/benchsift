import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { RouteError, RouteNotFound } from "@/components/error-page";
import { createLocaleRewrite } from "@/lib/locale";

export function getRouter() {
  // English at the root, French under /fr: one route tree for both.
  const { rewrite } = createLocaleRewrite();
  return createRouter({
    routeTree,
    rewrite,
    defaultPreload: "intent",
    defaultPreloadDelay: 100,
    defaultStaleTime: 30_000,
    defaultGcTime: 120_000,
    defaultPreloadGcTime: 30_000,
    scrollRestoration: true,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: RouteNotFound,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
