import assert from "node:assert/strict";
import test from "node:test";

import { readCookieValue } from "./http-cookie.ts";

test("reads cookies with or without spaces after separators", () => {
  const header = "first=1;benchsift_lang=fr; benchsift_theme=dark; token=a=b";

  assert.equal(readCookieValue(header, "benchsift_lang"), "fr");
  assert.equal(readCookieValue(header, "benchsift_theme"), "dark");
  assert.equal(readCookieValue(header, "token"), "a=b");
});

test("matches exact cookie names and preserves empty values", () => {
  const header = "prefix_benchsift_lang=en; benchsift_lang=; other=1";

  assert.equal(readCookieValue(header, "benchsift_lang"), "");
  assert.equal(readCookieValue(header, "missing"), undefined);
});
