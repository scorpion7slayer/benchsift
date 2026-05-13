import { unstable_cache } from "next/cache";
import { getCreatorDisplayName, resolveCreatorFromModelSlug } from "@/lib/provider-map";
import { readModelsCache, writeModelsCache, scheduleWriteModelsCache } from "@/lib/cron-cache";

const BASE_URL = "https://artificialanalysis.ai/api/v2";
const OR_BASE = "https://openrouter.ai/api/v1";
const API_FETCH_TIMEOUT_MS = 8_000;
const SCRAPE_FETCH_TIMEOUT_MS = 6_000;
const PARTIAL_MODEL_CHUNK_SIZE = 5;
const CAPABILITY_CHUNK_SIZE = 6;
const SCRAPE_USER_AGENT = "Mozilla/5.0 (compatible; NxtAICard/1.0; +https://nxtaicard.nxtaigen.com)";

/**
 * Cache TTLs by data volatility / TTL de cache par volatilité des données.
 *
 * Strategy: refresh fast-moving data hourly (new models, prices, perf metrics),
 * but cache slow-changing data longer (model capabilities, openness, knowledge cutoff).
 * Stratégie : données mouvantes 1h, capacités stables 24h.
 */
const CACHE_API_SECONDS = 3_600;             // 1h — AA API + OpenRouter (LLM list, prices, perf)
const CACHE_RSC_SECONDS = 21_600;            // 6h — AA RSC payload (coding agents leaderboard)
const CACHE_SCRAPE_SECONDS = 86_400;         // 24h — HTML scraping (params, modalities, cutoff…)

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
    process.env.ARTIFICIAL_ANALYSIS_FALLBACK_API_KEY_4,
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
      const json = (await res.json()) as { data?: OpenRouterModel[] };
      return json.data ?? [];
    } catch {
      return [];
    }
  },
  ["openrouter-models"],
  { revalidate: CACHE_API_SECONDS, tags: ["llm-models"] }
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
    // NOTE: OpenRouter reports "file" for PDF/document input on some models (e.g. GPT-5).
    // AA does not expose "file" as a distinct modality — we follow AA and ignore it.
    // AA ne distingue pas "file" comme modalité — on s'aligne sur AA.
    input_modality_text:    has(inp, "text"),
    input_modality_image:   has(inp, "image"),
    input_modality_speech:  has(inp, "audio"),
    input_modality_video:   has(inp, "video"),
    output_modality_text:   has(out, "text"),
    output_modality_image:  has(out, "image"),
    output_modality_speech: has(out, "audio"),
    output_modality_video:  has(out, "video"),
  };
}


export interface ModelCreator {
  id: string;
  name: string;
  slug: string;
}

export interface Evaluations {
  // AA composite indices — scale 0-100 / indices composites — échelle 0-100
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
  // Newer AA benchmarks / Benchmarks AA plus récents
  apex_agents?: number | null;          // APEX-Agents-AA (long-horizon agentic)
  omniscience_non_hallucination?: number | null; // AA-Omniscience non-hallucination rate
  // Catch-all for any other field returned by the API / pour tout autre champ
  [key: string]: number | null | undefined;
}

export interface Pricing {
  price_1m_blended_3_to_1: number | null;
  price_1m_input_tokens: number | null;
  price_1m_output_tokens: number | null;
  // New AA fields / Nouveaux champs AA
  price_1m_cache_hit_tokens?: number | null;       // cache hit price
  price_1m_blended_7_2_1?: number | null;          // blended cache:input:output 7:2:1
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
  // End-to-end latency for 500-token response (seconds) / latence bout en bout pour 500 tokens
  end_to_end_response_time_seconds?: number | null;
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
  // New scraped fields from AA model detail page / Nouveaux champs scrapés
  knowledge_cutoff?: string | null;            // ISO date string (e.g. "2024-09-30") / date ISO
  openness_index?: number | null;              // 0-100 scale / échelle 0-100
  intelligence_index_tokens?: number | null;   // tokens used to run AA Intelligence Index (verbosity)
  intelligence_index_cost_usd?: number | null; // USD cost to run AA Intelligence Index
}

let lastSuccessfulModels: LLMModel[] | null = null;

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
  "multimodal",
  "caching", "recommend",
  "leaderboard", "ranking", "benchmark",
]);

function isSafeModelSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{1,119}$/.test(slug) && !SITEMAP_EXCLUDED_SLUGS.has(slug);
}

function aaModelPageUrl(slug: string): string {
  return `https://artificialanalysis.ai/models/${encodeURIComponent(slug)}`;
}

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
async function buildPartialModel(slug: string, includeCapabilities = true): Promise<LLMModel | null> {
  try {
    if (!isSafeModelSlug(slug)) return null;
    const res = await fetchWithTimeout(
      aaModelPageUrl(slug),
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
      extractJsonStr(html, "model_name", "modelName", "short_name") ??
      html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/)?.[1]?.trim() ??
      html.match(/<title>\s*([^<-]+?)\s*-/)?.[1]?.trim() ??
      slugToName(slug);

    // Release date
    const releaseDate =
      html.match(/"release_date"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)
        ?.[1] ??
      html.match(/\\"release_date\\"\s*:\s*\\"(\d{4}-\d{2}-\d{2})\\"/)
        ?.[1] ??
      null;

    // Pricing — AA uses both "price_1m_blended_0_3_1" (legacy) and "price_1m_blended_7_2_1" (new)
    const pricing: Pricing = {
      price_1m_blended_3_to_1: extractJsonNum(
        html,
        "price_1m_blended_3_to_1",
        "price_1m_blended_0_3_1"
      ),
      price_1m_input_tokens:   extractJsonNum(html, "price_1m_input_tokens"),
      price_1m_output_tokens:  extractJsonNum(html, "price_1m_output_tokens"),
      // AA's real field name is "cache_hit_price" (without "price_1m" prefix)
      price_1m_cache_hit_tokens: extractJsonNum(html, "cache_hit_price"),
      price_1m_blended_7_2_1: extractJsonNum(html, "price_1m_blended_7_2_1"),
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
      apex_agents:       extractJsonNum(html, "apex_agents"),
      // AA exposes non_hallucination_rate inside omniscience_breakdown totals.
      // The aggregated value also appears as a top-level "non_hallucination_rate" when
      // the breakdown is summarized. / Sinon dans omniscience_breakdown.
      omniscience_non_hallucination: extractJsonNum(html, "non_hallucination_rate"),
    };

    // Performance
    const speed = extractJsonNum(html, "median_output_tokens_per_second", "median_output_speed");
    const ttft  = extractJsonNum(
      html,
      "median_time_to_first_token_seconds",
      "median_time_to_first_token",
      "median_time_to_first_chunk"
    );
    const ttfa  = extractJsonNum(html, "median_time_to_first_answer_token");
    const e2e   = extractJsonNum(
      html,
      "median_end_to_end_response_time_seconds",
      "end_to_end_response_time_seconds",
      "median_end_to_end_response_time",
      "end_to_end_response_time"
    );

    // Capabilities (context window, parameters, modalities) — from scrapeAA
    const caps = includeCapabilities ? await scrapeAA(slug) : {};

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
      end_to_end_response_time_seconds:   e2e,
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
    if (!isSafeModelSlug(slug)) return {};
    const res = await fetchWithTimeout(
      aaModelPageUrl(slug),
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

    // Knowledge cutoff — AA's real field is "knowledge_cutoff_date" (ISO)
    function extractKnowledgeCutoff(): string | null {
      const iso =
        html.match(/\\?"knowledge_cutoff_date\\?"\s*:\s*\\?"(\d{4}-\d{2}-\d{2})\\?"/)?.[1] ??
        html.match(/\\?"knowledge_cutoff\\?"\s*:\s*\\?"(\d{4}-\d{2}-\d{2})\\?"/)?.[1];
      if (iso) return iso;
      const txt = html.match(/[Kk]nowledge cutoff[^\d<]{0,30}((?:[A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})|(?:[A-Z][a-z]{2,8}\s+\d{4}))/)?.[1];
      return txt ? txt.trim() : null;
    }

    // Openness index — AA exposes "openness":{ … "opennessIndex": <number> … }
    function extractOpenness(): number | null {
      // Match "openness":{ … "opennessIndex": <number> } — non-greedy across the object
      const m = html.match(/\\?"openness\\?"\s*:\s*\{[\s\S]{0,800}?\\?"opennessIndex\\?"\s*:\s*([\d.-]+)/);
      if (m) return parseFloat(m[1]);
      return extractJsonNum(html, "openness_index", "openness_score");
    }

    // Intelligence Index output tokens (verbosity).
    // AA exposes "intelligence_index_token_counts":{"input_tokens":…, "answer_tokens":…, "output_tokens":…, "reasoning_tokens":…}
    function extractIIITokens(): number | null {
      const m = html.match(/\\?"intelligence_index_token_counts\\?"\s*:\s*\{[\s\S]{0,400}?\\?"output_tokens\\?"\s*:\s*(\d+)/);
      if (m) return parseInt(m[1], 10);
      // "When evaluating the Intelligence Index, it generated 76M tokens"
      const txt = html.match(/Intelligence Index[\s\S]{0,80}?generated\s+([\d.]+)\s*([MK])\b/i);
      if (txt) {
        const mult = txt[2].toUpperCase() === "M" ? 1_000_000 : 1_000;
        return Math.round(parseFloat(txt[1]) * mult);
      }
      return null;
    }

    // Intelligence Index cost — AA exposes "intelligence_index_cost":{"total_cost":<number>, …}
    function extractIICost(): number | null {
      const m = html.match(/\\?"intelligence_index_cost\\?"\s*:\s*\{[\s\S]{0,300}?\\?"total_cost\\?"\s*:\s*([\d.]+)/);
      if (m) return parseFloat(m[1]);
      // "it cost $910.37 to evaluate"
      const txt = html.match(/it cost\s+\$([\d,]+(?:\.\d+)?)\s+to evaluate/i);
      if (txt) return parseFloat(txt[1].replace(/,/g, ""));
      return null;
    }

    // End-to-end response time — AA exposes "end_to_end_response_time_metrics":{"total_time":<number>, …}
    function extractEndToEnd(): number | null {
      const m = html.match(/\\?"end_to_end_response_time_metrics\\?"\s*:\s*\{[\s\S]{0,500}?\\?"total_time\\?"\s*:\s*([\d.]+)/);
      if (m) {
        const v = parseFloat(m[1]);
        return v > 0 ? v : null;  // AA returns 0 for not-yet-benchmarked models
      }
      return extractJsonNum(
        html,
        "median_end_to_end_response_time_seconds",
        "end_to_end_response_time_seconds"
      );
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
      knowledge_cutoff: extractKnowledgeCutoff(),
      openness_index: extractOpenness(),
      intelligence_index_tokens: extractIIITokens(),
      intelligence_index_cost_usd: extractIICost(),
      end_to_end_response_time_seconds: extractEndToEnd(),
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
      knowledge_cutoff:           aa.knowledge_cutoff ?? null,
      openness_index:             aa.openness_index ?? null,
      intelligence_index_tokens:  aa.intelligence_index_tokens ?? null,
      intelligence_index_cost_usd: aa.intelligence_index_cost_usd ?? null,
      end_to_end_response_time_seconds: aa.end_to_end_response_time_seconds ?? null,
    };
  },
  ["aa-model-caps"],
  // Capabilities (params, modalities, openness, cutoff) change rarely → 24h cache.
  { revalidate: CACHE_SCRAPE_SECONDS, tags: ["llm-models"] }
);

/**
 * Minimal request-path fetch: AA API only — NO sitemap scrape, NO HTML regex.
 * The sitemap filter (which removes a handful of meta-models) is cosmetic and
 * runs in the cron instead. Keeping this path as light as possible so it fits
 * inside the Workers Free 10 ms CPU budget on cold-start.
 */
async function fetchLightModels(): Promise<LLMModel[]> {
  return apiFetch<LLMModel[]>("/data/llms/models");
}

/**
 * Full model list, including partial scrapes for slugs missing from the AA API.
 * CPU-heavy (regex on dozens of HTML pages) — only call from the Cron Trigger.
 */
export async function fetchModelsForCron(): Promise<LLMModel[]> {
  const [apiModels, validSlugs] = await Promise.all([
    apiFetch<LLMModel[]>("/data/llms/models"),
    scrapeAllModelSlugs(),
  ]);

  if (validSlugs.length === 0) return apiModels;

  const validSlugSet = new Set(validSlugs);
  const realApiModels = apiModels.filter((m) => validSlugSet.has(m.slug));

  const apiSlugSet = new Set(realApiModels.map((m) => m.slug));
  const missingSlugs = validSlugs.filter((s) => !apiSlugSet.has(s));

  if (missingSlugs.length === 0) return realApiModels;

  const extraModels: LLMModel[] = [];
  for (let i = 0; i < missingSlugs.length; i += PARTIAL_MODEL_CHUNK_SIZE) {
    const chunk = missingSlugs.slice(i, i + PARTIAL_MODEL_CHUNK_SIZE);
    const settled = await Promise.allSettled(chunk.map((slug) => buildPartialModel(slug)));
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) extraModels.push(r.value);
    }
  }

  return [...realApiModels, ...extraModels];
}

/**
 * Public entry point for cron: refreshes the KV cache and returns counts.
 * Called by `app/api/cron/refresh/route.ts`.
 */
export async function refreshModelsCache(): Promise<{ count: number }> {
  const models = await fetchModelsForCron();
  await writeModelsCache(models);
  if (models.length > 0) lastSuccessfulModels = models;
  return { count: models.length };
}

/**
 * Normalises the model_creator.name for products whose API name differs
 * from the canonical company name (e.g. AA returns "Kimi" but the actual
 * creator is Moonshot AI). The slug is kept intact for icon mapping.
 */
function normaliseCreatorNames(models: LLMModel[]): LLMModel[] {
  return models.map((m) => {
    const slug = m.model_creator.slug;
    const display = getCreatorDisplayName(slug, m.model_creator.name);
    if (display === m.model_creator.name) return m;
    return { ...m, model_creator: { ...m.model_creator, name: display } };
  });
}

/**
 * Reads the pre-computed KV cache populated by the Cron Trigger.
 * This is the fast path — zero CPU-heavy scraping, suitable for user requests
 * on the Workers Free 10 ms CPU budget.
 */
export async function getLLMModels(): Promise<LLMModel[]> {
  // 1. Fast path: KV cache filled by the cron.
  try {
    const cached = await readModelsCache();
    if (cached && cached.models.length > 0) {
      lastSuccessfulModels = cached.models;
      return normaliseCreatorNames(cached.models);
    }
  } catch {
    // Ignore KV failures and fall through to the light fetch.
  }

  // 2. Cold-start fallback: in-memory copy from a previous request.
  if (lastSuccessfulModels?.length) {
    return normaliseCreatorNames(lastSuccessfulModels);
  }

  // 3. Last resort: AA API only. No sitemap, no HTML scraping — minimal CPU.
  // Schedule a background KV write so subsequent cold-starts are instant.
  try {
    const models = await fetchLightModels();
    if (models.length > 0) {
      lastSuccessfulModels = models;
      scheduleWriteModelsCache(models);
      return normaliseCreatorNames(models);
    }
  } catch {
    // Swallow — falling through to public scrape would burn CPU and risk
    // a render-time crash. Better to return [] and let the UI show an
    // empty state; the next cron run will repopulate KV.
  }

  // No upstream succeeded. Returning [] keeps the page renderable
  // (empty list) instead of throwing from getLLMModels and triggering
  // error.tsx, which would consume CPU rendering hundreds of error UIs.
  return [];
}

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
  if (!isSafeModelSlug(slug)) return undefined;
  const models = await getLLMModels();
  const model = models.find((m) => m.slug === slug);
  if (!model) return undefined;
  const supplementary = await scrapeModelCapabilities(model.slug);
  return { ...model, ...supplementary };
}

// ─── Coding Agents (AA Coding Agent Index) ─────────────────────────────────
// AA's coding-agents page tracks how harnesses (Claude Code, Cursor CLI, OpenCode…)
// perform with specific underlying models on a 3-benchmark composite index.
// La page coding-agents d'AA mesure comment chaque harnais (Claude Code, Cursor CLI…)
// performe avec un modèle donné sur 3 benchmarks composites.

export interface CodingAgent {
  id: string;                              // unique row id from AA
  agent_name: string;                      // harness name (Claude Code, Cursor CLI…)
  agent_slug: string;                      // harness slug for icon lookup
  display_label: string;                   // "Claude Code - Opus 4.7 (Medium)"
  model_name: string;                      // underlying model name (full)
  model_short: string;                     // shorter display name
  model_slug: string;                      // underlying model slug
  model_creator_slug: string;              // for provider icon
  release_date: string | null;             // ISO date
  coding_agent_index: number | null;       // composite 0-100 (× 100 from raw 0-1)
  swe_bench_pro_hard_aa: number | null;    // pass@1 (0-1)
  terminal_bench_v2: number | null;        // pass@1 (0-1)
  swe_atlas_qna: number | null;            // pass@1 (0-1)
  cost_per_task_usd: number | null;        // USD per task
  time_per_task_seconds: number | null;    // wall time per task
  input_tokens_per_task: number | null;
  cached_input_tokens_per_task: number | null;
  output_tokens_per_task: number | null;
  total_tokens_per_task: number | null;
  cache_hit_rate: number | null;           // 0-1
  steps_per_task: number | null;
}

/**
 * Known coding-agent harnesses with their @lobehub/icons keys.
 * Harnais connus avec leurs clés d'icônes @lobehub/icons.
 */
export const CODING_AGENT_HARNESSES: Record<string, { name: string; icon: string }> = {
  "claude-code":   { name: "Claude Code",   icon: "claudecode" },
  "cursor-cli":    { name: "Cursor CLI",    icon: "cursor" },
  "cursor":        { name: "Cursor",        icon: "cursor" },
  "opencode":      { name: "OpenCode",      icon: "opencode" },
  "codex":         { name: "Codex CLI",     icon: "codex" },
  "codex-cli":     { name: "Codex CLI",     icon: "codex" },
  "openhands":     { name: "OpenHands",     icon: "openhands" },
  "cline":         { name: "Cline",         icon: "cline" },
  "amp":           { name: "Amp",           icon: "amp" },
  "antigravity":   { name: "Antigravity",   icon: "antigravity" },
  "junie":         { name: "Junie",         icon: "junie" },
  "trae":          { name: "Trae",          icon: "trae" },
  "windsurf":      { name: "Windsurf",      icon: "windsurf" },
  "github-copilot": { name: "GitHub Copilot", icon: "githubcopilot" },
  "copilot":       { name: "Copilot",       icon: "copilot" },
  "gemini-cli":    { name: "Gemini CLI",    icon: "geminicli" },
  "kilo-code":     { name: "KiloCode",      icon: "kilocode" },
  "roo-code":      { name: "RooCode",       icon: "roocode" },
};

const AA_AGENTS_PAGE = "https://artificialanalysis.ai/agents/coding-agents";

interface AAAgentRow {
  id?: string;
  agentName?: string;
  provider?: string;
  hostModelSlug?: string;
  display?: { agent?: string; model?: string };
  displayLabel?: string;
  releaseDate?: string;
  hostName?: string;
  hostShortName?: string;
  modelName?: string;
  indexScore?: number;
  mean?: {
    reward?: number;
    costUsd?: number;
    agentWallTimeSec?: number;
    steps?: number;
    inputTokens?: number;
    outputTokens?: number;
    cacheTokens?: number;
    cacheHitRate?: number;
    totalTokens?: number;
  };
  componentScores?: Array<{
    datasetIndexName?: string;
    mean?: { reward?: number };
  }>;
}

/**
 * Extracts the agent rows array from AA's RSC payload.
 * AA's /agents/coding-agents is client-rendered, but Next.js exposes the data
 * via the React Server Components (RSC) payload when the "RSC: 1" header is set.
 * We balance-parse the "rows":[...] array to get the leaderboard.
 * Le payload RSC est récupéré via le header "RSC: 1" sur la page Next.js.
 */
function extractRowsFromRSC(payload: string): AAAgentRow[] | null {
  const key = '"rows":[';
  const start = payload.indexOf(key);
  if (start < 0) return null;

  // Walk balanced brackets from inside the array opener
  let i = start + key.length;
  let depth = 1;
  let inStr = false;
  let esc = false;
  const maxLen = payload.length;
  while (i < maxLen && depth > 0) {
    const c = payload[i];
    if (esc) esc = false;
    else if (c === "\\") esc = true;
    else if (c === '"') inStr = !inStr;
    else if (!inStr) {
      if (c === "[" || c === "{") depth++;
      else if (c === "]" || c === "}") depth--;
    }
    i++;
  }
  if (depth !== 0) return null;
  const arrText = payload.slice(start + key.length - 1, i);
  try {
    return JSON.parse(arrText) as AAAgentRow[];
  } catch {
    return null;
  }
}

/** Slug-ify the harness name to match HARNESS keys / icons. */
function harnessSlug(agentName: string): string {
  return agentName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Fetches the AA coding-agents leaderboard via Next.js RSC payload.
 * Cached 24h to avoid hammering AA's frontend.
 * Mise en cache 24h pour ne pas surcharger AA.
 */
const getCodingAgentsCached = unstable_cache(
  async (): Promise<CodingAgent[]> => {
    try {
      const res = await fetchWithTimeout(
        AA_AGENTS_PAGE,
        {
          headers: {
            "User-Agent": SCRAPE_USER_AGENT,
            "RSC": "1",
            "Next-Router-Prefetch": "1",
            "Accept": "text/x-component, */*",
          },
        },
        SCRAPE_FETCH_TIMEOUT_MS
      );
      if (!res.ok) return [];
      const payload = await res.text();

      const rows = extractRowsFromRSC(payload);
      if (!rows) return [];

      const componentScore = (row: AAAgentRow, name: string): number | null => {
        const c = row.componentScores?.find((x) => x.datasetIndexName === name);
        return c?.mean?.reward ?? null;
      };

      return rows
        .map((row, i): CodingAgent | null => {
          const agentName = row.agentName ?? row.display?.agent ?? "";
          if (!agentName) return null;
          const slug = harnessSlug(agentName);
          const mean = row.mean ?? {};
          // hostModelSlug looks like "anthropic_claude-opus-4-6" — extract host + model id.
          // Then resolve the *real* creator from the model id, because the host is
          // sometimes a routing provider (friendliai for GLM, cursor for its own models…)
          // rather than the actual creator.
          const hostSlug = row.hostModelSlug ?? "";
          const [hostRaw, ...modelRest] = hostSlug.split("_");
          const modelSlug = modelRest.join("_") || hostSlug;
          const hostSlugLower = (hostRaw || row.provider || "").toLowerCase();
          const creatorSlug = resolveCreatorFromModelSlug(modelSlug, hostSlugLower);
          return {
            id: row.id ?? `${slug}-${i}`,
            agent_name: agentName,
            agent_slug: slug,
            display_label: row.displayLabel ?? `${agentName} - ${row.modelName ?? ""}`,
            model_name: row.modelName ?? row.display?.model ?? modelSlug,
            model_short: row.display?.model ?? row.modelName ?? "",
            model_slug: modelSlug,
            model_creator_slug: creatorSlug,
            release_date: row.releaseDate ?? null,
            // Convert 0-1 index to 0-100 for display consistency with LLM indices
            coding_agent_index: typeof row.indexScore === "number" ? row.indexScore * 100 : null,
            swe_bench_pro_hard_aa: componentScore(row, "swe-bench-pro-hard"),
            terminal_bench_v2:    componentScore(row, "terminal-bench-v2"),
            swe_atlas_qna:        componentScore(row, "swe-atlas-qna"),
            cost_per_task_usd:    mean.costUsd ?? null,
            time_per_task_seconds: mean.agentWallTimeSec ?? null,
            input_tokens_per_task:        mean.inputTokens ?? null,
            cached_input_tokens_per_task: mean.cacheTokens ?? null,
            output_tokens_per_task:       mean.outputTokens ?? null,
            total_tokens_per_task:        mean.totalTokens ?? null,
            cache_hit_rate:               mean.cacheHitRate ?? null,
            steps_per_task:               mean.steps ?? null,
          };
        })
        .filter((x): x is CodingAgent => x !== null);
    } catch {
      return [];
    }
  },
  ["aa-coding-agents"],
  // RSC payload is bigger; refresh every 6h — leaderboard changes rarely.
  { revalidate: CACHE_RSC_SECONDS, tags: ["aa-coding-agents"] }
);

export async function getCodingAgents(): Promise<CodingAgent[]> {
  return getCodingAgentsCached();
}
