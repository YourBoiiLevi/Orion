import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function unquoteValue(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];
  if ((quote !== "\"" && quote !== "'") || trimmed.at(-1) !== quote) {
    return trimmed;
  }

  const inner = trimmed.slice(1, -1);
  if (quote === "'") return inner;

  return inner
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, "\"")
    .replace(/\\\\/g, "\\");
}

function stripInlineComment(value) {
  let quote = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previous = value[index - 1];

    if ((char === "\"" || char === "'") && previous !== "\\") {
      quote = quote === char ? null : quote ?? char;
      continue;
    }

    if (char === "#" && quote == null && /\s/.test(previous ?? "")) {
      return value.slice(0, index);
    }
  }

  return value;
}

export function parseDotEnv(text) {
  const parsed = {};

  for (const rawLine of String(text ?? "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const normalized = line.startsWith("export ") ? line.slice("export ".length).trimStart() : line;
    const equalsIndex = normalized.indexOf("=");
    if (equalsIndex <= 0) continue;

    const key = normalized.slice(0, equalsIndex).trim();
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) continue;

    const value = stripInlineComment(normalized.slice(equalsIndex + 1));
    parsed[key] = unquoteValue(value);
  }

  return parsed;
}

export function loadDotEnv({
  path = resolve(process.cwd(), ".env"),
  env = process.env,
  override = false
} = {}) {
  let fileText;
  try {
    fileText = readFileSync(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return { loaded: false, path, parsed: {} };
    throw error;
  }

  const parsed = parseDotEnv(fileText);
  for (const [key, value] of Object.entries(parsed)) {
    if (override || env[key] == null) {
      env[key] = value;
    }
  }

  return { loaded: true, path, parsed };
}
