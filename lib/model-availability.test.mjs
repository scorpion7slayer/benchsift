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

test("trusted access and AA's checkered marker both restrict access, trusted access first", async () => {
  const { matchesAvailability, modelAccessRestriction } = await import("./model-availability.ts");
  const notPublic = { availability_status: "not_currently_available" };
  const trusted = { availability_status: "not_currently_available", cyber_index_result: { access: "trusted" } };
  const open = { availability_status: null, cyber_index_result: { access: "standard" } };
  assert.equal(modelAccessRestriction(notPublic), "not_public");
  assert.equal(modelAccessRestriction(trusted), "trusted_access");
  assert.equal(modelAccessRestriction(open), null);
  assert.equal(modelAccessRestriction({}), null);

  const filtered = (filter) => [notPublic, trusted, open].filter((model) => matchesAvailability(modelAccessRestriction(model), filter));
  assert.deepEqual(filtered("all"), [notPublic, trusted, open]);
  assert.deepEqual(filtered("public"), [open]);
  assert.deepEqual(filtered("restricted"), [notPublic, trusted]);
});
