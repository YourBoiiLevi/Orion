import { randomUUID } from "node:crypto";

export const DEFAULT_ALLOWED_COMMANDS = [
  "ability",
  "alwaysday",
  "camera",
  "camerashake",
  "clear",
  "clearspawnpoint",
  "clone",
  "controlscheme",
  "damage",
  "daylock",
  "dialogue",
  "difficulty",
  "effect",
  "enchant",
  "event",
  "execute",
  "fill",
  "fog",
  "function",
  "gamemode",
  "gamerule",
  "give",
  "help",
  "hud",
  "inputpermission",
  "locate",
  "loot",
  "me",
  "mobevent",
  "music",
  "particle",
  "place",
  "playanimation",
  "playsound",
  "recipe",
  "replaceitem",
  "ride",
  "say",
  "schedule",
  "scoreboard",
  "scriptevent",
  "setblock",
  "setmaxplayers",
  "setworldspawn",
  "spawnpoint",
  "spreadplayers",
  "stopsound",
  "structure",
  "summon",
  "tag",
  "teleport",
  "tell",
  "tellraw",
  "testfor",
  "testforblock",
  "testforblocks",
  "tickingarea",
  "time",
  "title",
  "titleraw",
  "toggledownfall",
  "tp",
  "weather",
  "w",
  "msg",
  "xp"
];

export function parseSocketMessage(raw) {
  const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function createRequestPacket(messagePurpose, body, requestId = randomUUID()) {
  return {
    header: {
      version: 1,
      requestId,
      messageType: "commandRequest",
      messagePurpose
    },
    body
  };
}

export function createSubscribePacket(eventName = "PlayerMessage") {
  return createRequestPacket("subscribe", { eventName });
}

export function normalizeCommandLine(commandLine) {
  return String(commandLine ?? "").trim().replace(/^\/+/, "");
}

export function createCommandPacket(commandLine, requestId = randomUUID()) {
  return createRequestPacket(
    "commandRequest",
    {
      version: 1,
      commandLine: normalizeCommandLine(commandLine),
      origin: { type: "player" }
    },
    requestId
  );
}

export function createTellRawCommand(message, target = "@a") {
  const payload = JSON.stringify({ rawtext: [{ text: String(message) }] });
  return `tellraw ${target} ${payload}`;
}

export function isCommandResponsePacket(packet) {
  const purpose = packet?.header?.messagePurpose;
  return purpose === "commandResponse" || purpose === "error";
}

function firstString(...values) {
  return values.find((value) => typeof value === "string" && value.length > 0) ?? "";
}

export function extractChatEvent(packet) {
  const body = packet?.body ?? {};
  const properties = body.properties ?? {};
  const eventName = firstString(
    packet?.header?.eventName,
    body.eventName,
    properties.eventName,
    body.name,
    properties.name
  );

  if (eventName !== "PlayerMessage") return null;

  const message = firstString(
    body.message,
    body.Message,
    body.text,
    body.Text,
    properties.message,
    properties.Message,
    properties.text,
    properties.Text
  );

  if (!message) return null;

  return {
    message,
    sender: firstString(
      body.sender,
      body.Sender,
      body.player,
      body.Player,
      body.username,
      body.Username,
      properties.sender,
      properties.Sender,
      properties.player,
      properties.Player,
      properties.username,
      properties.Username
    ),
    receiver: firstString(body.receiver, body.Receiver, properties.receiver, properties.Receiver),
    type: firstString(body.type, body.Type, properties.type, properties.Type)
  };
}

export function extractAiPrompt(message, prefix = "!ai") {
  const normalizedMessage = String(message ?? "").trimStart();
  if (!normalizedMessage.startsWith(prefix)) return null;
  return normalizedMessage.slice(prefix.length).trim();
}

function stripMarkdownFences(text) {
  return text
    .split("\n")
    .filter((line) => !line.trim().startsWith("```"))
    .join("\n");
}

function commandName(commandLine) {
  return commandLine.split(/\s+/, 1)[0]?.toLowerCase() ?? "";
}

export function sanitizeCommands(rawText, { blockedCommands = [], allowedCommands = DEFAULT_ALLOWED_COMMANDS, maxCommandLength = 32767 } = {}) {
  const blocked = new Set(blockedCommands.map((command) => command.toLowerCase()));
  const allowed = allowedCommands == null ? null : new Set(allowedCommands.map((command) => command.toLowerCase()));
  const commands = [];
  const rejected = [];
  const text = stripMarkdownFences(String(rawText ?? "").replace(/\r\n/g, "\n").replace(/<think>[\s\S]*?<\/think>/gi, "")).trim();

  for (const [index, originalLine] of text.split("\n").entries()) {
    let line = originalLine.trim();
    if (!line) continue;
    if (line.startsWith("#") || line.startsWith("//") || line.startsWith("--")) {
      rejected.push({ line: originalLine, reason: "comment", index });
      continue;
    }

    line = line.replace(/^\d+[\.)]\s+/, "").replace(/^[-*]\s+/, "");
    line = normalizeCommandLine(line);

    const name = commandName(line);
    if (!/^[a-z][a-z0-9:_-]*$/i.test(name)) {
      rejected.push({ line: originalLine, reason: "invalid command name", index });
      continue;
    }
    if (allowed && !allowed.has(name)) {
      rejected.push({ line: originalLine, reason: `unknown command: ${name}`, index });
      continue;
    }
    if (blocked.has(name)) {
      rejected.push({ line: originalLine, reason: `blocked command: ${name}`, index });
      continue;
    }
    if (line.length > maxCommandLength) {
      rejected.push({ line: originalLine, reason: "too long", index });
      continue;
    }

    commands.push(line);
  }

  return { commands, rejected };
}
