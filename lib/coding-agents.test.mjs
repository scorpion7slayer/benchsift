import assert from "node:assert/strict";
import test from "node:test";

test("resolves versioned harness slugs to their provider logo", async () => {
  const { harnessProvider } = await import("./coding-agents.ts");
  assert.equal(harnessProvider("muse-code-102-rc"), "meta");
  assert.equal(harnessProvider("antigravity-sdk-v0112"), "google");
  assert.equal(harnessProvider("claude-code"), "anthropic");
  assert.equal(harnessProvider("devin-fusion-cli", "cognition"), "cognition");
  assert.equal(harnessProvider("unknown-tool"), "unknown-tool");
});

test("separates a configuration's effort from its model name", async () => {
  const { splitEffort } = await import("./coding-agents.ts");
  assert.deepEqual(splitEffort("Sonnet 5.5 (max)"), { base: "Sonnet 5.5", effort: "max" });
  assert.deepEqual(splitEffort("Fable 5.1 (max) (with fallback)"), { base: "Fable 5.1 (with fallback)", effort: "max" });
  assert.deepEqual(splitEffort("Claude Fable 5.1 XHigh"), { base: "Claude Fable 5.1", effort: "xhigh" });
  assert.deepEqual(splitEffort("Kimi K3"), { base: "Kimi K3", effort: null });
});
