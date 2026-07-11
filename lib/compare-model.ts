export interface CompareModelOption {
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
