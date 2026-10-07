type LogLevel = "info" | "warn" | "error";
type LogFields = Record<string, string | number | boolean | null | undefined>;

/** Call sites pass counts, states and durations only, never requests or errors. */
export function logEvent(level: LogLevel, event: string, fields: LogFields = {}): void {
  const details = Object.entries(fields).filter(([, value]) => value != null)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(" ");
  const line = `${new Date().toISOString()} ${level.toUpperCase()} [benchsift] ${event}${details ? ` ${details}` : ""}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
