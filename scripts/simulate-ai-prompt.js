import { performance } from "node:perf_hooks";
import { loadConfig } from "../src/config.js";
import { loadDotEnv } from "../src/env.js";
import { ChatCompletionsClient } from "../src/modelClient.js";
import { sanitizeCommands } from "../src/minecraftProtocol.js";

function parseArgs(argv) {
  const args = {
    prompt: "build me a cozy spruce house",
    includeRaw: false,
    debug: process.env.DEBUG_LLM !== "false"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--prompt") args.prompt = argv[++index];
    if (arg === "--raw") args.includeRaw = true;
    if (arg === "--quiet") args.debug = false;
  }

  return args;
}

loadDotEnv();

const args = parseArgs(process.argv.slice(2));
const config = loadConfig();

if (!config.model.apiKey) {
  console.error("No API key found. Set NVIDIA_API_KEY in .env or in your shell.");
  process.exit(1);
}

const client = new ChatCompletionsClient({
  ...config.model,
  logger: console,
  debug: args.debug
});

console.log(`Simulating Minecraft prompt against ${config.model.model}`);
if (config.model.profileId) {
  console.log(`Using model profile: ${config.model.profileId}`);
}
console.log(`Prompt: ${args.prompt}`);

const startedAt = performance.now();
try {
  const rawCommands = await client.createCommandText(args.prompt);
  const elapsedMs = Math.round(performance.now() - startedAt);
  const parsed = sanitizeCommands(rawCommands, {
    blockedCommands: config.behavior.blockedCommands,
    allowedCommands: config.behavior.allowedCommands
  });

  console.log(`Model returned in ${elapsedMs}ms`);
  console.log(`Raw characters: ${rawCommands.length}`);
  console.log(`Parsed commands: ${parsed.commands.length}`);
  console.log(`Rejected lines: ${parsed.rejected.length}`);

  if (args.includeRaw) {
    console.log("\n--- Raw model output ---");
    console.log(rawCommands);
  }

  console.log("\n--- Parsed commands ---");
  for (const command of parsed.commands) {
    console.log(command);
  }

  if (parsed.rejected.length > 0) {
    console.log("\n--- Rejected lines ---");
    console.log(JSON.stringify(parsed.rejected, null, 2));
  }
} catch (error) {
  console.error(`Simulation failed after ${Math.round(performance.now() - startedAt)}ms:`, error);
  process.exit(1);
}
