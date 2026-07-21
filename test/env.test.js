import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadDotEnv, parseDotEnv } from "../src/env.js";

test("parseDotEnv supports comments, quotes, and export syntax", () => {
  const parsed = parseDotEnv(`
    # ignored
    NVIDIA_API_KEY=nvapi-test
    OPENAI_BASE_URL="https://integrate.api.nvidia.com/v1"
    export MC_AI_PREFIX='!build'
    MC_STATUS_MESSAGES=true # inline comment
  `);

  assert.deepEqual(parsed, {
    NVIDIA_API_KEY: "nvapi-test",
    OPENAI_BASE_URL: "https://integrate.api.nvidia.com/v1",
    MC_AI_PREFIX: "!build",
    MC_STATUS_MESSAGES: "true"
  });
});

test("loadDotEnv loads .env without overriding existing process values by default", () => {
  const directory = mkdtempSync(join(tmpdir(), "orion-env-"));
  const path = join(directory, ".env");
  const env = { NVIDIA_API_KEY: "from-shell" };

  try {
    writeFileSync(path, "NVIDIA_API_KEY=from-file\nOPENAI_MODEL=z-ai/glm-5.2\n", "utf8");
    const result = loadDotEnv({ path, env });

    assert.equal(result.loaded, true);
    assert.equal(env.NVIDIA_API_KEY, "from-shell");
    assert.equal(env.OPENAI_MODEL, "z-ai/glm-5.2");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("loadDotEnv reports missing files without throwing", () => {
  const result = loadDotEnv({ path: join(tmpdir(), "missing-orion-dot-env-file"), env: {} });
  assert.equal(result.loaded, false);
});
