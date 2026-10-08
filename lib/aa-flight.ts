/**
 * Reader for the React Server Components (Flight) payloads Artificial Analysis
 * pages return with the `RSC: 1` header. Only JSON records and property
 * references are decoded; upstream code is never evaluated.
 */

/** JSON records of a Flight payload, keyed by their hexadecimal id. */
export function parseFlightRecords(payload: string): Map<string, unknown> {
  const records = new Map<string, unknown>();
  for (const line of payload.split("\n")) {
    const match = /^([a-f0-9]+):([\[{].*)$/.exec(line);
    if (!match) continue;
    try {
      records.set(match[1], JSON.parse(match[2]));
    } catch {
      /* Non-JSON Flight records. */
    }
  }
  return records;
}

/**
 * Replaces `$id:path` references with the values they point to. Cycles,
 * missing records and prototype keys throw rather than produce a guess.
 */
export function resolveFlightReferences(
  value: unknown,
  records: ReadonlyMap<string, unknown>,
): unknown {
  function resolve(value: unknown, seen: Set<string>, depth: number): unknown {
    if (depth > 64) throw new Error("Nested Flight data");
    if (typeof value === "string" && /^\$[a-f0-9]+(?::|$)/.test(value)) {
      if (seen.has(value)) throw new Error("Cyclic Flight reference");
      const [id, ...path] = value.slice(1).split(":");
      let target = records.get(id);
      for (const key of path) {
        if (key === "__proto__" || key === "constructor" || key === "prototype")
          throw new Error("Invalid reference");
        if (Array.isArray(target) && target[0] === "$" && key === "props")
          target = target[3];
        else if (
          target &&
          typeof target === "object" &&
          Object.hasOwn(target, key)
        )
          target = (target as Record<string, unknown>)[key];
        else throw new Error("Unresolved Flight reference");
      }
      if (target === undefined) throw new Error("Missing Flight record");
      return resolve(target, new Set([...seen, value]), depth + 1);
    }
    if (Array.isArray(value))
      return value.map((item) => resolve(item, seen, depth + 1));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          resolve(item, seen, depth + 1),
        ]),
      );
    return value;
  }
  return resolve(value, new Set(), 0);
}

type FlightProps = Record<string, unknown>;

function isElement(value: unknown): value is ["$", unknown, unknown, FlightProps] {
  return (
    Array.isArray(value) &&
    value[0] === "$" &&
    value.length >= 4 &&
    Boolean(value[3]) &&
    typeof value[3] === "object" &&
    !Array.isArray(value[3])
  );
}

/**
 * Props of a rendered element, following a lazy `$L<id>` reference to the
 * record that holds it. Anything else is not an element and gives null.
 */
export function flightElementProps(
  value: unknown,
  records: ReadonlyMap<string, unknown>,
): FlightProps | null {
  const lazy = typeof value === "string" ? /^\$L([a-f0-9]+)$/.exec(value) : null;
  const element = lazy ? records.get(lazy[1]) : value;
  return isElement(element) ? element[3] : null;
}

/** Props of every element in the payload whose props satisfy `matches`. */
export function findFlightElementProps(
  records: ReadonlyMap<string, unknown>,
  matches: (props: FlightProps) => boolean,
): FlightProps[] {
  const found: FlightProps[] = [];
  const visit = (value: unknown, depth: number) => {
    if (depth > 256 || !value || typeof value !== "object") return;
    if (isElement(value) && matches(value[3])) found.push(value[3]);
    for (const item of Array.isArray(value) ? value : Object.values(value)) {
      visit(item, depth + 1);
    }
  };
  for (const record of records.values()) visit(record, 0);
  return found;
}
