import type { LLMModel } from "./api";
import { getCanonicalCreatorSlug } from "./provider-map";
import { isOpenRouterStealthEntry } from "./openrouter-model-filter";

export interface StealthIdentity {
  id: string;
  name: string;
  sourceUrl: string;
  announcementUrl?: string;
  listedAt: string | null;
  firstSeenAt: string | null;
  revealedAs?: string;
}

export function restoreStealthIdentity(model: LLMModel): LLMModel {
  const id = model.id.replace(/^(?:openrouter:|modelsdev:)/, "");
  if (!isOpenRouterStealthEntry({ id }) || model.stealth_history?.length) return model;
  return { ...model, is_stealth: true, stealth_history: [{
    id, name: model.name, sourceUrl: `https://openrouter.ai/${id.split("/").map(encodeURIComponent).join("/")}`,
    listedAt: model.release_date, firstSeenAt: null,
  }] };
}

function earliest(a: string | null, b: string | null): string | null {
  return [a, b].filter((v): v is string => Boolean(v) && Number.isFinite(Date.parse(v!))).sort()[0] ?? null;
}

export function mergeIdentityMetadata(primary: LLMModel, extra: LLMModel): LLMModel {
  const identities = new Map<string, StealthIdentity>();
  for (const row of [...(extra.stealth_history ?? []), ...(primary.stealth_history ?? [])]) {
    const previous = identities.get(row.id);
    identities.set(row.id, previous ? {
      ...previous, ...row,
      revealedAs: row.revealedAs ?? previous.revealedAs,
      listedAt: earliest(previous.listedAt, row.listedAt),
      firstSeenAt: earliest(previous.firstSeenAt, row.firstSeenAt),
    } : row);
  }
  return {
    ...primary,
    ...(identities.size ? { stealth_history: [...identities.values()] } : {}),
    alias_slugs: [...new Set([...(primary.alias_slugs ?? []), ...(extra.alias_slugs ?? []),
      ...(extra.slug !== primary.slug ? [extra.slug] : [])])].filter((slug) => slug !== primary.slug),
    search_aliases: [...new Set([...(primary.search_aliases ?? []), ...(extra.search_aliases ?? []),
      ...(extra.name !== primary.name ? [extra.name] : [])])],
  };
}

export function resolveModelSlug(models: LLMModel[], slug: string): string {
  if (models.some((model) => model.slug === slug)) return slug;
  return models.find((model) => model.alias_slugs?.includes(slug))?.slug ?? slug;
}

function sourceId(value: string): string {
  const [creator, ...parts] = value.toLowerCase().replace(/^(?:openrouter:|modelsdev:)/, "").split("/");
  return `${getCanonicalCreatorSlug(creator)}/${parts.join("/")}`;
}

/** A reveal moves only identity history, never the preview's prices or scores. */
export function mergeRevealedStealthModels(models: LLMModel[]): LLMModel[] {
  const result = [...models];
  const removed = new Set<number>();
  models.forEach((model, index) => {
    if (!model.is_stealth) return;
    const targets = new Set((model.stealth_history ?? []).flatMap((row) => row.revealedAs ? [sourceId(row.revealedAs)] : []));
    if (targets.size !== 1) return;
    const target = [...targets][0];
    const candidates = models.flatMap((candidate, i) => !candidate.is_stealth &&
      [candidate.openrouter_api_id, candidate.models_dev_id, candidate.id]
        .some((id) => id && sourceId(id) === target) ? [i] : []);
    // Multiple reasoning configurations may share the same published model ID.
    // Preserve them and attach the sourced history to each configuration.
    for (const i of candidates) result[i] = mergeIdentityMetadata(result[i], model);
    if (candidates.length) removed.add(index);
  });
  return result.filter((_, i) => !removed.has(i));
}
