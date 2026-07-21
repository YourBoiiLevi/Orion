import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "../src/config.js";
import { loadDotEnv } from "../src/env.js";
import { findModelProfiles } from "../src/llmModelProfiles.js";
import { runLlmDiagnostics } from "../src/llmDiagnostics.js";

function parseArgs(argv) {
  const args = {
    models: process.env.LLM_TEST_MODELS || "all",
    iterations: Number.parseInt(process.env.LLM_TEST_ITERATIONS || "1", 10),
    cooldownMs: Number.parseInt(process.env.LLM_TEST_COOLDOWN_MS || "1500", 10),
    timeoutMs: process.env.LLM_TIMEOUT_MS ? Number.parseInt(process.env.LLM_TIMEOUT_MS, 10) : undefined,
    maxTokens: process.env.LLM_MAX_TOKENS ? Number.parseInt(process.env.LLM_MAX_TOKENS, 10) : undefined,
    includeRaw: process.env.LLM_INCLUDE_RAW === "true",
    useProviderExtras: process.env.LLM_USE_PROVIDER_EXTRAS !== "false",
    output: process.env.LLM_REPORT_PATH || ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--models") args.models = argv[++index];
    if (arg === "--iterations") args.iterations = Number.parseInt(argv[++index], 10);
    if (arg === "--cooldown-ms") args.cooldownMs = Number.parseInt(argv[++index], 10);
    if (arg === "--timeout-ms") args.timeoutMs = Number.parseInt(argv[++index], 10);
    if (arg === "--max-tokens") args.maxTokens = Number.parseInt(argv[++index], 10);
    if (arg === "--include-raw") args.includeRaw = true;
    if (arg === "--minimal") args.useProviderExtras = false;
    if (arg === "--output") args.output = argv[++index];
  }

  return args;
}

function formatRate(value) {
  return `${Math.round(value * 100)}%`;
}

function formatSummary(summary) {
  return summary.map((item) => ({
    model: item.label,
    attempts: item.attempts,
    success: formatRate(item.successRate),
    parser: formatRate(item.compatibleRate),
    avgMs: item.avgLatencyMs ?? "-",
    p95Ms: item.p95LatencyMs ?? "-",
    maxMs: item.maxLatencyMs ?? "-",
    lastError: item.lastError ? item.lastError.slice(0, 100) : ""
  }));
}

function defaultOutputPath() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return join("reports", `llm-diagnostics-${stamp}.json`);
}

loadDotEnv();

const args = parseArgs(process.argv.slice(2));
const config = loadConfig();

if (!config.model.apiKey) {
  console.error("No API key found. Set NVIDIA_API_KEY in .env or in your shell.");
  process.exit(1);
}

const profiles = findModelProfiles(args.models);
console.log(`Running ${args.iterations} LLM probe(s) for ${profiles.map((profile) => profile.label).join(", ")}`);
console.log(`Endpoint: ${config.model.baseUrl}`);
console.log(`Provider extras: ${args.useProviderExtras ? "enabled" : "disabled"}`);

const report = await runLlmDiagnostics({
  profiles,
  config,
  iterations: args.iterations,
  cooldownMs: args.cooldownMs,
  timeoutMs: args.timeoutMs,
  maxTokens: args.maxTokens,
  includeRaw: args.includeRaw,
  useProviderExtras: args.useProviderExtras,
  onResult: (result) => {
    const status = result.ok ? (result.compatible ? "ok" : "parser-fail") : "fail";
    const detail = result.ok ? `${result.latencyMs}ms, ${result.commandCount} command(s)` : `${result.latencyMs}ms, ${result.error}`;
    console.log(`[${status}] ${result.label}: ${detail}`);
  }
});

console.table(formatSummary(report.summary));

const output = args.output || defaultOutputPath();
mkdirSync("reports", { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join("reports", "llm-diagnostics-latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Report written to ${output}`);
