import type { LLMModel } from "@/lib/api";

const OR_BASE = "https://openrouter.ai/api/v1";
const OPENROUTER_RANKINGS_PAGE = "https://openrouter.ai/rankings";
const OPENROUTER_APP_REFERER = "https://nxtaicard.nxtaigen.com";
const OPENROUTER_APP_TITLE = "NxtAICard";

const MODEL_RANKINGS_ACTION_ID = "40824635c5eb77626bdf6795ffbf382c0862b321e1";
const DA_BENCHMARK_RANKINGS_ACTION_ID = "00f63ea3aac04d141ad7cda1cbafdc6bb12dc75b45";

const OPENROUTER_ACTION_TIMEOUT_MS = 8_000;
const OPENROUTER_API_TIMEOUT_MS = 8_000;

export interface OpenRouterModel {
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

interface OpenRouterRankingRow {
  model_permaslug?: string;
  variant?: string;
  variant_permaslug?: string;
  total_completion_tokens?: number;
  total_prompt_tokens?: number;
  total_native_tokens_reasoning?: number;
  total_native_tokens_cached?: number;
  total_tool_calls?: number;
  num_media_prompt?: number;
  num_media_completion?: number;
  num_audio_prompt?: number;
  count?: number;
  change?: number | null;
}

interface OpenRouterDABenchmarkRow {
  permaslug?: string;
  openrouter_id?: string | null;
  display_name?: string;
  score?: number | null;
  win_rate?: number | null;
  avg_generation_time_ms?: number | null;
}

interface OpenRouterEnrichmentOptions {
  apiKey?: string;
  includeUsageRankings?: boolean;
  includeBenchmarks?: boolean;
}

function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs = OPENROUTER_API_TIMEOUT_MS,
): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(timeoutMs),
  });
}

function openRouterHeaders(apiKey?: string): HeadersInit {
  return {
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    "HTTP-Referer": OPENROUTER_APP_REFERER,
    "X-OpenRouter-Title": OPENROUTER_APP_TITLE,
  };
}

export async function getOpenRouterModels(
  options: { apiKey?: string } = {},
): Promise<OpenRouterModel[]> {
  try {
    const res = await fetchWithTimeout(`${OR_BASE}/models`, {
      headers: openRouterHeaders(options.apiKey),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: OpenRouterModel[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

/** Finds the OR model matching an AA slug via multiple strategies. */
export function findOpenRouterModel(
  aaSlug: string,
  orModels: OpenRouterModel[],
): OpenRouterModel | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[\s_.]/g, "-");
  const ns = norm(aaSlug);
  let m = orModels.find((o) => norm(o.canonical_slug) === ns);
  if (m) return m;
  m = orModels.find((o) => norm(o.id.split("/").pop() ?? "") === ns);
  if (m) return m;
  return orModels.find((o) => {
    const c = norm(o.canonical_slug);
    const s = norm(o.id.split("/").pop() ?? "");
    return c.includes(ns) || ns.includes(c) || s.includes(ns) || ns.includes(s);
  });
}

/** Converts an OR model to our capabilities format. */
export function openRouterCapabilities(or: OpenRouterModel): Partial<LLMModel> {
  const inp = or.architecture?.input_modalities ?? [];
  const out = or.architecture?.output_modalities ?? [];
  const params = or.supported_parameters ?? [];
  const has = (arr: string[], ...keys: string[]) =>
    keys.some((k) => arr.includes(k)) ? true : undefined;
  return {
    context_window_tokens: or.context_length || or.top_provider?.context_length || null,
    reasoning_model: params.includes("reasoning") || params.includes("include_reasoning")
      ? true
      : undefined,
    input_modality_text: has(inp, "text"),
    input_modality_image: has(inp, "image"),
    input_modality_speech: has(inp, "audio"),
    input_modality_video: has(inp, "video"),
    output_modality_text: has(out, "text"),
    output_modality_image: has(out, "image"),
    output_modality_speech: has(out, "audio"),
    output_modality_video: has(out, "video"),
  };
}

async function callOpenRouterRankingsAction<T>(
  actionId: string,
  body: string,
): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(
      OPENROUTER_RANKINGS_PAGE,
      {
        method: "POST",
        headers: {
          "Accept": "text/x-component",
          "Content-Type": "text/plain;charset=UTF-8",
          "Next-Action": actionId,
        },
        body,
      },
      OPENROUTER_ACTION_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    const text = await res.text();
    const payload = text.match(/^1:(.*)$/m)?.[1];
    if (!payload) return null;
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

async function getOpenRouterUsageRankings(): Promise<OpenRouterRankingRow[]> {
  return (
    (await callOpenRouterRankingsAction<OpenRouterRankingRow[]>(
      MODEL_RANKINGS_ACTION_ID,
      JSON.stringify(["week"]),
    )) ?? []
  );
}

async function getOpenRouterDABenchmarkRankings(): Promise<Record<string, OpenRouterDABenchmarkRow[]>> {
  return (
    (await callOpenRouterRankingsAction<Record<string, OpenRouterDABenchmarkRow[]>>(
      DA_BENCHMARK_RANKINGS_ACTION_ID,
      "[]",
    )) ?? {}
  );
}

function normaliseId(id: string | null | undefined): string | null {
  if (!id) return null;
  return id
    .toLowerCase()
    .replace(/:free$/, "")
    .replace(/[\s_]/g, "-");
}

function stripDateSuffix(id: string): string {
  return id.replace(/-\d{8}$/, "");
}

function idCandidates(id: string | null | undefined): string[] {
  const norm = normaliseId(id);
  if (!norm) return [];
  const suffix = norm.split("/").pop() ?? norm;
  return [...new Set([norm, suffix, stripDateSuffix(norm), stripDateSuffix(suffix)])];
}

function modelCandidates(model: LLMModel, orModel?: OpenRouterModel): Set<string> {
  return new Set([
    ...idCandidates(model.slug),
    ...idCandidates(`${model.model_creator.slug}/${model.slug}`),
    ...idCandidates(orModel?.id),
    ...idCandidates(orModel?.canonical_slug),
  ]);
}

function rowCandidates(row: OpenRouterDABenchmarkRow | OpenRouterRankingRow): Set<string> {
  return new Set([
    ...idCandidates("permaslug" in row ? row.permaslug : undefined),
    ...idCandidates("openrouter_id" in row ? row.openrouter_id : undefined),
    ...idCandidates("model_permaslug" in row ? row.model_permaslug : undefined),
    ...idCandidates("variant_permaslug" in row ? row.variant_permaslug : undefined),
  ]);
}

function matchesModel(
  modelIds: Set<string>,
  row: OpenRouterDABenchmarkRow | OpenRouterRankingRow,
): boolean {
  for (const candidate of rowCandidates(row)) {
    if (modelIds.has(candidate)) return true;
  }
  return false;
}

function metricKey(category: string): string {
  return category.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

function mergeOpenRouterData(
  model: LLMModel,
  modelIds: Set<string>,
  usageRows: OpenRouterRankingRow[],
  daBenchmarks: Record<string, OpenRouterDABenchmarkRow[]>,
): LLMModel {
  const evaluations = { ...model.evaluations };

  for (const [category, rows] of Object.entries(daBenchmarks)) {
    if (!category.startsWith("models-")) continue;
    const row = rows.find((r) => typeof r.win_rate === "number" && matchesModel(modelIds, r));
    if (row?.win_rate != null) {
      evaluations[`openrouter_da_${metricKey(category.replace(/^models-/, ""))}_win_rate`] = row.win_rate;
    }
  }

  const usageRankings = usageRows.map((row, index) => ({
    row,
    rank: index + 1,
    tokens:
      (row.total_prompt_tokens ?? 0) +
      (row.total_completion_tokens ?? 0) +
      (row.total_native_tokens_reasoning ?? 0),
  }));
  const usage = usageRankings.find(({ row }) => matchesModel(modelIds, row));
  if (!usage) return { ...model, evaluations };

  return {
    ...model,
    evaluations,
    openrouter_weekly_rank: usage.rank,
    openrouter_weekly_tokens: usage.tokens,
    openrouter_weekly_requests: usage.row.count ?? null,
    openrouter_weekly_tool_calls: usage.row.total_tool_calls ?? null,
    openrouter_weekly_images:
      (usage.row.num_media_prompt ?? 0) + (usage.row.num_media_completion ?? 0),
    openrouter_weekly_audio_inputs: usage.row.num_audio_prompt ?? null,
    openrouter_variant: usage.row.variant ?? null,
  };
}

function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined && value !== null) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

export async function enrichModelsWithOpenRouter(
  models: LLMModel[],
  options: OpenRouterEnrichmentOptions = {},
): Promise<LLMModel[]> {
  const [orModels, usageRows, daBenchmarks] = await Promise.all([
    getOpenRouterModels({ apiKey: options.apiKey }),
    options.includeUsageRankings ? getOpenRouterUsageRankings() : Promise.resolve([]),
    options.includeBenchmarks !== false ? getOpenRouterDABenchmarkRankings() : Promise.resolve({}),
  ]);

  if (
    orModels.length === 0 &&
    usageRows.length === 0 &&
    Object.keys(daBenchmarks).length === 0
  ) {
    return models;
  }

  return models.map((model) => {
    const orModel = findOpenRouterModel(model.slug, orModels);
    const caps = orModel ? openRouterCapabilities(orModel) : {};
    const enriched = mergeDefined(model, caps);
    return mergeOpenRouterData(
      enriched,
      modelCandidates(model, orModel),
      usageRows,
      daBenchmarks,
    );
  });
}
