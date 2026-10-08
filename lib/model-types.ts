/** Shapes of catalogue data shared by the server pipeline and the UI. */
import type { ModelAvailabilityStatus } from "./model-availability";

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
  terminalbench_v2_1: number | null;
  tau2: number | null;
  tau_banking: number | null;
  // Newer AA benchmarks / Benchmarks AA plus récents
  apex_agents?: number | null;          // APEX-Agents-AA (long-horizon agentic)
  omniscience_non_hallucination?: number | null; // AA-Omniscience non-hallucination rate
  cyber_index?: number | null;          // AA Cyber Index, 0-100 (details in cyber_index_result)
  // Catch-all for any other field returned by the API / pour tout autre champ
  [key: string]: number | null | undefined;
}

export interface Pricing {
  price_1m_blended_3_to_1: number | null;
  price_1m_input_tokens: number | null;
  price_1m_output_tokens: number | null;
  price_1m_cache_write_tokens?: number | null;
  price_1m_reasoning_tokens?: number | null;
  price_web_search?: number | null;
  openrouter_display_prices?: {
    label: string;
    price: number;
    unit: string;
    kind?: string;
  }[];
  // New AA fields / Nouveaux champs AA
  price_1m_cache_hit_tokens?: number | null;       // cache hit price
  price_1m_blended_7_2_1?: number | null;          // blended cache:input:output 7:2:1
}

export interface LLMModel {
  /** Source-backed former identities, never inferred from model behavior. */
  stealth_history?: import("./model-identity").StealthIdentity[];
  is_stealth?: boolean;
  alias_slugs?: string[];
  search_aliases?: string[];
  id: string;
  name: string;
  slug: string;
  release_date: string | null;
  release_timestamp?: string | null;
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
  openrouter_input_modalities?: string[];
  openrouter_output_modalities?: string[];
  openrouter_supported_voices?: string[];
  openrouter_supported_parameters?: string[];
  openrouter_max_completion_tokens?: number | null;
  openrouter_expiration_date?: string | null;
  reasoning_model?: boolean;
  reasoning_properties?: { style: string } | null;
  // New scraped fields from AA model detail page / Nouveaux champs scrapés
  knowledge_cutoff?: string | null;            // ISO date string (e.g. "2024-09-30") / date ISO
  openness_index?: number | null;              // 0-100 scale / échelle 0-100
  intelligence_index_tokens?: number | null;   // tokens used to run AA Intelligence Index (verbosity)
  intelligence_index_cost_usd?: number | null; // USD cost to run AA Intelligence Index
  intelligence_index_cost_per_task_usd?: number | null; // AA weighted average cost per Intelligence Index task
  /** AA Cyber Index breakdown: safety blocks, trusted access, benchmarks and cost. */
  cyber_index_result?: import("./cyber-index").CyberIndexResult | null;
  openrouter_weekly_rank?: number | null;       // OpenRouter weekly Top Models rank
  openrouter_variant?: string | null;           // OpenRouter ranking variant (free/standard)
  openrouter_api_id?: string | null;             // Structured AA V2 link to OpenRouter
  huggingface_id?: string | null;
  huggingface_url?: string | null;
  huggingface_official?: boolean | null;
  huggingface_source?: string | null;
  huggingface_license?: string | null;
  huggingface_downloads?: number | null;
  huggingface_likes?: number | null;
  huggingface_pipeline_tag?: string | null;
  huggingface_library_name?: string | null;
  huggingface_tags?: string[];
  huggingface_gated?: string | null;
  huggingface_private?: boolean | null;
  huggingface_inference_providers?: string[];
  huggingface_created_at?: string | null;
  huggingface_last_modified?: string | null;
  models_dev_id?: string;
  models_dev_url?: string;
  provider_icon_url?: string | null;
  availability_status?: ModelAvailabilityStatus | null;
}
