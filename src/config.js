import { DEFAULT_ALLOWED_COMMANDS } from "./minecraftProtocol.js";

const DEFAULT_BLOCKED_COMMANDS = [
  "connect",
  "wsserver",
  "stop",
  "kick",
  "ban",
  "ban-ip",
  "pardon",
  "op",
  "deop",
  "allowlist",
  "whitelist",
  "save",
  "reload",
  "transfer"
];

function parseBoolean(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function parseInteger(value, fallback, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseFloatValue(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  const parsed = Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseList(value, fallback) {
  if (value == null) return fallback;
  if (value.trim() === "*") return null;
  if (value.trim() === "") return [];
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, "");
}

export function loadConfig(env = process.env) {
  const baseUrl = stripTrailingSlash(env.OPENAI_BASE_URL || env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1");
  const apiKey = env.NVIDIA_API_KEY || env.OPENAI_API_KEY || "";

  return {
    minecraft: {
      host: env.MC_WS_HOST || "0.0.0.0",
      port: parseInteger(env.MC_WS_PORT, 3000, { min: 1, max: 65535 }),
      maxInFlight: parseInteger(env.MC_MAX_IN_FLIGHT, 50, { min: 1, max: 95 }),
      commandDelayMs: parseInteger(env.MC_COMMAND_DELAY_MS, 0, { min: 0, max: 60_000 })
    },
    model: {
      apiKey,
      baseUrl,
      model: env.OPENAI_MODEL || env.NVIDIA_MODEL || "z-ai/glm-5.2",
      temperature: parseFloatValue(env.OPENAI_TEMPERATURE, 0.3, { min: 0, max: 1 }),
      topP: parseFloatValue(env.OPENAI_TOP_P, 1, { min: 0, max: 1 }),
      maxTokens: parseInteger(env.OPENAI_MAX_TOKENS, 4096, { min: 1, max: 32768 }),
      timeoutMs: parseInteger(env.OPENAI_TIMEOUT_MS, 180_000, { min: 1000, max: 600_000 })
    },
    behavior: {
      commandPrefix: env.MC_AI_PREFIX || "!ai",
      statusTarget: env.MC_STATUS_TARGET || "@a",
      includeStatusMessages: parseBoolean(env.MC_STATUS_MESSAGES, true),
      dryRun: parseBoolean(env.DRY_RUN_COMMANDS, false),
      blockedCommands: parseList(env.MC_BLOCKED_COMMANDS, DEFAULT_BLOCKED_COMMANDS),
      allowedCommands: parseList(env.MC_ALLOWED_COMMANDS, DEFAULT_ALLOWED_COMMANDS)
    }
  };
}
