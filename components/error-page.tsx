import { useEffect, useRef, useSyncExternalStore } from "react";
import { Link, useRouter, useRouterState, type ErrorComponentProps } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Home, RefreshCw } from "@/components/icons";
import { CatScene } from "@/components/pixel-art/cat-scenes";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ERROR_STATUS, errorKind, isErrorKind, type ErrorKind } from "@/lib/error-kind";
import { useI18n } from "@/lib/i18n";

const ISSUES_URL = "https://github.com/scorpion7slayer/benchsift/issues";

/** Full error page: header, an animated scene for the kind of error, then what to do next. */
export function ErrorPage({ kind, onRetry }: { kind: ErrorKind; onRetry?: () => void }) {
  const { t } = useI18n();
  const copy = t.errors[kind];
  const actions = t.errors.actions;
  const status = ERROR_STATUS[kind];
  const content = useRef<HTMLDivElement>(null);
  const retry = kind === "rateLimited" || kind === "server" || kind === "unavailable";

  return (
    <div className="flex min-h-[100svh] flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 items-center" aria-labelledby="error-title">
        <div ref={content} className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10 text-center sm:px-6 sm:py-14">
          <div className="w-full max-w-xl">
            <CatScene kind={kind} spotTarget={content} />
          </div>
          <p className="mt-6 font-mono text-sm font-medium text-muted-foreground">
            {status != null && (
              <>
                {status} <span aria-hidden="true">·</span>{" "}
              </>
            )}
            {copy.status}
          </p>
          <h1 id="error-title" className="mt-2 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-[58ch] text-pretty text-base leading-7 text-muted-foreground">{copy.description}</p>
          <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            {kind === "network" ? (
              <Button size="control" onClick={() => window.location.reload()}>
                <RefreshCw aria-hidden="true" />
                {actions.reload}
              </Button>
            ) : retry && onRetry ? (
              <Button size="control" onClick={onRetry}>
                <RefreshCw aria-hidden="true" />
                {actions.retry}
              </Button>
            ) : null}
            <Button asChild size="control" variant={kind === "network" || (retry && onRetry) ? "outline" : "default"}>
              <Link to="/">
                <Home aria-hidden="true" />
                {actions.home}
              </Link>
            </Button>
            {(kind === "notFound" || kind === "forbidden") && (
              <Button asChild size="control" variant="outline">
                <Link to="/models">
                  {actions.browse}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            )}
            {kind === "server" && (
              <Button asChild size="control" variant="ghost">
                <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
                  {actions.report}
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/**
 * Unknown routes and `notFound()`. In development, `?error=<kind>` previews the
 * other pages; the check is compiled out of production builds.
 */
export function RouteNotFound() {
  const preview = useRouterState({
    select: (state) => (import.meta.env.DEV ? (state.location.search as Record<string, unknown>).error : undefined),
  });
  return <ErrorPage kind={isErrorKind(preview) ? preview : "notFound"} onRetry={() => window.location.reload()} />;
}

const subscribeOnline = (notify: () => void) => {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
};

/** Errors thrown while loading or rendering a route. */
export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter();
  // The server renders as online; the browser corrects it after hydration.
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const kind = errorKind(error, { online });

  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorPage kind={kind} onRetry={() => void router.invalidate()} />;
}
