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
export function extractJsonNumber(html: string, ...keys: string[]): number | null {
  for (const key of keys) {
    for (const escaped of [false, true]) {
      for (const start of findJsonValueStarts(html, key, escaped)) {
        const match = html.slice(start, start + 64).match(/^([\d.]+)/);
        if (!match) continue;

        const value = Number.parseFloat(match[1]);
        if (Number.isFinite(value)) return value;
      }
    }
  }
  return null;
}

/** Extracts a string from regular or backslash-escaped JSON in HTML. */
export function extractJsonString(html: string, ...keys: string[]): string | null {
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

function extractModelCreator(html: string, slug: string) {
  const structuredSlug =
    extractJsonString(html, "model_creator_slug", "creator_slug") ??
    html.match(
      /"model_creators?"\s*:\s*\{[^}]{0,300}"slug"\s*:\s*"([a-z0-9-]+)"/,
    )?.[1] ??
    html.match(
      /\\"model_creators?\\"\s*:\s*\{[^}]{0,300}\\"slug\\"\s*:\s*\\"([a-z0-9-]+)\\"/,
    )?.[1];
  const metaCreatorName = html.match(
    /<meta\s+name="description"\s+content="Analysis of ([^"<&]{1,80})(?:&#x27;|&apos;|')s\b/i,
  )?.[1];
  const creatorSlug =
    structuredSlug ??
    metaCreatorName?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ??
    slug.split("-")[0];
  const creatorName =
    extractJsonString(html, "model_creator_name", "creator_name") ??
    html.match(
      /"model_creators?"\s*:\s*\{[^}]{0,300}"name"\s*:\s*"([^"]+)"/,
    )?.[1] ??
    html.match(
      /\\"model_creators?\\"\s*:\s*\{[^}]{0,300}\\"name\\"\s*:\s*\\"([^"\\]+)\\"/,
    )?.[1] ??
    metaCreatorName ??
    creatorSlug.charAt(0).toUpperCase() + creatorSlug.slice(1);

  return { id: creatorSlug, name: creatorName, slug: creatorSlug };
}

function extractModelName(html: string, slug: string): string {
  return (
    extractJsonString(html, "model_name", "modelName", "short_name") ??
    html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/)?.[1]?.trim() ??
    html.match(/<title>\s*([^<-]+?)\s*-/)?.[1]?.trim() ??
    slugToName(slug)
  );
}

function extractReleaseDate(html: string): string | null {
  return (
    html.match(/"release_date"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1] ??
    html.match(/\\"release_date\\"\s*:\s*\\"(\d{4}-\d{2}-\d{2})\\"/)?.[1] ??
    null
  );
}

function extractPricing(html: string) {
  return {
    price_1m_blended_3_to_1: extractJsonNumber(
      html,
      "price_1m_blended_3_to_1",
      "price_1m_blended_0_3_1",
    ),
    price_1m_input_tokens: extractJsonNumber(html, "price_1m_input_tokens"),
    price_1m_output_tokens: extractJsonNumber(html, "price_1m_output_tokens"),
    price_1m_cache_hit_tokens: extractJsonNumber(html, "cache_hit_price"),
    price_1m_blended_7_2_1: extractJsonNumber(
      html,
      "price_1m_blended_7_2_1",
    ),
  };
}

function extractEvaluations(html: string) {
  return {
    artificial_analysis_intelligence_index: extractJsonNumber(
      html,
      "intelligence_index",
      "artificial_analysis_intelligence_index",
    ),
    artificial_analysis_coding_index: extractJsonNumber(
      html,
      "coding_index",
      "artificial_analysis_coding_index",
    ),
    artificial_analysis_math_index: extractJsonNumber(
      html,
      "math_index",
      "artificial_analysis_math_index",
    ),
    mmlu_pro: extractJsonNumber(html, "mmlu_pro"),
    gpqa: extractJsonNumber(html, "gpqa"),
    hle: extractJsonNumber(html, "hle"),
    livecodebench: extractJsonNumber(html, "livecodebench"),
    scicode: extractJsonNumber(html, "scicode"),
    math_500: extractJsonNumber(html, "math_500"),
    aime: extractJsonNumber(html, "aime"),
    aime_25: extractJsonNumber(html, "aime_25"),
    ifbench: extractJsonNumber(html, "ifbench"),
    lcr: extractJsonNumber(html, "lcr"),
    terminalbench_hard: extractJsonNumber(html, "terminalbench_hard"),
    terminalbench_v2_1: extractJsonNumber(html, "terminalbench_v2_1"),
    tau2: extractJsonNumber(html, "tau2"),
    tau_banking: extractJsonNumber(html, "tau_banking"),
    agentic_index: extractJsonNumber(html, "agentic_index"),
    gdpval: extractJsonNumber(html, "gdpval"),
    gdpval_normalized: extractJsonNumber(html, "gdpval_normalized"),
    omniscience: extractJsonNumber(html, "omniscience"),
    multilingual_aa: extractJsonNumber(html, "multilingual_aa"),
    mmmu_pro: extractJsonNumber(html, "mmmu_pro"),
    critpt: extractJsonNumber(html, "critpt"),
    apex_agents: extractJsonNumber(html, "apex_agents"),
    itbench_aa: extractJsonNumber(html, "itbench_aa"),
    omniscience_non_hallucination: extractJsonNumber(
      html,
      "non_hallucination_rate",
    ),
  };
}

function extractPerformance(html: string) {
  return {
    median_output_tokens_per_second: extractJsonNumber(
      html,
      "median_output_tokens_per_second",
      "median_output_speed",
    ),
    median_time_to_first_token_seconds: extractJsonNumber(
      html,
      "median_time_to_first_token_seconds",
      "median_time_to_first_token",
      "median_time_to_first_chunk",
    ),
    median_time_to_first_answer_token: extractJsonNumber(
      html,
      "median_time_to_first_answer_token",
    ),
    end_to_end_response_time_seconds: extractJsonNumber(
      html,
      "median_end_to_end_response_time_seconds",
      "end_to_end_response_time_seconds",
      "median_end_to_end_response_time",
      "end_to_end_response_time",
    ),
  };
}

/** Parses the base model record embedded in an Artificial Analysis page. */
export function extractAAPartialModelData(html: string, slug: string) {
  return {
    name: extractModelName(html, slug),
    release_date: extractReleaseDate(html),
    model_creator: extractModelCreator(html, slug),
    evaluations: extractEvaluations(html),
    pricing: extractPricing(html),
    ...extractPerformance(html),
  };
}

function extractJsonBoolean(
  html: string,
  ...keys: string[]
): boolean | undefined {
  for (const key of keys) {
    for (const escaped of [false, true]) {
      for (const start of findJsonValueStarts(html, key, escaped)) {
        if (html.startsWith("true", start)) return true;
        if (html.startsWith("false", start)) return false;
      }
    }
  }
  return undefined;
}

function extractContextWindow(html: string): number | null {
  const jsonValue = extractJsonNumber(
    html,
    "context_window_tokens",
    "context_window",
  );
  if (jsonValue !== null) return jsonValue;

  let match = html.match(/context window of ([\d.]+)\s*M tokens/i);
  if (match) return Math.round(Number.parseFloat(match[1]) * 1_000_000);

  match = html.match(/context window of ([\d,]+)\s*tokens/i);
  if (match) return Number.parseInt(match[1].replace(/,/g, ""), 10);

  match = html.match(/[Cc]ontext window[\s\S]{0,120}?([\d.]+)\s*([kKmM])\b/);
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
  html: string,
  label: string,
  jsonKey: string,
): number | null {
  for (const escaped of [false, true]) {
    for (const valueStart of findJsonValueStarts(html, jsonKey, escaped)) {
      const quote = escaped ? '\\"' : '"';
      if (!html.startsWith(quote, valueStart)) continue;
      const start = valueStart + quote.length;

      const match = html.slice(start, start + 64).match(/^([\d.]+)([BbMmKkT])/);
      if (match) return toBillions(Number.parseFloat(match[1]), match[2]);
    }
  }

  const labelIndex = html.indexOf(label);
  if (labelIndex < 0) return null;
  const nearbyText = html.slice(labelIndex + label.length, labelIndex + label.length + 200);
  const match = nearbyText.match(/[\s\S]*?([\d.]+)\s*([BbMmKkT])\b/);
  return match ? toBillions(Number.parseFloat(match[1]), match[2]) : null;
}

function extractKnowledgeCutoff(html: string): string | null {
  const iso =
    html.match(/\\?"knowledge_cutoff_date\\?"\s*:\s*\\?"(\d{4}-\d{2}-\d{2})\\?"/)?.[1] ??
    html.match(/\\?"knowledge_cutoff\\?"\s*:\s*\\?"(\d{4}-\d{2}-\d{2})\\?"/)?.[1];
  if (iso) return iso;

  const textPattern =
    /[Kk]nowledge cutoff[^\d<]{0,30}((?:[A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})|(?:[A-Z][a-z]{2,8}\s+\d{4}))/;
  const text = html.match(textPattern)?.[1];
  return text?.trim() ?? null;
}

function extractOpenness(html: string): number | null {
  const match = html.match(
    /\\?"openness\\?"\s*:\s*\{[\s\S]{0,800}?\\?"opennessIndex\\?"\s*:\s*([\d.-]+)/,
  );
  return match
    ? Number.parseFloat(match[1])
    : extractJsonNumber(html, "openness_index", "openness_score");
}

function extractIntelligenceIndexTokens(html: string): number | null {
  const jsonMatch = html.match(
    /\\?"intelligence_index_token_counts\\?"\s*:\s*\{[\s\S]{0,400}?\\?"output_tokens\\?"\s*:\s*(\d+)/,
  );
  if (jsonMatch) return Number.parseInt(jsonMatch[1], 10);

  const textMatch = html.match(
    /Intelligence Index[\s\S]{0,80}?generated\s+([\d.]+)\s*([MK])\b/i,
  );
  if (!textMatch) return null;
  const multiplier = textMatch[2].toUpperCase() === "M" ? 1_000_000 : 1_000;
  return Math.round(Number.parseFloat(textMatch[1]) * multiplier);
}

function extractIntelligenceIndexCost(html: string): number | null {
  const jsonMatch = html.match(
    /\\?"intelligence_index_cost\\?"\s*:\s*\{[\s\S]{0,300}?\\?"total_cost\\?"\s*:\s*([\d.]+)/,
  );
  if (jsonMatch) return Number.parseFloat(jsonMatch[1]);

  const textMatch = html.match(/it cost\s+\$([\d,]+(?:\.\d+)?)\s+to evaluate/i);
  return textMatch ? Number.parseFloat(textMatch[1].replace(/,/g, "")) : null;
}

function extractEndToEndResponseTime(html: string): number | null {
  const match = html.match(
    /\\?"end_to_end_response_time_metrics\\?"\s*:\s*\{[\s\S]{0,500}?\\?"total_time\\?"\s*:\s*([\d.]+)/,
  );
  if (match) {
    const value = Number.parseFloat(match[1]);
    return value > 0 ? value : null;
  }
  return extractJsonNumber(
    html,
    "median_end_to_end_response_time_seconds",
    "end_to_end_response_time_seconds",
  );
}

/** Parses the capability fields embedded in an Artificial Analysis model page. */
export function extractAACapabilities(html: string) {
  return {
    context_window_tokens: extractContextWindow(html),
    total_parameters_b: extractParameterBillions(
      html,
      "Total parameters",
      "totalParameters",
    ),
    active_parameters_b: extractParameterBillions(
      html,
      "Active parameters",
      "activeParameters",
    ),
    reasoning_model: extractJsonBoolean(html, "reasoning_model", "isReasoning"),
    reasoning_properties: null,
    is_open_weights: extractJsonBoolean(html, "is_open_weights", "isOpenWeights"),
    input_modality_text: extractJsonBoolean(
      html,
      "input_modality_text",
      "inputModalityText",
    ),
    input_modality_image: extractJsonBoolean(
      html,
      "input_modality_image",
      "inputModalityImage",
    ),
    input_modality_speech: extractJsonBoolean(
      html,
      "input_modality_speech",
      "inputModalitySpeech",
    ),
    input_modality_video: extractJsonBoolean(
      html,
      "input_modality_video",
      "inputModalityVideo",
    ),
    output_modality_text: extractJsonBoolean(
      html,
      "output_modality_text",
      "outputModalityText",
    ),
    output_modality_image: extractJsonBoolean(
      html,
      "output_modality_image",
      "outputModalityImage",
    ),
    output_modality_speech: extractJsonBoolean(
      html,
      "output_modality_speech",
      "outputModalitySpeech",
    ),
    output_modality_video: extractJsonBoolean(
      html,
      "output_modality_video",
      "outputModalityVideo",
    ),
    knowledge_cutoff: extractKnowledgeCutoff(html),
    openness_index: extractOpenness(html),
    intelligence_index_tokens: extractIntelligenceIndexTokens(html),
    intelligence_index_cost_usd: extractIntelligenceIndexCost(html),
    end_to_end_response_time_seconds: extractEndToEndResponseTime(html),
  };
}
