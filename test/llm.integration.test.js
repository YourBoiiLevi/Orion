import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";
import { loadDotEnv } from "../src/env.js";
import { findModelProfiles } from "../src/llmModelProfiles.js";
import { runSingleLlmProbe } from "../src/llmDiagnostics.js";

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

loadDotEnv();
const config = loadConfig();
const profiles = findModelProfiles(process.env.LLM_TEST_MODELS || "all");
const iterations = parseInteger(process.env.LLM_TEST_ITERATIONS, 1);
const cooldownMs = parseInteger(process.env.LLM_TEST_COOLDOWN_MS, 1500);
const maxLatencyMs = process.env.LLM_MAX_LATENCY_MS ? parseInteger(process.env.LLM_MAX_LATENCY_MS, 0) : null;
const useProviderExtras = process.env.LLM_USE_PROVIDER_EXTRAS !== "false";

test("NVIDIA NIM LLM profiles are API-compatible and parser-compatible", async (t) => {
  if (!config.model.apiKey) {
    t.skip("Set NVIDIA_API_KEY in .env to run live LLM tests.");
    return;
  }

  for (const profile of profiles) {
    await t.test(profile.label, { timeout: profile.timeoutMs + 15_000 }, async () => {
      for (let iteration = 1; iteration <= iterations; iteration += 1) {
        const result = await runSingleLlmProbe({
          profile,
          config,
          includeRaw: true,
          useProviderExtras
        });

        assert.equal(result.ok, true, `${profile.label} request failed: ${result.error}`);
        assert.equal(
          result.compatible,
          true,
          `${profile.label} returned content that the command parser rejected:\n${result.rawContent}\nRejected: ${JSON.stringify(result.rejected)}`
        );
        assert.ok(result.commandCount > 0, `${profile.label} returned no parsed commands.`);

        if (maxLatencyMs != null) {
          assert.ok(result.latencyMs <= maxLatencyMs, `${profile.label} took ${result.latencyMs}ms, above ${maxLatencyMs}ms.`);
        }

        if (iteration < iterations && cooldownMs > 0) {
          await sleep(cooldownMs);
        }
      }
    });
  }
});
