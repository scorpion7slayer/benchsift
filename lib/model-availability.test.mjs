import assert from "node:assert/strict";
import test from "node:test";

import { extractAAAvailabilityStatus } from "./model-availability.ts";

test("detects regular and escaped checkered availability entries", () => {
  assert.equal(
    extractAAAvailabilityStatus(
      '{"url":"/models/claude-fable-5","rank":1,"pattern":"checkered"}',
      "claude-fable-5",
    ),
    "not_currently_available",
  );
  assert.equal(
    extractAAAvailabilityStatus(
      String.raw`{\"url\":\"/models/gpt-test\",\"pattern\":\"checkered\"}`,
      "gpt-test",
    ),
    "not_currently_available",
  );
});

test("does not cross object boundaries or interpret slugs as regex", () => {
  const html = [
    '{"url":"/models/available","pattern":"solid"}',
    '{"url":"/models/other","pattern":"checkered"}',
    '{"url":"/models/literal-abc","pattern":"checkered"}',
  ].join("");

  assert.equal(extractAAAvailabilityStatus(html, "available"), null);
  assert.equal(extractAAAvailabilityStatus(html, "literal-.*"), null);
});
