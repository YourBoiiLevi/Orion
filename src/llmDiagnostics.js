import { performance } from "node:perf_hooks";
import { ChatCompletionsClient } from "./modelClient.js";
import { sanitizeCommands } from "./minecraftProtocol.js";

export const DEFAULT_LLM_DIAGNOSTIC_PROMPT = [
  "Create exactly three Minecraft Bedrock commands for a tiny parser smoke test.",
  "The commands should place one stone block at the player's feet, place one torch nearby, and send a short done message.",
  "Return only commands, one per line."
].join(" ");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roundMs(value) {
  return Math.round(value);
}

function percentile(values, percentileRank) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileRank / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function extractUsage(payload) {
  const usage = payload?.usage;
  if (!usage || typeof usage !== "object") return null;
  return {
    promptTokens: usage.prompt_tokens ?? usage.promptTokens ?? null,
    completionTokens: usage.completion_tokens ?? usage.completionTokens ?? null,
    totalTokens: usage.total_tokens ?? usage.totalTokens ?? null
  };
}

export async function runSingleLlmProbe({
  profile,
  config,
  prompt = DEFAULT_LLM_DIAGNOSTIC_PROMPT,
  timeoutMs,
  maxTokens,
  includeRaw = false,
  useProviderExtras = true,
  fetchImpl
}) {
  const extraBody = useProviderExtras ? (profile.extraBody ?? {}) : {};
  const startedAt = performance.now();
  const client = new ChatCompletionsClient({
    ...config.model,
    model: profile.model,
    temperature: profile.temperature ?? config.model.temperature,
    topP: profile.topP ?? config.model.topP,
    maxTokens: maxTokens ?? profile.maxTokens ?? config.model.maxTokens,
    timeoutMs: timeoutMs ?? profile.timeoutMs ?? config.model.timeoutMs,
    extraBody,
    fetchImpl
  });

  try {
    const payload = await client.createChatCompletion({
      messages: [
        {
          role: "system",
          content: [
            "You are testing OpenAI-compatible chat completion behavior.",
            "Return only executable Minecraft Bedrock commands, one per line.",
            "Do not use markdown, comments, bullets, or explanations."
          ].join("\n")
        },
        { role: "user", content: prompt }
      ],
      model: profile.model,
      temperature: profile.temperature ?? config.model.temperature,
      topP: profile.topP ?? config.model.topP,
      maxTokens: maxTokens ?? profile.maxTokens ?? config.model.maxTokens,
      stream: false,
      extraBody
    });
    const latencyMs = roundMs(performance.now() - startedAt);
    const content = payload?.choices?.[0]?.message?.content ?? "";
    const parsed = sanitizeCommands(content, {
      blockedCommands: config.behavior.blockedCommands,
      allowedCommands: config.behavior.allowedCommands
    });
    const compatible = typeof content === "string" && content.trim() !== "" && parsed.commands.length > 0 && parsed.rejected.length === 0;

    return {
      ok: true,
      compatible,
      profileId: profile.id,
      label: profile.label,
      model: profile.model,
      latencyMs,
      commandCount: parsed.commands.length,
      rejectedCount: parsed.rejected.length,
      firstCommand: parsed.commands[0] ?? null,
      finishReason: payload?.choices?.[0]?.finish_reason ?? null,
      responseModel: payload?.model ?? null,
      providerExtras: useProviderExtras,
      usage: extractUsage(payload),
      rawContent: includeRaw ? content : undefined,
      rejected: includeRaw ? parsed.rejected : undefined
    };
  } catch (error) {
    return {
      ok: false,
      compatible: false,
      profileId: profile.id,
      label: profile.label,
      model: profile.model,
      latencyMs: roundMs(performance.now() - startedAt),
      providerExtras: useProviderExtras,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export function summarizeLlmProbeResults(results) {
  const summaries = [];
  const byProfile = new Map();

  for (const result of results) {
    if (!byProfile.has(result.profileId)) byProfile.set(result.profileId, []);
    byProfile.get(result.profileId).push(result);
  }

  for (const [profileId, profileResults] of byProfile) {
    const latencies = profileResults.filter((result) => result.ok).map((result) => result.latencyMs);
    const successes = profileResults.filter((result) => result.ok).length;
    const compatible = profileResults.filter((result) => result.compatible).length;
    const failures = profileResults.filter((result) => !result.ok);

    summaries.push({
      profileId,
      label: profileResults[0]?.label ?? profileId,
      model: profileResults[0]?.model ?? profileId,
      attempts: profileResults.length,
      successes,
      failures: failures.length,
      successRate: profileResults.length === 0 ? 0 : successes / profileResults.length,
      compatible,
      compatibleRate: profileResults.length === 0 ? 0 : compatible / profileResults.length,
      minLatencyMs: latencies.length ? Math.min(...latencies) : null,
      avgLatencyMs: latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : null,
      p95LatencyMs: percentile(latencies, 95),
      maxLatencyMs: latencies.length ? Math.max(...latencies) : null,
      lastError: failures.at(-1)?.error ?? null
    });
  }

  return summaries.sort((a, b) => {
    if (a.successRate !== b.successRate) return b.successRate - a.successRate;
    return (a.avgLatencyMs ?? Number.MAX_SAFE_INTEGER) - (b.avgLatencyMs ?? Number.MAX_SAFE_INTEGER);
  });
}

export async function runLlmDiagnostics({
  profiles,
  config,
  iterations = 1,
  cooldownMs = 1500,
  prompt = DEFAULT_LLM_DIAGNOSTIC_PROMPT,
  timeoutMs,
  maxTokens,
  includeRaw = false,
  useProviderExtras = true,
  onResult
}) {
  const results = [];

  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    for (const profile of profiles) {
      const result = await runSingleLlmProbe({
        profile,
        config,
        prompt,
        timeoutMs,
        maxTokens,
        includeRaw,
        useProviderExtras
      });
      result.iteration = iteration;
      results.push(result);
      onResult?.(result);

      if (cooldownMs > 0) {
        await sleep(cooldownMs);
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    baseUrl: config.model.baseUrl,
    iterations,
    providerExtras: useProviderExtras,
    prompt,
    results,
    summary: summarizeLlmProbeResults(results)
  };
}
