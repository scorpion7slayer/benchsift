const port = process.env.PORT || "3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET is not configured.");
  process.exit(1);
}

const response = await fetch(`http://127.0.0.1:${port}/api/cron/refresh`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${secret}`,
  },
});

const body = await response.text();
console.log(body);

if (!response.ok) {
  process.exit(1);
}
