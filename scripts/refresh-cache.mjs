import http from "node:http";

const port = process.env.PORT || "3000";
const secret = process.env.CRON_SECRET;
const timeoutMs = Number.parseInt(process.env.REFRESH_CACHE_TIMEOUT_MS || "1800000", 10);

if (!secret) {
  console.error("CRON_SECRET is not configured.");
  process.exit(1);
}

function refreshCache() {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/cron/refresh",
        method: "POST",
        headers: {
          authorization: `Bearer ${secret}`,
        },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({ body, statusCode: response.statusCode || 0 });
        });
      },
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Refresh request timed out after ${timeoutMs}ms`));
    });
    request.on("error", reject);
    request.end();
  });
}

const response = await refreshCache();
console.log(response.body || `HTTP ${response.statusCode}`);

if (response.statusCode < 200 || response.statusCode >= 300) {
  process.exit(1);
}
