import test from "node:test";
import assert from "node:assert/strict";
import { summarizeLlmProbeResults } from "../src/llmDiagnostics.js";
import { findModelProfiles, NIM_LLM_MODEL_PROFILES } from "../src/llmModelProfiles.js";

test("findModelProfiles selects profiles by id or slug", () => {
  assert.deepEqual(
    findModelProfiles("glm-5.2,deepseek-ai/deepseek-v4-flash").map((profile) => profile.id),
    ["glm-5.2", "deepseek-v4-flash"]
  );
  assert.equal(findModelProfiles("all").length, NIM_LLM_MODEL_PROFILES.length);
});

test("summarizeLlmProbeResults calculates success and parser compatibility rates", () => {
  const summary = summarizeLlmProbeResults([
    { profileId: "a", label: "A", model: "a/model", ok: true, compatible: true, latencyMs: 100 },
    { profileId: "a", label: "A", model: "a/model", ok: true, compatible: false, latencyMs: 300 },
    { profileId: "a", label: "A", model: "a/model", ok: false, compatible: false, latencyMs: 50, error: "timeout" }
  ]);

  assert.equal(summary.length, 1);
  assert.equal(summary[0].attempts, 3);
  assert.equal(summary[0].successes, 2);
  assert.equal(summary[0].failures, 1);
  assert.equal(summary[0].successRate, 2 / 3);
  assert.equal(summary[0].compatibleRate, 1 / 3);
  assert.equal(summary[0].avgLatencyMs, 200);
  assert.equal(summary[0].lastError, "timeout");
});
