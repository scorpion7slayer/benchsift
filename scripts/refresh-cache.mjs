import http from "node:http";

const port = process.env.PORT || "3000";
const secret = process.env.CRON_SECRET;
const requestedTimeout = Number(process.env.REFRESH_CACHE_TIMEOUT_MS || 1_800_000);
const timeoutMs = Number.isFinite(requestedTimeout) && requestedTimeout > 0 ? requestedTimeout : 1_800_000;
const jsonOutput = process.argv.includes("--json");
const started = Date.now();
function log(message) {
  if (!jsonOutput) console.log(`${new Date().toISOString()} [refresh] ${message}`);
}
function duration(ms) { return `${Math.round(ms / 1000)}s`; }

if (!secret) {
  console.error("[refresh] FAILED: CRON_SECRET is not configured.");
  process.exit(1);
}

function requestLocalApp(path, method) {
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: "127.0.0.1", port, path, method,
      headers: { authorization: `Bearer ${secret}` },
    }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("error", () => reject(new Error("Response interrupted")));
      response.on("end", () => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode || 0} from ${path}`));
          return;
        }
        try {
          const data = JSON.parse(body);
          if (data.ok !== true) throw new Error();
          resolve(data);
        } catch { reject(new Error(`Invalid response from ${path}`)); }
      });
    });
    const deadline = setTimeout(() => {
      // Bun's ClientRequest.destroy does not always emit an error event.
      reject(new Error("Local application request timed out"));
      request.destroy();
    }, timeoutMs);
    request.on("close", () => clearTimeout(deadline));
    request.on("error", () => reject(new Error("Local application unavailable or request timed out")));
    request.end();
  });
}

log("Starting catalogue refresh.");
const progress = setInterval(() => log(`Still running (${duration(Date.now() - started)}). Source progress is in the application logs.`), 30_000);
try {
  const refresh = await requestLocalApp("/api/cron/refresh", "POST");
  if (!Number.isSafeInteger(refresh.count) || refresh.count <= 0) throw new Error("Refresh returned an empty or invalid catalogue");
  log(`Catalogue updated: ${refresh.count} models in ${duration(refresh.durationMs ?? Date.now() - started)}.`);
  const stats = refresh.stats ?? {};
  const labels = {
    apiModels: "Artificial Analysis (language)", mediaModels: "Artificial Analysis (media)",
    cyberIndexModels: "Artificial Analysis Cyber Index",
    openRouterEnrichedModels: "Enriched with OpenRouter", huggingFaceEnrichedModels: "Enriched with Hugging Face",
    modelsDevEnrichedModels: "Enriched with Models.dev", retainedHistoricalModels: "Historical models retained",
    transientRetries: "Upstream retries",
  };
  for (const [key, label] of Object.entries(labels)) if (Number.isFinite(stats[key])) log(`${label}: ${stats[key]}`);
  log("Checking persisted cache…");
  const status = await requestLocalApp("/api/cron/status", "GET");
  if (!status.exists || !status.valid || !status.fresh || status.count !== refresh.count) {
    throw new Error("Cache verification failed: expected a fresh, valid cache with the refreshed model count");
  }
  log(`SUCCESS: cache verified (${status.count} models, refreshed ${status.refreshedAt}). Total ${duration(Date.now() - started)}.`);
  if (jsonOutput) console.log(JSON.stringify({ ok: true, count: refresh.count, stats, durationMs: Date.now() - started, cache: { valid: status.valid, fresh: status.fresh, count: status.count, refreshedAt: status.refreshedAt } }));
} catch (error) {
  console.error(`${new Date().toISOString()} [refresh] FAILED after ${duration(Date.now() - started)}: ${error.message}. See application logs for source progress.`);
  process.exitCode = 1;
} finally { clearInterval(progress); }
