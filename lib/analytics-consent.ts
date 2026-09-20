import { readCookieValue } from "./http-cookie";

// Version the consent when the disclosed purposes or data collection change.
export const ANALYTICS_COOKIE = "benchsift_analytics_v1";
export const ANALYTICS_MAX_AGE = 180 * 24 * 60 * 60;
export type AnalyticsConsent = "accepted" | "rejected" | null;

export function readAnalyticsConsent(
  cookies: string,
  now = Date.now(),
): AnalyticsConsent {
  const value = readCookieValue(cookies, ANALYTICS_COOKIE);
  const match = /^(accepted|rejected)\.(\d{13})$/.exec(value ?? "");
  if (!match) return null;
  const age = now - Number(match[2]);
  return age >= 0 && age < ANALYTICS_MAX_AGE * 1000
    ? (match[1] as AnalyticsConsent)
    : null;
}

export function analyticsConsentCookie(
  choice: Exclude<AnalyticsConsent, null>,
  secure: boolean,
  now = Date.now(),
): string {
  return `${ANALYTICS_COOKIE}=${choice}.${now}; Path=/; Max-Age=${ANALYTICS_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

type AnalyticsWindow = Window & {
  __RYBBIT_OPTOUT__?: boolean;
  rybbit?: { stopSessionReplay?: () => void };
};

/** Own the SDK lifetime: removing its script tag cannot stop its listeners. */
export function createAnalyticsController(win: AnalyticsWindow) {
  const scriptId = "benchsift-rybbit";
  let loaded = Boolean(win.document.getElementById(scriptId));
  let reloading = false;

  function sync(): AnalyticsConsent {
    const consent = readAnalyticsConsent(win.document.cookie);
    if (consent !== "accepted") {
      if (loaded && !reloading) {
        reloading = true;
        win.__RYBBIT_OPTOUT__ = true;
        try { win.rybbit?.stopSessionReplay?.(); } catch { /* Unload below. */ }
        win.location.reload();
      }
      return consent;
    }
    // Local previews and other hosts must never pollute production analytics.
    if (loaded || reloading || win.__RYBBIT_OPTOUT__ ||
        win.location.hostname !== "benchsift.nxtaigen.com" ||
        win.location.protocol !== "https:") return consent;
    try {
      if (win.localStorage.getItem("disable-rybbit") !== null) return consent;
    } catch { /* Consent is stored in a cookie, not localStorage. */ }
    const script = win.document.createElement("script");
    script.id = scriptId;
    script.src = "https://rybbit.nxtaigen.com/api/script.js?siteId=4e72af66bb61";
    script.async = true;
    script.setAttribute("data-site-id", "4e72af66bb61");
    script.setAttribute("data-replay-mask-all-inputs", "true");
    script.setAttribute("data-replay-collect-fonts", "false");
    script.setAttribute("data-replay-block-selector", "[data-analytics-consent]");
    loaded = true;
    win.document.head.appendChild(script);
    return consent;
  }

  function choose(choice: Exclude<AnalyticsConsent, null>): boolean {
    win.document.cookie = analyticsConsentCookie(choice, win.location.protocol === "https:");
    if (readAnalyticsConsent(win.document.cookie) !== choice) return false;
    // A signal for other tabs; the cookie remains the consent authority.
    try { win.localStorage.setItem(ANALYTICS_COOKIE, `${choice}.${Date.now()}`); } catch { /* Tabs also poll. */ }
    sync();
    return true;
  }

  return { sync, choose };
}
