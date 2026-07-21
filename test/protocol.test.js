import test from "node:test";
import assert from "node:assert/strict";
import {
  createCommandPacket,
  createTellRawCommand,
  extractAiPrompt,
  extractChatEvent,
  sanitizeCommands
} from "../src/minecraftProtocol.js";

test("extractAiPrompt detects prefixed chat and returns everything after !ai", () => {
  assert.equal(extractAiPrompt("!ai build a tower"), "build a tower");
  assert.equal(extractAiPrompt("   !aibuild a tower"), "build a tower");
  assert.equal(extractAiPrompt("hello !ai build"), null);
});

test("extractChatEvent supports PlayerMessage packets with direct body fields", () => {
  const chat = extractChatEvent({
    header: { eventName: "PlayerMessage", messagePurpose: "event" },
    body: { message: "!ai build", sender: "Aathreya", type: "chat" }
  });

  assert.deepEqual(chat, {
    message: "!ai build",
    sender: "Aathreya",
    receiver: "",
    type: "chat"
  });
});

test("extractChatEvent supports PlayerMessage packets with properties payloads", () => {
  const chat = extractChatEvent({
    header: { messagePurpose: "event" },
    body: {
      eventName: "PlayerMessage",
      properties: { Message: "!ai castle", Sender: "Builder" }
    }
  });

  assert.equal(chat.message, "!ai castle");
  assert.equal(chat.sender, "Builder");
});

test("sanitizeCommands strips fences, slashes, bullets, and rejects unsafe lines", () => {
  const result = sanitizeCommands(
    [
      "```mcfunction",
      "/fill ~ ~ ~ ~5 ~3 ~5 stonebrick",
      "1. /setblock ~1 ~1 ~1 torch",
      "// comment",
      "/stop",
      "not a command?",
      "```"
    ].join("\n"),
    { blockedCommands: ["stop"] }
  );

  assert.deepEqual(result.commands, [
    "fill ~ ~ ~ ~5 ~3 ~5 stonebrick",
    "setblock ~1 ~1 ~1 torch"
  ]);
  assert.equal(result.rejected.length, 3);
});

test("createCommandPacket uses Bedrock commandRequest shape", () => {
  const packet = createCommandPacket("/setblock ~ ~ ~ stone", "request-1");
  assert.equal(packet.header.messagePurpose, "commandRequest");
  assert.equal(packet.header.messageType, "commandRequest");
  assert.equal(packet.header.requestId, "request-1");
  assert.equal(packet.body.commandLine, "setblock ~ ~ ~ stone");
  assert.deepEqual(packet.body.origin, { type: "player" });
});

test("createTellRawCommand escapes JSON message content", () => {
  const command = createTellRawCommand('AI says "done"', "@a");
  assert.equal(command, 'tellraw @a {"rawtext":[{"text":"AI says \\"done\\""}]}');
});
