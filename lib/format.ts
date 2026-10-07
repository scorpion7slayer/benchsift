/**
 * Locale-aware display formatting for measurements. Every helper renders a
 * missing or non-finite value as "—" so absent data never reads as zero.
 */

export const MISSING = "—";

export type DisplayLang = "fr" | "en";

export function localeFor(lang: DisplayLang): string {
  return lang === "fr" ? "fr-BE" : "en-US";
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat(locale, options);
    formatters.set(key, cached);
  }
  return cached;
}

function isPresent(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Scores and indices keep a fixed number of decimals so columns align. */
export function formatNumber(
  value: number | null | undefined,
  lang: DisplayLang,
  decimals = 1,
): string {
  if (!isPresent(value)) return MISSING;
  return formatter(localeFor(lang), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** USD amounts: cents above one dollar, three significant digits below. */
export function formatMoney(value: number | null | undefined, lang: DisplayLang): string {
  if (!isPresent(value)) return MISSING;
  const base: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
  };
  if (value === 0 || value >= 1) {
    const whole = Number.isInteger(value);
    return formatter(localeFor(lang), {
      ...base,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(value);
  }
  return formatter(localeFor(lang), {
    ...base,
    minimumSignificantDigits: 2,
    maximumSignificantDigits: 3,
  }).format(value);
}

/** Axis-friendly USD: compact from a thousand ($2.8K), otherwise as `formatMoney`. */
export function formatMoneyCompact(value: number | null | undefined, lang: DisplayLang): string {
  if (!isPresent(value)) return MISSING;
  if (Math.abs(value) < 1000) return formatMoney(value, lang);
  return formatter(localeFor(lang), {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumSignificantDigits: 3,
  }).format(value);
}

/** Token counts in compact notation: 131K, 1.05M. */
export function formatTokens(value: number | null | undefined, lang: DisplayLang): string {
  if (!isPresent(value)) return MISSING;
  return formatter(localeFor(lang), {
    notation: "compact",
    maximumSignificantDigits: 3,
  }).format(value);
}

export function formatSeconds(value: number | null | undefined, lang: DisplayLang): string {
  if (!isPresent(value)) return MISSING;
  return `${formatter(localeFor(lang), { maximumSignificantDigits: 3 }).format(value)} s`;
}

export function formatSpeed(value: number | null | undefined, lang: DisplayLang): string {
  if (!isPresent(value)) return MISSING;
  return `${formatter(localeFor(lang), { maximumFractionDigits: value >= 100 ? 0 : 1 }).format(value)} t/s`;
}

/** A duration in minutes and seconds ("18 min 52 s"), or seconds below a minute. */
export function formatDuration(seconds: number | null | undefined, lang: DisplayLang): string {
  if (!isPresent(seconds) || seconds < 0) return MISSING;
  const total = Math.round(seconds);
  if (total < 60) return formatSeconds(total, lang);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} h ${String(minutes % 60).padStart(2, "0")}`;
  }
  return rest ? `${minutes} min ${String(rest).padStart(2, "0")} s` : `${minutes} min`;
}

/** A 0–1 fraction as a percentage with one decimal. */
export function formatPercent(fraction: number | null | undefined, lang: DisplayLang): string {
  if (!isPresent(fraction)) return MISSING;
  return formatter(localeFor(lang), {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(fraction);
}

/** Parameter counts published in billions. */
export function formatParameters(billions: number | null | undefined, lang: DisplayLang): string {
  if (!isPresent(billions)) return MISSING;
  const digits = formatter(localeFor(lang), { maximumSignificantDigits: 3 });
  if (billions >= 1000) return `${digits.format(billions / 1000)}T`;
  if (billions >= 1) return `${digits.format(billions)}B`;
  return `${digits.format(billions * 1000)}M`;
}

/** How many times larger a value is than the reference, e.g. "×6.7". */
export function formatRatio(value: number, lang: DisplayLang): string {
  return `×${formatter(localeFor(lang), { maximumSignificantDigits: value >= 10 ? 3 : 2 }).format(value)}`;
}

/**
 * The single price a catalogue row shows: the provider's unit price for media
 * models (per image, per minute…), otherwise the blended 3:1 token price.
 */
export function formatCatalogPrice(
  pricing: {
    price_1m_blended_3_to_1: number | null;
    openrouter_display_prices?: Array<{ price: number; unit: string; kind?: string }>;
  },
  lang: DisplayLang,
): string {
  const unit = pricing.openrouter_display_prices?.find((row) => row.kind === "unit");
  if (unit) return `${formatMoney(unit.price, lang)} ${unit.unit.replace(/^per /, "/")}`;
  return formatMoney(pricing.price_1m_blended_3_to_1, lang);
}

const dateFormatters = new Map<DisplayLang, Intl.DateTimeFormat>();

/** A calendar date such as "9 juin 2026" / "Jun 9, 2026"; invalid dates read "—". */
export function formatDate(value: string | null | undefined, lang: DisplayLang): string {
  const time = value ? Date.parse(value) : Number.NaN;
  if (!Number.isFinite(time)) return MISSING;
  let cached = dateFormatters.get(lang);
  if (!cached) {
    cached = new Intl.DateTimeFormat(localeFor(lang), { dateStyle: "medium", timeZone: "UTC" });
    dateFormatters.set(lang, cached);
  }
  return cached.format(time);
}
