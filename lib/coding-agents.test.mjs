import assert from "node:assert/strict";
import test from "node:test";

import { CODING_AGENT_HARNESSES } from "./coding-agents.ts";

test("maps current Grok Build and Kimi Code harness slugs to branded icons", () => {
  assert.deepEqual(CODING_AGENT_HARNESSES["grok-build"], {
    name: "Grok Build",
    icon: "grok",
  });
  assert.deepEqual(CODING_AGENT_HARNESSES["kimi-code-cli"], {
    name: "Kimi Code CLI",
    icon: "kimi",
  });
});
