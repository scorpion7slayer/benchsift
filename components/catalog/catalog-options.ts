import {
  ArrowUpDown,
  AudioLines,
  BarChart3,
  Blocks,
  Brain,
  Captions,
  DollarSign,
  Eye,
  ImageIcon,
  Mic,
  Route,
  Timer,
  Type,
  Video,
  Zap,
  type RuneIcon,
} from "@/components/icons";
import type { CategoryFilter, NormalRankingKey, SortKey } from "@/lib/model-grid-logic";

export const NORMAL_RANKING_OPTIONS: ReadonlyArray<{
  value: NormalRankingKey;
  label: "general" | "coding" | "math" | "speed" | "price";
  icon: RuneIcon;
}> = [
  { value: "intelligence", label: "general", icon: Blocks },
  { value: "coding", label: "coding", icon: BarChart3 },
  { value: "math", label: "math", icon: Brain },
  { value: "speed", label: "speed", icon: Zap },
  { value: "price_asc", label: "price", icon: DollarSign },
];

export type SortGroup = "indices" | "benchmarks" | "performance" | "openrouter" | "pricing" | "general";

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; group: SortGroup }> = [
  { value: "intelligence", group: "indices" },
  { value: "coding", group: "indices" },
  { value: "math", group: "indices" },
  { value: "agentic", group: "indices" },
  { value: "gpqa", group: "benchmarks" },
  { value: "mmlu_pro", group: "benchmarks" },
  { value: "hle", group: "benchmarks" },
  { value: "livecodebench", group: "benchmarks" },
  { value: "math_500", group: "benchmarks" },
  { value: "aime_25", group: "benchmarks" },
  { value: "speed", group: "performance" },
  { value: "ttft", group: "performance" },
  { value: "openrouter_popular", group: "openrouter" },
  { value: "price", group: "pricing" },
  { value: "input_price", group: "pricing" },
  { value: "output_price", group: "pricing" },
  { value: "cost_per_task", group: "pricing" },
  { value: "context", group: "general" },
  { value: "newest", group: "general" },
  { value: "name", group: "general" },
];

export const CATEGORY_OPTIONS: ReadonlyArray<{ value: CategoryFilter; icon: RuneIcon }> = [
  { value: "all", icon: Blocks },
  { value: "new", icon: Timer },
  { value: "stealth", icon: Eye },
  { value: "text", icon: Type },
  { value: "image", icon: ImageIcon },
  { value: "embeddings", icon: Blocks },
  { value: "audio", icon: AudioLines },
  { value: "video", icon: Video },
  { value: "rerank", icon: ArrowUpDown },
  { value: "speech", icon: Mic },
  { value: "transcription", icon: Captions },
  { value: "decisions", icon: Route },
];
