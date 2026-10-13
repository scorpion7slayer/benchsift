import type { MetricRank, SimilarModel } from "./model-insights";

/*
 * The facts behind a model page's comparison paragraph: its Intelligence
 * Index and rank, then how its blended price and output speed compare with
 * the closest models on that index. Only measured values are compared; a
 * missing value leaves its comparison out rather than guessing.
 */

/** How the model's value compares with a peer's: "lower" means the model's is lower. */
export type Relation = "lower" | "higher" | "similar";

export interface PeerComparison {
  peer: SimilarModel;
  price: Relation | null;
  speed: Relation | null;
}

export interface ModelSummary {
  intelligence: number;
  rank: MetricRank | null;
  price: number | null;
  speed: number | null;
  peers: PeerComparison[];
}

/** Values within 5% of each other read as the same level. */
const SIMILAR_RATIO = 0.05;

export function relation(value: number | null, other: number | null): Relation | null {
  if (value === null || other === null || !Number.isFinite(value) || !Number.isFinite(other)) return null;
  if (Math.abs(value - other) <= SIMILAR_RATIO * Math.max(Math.abs(value), Math.abs(other))) return "similar";
  return value < other ? "lower" : "higher";
}

/**
 * Compares a model with its `limit` closest peers on the Intelligence Index,
 * listed best score first. Without a score or a peer there is nothing to say.
 */
export function modelSummary(
  model: { intelligence: number | null; price: number | null; speed: number | null },
  rank: MetricRank | null | undefined,
  similar: readonly SimilarModel[],
  limit = 3,
): ModelSummary | null {
  const { intelligence } = model;
  if (intelligence === null || !Number.isFinite(intelligence)) return null;
  const peers = similar
    .map((peer, index) => ({ peer, index }))
    .sort((a, b) => Math.abs(a.peer.intelligence - intelligence) - Math.abs(b.peer.intelligence - intelligence) || a.index - b.index)
    .slice(0, limit)
    .sort((a, b) => b.peer.intelligence - a.peer.intelligence || a.index - b.index)
    .map(({ peer }) => ({
      peer,
      price: relation(model.price, peer.price),
      speed: relation(model.speed, peer.speed),
    }));
  if (peers.length === 0) return null;
  return { intelligence, rank: rank ?? null, price: model.price, speed: model.speed, peers };
}
