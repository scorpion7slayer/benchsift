import assert from "node:assert/strict";
import test from "node:test";

import {
  MISSING,
  formatDate,
  formatDuration,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatParameters,
  formatPercent,
  formatRatio,
  formatSeconds,
  formatSpeed,
  formatTokens,
} from "./format.ts";

test("missing measurements never render as zero", () => {
  for (const format of [formatMoney, formatTokens, formatSeconds, formatSpeed, formatPercent, formatParameters]) {
    assert.equal(format(null, "en"), MISSING);
    assert.equal(format(Number.NaN, "fr"), MISSING);
  }
  assert.equal(formatNumber(undefined, "en"), MISSING);
  assert.equal(formatMoney(0, "en"), "$0");
});

test("prices keep consistent precision", () => {
  assert.equal(formatMoney(0.6, "en"), "$0.60");
  assert.equal(formatMoney(0.15, "en"), "$0.15");
  assert.equal(formatMoney(0.042, "en"), "$0.042");
  assert.equal(formatMoney(10, "en"), "$10");
  assert.equal(formatMoney(1.5, "en"), "$1.50");
  assert.match(formatMoney(0.6, "fr"), /^0,60\s\$$/);
  assert.equal(formatMoneyCompact(2824.18, "en"), "$2.82K");
  assert.equal(formatMoneyCompact(500, "en"), "$500");
});

test("tokens, durations and scores use the display locale", () => {
  assert.equal(formatTokens(131_072, "en"), "131K");
  assert.equal(formatTokens(1_050_000, "en"), "1.05M");
  assert.equal(formatSeconds(0.553, "en"), "0.553 s");
  assert.equal(formatSeconds(66.11, "fr"), "66,1 s");
  assert.equal(formatSpeed(263.8, "en"), "264 t/s");
  assert.equal(formatSpeed(62.54, "en"), "62.5 t/s");
  assert.equal(formatNumber(57.12, "fr"), "57,1");
  assert.equal(formatPercent(0.935, "en"), "93.5%");
  assert.equal(formatParameters(117, "en"), "117B");
  assert.equal(formatParameters(1500, "en"), "1.5T");
  assert.equal(formatParameters(0.75, "en"), "750M");
  assert.equal(formatRatio(66.67, "en"), "×66.7");
  assert.equal(formatRatio(1.44, "en"), "×1.4");
});

test("dates are calendar dates in the display locale", () => {
  assert.equal(formatDate("2026-06-09", "fr"), "9 juin 2026");
  assert.equal(formatDate("2026-06-09", "en"), "Jun 9, 2026");
  assert.equal(formatDate("not a date", "en"), MISSING);
  assert.equal(formatDate(null, "fr"), MISSING);
});

test("durations read in minutes and seconds", () => {
  assert.equal(formatDuration(1132, "fr"), "18 min 52 s");
  assert.equal(formatDuration(600, "en"), "10 min");
  assert.equal(formatDuration(42, "en"), "42 s");
  assert.equal(formatDuration(4500, "en"), "1 h 15");
  assert.equal(formatDuration(null, "en"), MISSING);
});
