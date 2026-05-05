"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";

const PAGE_EXIT_MS = 540;
const PAGE_CLEANUP_MS = 1200;

interface PageTransitionContextValue {
  push: (href: string) => void;
  replace: (href: string) => void;
}

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getInternalHref(href: string) {
  const target = new URL(href, window.location.href);
  if (target.origin !== window.location.origin) return null;

  const next = `${target.pathname}${target.search}${target.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next === current) return null;

  return next;
}

function isModifiedClick(event: MouseEvent | ReactMouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const leavingRef = useRef(false);
  const navTimerRef = useRef<number | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (navTimerRef.current) window.clearTimeout(navTimerRef.current);
    if (cleanupTimerRef.current) window.clearTimeout(cleanupTimerRef.current);
    navTimerRef.current = null;
    cleanupTimerRef.current = null;
  }, []);

  const transitionTo = useCallback(
    (href: string, mode: "push" | "replace") => {
      const next = getInternalHref(href);
      if (!next) return;

      if (prefersReducedMotion()) {
        router[mode](next);
        return;
      }

      if (leavingRef.current) return;
      leavingRef.current = true;
      document.documentElement.classList.add("page-route-leaving");

      navTimerRef.current = window.setTimeout(() => {
        router[mode](next);
        cleanupTimerRef.current = window.setTimeout(() => {
          document.documentElement.classList.remove("page-route-leaving");
          leavingRef.current = false;
        }, PAGE_CLEANUP_MS);
      }, PAGE_EXIT_MS);
    },
    [router]
  );

  useEffect(() => {
    document.documentElement.classList.remove("page-route-leaving");
    leavingRef.current = false;
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        isModifiedClick(event) ||
        prefersReducedMotion()
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor) return;

      const target = anchor.getAttribute("target");
      const href = anchor.getAttribute("href");
      if (!href || anchor.hasAttribute("download") || (target && target !== "_self")) return;

      const next = getInternalHref(href);
      if (!next) return;

      event.preventDefault();
      transitionTo(next, "push");
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, [clearTimers, transitionTo]);

  const contextValue = useMemo<PageTransitionContextValue>(
    () => ({
      push: (href) => transitionTo(href, "push"),
      replace: (href) => transitionTo(href, "replace"),
    }),
    [transitionTo]
  );

  return (
    <PageTransitionContext.Provider value={contextValue}>
      <div key={pathname} className="page-transition-frame flex flex-1 flex-col">
        {children}
      </div>
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error("usePageTransition must be used inside PageTransitionProvider");
  }
  return context;
}
