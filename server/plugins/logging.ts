import { definePlugin } from "nitro";
import { logEvent } from "../../lib/logger";

export default definePlugin((app) => {
  logEvent("info", "server.started", {
    cache: "disk", redisConfigured: Boolean(process.env.REDIS_URL),
    refreshConfigured: Boolean(process.env.CRON_SECRET),
  });
  const started = new WeakMap<object, number>();
  app.hooks.hook("request", (event) => { started.set(event, Date.now()); });
  app.hooks.hook("response", (response, event) => {
    const path = new URL(event.req.url).pathname;
    const failed = response.status >= 400;
    if (!failed && (path === "/health" || /^\/(?:assets|logos|fonts)\//.test(path) || /favicon/.test(path))) return;
    const route = path.startsWith("/models/") ? "/models/:slug"
      : path.startsWith("/_serverFn/") ? "/_serverFn/:function"
      : ["/", "/compare", "/models", "/about", "/privacy", "/legal", "/accessibility", "/api/cron/refresh", "/api/cron/status", "/health", "/agents/coding", "/benchmarks/deepswe"].includes(path) ? path : "/other";
    logEvent(response.status >= 500 ? "error" : failed ? "warn" : "info", "http.response", {
      method: event.req.method, route, status: response.status,
      durationMs: Date.now() - (started.get(event) ?? Date.now()),
    });
  });
  app.hooks.hook("error", () => { logEvent("error", "server.request_failed"); });
  app.hooks.hook("close", () => { logEvent("info", "server.stopped"); });
});
