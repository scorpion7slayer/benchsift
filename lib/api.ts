import { unstable_cache } from "next/cache";

const BASE_URL = "https://artificialanalysis.ai/api/v2";
const OR_BASE = "https://openrouter.ai/api/v1";
const API_FETCH_TIMEOUT_MS = 8_000;
const SCRAPE_FETCH_TIMEOUT_MS = 6_000;
const PARTIAL_MODEL_CHUNK_SIZE = 5;
const CAPABILITY_CHUNK_SIZE = 6;
const SCRAPE_USER_AGENT = "Mozilla/5.0 (compatible; NxtAICard/1.0; +https://nxtaicard.nxtaigen.com)";

function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs = API_FETCH_TIMEOUT_MS
): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(timeoutMs),
  });
}

function getApiKeys(): string[] {
  return [
    process.env.ARTIFICIAL_ANALYSIS_API_KEY,
    process.env.ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY,
    process.env.ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_2,
    process.env.ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_3,
  ].filter((k): k is string => typeof k === "string" && k.length > 0);
}

// OpenRouter types / Types OpenRouter

interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  hugging_face_id: string | null;
  name: string;
  created: number;
  context_length: number;
  architecture: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
    instruct_type: string | null;
  };
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    audio?: string;
  };
  top_provider: {
    context_length: number | null;
    max_completion_tokens: number | null;
    is_moderated: boolean;
  } | null;
  supported_parameters: string[] | null;
}

const getOpenRouterModels = unstable_cache(
  async (): Promise<OpenRouterModel[]> => {
    try {
      const res = await fetchWithTimeout(`${OR_BASE}/models`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data as OpenRouterModel[]) ?? [];
    } catch {
      return [];
    }
  },
  ["openrouter-models"],
  { revalidate: 86400 }
);

/** Finds the OR model matching an AA slug via multiple strategies. / Trouve le modèle OR correspondant via plusieurs stratégies. */
function findOrModel(aaSlug: string, orModels: OpenRouterModel[]): OpenRouterModel | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[\s_.]/g, "-");
  const ns = norm(aaSlug);
  // 1. exact canonical_slug
  let m = orModels.find((o) => norm(o.canonical_slug) === ns);
  if (m) return m;
  // 2. exact OR id suffix (after "/") / suffixe exact
  m = orModels.find((o) => norm(o.id.split("/").pop() ?? "") === ns);
  if (m) return m;
  // 3. substring match (fuzzy) / l'un contient l'autre
  return orModels.find((o) => {
    const c = norm(o.canonical_slug);
    const s = norm(o.id.split("/").pop() ?? "");
    return c.includes(ns) || ns.includes(c) || s.includes(ns) || ns.includes(s);
  });
}

/** Converts an OR model to our capabilities format. / Convertit un modèle OR en capacités. */
function orCapabilities(or: OpenRouterModel): Partial<LLMModel> {
  const inp = or.architecture?.input_modalities ?? [];
  const out = or.architecture?.output_modalities ?? [];
  const params = or.supported_parameters ?? [];
  const has = (arr: string[], ...keys: string[]) =>
    keys.some((k) => arr.includes(k)) ? true : undefined;
  return {
    context_window_tokens: or.context_length || or.top_provider?.context_length || null,
    // Reasoning: "reasoning" or "include_reasoning" in supported_parameters (reliable) / fiable
    reasoning_model: params.includes("reasoning") || params.includes("include_reasoning")
      ? true
      : undefined,
    // is_open_weights: removed from OR — hugging_face_id != null is unreliable
    // (some closed models have an HF presence for their tokenizer / certains modèles fermés ont une présence HF)
    input_modality_text:    has(inp, "text"),
    input_modality_image:   has(inp, "image"),
    input_modality_speech:  has(inp, "audio"),
    input_modality_video:   has(inp, "video", "file"),
    output_modality_text:   has(out, "text"),
    output_modality_image:  has(out, "image"),
    output_modality_speech: has(out, "audio"),
    output_modality_video:  has(out, "video", "file"),
  };
}


export interface ModelCreator {
  id: string;
  name: string;
  slug: string;
}

export interface Evaluations {
  // AA indices — scale 0-100 / échelle 0-100
  artificial_analysis_intelligence_index: number | null;
  artificial_analysis_coding_index: number | null;
  artificial_analysis_math_index: number | null;
  // Standard benchmarks — decimal 0-1 (× 100 to display as %) / décimal 0-1
  mmlu_pro: number | null;
  gpqa: number | null;
  hle: number | null;
  livecodebench: number | null;
  scicode: number | null;
  math_500: number | null;
  aime: number | null;
  aime_25: number | null;
  ifbench: number | null;
  lcr: number | null;
  terminalbench_hard: number | null;
  tau2: number | null;
  // Catch-all for any other field returned by the API / pour tout autre champ
  [key: string]: number | null;
}

export interface Pricing {
  price_1m_blended_3_to_1: number | null;
  price_1m_input_tokens: number | null;
  price_1m_output_tokens: number | null;
}

export interface LLMModel {
  id: string;
  name: string;
  slug: string;
  release_date: string | null;
  model_creator: ModelCreator;
  evaluations: Evaluations;
  pricing: Pricing;
  // Performance (from the API) / depuis l'API
  median_output_tokens_per_second: number | null;
  median_time_to_first_token_seconds: number | null;
  median_time_to_first_answer_token: number | null;
  // Additional capabilities (AA scraping — detail page only) / disponibles sur la page détail
  context_window_tokens?: number | null;
  total_parameters_b?: number | null;   // total parameters in billions / en milliards
  active_parameters_b?: number | null;  // active parameters in billions / en milliards
  is_open_weights?: boolean;
  input_modality_text?: boolean;
  input_modality_image?: boolean;
  input_modality_speech?: boolean;
  input_modality_video?: boolean;
  output_modality_text?: boolean;
  output_modality_image?: boolean;
  output_modality_speech?: boolean;
  output_modality_video?: boolean;
  reasoning_model?: boolean;
  reasoning_properties?: { style: string } | null;
}

interface ApiResponse<T> {
  status: number;
  data: T;
}

/** Tries every key in order, continues on any error (429 or other). */
async function apiFetch<T>(endpoint: string): Promise<T> {
  const keys = getApiKeys();

  if (keys.length === 0) throw new Error("No ARTIFICIAL_ANALYSIS_API_KEY set");

  let lastError: Error | null = null;

  for (const key of keys) {
    try {
      const res = await fetchWithTimeout(
        `${BASE_URL}${endpoint}`,
        { headers: { "x-api-key": key } },
        API_FETCH_TIMEOUT_MS
      );

      if (!res.ok) {
        lastError = new Error(`API error ${res.status} on key …${key.slice(-6)}`);
        continue;
      }

      const json: ApiResponse<T> = await res.json();
      return json.data;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      continue;
    }
  }

  throw lastError ?? new Error("All API keys failed (429 rate limit on all keys)");
}

// ─── HTML extraction helpers ────────────────────────────────────────────────

/** Converts a slug to a readable name (e.g. "nvidia-nemotron-3-nano-30b" → "Nvidia Nemotron 3 Nano 30B") */
function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => {
      if (/^\d+$/.test(w)) return w;
      if (/^\d+[bBmMkKtT]$/.test(w)) return w.slice(0, -1) + w.slice(-1).toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/**
 * Extracts a numeric value from JSON-like HTML.
 * Handles both regular JSON ("key":123) and escaped JSON (\"key\":123).
 */
function extractJsonNum(html: string, ...keys: string[]): number | null {
  for (const key of keys) {
    let m = html.match(new RegExp(`"${key}"\\s*:\\s*([\\d.]+)`));
    if (m) return parseFloat(m[1]);
    m = html.match(new RegExp(`\\\\"${key}\\\\"\\s*:\\s*([\\d.]+)`));
    if (m) return parseFloat(m[1]);
  }
  return null;
}

/**
 * Extracts a string value from JSON-like HTML.
 * Handles both regular JSON ("key":"val") and escaped JSON (\"key\":\"val\").
 */
function extractJsonStr(html: string, ...keys: string[]): string | null {
  for (const key of keys) {
    let m = html.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
    if (m) return m[1];
    m = html.match(new RegExp(`\\\\"${key}\\\\"\\s*:\\s*\\\\"([^"\\\\]+)\\\\"`));
    if (m) return m[1];
  }
  return null;
}

// ─── Scrape all model slugs from the sitemap ────────────────────────────────

/**
 * Meta-pages that appear under /models/ in the sitemap but are NOT individual models.
 * These are category pages, comparison hubs, and feature pages.
 */
const SITEMAP_EXCLUDED_SLUGS = new Set([
  "comparisons", "compare",
  "multilingual", "open-source", "capabilities",
  "caching", "recommend",
  "leaderboard", "ranking", "benchmark",
]);

/**
 * Fetches the AA sitemap to get the authoritative list of real model slugs.
 * Used both to add missing models and to filter out "fake" meta-models returned by the API.
 * Called only inside the cached getLLMModels refresh to avoid extra KV entries.
 */
async function scrapeAllModelSlugs(): Promise<string[]> {
  try {
    const res = await fetchWithTimeout(
      "https://artificialanalysis.ai/sitemap.xml",
      { headers: { "User-Agent": SCRAPE_USER_AGENT } },
      SCRAPE_FETCH_TIMEOUT_MS
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const slugs = new Set<string>();
    for (const m of xml.matchAll(
      /https:\/\/artificialanalysis\.ai\/models\/([a-z0-9][a-z0-9\-_.]+?)(?:<|\/|$)/g
    )) {
      const s = m[1];
      // Only keep direct model slugs — skip meta-pages and sub-pages (contain "/")
      if (s.length > 2 && !SITEMAP_EXCLUDED_SLUGS.has(s) && !s.includes("/")) {
        slugs.add(s);
      }
    }
    return [...slugs];
  } catch {
    return [];
  }
}

// ─── Build partial models for slugs missing from the API ────────────────────

/**
 * Builds a minimal LLMModel by scraping an AA model page.
 * Used for models that exist on AA but are not yet in their API.
 * Called only inside the cached getLLMModels refresh to avoid per-slug KV writes.
 */
async function buildPartialModel(slug: string): Promise<LLMModel | null> {
  try {
    const res = await fetchWithTimeout(
      `https://artificialanalysis.ai/models/${slug}`,
      { headers: { "User-Agent": SCRAPE_USER_AGENT } },
      SCRAPE_FETCH_TIMEOUT_MS
    );
    if (!res.ok) return null;
    const html = await res.text();

    // Creator — try structured JSON first, then object pattern
    const creatorSlug =
      extractJsonStr(html, "model_creator_slug", "creator_slug") ??
      html.match(/"model_creators?"\s*:\s*\{[^}]{0,300}"slug"\s*:\s*"([a-z0-9\-]+)"/)?.[1] ??
      html.match(/\\"model_creators?\\"\s*:\s*\{[^}]{0,300}\\"slug\\"\s*:\s*\\"([a-z0-9\-]+)\\"/)?.[1] ??
      slug.split("-")[0];
    const creatorName =
      extractJsonStr(html, "model_creator_name", "creator_name") ??
      html.match(/"model_creators?"\s*:\s*\{[^}]{0,300}"name"\s*:\s*"([^"]+)"/)?.[1] ??
      html.match(/\\"model_creators?\\"\s*:\s*\{[^}]{0,300}\\"name\\"\s*:\s*\\"([^"\\]+)\\"/)?.[1] ??
      (creatorSlug.charAt(0).toUpperCase() + creatorSlug.slice(1));

    // Model name
    const name =
      extractJsonStr(html, "model_name", "modelName") ??
      html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/)?.[1]?.trim() ??
      slugToName(slug);

    // Release date
    const releaseDate =
      html.match(/"release_date"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)
        ?.[1] ??
      html.match(/\\"release_date\\"\s*:\s*\\"(\d{4}-\d{2}-\d{2})\\"/)
        ?.[1] ??
      null;

    // Pricing
    const pricing: Pricing = {
      price_1m_blended_3_to_1: extractJsonNum(html, "price_1m_blended_3_to_1"),
      price_1m_input_tokens:   extractJsonNum(html, "price_1m_input_tokens"),
      price_1m_output_tokens:  extractJsonNum(html, "price_1m_output_tokens"),
    };

    // Evaluations — AA HTML uses short names (intelligence_index, coding_index, math_index)
    const evaluations: Evaluations = {
      artificial_analysis_intelligence_index: extractJsonNum(html, "intelligence_index", "artificial_analysis_intelligence_index"),
      artificial_analysis_coding_index:       extractJsonNum(html, "coding_index", "artificial_analysis_coding_index"),
      artificial_analysis_math_index:         extractJsonNum(html, "math_index", "artificial_analysis_math_index"),
      mmlu_pro:          extractJsonNum(html, "mmlu_pro"),
      gpqa:              extractJsonNum(html, "gpqa"),
      hle:               extractJsonNum(html, "hle"),
      livecodebench:     extractJsonNum(html, "livecodebench"),
      scicode:           extractJsonNum(html, "scicode"),
      math_500:          extractJsonNum(html, "math_500"),
      aime:              extractJsonNum(html, "aime"),
      aime_25:           extractJsonNum(html, "aime_25"),
      ifbench:           extractJsonNum(html, "ifbench"),
      lcr:               extractJsonNum(html, "lcr"),
      terminalbench_hard: extractJsonNum(html, "terminalbench_hard"),
      tau2:              extractJsonNum(html, "tau2"),
    };

    // Performance
    const speed = extractJsonNum(html, "median_output_tokens_per_second");
    const ttft  = extractJsonNum(html, "median_time_to_first_token_seconds", "median_time_to_first_token");
    const ttfa  = extractJsonNum(html, "median_time_to_first_answer_token");

    // Capabilities (context window, parameters, modalities) — from scrapeAA
    const caps = await scrapeAA(slug);

    return {
      id: slug,
      name,
      slug,
      release_date: releaseDate,
      model_creator: { id: creatorSlug, name: creatorName, slug: creatorSlug },
      evaluations,
      pricing,
      median_output_tokens_per_second:    speed,
      median_time_to_first_token_seconds: ttft,
      median_time_to_first_answer_token:  ttfa,
      ...caps,
    };
  } catch {
    return null;
  }
}

// ─── AA page scraper ─────────────────────────────────────────────────────────

/**
 * Scrapes the Artificial Analysis website for data missing from the API:
 * parameters, open/closed weights, reasoning. / paramètres, poids, raisonnement.
 */
async function scrapeAA(slug: string): Promise<Partial<LLMModel>> {
  try {
    const res = await fetchWithTimeout(
      `https://artificialanalysis.ai/models/${slug}`,
      {
        headers: { "User-Agent": SCRAPE_USER_AGENT },
        cache: "no-store",
      },
      SCRAPE_FETCH_TIMEOUT_MS
    );
    if (!res.ok) return {};
    const html = await res.text();

    function extractBool(snakeKey: string, camelKey?: string): boolean | undefined {
      let m = html.match(new RegExp(`\\\\?"${snakeKey}\\\\?":(true|false)`));
      if (!m && camelKey) m = html.match(new RegExp(`\\\\?"${camelKey}\\\\?":(true|false)`));
      return m ? m[1] === "true" : undefined;
    }

    function extractContextWindow(): number | null {
      // JSON field (both naming conventions used by AA)
      let m = html.match(/"context_window_tokens":(\d+)/);
      if (m) return parseInt(m[1]);
      m = html.match(/"context_window":(\d+)/);
      if (m) return parseInt(m[1]);
      // Escaped JSON
      m = html.match(/\\"context_window_tokens\\":(\d+)/);
      if (m) return parseInt(m[1]);
      m = html.match(/\\"context_window\\":(\d+)/);
      if (m) return parseInt(m[1]);
      // Text patterns
      m = html.match(/context window of ([\d.]+)\s*M tokens/i);
      if (m) return Math.round(parseFloat(m[1]) * 1_000_000);
      m = html.match(/context window of ([\d,]+)\s*tokens/i);
      if (m) return parseInt(m[1].replace(/,/g, ""));
      m = html.match(/[Cc]ontext window[\s\S]{0,120}?([\d.]+)\s*([kKmM])\b/);
      if (m) {
        const mult = /[mM]/.test(m[2]) ? 1_000_000 : 1_000;
        return Math.round(parseFloat(m[1]) * mult);
      }
      return null;
    }

    function extractParamsB(label: string, jsonKey: string): number | null {
      let m = html.match(new RegExp(`\\\\?"${jsonKey}\\\\?":\\\\?"([\\d.]+)([BbMmKkT])`));
      if (!m) m = html.match(new RegExp(`${label}[\\s\\S]{0,200}?([\\d.]+)\\s*([BbMmKkT])\\b`));
      if (!m) return null;
      const val = parseFloat(m[1]);
      const unit = m[2].toUpperCase();
      if (unit === "T") return val * 1000;
      if (unit === "B") return val;
      if (unit === "M") return val / 1000;
      if (unit === "K") return val / 1_000_000;
      return null;
    }

    return {
      context_window_tokens: extractContextWindow(),
      total_parameters_b: extractParamsB("Total parameters", "totalParameters"),
      active_parameters_b: extractParamsB("Active parameters", "activeParameters"),
      reasoning_model: extractBool("reasoning_model", "isReasoning"),
      reasoning_properties: null,
      is_open_weights: extractBool("is_open_weights", "isOpenWeights"),
      input_modality_text: extractBool("input_modality_text", "inputModalityText"),
      input_modality_image: extractBool("input_modality_image", "inputModalityImage"),
      input_modality_speech: extractBool("input_modality_speech", "inputModalitySpeech"),
      input_modality_video: extractBool("input_modality_video", "inputModalityVideo"),
      output_modality_text: extractBool("output_modality_text", "outputModalityText"),
      output_modality_image: extractBool("output_modality_image", "outputModalityImage"),
      output_modality_speech: extractBool("output_modality_speech", "outputModalitySpeech"),
      output_modality_video: extractBool("output_modality_video", "outputModalityVideo"),
    };
  } catch {
    return {};
  }
}

/**
 * Returns model capabilities by merging two sources:
 * - OpenRouter API   → context, modalities (structured, reliable) / structuré, fiable
 * - AA HTML scraping → parameters, weights, reasoning (AA only) / uniquement sur AA
 *
 * OR takes priority for context & modalities; AA for the rest. Cached 24h.
 */
const scrapeModelCapabilities = unstable_cache(
  async (slug: string): Promise<Partial<LLMModel>> => {
    const [aa, orModels] = await Promise.all([
      scrapeAA(slug),
      getOpenRouterModels(),
    ]);

    const or = (() => {
      const match = findOrModel(slug, orModels);
      return match ? orCapabilities(match) : {};
    })();

    return {
      total_parameters_b:   aa.total_parameters_b,
      active_parameters_b:  aa.active_parameters_b,
      reasoning_properties: aa.reasoning_properties ?? null,
      is_open_weights:      aa.is_open_weights,
      reasoning_model:   or.reasoning_model   ?? aa.reasoning_model,
      context_window_tokens:  or.context_window_tokens  ?? aa.context_window_tokens,
      input_modality_text:    or.input_modality_text    ?? aa.input_modality_text,
      input_modality_image:   or.input_modality_image   ?? aa.input_modality_image,
      input_modality_speech:  or.input_modality_speech  ?? aa.input_modality_speech,
      input_modality_video:   or.input_modality_video   ?? aa.input_modality_video,
      output_modality_text:   or.output_modality_text   ?? aa.output_modality_text,
      output_modality_image:  or.output_modality_image  ?? aa.output_modality_image,
      output_modality_speech: or.output_modality_speech ?? aa.output_modality_speech,
      output_modality_video:  or.output_modality_video  ?? aa.output_modality_video,
    };
  },
  ["aa-model-caps"],
  { revalidate: 86400 }
);

export const getLLMModels = unstable_cache(
  async (): Promise<LLMModel[]> => {
    // Fetch API models and the authoritative sitemap slugs in parallel
    const [apiModels, validSlugs] = await Promise.all([
      apiFetch<LLMModel[]>("/data/llms/models"),
      scrapeAllModelSlugs(),
    ]);

    // If the sitemap is unavailable, fall back to raw API results
    if (validSlugs.length === 0) return apiModels;

    const validSlugSet = new Set(validSlugs);

    // Filter the API: remove "fake" meta-models that aren't real individual models
    const realApiModels = apiModels.filter((m) => validSlugSet.has(m.slug));

    // Find slugs on the AA website but absent from their API → build partial models
    const apiSlugSet = new Set(realApiModels.map((m) => m.slug));
    const missingSlugs = validSlugs.filter((s) => !apiSlugSet.has(s));

    if (missingSlugs.length === 0) return realApiModels;

    // Build partial models for missing slugs in small chunks to avoid Worker timeouts.
    const extraModels: LLMModel[] = [];
    for (let i = 0; i < missingSlugs.length; i += PARTIAL_MODEL_CHUNK_SIZE) {
      const chunk = missingSlugs.slice(i, i + PARTIAL_MODEL_CHUNK_SIZE);
      const settled = await Promise.allSettled(chunk.map(buildPartialModel));
      for (const r of settled) {
        if (r.status === "fulfilled" && r.value) extraModels.push(r.value);
      }
    }

    return [...realApiModels, ...extraModels];
  },
  ["llm-models"],
  { revalidate: 86400, tags: ["llm-models"] }
);

export { scrapeModelCapabilities };

export async function getLLMModelBasic(slug: string): Promise<LLMModel | undefined> {
  const models = await getLLMModels();
  return models.find((m) => m.slug === slug);
}

/** Enriches models in parallel (chunked to avoid flooding). / Par chunks pour éviter le flood. */
async function chunkedScrape(
  models: LLMModel[],
  chunkSize = CAPABILITY_CHUNK_SIZE
): Promise<Partial<LLMModel>[]> {
  const results: Partial<LLMModel>[] = [];
  for (let i = 0; i < models.length; i += chunkSize) {
    const chunk = models.slice(i, i + chunkSize);
    const settled = await Promise.allSettled(chunk.map((m) => scrapeModelCapabilities(m.slug)));
    results.push(...settled.map((r) => (r.status === "fulfilled" ? r.value : {})));
  }
  return results;
}

/**
 * Module-level cache for development. / Cache module-level pour le développement.
 * In dev, Turbopack resets 'use cache' on each recompile.
 * This Map persists in Node.js memory across navigations → single scrape per session.
 */
const _devCache = new Map<string, Partial<LLMModel>>();

/**
 * Returns all models enriched with context window, modalities, reasoning…
 * Production: 'use cache' caches the combined result for 1h.
 * Dev: _devCache avoids re-scraping on each Turbopack recompile. / évite de re-scraper.
 */
export async function getLLMModelsWithContext(): Promise<LLMModel[]> {
  const models = await getLLMModels();

  if (process.env.NODE_ENV === "development") {
    const uncached = models.filter((m) => !_devCache.has(m.slug));
    if (uncached.length > 0) {
      const caps = await chunkedScrape(uncached);
      uncached.forEach((m, i) => _devCache.set(m.slug, caps[i]));
    }
    return models.map((m) => ({ ...m, ..._devCache.get(m.slug) }));
  }

  const capabilities = await chunkedScrape(models);
  return models.map((model, i) => ({ ...model, ...capabilities[i] }));
}

/** Returns a model enriched with website data (context window, modalities…). / Retourne un modèle enrichi. */
export async function getLLMModel(slug: string): Promise<LLMModel | undefined> {
  const [models, supplementary] = await Promise.all([
    getLLMModels(),
    scrapeModelCapabilities(slug),
  ]);
  const model = models.find((m) => m.slug === slug);
  if (!model) return undefined;
  return { ...model, ...supplementary };
}
