import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ANALYTICS_COOKIE, createAnalyticsController, type AnalyticsConsent } from "@/lib/analytics-consent";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/link";
import { Lock } from "@/components/icons";
import { cn } from "@/lib/utils";

const AnalyticsContext = createContext<(() => void) | null>(null);

export function AnalyticsConsentProvider({ children, initialConsent = null }: {
  children: React.ReactNode;
  initialConsent?: AnalyticsConsent;
}) {
  const { t } = useI18n();
  const copy = t.analytics;
  const [consent, setConsent] = useState(initialConsent);
  const [managing, setManaging] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const controller = useRef<ReturnType<typeof createAnalyticsController> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const banner = useRef<HTMLElement>(null);
  const showBanner = consent === null && !managing;

  useEffect(() => {
    const element = banner.current;
    if (!showBanner || !element) return;
    // Account for the overlay during focus scrolling without adding layout space.
    const root = document.documentElement;
    const measure = () => {
      const bottom = parseFloat(getComputedStyle(element).bottom) || 0;
      root.style.setProperty("--analytics-banner-height", `${element.getBoundingClientRect().height + bottom + 12}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--analytics-banner-height");
    };
  }, [showBanner]);

  useEffect(() => {
    const current = createAnalyticsController(window);
    controller.current = current;
    const sync = () => setConsent(current.sync());
    const onStorage = (event: StorageEvent) => {
      if (event.key === ANALYTICS_COOKIE || event.key === null) sync();
    };
    sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", sync);
    window.addEventListener("pageshow", sync);
    document.addEventListener("visibilitychange", sync);
    const timer = window.setInterval(sync, 30_000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", sync);
      window.removeEventListener("pageshow", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    if (managing) dialog.current?.showModal();
    else dialog.current?.close();
  }, [managing]);

  function choose(choice: "accepted" | "rejected") {
    if (!controller.current?.choose(choice)) {
      setSaveFailed(true);
      return;
    }
    setConsent(choice);
    setSaveFailed(false);
    if (!managing) document.getElementById("main-content")?.focus({ preventScroll: true });
    setManaging(false);
  }

  function controls(modal: boolean) {
    const titleId = modal ? "analytics-dialog-title" : "analytics-banner-title";
    const buttonClass = modal ? "min-h-11 min-w-24" : "h-8 min-w-20 text-xs pointer-coarse:min-h-11";
    return (
      <div className={cn(modal ? "flex flex-col gap-3 p-4" : "grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center")} data-analytics-consent>
        {!modal && <Lock aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground md:mt-0" />}
        <div className="min-w-0">
          <h2 id={titleId} className={cn("font-semibold", modal ? "text-sm" : "text-[13px] leading-[18px]")}>{modal ? copy.title : copy.bannerTitle}</h2>
          <p className={cn("text-muted-foreground", modal ? "mt-1 text-sm leading-5" : "mt-0.5 text-xs leading-4")}>{modal ? copy.description : copy.bannerDescription}</p>
        </div>
        {modal && <>
          <p className="text-xs leading-5 text-muted-foreground">{copy.duration}</p>
          <p className="text-sm" role="status">{consent === "accepted" ? copy.accepted : consent === "rejected" ? copy.rejected : copy.undecided}</p>
        </>}
        <div className={cn("flex flex-wrap items-center gap-2", !modal && "col-span-2 md:col-span-1 md:justify-end")}>
          <Button variant="outline" className={buttonClass} onClick={() => choose("rejected")}>{copy.reject}</Button>
          <Button variant="outline" className={buttonClass} onClick={() => choose("accepted")}>{copy.accept}</Button>
          <Link href="/privacy" className={cn("inline-flex items-center underline underline-offset-4", modal ? "min-h-11 text-sm" : "min-h-8 text-xs pointer-coarse:min-h-11")} onClick={() => setManaging(false)}>{t.trust.privacy}</Link>
          {modal && <Button variant="ghost" className="min-h-11" onClick={() => setManaging(false)}>{copy.close}</Button>}
        </div>
        {saveFailed && <p role="alert" className="col-span-full text-sm text-destructive">{copy.saveFailed}</p>}
      </div>
    );
  }

  return (
    <AnalyticsContext.Provider value={() => { setSaveFailed(false); setManaging(true); }}>
      {children}
      {showBanner && (
        <section
          ref={banner}
          data-cookie-banner
          aria-labelledby="analytics-banner-title"
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto max-h-[70dvh] max-w-4xl overflow-y-auto rounded-xl border bg-card/95 text-card-foreground shadow-lg backdrop-blur-sm sm:inset-x-6 sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          {controls(false)}
        </section>
      )}
      <dialog ref={dialog} aria-labelledby="analytics-dialog-title" onCancel={() => setManaging(false)} onClose={() => setManaging(false)} className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border bg-background text-foreground shadow-xl backdrop:bg-black/40">
        {controls(true)}
      </dialog>
    </AnalyticsContext.Provider>
  );
}

export function AnalyticsPreferencesButton() {
  const open = useContext(AnalyticsContext);
  const { t } = useI18n();
  return <button type="button" onClick={() => open?.()} className="min-h-11 text-left hover:text-foreground">{t.analytics.manage}</button>;
}
