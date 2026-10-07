export interface CompareModelOption {
  search_aliases?: import("./api").LLMModel["search_aliases"];
  stealth_history?: import("./api").LLMModel["stealth_history"];
  id: string;
  name: string;
  slug: string;
  model_creator: {
    name: string;
    slug: string;
  };
  provider_icon_url?: string | null;
  intelligence_score: number | null;
}
