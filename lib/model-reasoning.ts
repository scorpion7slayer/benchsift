import type { LLMModel } from "@/lib/api";

export type ReasoningMode =
  | "default"
  | "non-reasoning"
  | "reasoning"
  | "adaptive-reasoning"
  | "thinking";

export type ReasoningEffort =
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

export interface ReasoningVariantDescriptor {
  familyKey: string;
  familyName: string;
  mode: ReasoningMode;
  effort: ReasoningEffort | null;
  explicit: boolean;
}

export interface ModelReasoningVariant {
  model: LLMModel;
  descriptor: ReasoningVariantDescriptor;
}

export interface ModelReasoningFamily {
  familyKey: string;
  familyName: string;
  variants: ModelReasoningVariant[];
}

export interface ModelReasoningVariantOption {
  slug: string;
  name: string;
  mode: ReasoningMode;
  effort: ReasoningEffort | null;
}

export interface ModelDetailData {
  model: LLMModel;
  familyName: string;
  variants: ModelReasoningVariantOption[];
}

type ReasoningModelIdentity = Pick<LLMModel, "name" | "slug" | "model_creator">;

const EFFORTS: ReasoningEffort[] = [
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
];

const EFFORT_RANK = new Map<ReasoningEffort, number>(
  EFFORTS.map((effort, index) => [effort, index]),
);

const REASONING_QUALIFIER =
  /(?:non[-\s]?reasoning|adaptive\s+reasoning|reasoning|thinking|\beffort\b|^\s*(?:minimal|low|medium|high|xhigh|max)\s*$)/i;

function cleanName(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([,)])/g, "$1")
    .replace(/([(])\s+/g, "$1")
    .trim();
}

function normaliseFamilyName(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseEffort(value: string): ReasoningEffort | null {
  const normalised = value.toLowerCase().replace(/[\s_-]+/g, "");
  if (normalised.includes("xhigh") || normalised.includes("extrahigh")) return "xhigh";
  if (normalised.includes("maximum") || normalised.includes("max")) return "max";
  if (normalised.includes("minimal")) return "minimal";
  if (normalised.includes("low")) return "low";
  if (normalised.includes("medium")) return "medium";
  if (normalised.includes("high")) return "high";
  return null;
}

function parseMode(value: string): ReasoningMode | null {
  if (/non[-\s]?reasoning/i.test(value)) return "non-reasoning";
  if (/adaptive\s+reasoning/i.test(value)) return "adaptive-reasoning";
  if (/thinking/i.test(value)) return "thinking";
  if (/reasoning/i.test(value)) return "reasoning";
  return null;
}

function stripTrailingReasoningWord(value: string): {
  familyName: string;
  mode: ReasoningMode | null;
} {
  const trailingContext = value.match(/(\s+\([^()]+\))\s*$/)?.[1] ?? "";
  const prefix = trailingContext
    ? value.slice(0, value.length - trailingContext.length)
    : value;
  const match = prefix.match(
    /^(.*?)(?:[-\s]+)(non[-\s]?reasoning|adaptive\s+reasoning|thinking|reasoning|think)\s*$/i,
  );
  if (!match) return { familyName: value, mode: null };

  const token = match[2];
  const mode = /non/i.test(token)
    ? "non-reasoning"
    : /adaptive/i.test(token)
      ? "adaptive-reasoning"
      : /think/i.test(token)
        ? "thinking"
        : "reasoning";

  return {
    familyName: cleanName(`${match[1]}${trailingContext}`),
    mode,
  };
}

export function describeReasoningVariant(
  model: ReasoningModelIdentity,
): ReasoningVariantDescriptor {
  let familyName = cleanName(model.name);
  let mode: ReasoningMode = "default";
  let effort: ReasoningEffort | null = null;
  let explicit = false;

  const parenthetical = familyName.match(/\s*\(([^()]*)\)\s*$/);
  if (parenthetical && REASONING_QUALIFIER.test(parenthetical[1])) {
    const qualifier = parenthetical[1];
    const preservedParts = qualifier
      .split(/\s*,\s*/)
      .filter((part) => !REASONING_QUALIFIER.test(part));

    familyName = cleanName(
      `${familyName.slice(0, parenthetical.index)}${
        preservedParts.length > 0 ? ` (${preservedParts.join(", ")})` : ""
      }`,
    );
    mode = parseMode(qualifier) ?? "reasoning";
    effort = parseEffort(qualifier);
    explicit = true;
  }

  const suffix = stripTrailingReasoningWord(familyName);
  if (suffix.mode) {
    familyName = suffix.familyName;
    if (mode === "default" || mode === "reasoning") mode = suffix.mode;
    explicit = true;
  }

  const familyKey = `${model.model_creator.slug.toLowerCase()}:${normaliseFamilyName(familyName)}`;
  return { familyKey, familyName, mode, effort, explicit };
}

function sortVariants(a: ModelReasoningVariant, b: ModelReasoningVariant): number {
  const modeRank = (mode: ReasoningMode) => {
    if (mode === "non-reasoning") return 0;
    if (mode === "default") return 1;
    return 2;
  };
  return (
    modeRank(a.descriptor.mode) - modeRank(b.descriptor.mode) ||
    (a.descriptor.effort ? EFFORT_RANK.get(a.descriptor.effort)! + 1 : 0) -
      (b.descriptor.effort ? EFFORT_RANK.get(b.descriptor.effort)! + 1 : 0) ||
    a.model.name.localeCompare(b.model.name)
  );
}

export function getModelReasoningFamily(
  models: LLMModel[],
  slug: string,
): ModelReasoningFamily | null {
  const selected = models.find((model) => model.slug === slug);
  if (!selected) return null;

  const selectedDescriptor = describeReasoningVariant(selected);
  const variants = models
    .map((model) => ({ model, descriptor: describeReasoningVariant(model) }))
    .filter((entry) => entry.descriptor.familyKey === selectedDescriptor.familyKey);
  const isReasoningFamily =
    variants.length > 1 && variants.some((entry) => entry.descriptor.explicit);

  if (!isReasoningFamily) {
    return {
      familyKey: selectedDescriptor.familyKey,
      familyName: selected.name,
      variants: [{ model: selected, descriptor: selectedDescriptor }],
    };
  }

  return {
    familyKey: selectedDescriptor.familyKey,
    familyName: selectedDescriptor.familyName,
    variants: variants.sort(sortVariants),
  };
}

export function getCanonicalReasoningVariant(
  family: ModelReasoningFamily,
): ModelReasoningVariant {
  return [...family.variants].sort(
    (a, b) =>
      a.model.slug.length - b.model.slug.length ||
      a.model.slug.localeCompare(b.model.slug),
  )[0];
}

export function toModelDetailData(
  family: ModelReasoningFamily,
  selectedSlug: string,
): ModelDetailData | null {
  const selected = family.variants.find(({ model }) => model.slug === selectedSlug);
  if (!selected) return null;
  return {
    model: selected.model,
    familyName: family.familyName,
    variants: family.variants.map(({ model, descriptor }) => ({
      slug: model.slug,
      name: model.name,
      mode: descriptor.mode,
      effort: descriptor.effort,
    })),
  };
}

export function collapseReasoningVariants(models: LLMModel[]): LLMModel[] {
  const descriptors = models.map((model, index) => ({
    model,
    index,
    descriptor: describeReasoningVariant(model),
  }));
  const groups = new Map<string, typeof descriptors>();

  for (const entry of descriptors) {
    const group = groups.get(entry.descriptor.familyKey) ?? [];
    group.push(entry);
    groups.set(entry.descriptor.familyKey, group);
  }

  const collapsed: Array<{ model: LLMModel; index: number }> = [];
  for (const group of groups.values()) {
    const isReasoningFamily =
      group.length > 1 && group.some((entry) => entry.descriptor.explicit);
    if (!isReasoningFamily) {
      collapsed.push(...group.map(({ model, index }) => ({ model, index })));
      continue;
    }

    const family: ModelReasoningFamily = {
      familyKey: group[0].descriptor.familyKey,
      familyName: group[0].descriptor.familyName,
      variants: group.map(({ model, descriptor }) => ({ model, descriptor })),
    };
    const canonical = getCanonicalReasoningVariant(family);
    collapsed.push({
      index: Math.min(...group.map((entry) => entry.index)),
      model: { ...canonical.model, name: family.familyName },
    });
  }

  return collapsed
    .sort((a, b) => a.index - b.index)
    .map(({ model }) => model);
}
