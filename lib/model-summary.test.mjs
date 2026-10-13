import assert from "node:assert/strict";
import test from "node:test";
import { modelSummary, relation } from "./model-summary.ts";

const peer = (slug, intelligence, price, speed) => ({
  slug,
  name: slug,
  creatorName: "Creator",
  creatorSlug: "creator",
  providerIconUrl: null,
  intelligence,
  price,
  speed,
});

test("relation reads values within 5% as similar and keeps missing values null", () => {
  assert.equal(relation(1, 2), "lower");
  assert.equal(relation(2, 1), "higher");
  assert.equal(relation(100, 104), "similar");
  assert.equal(relation(0, 0), "similar");
  assert.equal(relation(null, 1), null);
  assert.equal(relation(1, null), null);
});

test("modelSummary keeps the three closest peers, best score first, with price and speed relations", () => {
  const summary = modelSummary(
    { intelligence: 50, price: 4, speed: 100 },
    { rank: 12, total: 300 },
    [peer("far", 58, 1, 50), peer("above", 52, 8, 100), peer("close", 50.5, 4.1, null), peer("below", 47, 2, 150)],
  );
  assert.deepEqual(summary.peers.map(({ peer }) => peer.slug), ["above", "close", "below"]);
  assert.deepEqual(summary.peers.map(({ price, speed }) => [price, speed]), [
    ["lower", "similar"],
    ["similar", null],
    ["higher", "lower"],
  ]);
  assert.deepEqual(summary.rank, { rank: 12, total: 300 });
});

test("modelSummary says nothing without a score or a peer", () => {
  assert.equal(modelSummary({ intelligence: null, price: 1, speed: 1 }, null, [peer("a", 50, 1, 1)]), null);
  assert.equal(modelSummary({ intelligence: 50, price: 1, speed: 1 }, null, []), null);
  const unpriced = modelSummary({ intelligence: 50, price: null, speed: null }, undefined, [peer("a", 50, 1, 1)]);
  assert.equal(unpriced.rank, null);
  assert.deepEqual(unpriced.peers.map(({ price, speed }) => [price, speed]), [[null, null]]);
});
