import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { RouteError, RouteNotFound } from "@/components/error-page";

export function getRouter() {
  return createRouter({
    routeTree,
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
