import assert from "node:assert/strict";
import test from "node:test";

import { latestDate, summarizeRanking, upperHalf } from "./data-summary.ts";

const rows = [
  { name: "B", score: 60, cost: 2, time: 30 },
  { name: "A", score: 80, cost: 10, time: 50 },
  { name: "C", score: 55, cost: 1, time: 40 },
  { name: "D", score: 10, cost: 0.01, time: 1 },
  { name: "E", score: null, cost: 0.001, time: 0.5 },
];

test("the leader is the best score and missing scores are left out", () => {
  const summary = summarizeRanking(rows);
  assert.equal(summary.count, 4);
  assert.equal(summary.leader.name, "A");
});

test("value and speed are chosen in the upper half, so weak cheap runs never win", () => {
  const summary = summarizeRanking(rows);
  assert.equal(summary.pool, 2);
  // B: 30 points per dollar, A: 8; D (1000 per dollar) is in the lower half.
  assert.equal(summary.value.name, "B");
  assert.equal(summary.fastest.name, "B");
});

test("the cheapest view picks the lowest cost and keeps a measured zero", () => {
  const summary = summarizeRanking([
    { name: "X", score: 1200, cost: 0.4 },
    { name: "Y", score: 1100, cost: 0 },
    { name: "Z", score: 900, cost: 0.01 },
  ], { value: "cheapest" });
  assert.equal(summary.value.name, "Y");
});

test("a ratio needs a positive cost, and speed counts when no time exists", () => {
  const summary = summarizeRanking([
    { name: "X", score: 70, cost: 0, speed: 50 },
    { name: "Y", score: 65, cost: null, speed: 200 },
  ]);
  assert.equal(summary.value, null);
  assert.equal(summary.fastest.name, "Y");
  assert.equal(summary.fastest.speed, 200);
});

test("an empty ranking has no picks", () => {
  assert.deepEqual(summarizeRanking([]), { count: 0, leader: null, value: null, fastest: null, pool: 0 });
});

test("short rankings are not split", () => {
  assert.deepEqual(upperHalf([1, 2, 3]), [1, 2, 3]);
  assert.deepEqual(upperHalf([1, 2, 3, 4, 5]), [1, 2, 3]);
});

test("the latest date ignores invalid values", () => {
  assert.equal(latestDate(null, "2026-01-02", "nope", "2026-03-01T10:00:00Z"), "2026-03-01T10:00:00.000Z");
  assert.equal(latestDate(undefined), null);
});
