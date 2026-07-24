import * as cheerio from "cheerio/slim";

export interface AAHtmlDocument {
  structuredSources: string[];
  visibleText: string;
  metaDescription: string | null;
  title: string | null;
  heading: string | null;
}

type AAHtmlInput = string | AAHtmlDocument;

function normaliseVisibleText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Parses the stable HTML structure once, then isolates embedded scripts from
 * visible copy. Raw HTML remains the final fallback for historical RSC shapes.
 */
export function parseAAHtmlDocument(html: string): AAHtmlDocument {
  const $ = cheerio.load(html);
  const scripts = $("script")
    .toArray()
    .map((element) => $(element).text().trim())
    .filter(Boolean);
  const body = $("body").first();
  let visibleText: string;
  if (body.length > 0) {
    const innerText = body.prop("innerText");
    const preferredText =
      typeof innerText === "string" ? normaliseVisibleText(innerText) : "";
    visibleText = preferredText || normaliseVisibleText(body.text());
  } else {
    visibleText = normaliseVisibleText($.root().text());
  }
  const clean = (value: string): string | null => {
    const normalised = normaliseVisibleText(value);
    return normalised || null;
  };

  return {
    structuredSources: scripts.length > 0 ? [...scripts, html] : [html],
    visibleText,
    metaDescription: clean(
      $('meta[name="description"]').first().attr("content") ?? "",
    ),
    title: clean($("title").first().text()),
    heading: clean($("h1").first().text()),
  };
}

function structuredSources(input: AAHtmlInput): string[] {
  return typeof input === "string" ? [input] : input.structuredSources;
}

function visibleText(input: AAHtmlInput): string {
  return typeof input === "string" ? input : input.visibleText;
}

function firstStructuredMatch(
  input: AAHtmlInput,
  pattern: RegExp,
): RegExpMatchArray | null {
  for (const source of structuredSources(input)) {
    const match = source.match(pattern);
    if (match) return match;
  }
  return null;
}

function* findJsonValueStarts(
  html: string,
  key: string,
  escaped: boolean,
): Generator<number> {
  const marker = escaped ? `\\"${key}\\"` : `"${key}"`;
  let searchFrom = 0;

  while (searchFrom < html.length) {
    const markerIndex = html.indexOf(marker, searchFrom);
    if (markerIndex < 0) return;
    searchFrom = markerIndex + marker.length;

    let cursor = searchFrom;
    while (/\s/.test(html[cursor] ?? "")) cursor++;
    if (html[cursor] !== ":") continue;

    cursor++;
    while (/\s/.test(html[cursor] ?? "")) cursor++;
    yield cursor;
  }
}

/** Extracts a finite number from regular or backslash-escaped JSON in HTML. */
export function extractJsonNumber(input: AAHtmlInput, ...keys: string[]): number | null {
  for (const html of structuredSources(input)) {
    for (const key of keys) {
      for (const escaped of [false, true]) {
        for (const start of findJsonValueStarts(html, key, escaped)) {
          const match = html.slice(start, start + 64).match(/^(-?[\d.]+)/);
          if (!match) continue;

          const value = Number.parseFloat(match[1]);
          if (Number.isFinite(value)) return value;
        }
      }
    }
  }
  return null;
}

/** Extracts a string from regular or backslash-escaped JSON in HTML. */
export function extractJsonString(input: AAHtmlInput, ...keys: string[]): string | null {
  for (const html of structuredSources(input)) {
    for (const key of keys) {
      for (const escaped of [false, true]) {
        for (const start of findJsonValueStarts(html, key, escaped)) {
          const quote = escaped ? '\\"' : '"';
          if (!html.startsWith(quote, start)) continue;
          const valueStart = start + quote.length;
          const valueEnd = html.indexOf(quote, valueStart);
          if (valueEnd > valueStart) return html.slice(valueStart, valueEnd);
        }
      }
    }
  }
  return null;
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => {
      if (/^\d+$/.test(word)) return word;
      if (/^\d+[bBmMkKtT]$/.test(word)) {
        return word.slice(0, -1) + word.slice(-1).toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function extractModelCreator(input: AAHtmlInput, slug: string) {
  const structuredSlug =
    extractJsonString(input, "model_creator_slug", "creator_slug") ??
    firstStructuredMatch(
      input,
      /"model_creators?"\s*:\s*\{[^}]{0,300}"slug"\s*:\s*"([a-z0-9-]+)"/,
    )?.[1] ??
    firstStructuredMatch(
      input,
      /\\"model_creators?\\"\s*:\s*\{[^}]{0,300}\\"slug\\"\s*:\s*\\"([a-z0-9-]+)\\"/,
    )?.[1];
  const metaDescription =
    typeof input === "string" ? null : input.metaDescription;
  const metaCreatorName = metaDescription?.match(
    /Analysis of (.{1,80}?)(?:'s|’s)\b/i,
  )?.[1];
  const creatorSlug =
    structuredSlug ??
    metaCreatorName?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ??
    slug.split("-")[0];
  const creatorName =
    extractJsonString(input, "model_creator_name", "creator_name") ??
    firstStructuredMatch(
      input,
      /"model_creators?"\s*:\s*\{[^}]{0,300}"name"\s*:\s*"([^"]+)"/,
    )?.[1] ??
    firstStructuredMatch(
      input,
      /\\"model_creators?\\"\s*:\s*\{[^}]{0,300}\\"name\\"\s*:\s*\\"([^"\\]+)\\"/,
    )?.[1] ??
    metaCreatorName ??
    creatorSlug.charAt(0).toUpperCase() + creatorSlug.slice(1);

  return { id: creatorSlug, name: creatorName, slug: creatorSlug };
}

function extractModelName(input: AAHtmlInput, slug: string): string {
  const heading = typeof input === "string" ? null : input.heading;
  const title = typeof input === "string" ? null : input.title;
  const cleanHeading = heading
    ?.replace(/\s+Intelligence,\s*Performance\s*&\s*Price Analysis$/i, "")
    .trim();
  return (
    extractJsonString(input, "model_name", "modelName", "short_name") ??
    cleanHeading ??
    title?.split(/\s+-\s+/)[0]?.trim() ??
    slugToName(slug)
  );
}

function extractReleaseDate(input: AAHtmlInput): string | null {
  const value = extractJsonString(input, "release_date", "releaseDate");
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function extractPricing(input: AAHtmlInput) {
  return {
    price_1m_blended_3_to_1: extractJsonNumber(
      input,
      "price_1m_blended_3_to_1",
      "price_1m_blended_0_3_1",
    ),
    price_1m_input_tokens: extractJsonNumber(input, "price_1m_input_tokens"),
    price_1m_output_tokens: extractJsonNumber(input, "price_1m_output_tokens"),
    price_1m_cache_hit_tokens: extractJsonNumber(input, "cache_hit_price"),
    price_1m_blended_7_2_1: extractJsonNumber(
      input,
      "price_1m_blended_7_2_1",
    ),
  };
}

function extractEvaluations(input: AAHtmlInput) {
  return {
    artificial_analysis_intelligence_index: extractJsonNumber(
      input,
      "intelligence_index",
      "artificial_analysis_intelligence_index",
    ),
    artificial_analysis_coding_index: extractJsonNumber(
      input,
      "coding_index",
      "artificial_analysis_coding_index",
    ),
    artificial_analysis_math_index: extractJsonNumber(
      input,
      "math_index",
      "artificial_analysis_math_index",
    ),
    mmlu_pro: extractJsonNumber(input, "mmlu_pro"),
    gpqa: extractJsonNumber(input, "gpqa"),
    hle: extractJsonNumber(input, "hle"),
    livecodebench: extractJsonNumber(input, "livecodebench"),
    scicode: extractJsonNumber(input, "scicode"),
    math_500: extractJsonNumber(input, "math_500"),
    aime: extractJsonNumber(input, "aime"),
    aime_25: extractJsonNumber(input, "aime_25"),
    ifbench: extractJsonNumber(input, "ifbench"),
    lcr: extractJsonNumber(input, "lcr"),
    terminalbench_hard: extractJsonNumber(input, "terminalbench_hard"),
    terminalbench_v2_1: extractJsonNumber(input, "terminalbench_v2_1"),
    tau2: extractJsonNumber(input, "tau2"),
    tau_banking: extractJsonNumber(input, "tau_banking"),
    agentic_index: extractJsonNumber(input, "agentic_index"),
    gdpval: extractJsonNumber(input, "gdpval"),
    gdpval_normalized: extractJsonNumber(input, "gdpval_normalized"),
    omniscience: extractJsonNumber(input, "omniscience"),
    multilingual_aa: extractJsonNumber(input, "multilingual_aa"),
    mmmu_pro: extractJsonNumber(input, "mmmu_pro"),
    critpt: extractJsonNumber(input, "critpt"),
    apex_agents: extractJsonNumber(input, "apex_agents"),
    itbench_aa: extractJsonNumber(input, "itbench_aa"),
    omniscience_non_hallucination: extractJsonNumber(
      input,
      "non_hallucination_rate",
    ),
  };
}

function extractPerformance(input: AAHtmlInput) {
  return {
    median_output_tokens_per_second: extractJsonNumber(
      input,
      "median_output_tokens_per_second",
      "median_output_speed",
    ),
    median_time_to_first_token_seconds: extractJsonNumber(
      input,
      "median_time_to_first_token_seconds",
      "median_time_to_first_token",
      "median_time_to_first_chunk",
    ),
    median_time_to_first_answer_token: extractJsonNumber(
      input,
      "median_time_to_first_answer_token",
    ),
    end_to_end_response_time_seconds: extractJsonNumber(
      input,
      "median_end_to_end_response_time_seconds",
      "end_to_end_response_time_seconds",
      "median_end_to_end_response_time",
      "end_to_end_response_time",
    ),
  };
}

/** Parses the base model record embedded in an Artificial Analysis page. */
export function extractAAPartialModelData(input: AAHtmlInput, slug: string) {
  const document =
    typeof input === "string" ? parseAAHtmlDocument(input) : input;
  return {
    name: extractModelName(document, slug),
    release_date: extractReleaseDate(document),
    model_creator: extractModelCreator(document, slug),
    evaluations: extractEvaluations(document),
    pricing: extractPricing(document),
    ...extractPerformance(document),
  };
}

function extractJsonBoolean(
  input: AAHtmlInput,
  ...keys: string[]
): boolean | undefined {
  for (const html of structuredSources(input)) {
    for (const key of keys) {
      for (const escaped of [false, true]) {
        for (const start of findJsonValueStarts(html, key, escaped)) {
          if (html.startsWith("true", start)) return true;
          if (html.startsWith("false", start)) return false;
        }
      }
    }
  }
  return undefined;
}

function extractContextWindow(input: AAHtmlInput): number | null {
  const jsonValue = extractJsonNumber(
    input,
    "context_window_tokens",
    "context_window",
  );
  if (jsonValue !== null) return jsonValue;

  const text = visibleText(input);
  let match = text.match(/context window of ([\d.]+)\s*M tokens/i);
  if (match) return Math.round(Number.parseFloat(match[1]) * 1_000_000);

  match = text.match(/context window of ([\d,]+)\s*tokens/i);
  if (match) return Number.parseInt(match[1].replace(/,/g, ""), 10);

  match = text.match(/[Cc]ontext window[\s\S]{0,120}?([\d.]+)\s*([kKmM])\b/);
  if (!match) return null;

  const multiplier = /[mM]/.test(match[2]) ? 1_000_000 : 1_000;
  return Math.round(Number.parseFloat(match[1]) * multiplier);
}

function toBillions(value: number, unit: string): number | null {
  switch (unit.toUpperCase()) {
    case "T":
      return value * 1_000;
    case "B":
      return value;
    case "M":
      return value / 1_000;
    case "K":
      return value / 1_000_000;
    default:
      return null;
  }
}

function extractParameterBillions(
  input: AAHtmlInput,
  label: string,
  jsonKey: string,
): number | null {
  for (const html of structuredSources(input)) {
    for (const escaped of [false, true]) {
      for (const valueStart of findJsonValueStarts(html, jsonKey, escaped)) {
        const quote = escaped ? '\\"' : '"';
        if (!html.startsWith(quote, valueStart)) continue;
        const start = valueStart + quote.length;

        const match = html.slice(start, start + 64).match(/^([\d.]+)([BbMmKkT])/);
        if (match) return toBillions(Number.parseFloat(match[1]), match[2]);
      }
    }
  }

  const text = visibleText(input);
  const labelIndex = text.indexOf(label);
  if (labelIndex < 0) return null;
  const nearbyText = text.slice(labelIndex + label.length, labelIndex + label.length + 200);
  const match = nearbyText.match(/[\s\S]*?([\d.]+)\s*([BbMmKkT])\b/);
  return match ? toBillions(Number.parseFloat(match[1]), match[2]) : null;
}

function extractKnowledgeCutoff(input: AAHtmlInput): string | null {
  const iso = extractJsonString(
    input,
    "knowledge_cutoff_date",
    "knowledge_cutoff",
  );
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;

  const textPattern =
    /[Kk]nowledge cutoff[^\d]{0,30}((?:[A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})|(?:[A-Z][a-z]{2,8}\s+\d{4}))/;
  const text = visibleText(input).match(textPattern)?.[1];
  return text?.trim() ?? null;
}

function extractOpenness(input: AAHtmlInput): number | null {
  const match = firstStructuredMatch(
    input,
    /\\?"openness\\?"\s*:\s*\{[\s\S]{0,800}?\\?"opennessIndex\\?"\s*:\s*([\d.-]+)/,
  );
  return match
    ? Number.parseFloat(match[1])
    : extractJsonNumber(input, "openness_index", "openness_score");
}

function extractIntelligenceIndexTokens(input: AAHtmlInput): number | null {
  const jsonMatch = firstStructuredMatch(
    input,
    /\\?"intelligence_index_token_counts\\?"\s*:\s*\{[\s\S]{0,400}?\\?"output_tokens\\?"\s*:\s*(\d+)/,
  );
  if (jsonMatch) return Number.parseInt(jsonMatch[1], 10);

  const textMatch = visibleText(input).match(
    /Intelligence Index[\s\S]{0,80}?generated\s+([\d.]+)\s*([MK])\b/i,
  );
  if (!textMatch) return null;
  const multiplier = textMatch[2].toUpperCase() === "M" ? 1_000_000 : 1_000;
  return Math.round(Number.parseFloat(textMatch[1]) * multiplier);
}

function extractIntelligenceIndexCost(input: AAHtmlInput): number | null {
  const jsonMatch = firstStructuredMatch(
    input,
    /\\?"intelligence_index_cost\\?"\s*:\s*\{[\s\S]{0,300}?\\?"total_cost\\?"\s*:\s*([\d.]+)/,
  );
  if (jsonMatch) return Number.parseFloat(jsonMatch[1]);

  const textMatch = visibleText(input).match(
    /it cost\s+\$([\d,]+(?:\.\d+)?)\s+to evaluate/i,
  );
  return textMatch ? Number.parseFloat(textMatch[1].replace(/,/g, "")) : null;
}

function extractEndToEndResponseTime(input: AAHtmlInput): number | null {
  const match = firstStructuredMatch(
    input,
    /\\?"end_to_end_response_time_metrics\\?"\s*:\s*\{[\s\S]{0,500}?\\?"total_time\\?"\s*:\s*([\d.]+)/,
  );
  if (match) {
    const value = Number.parseFloat(match[1]);
    return value > 0 ? value : null;
  }
  return extractJsonNumber(
    input,
    "median_end_to_end_response_time_seconds",
    "end_to_end_response_time_seconds",
  );
}

/** Parses the capability fields embedded in an Artificial Analysis model page. */
export function extractAACapabilities(input: AAHtmlInput) {
  const document =
    typeof input === "string" ? parseAAHtmlDocument(input) : input;
  return {
    context_window_tokens: extractContextWindow(document),
    total_parameters_b: extractParameterBillions(
      document,
      "Total parameters",
      "totalParameters",
    ),
    active_parameters_b: extractParameterBillions(
      document,
      "Active parameters",
      "activeParameters",
    ),
    reasoning_model: extractJsonBoolean(document, "reasoning_model", "isReasoning"),
    reasoning_properties: null,
    is_open_weights: extractJsonBoolean(document, "is_open_weights", "isOpenWeights"),
    input_modality_text: extractJsonBoolean(
      document,
      "input_modality_text",
      "inputModalityText",
    ),
    input_modality_image: extractJsonBoolean(
      document,
      "input_modality_image",
      "inputModalityImage",
    ),
    input_modality_speech: extractJsonBoolean(
      document,
      "input_modality_speech",
      "inputModalitySpeech",
    ),
    input_modality_video: extractJsonBoolean(
      document,
      "input_modality_video",
      "inputModalityVideo",
    ),
    output_modality_text: extractJsonBoolean(
      document,
      "output_modality_text",
      "outputModalityText",
    ),
    output_modality_image: extractJsonBoolean(
      document,
      "output_modality_image",
      "outputModalityImage",
    ),
    output_modality_speech: extractJsonBoolean(
      document,
      "output_modality_speech",
      "outputModalitySpeech",
    ),
    output_modality_video: extractJsonBoolean(
      document,
      "output_modality_video",
      "outputModalityVideo",
    ),
    knowledge_cutoff: extractKnowledgeCutoff(document),
    openness_index: extractOpenness(document),
    intelligence_index_tokens: extractIntelligenceIndexTokens(document),
    intelligence_index_cost_usd: extractIntelligenceIndexCost(document),
    end_to_end_response_time_seconds: extractEndToEndResponseTime(document),
  };
}
