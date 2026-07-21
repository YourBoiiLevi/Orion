import { loadDotEnv } from "./env.js";
import { loadConfig } from "./config.js";
import { MinecraftAiBridge } from "./server.js";

loadDotEnv();

const config = loadConfig();
const bridge = new MinecraftAiBridge(config);

await bridge.start();

console.log(`Minecraft AI bridge listening on ws://${config.minecraft.host}:${config.minecraft.port}`);
console.log(`In Minecraft Bedrock, enable cheats and run: /connect localhost:${config.minecraft.port}`);
console.log(`Then type: ${config.behavior.commandPrefix} build a cozy spruce cabin`);
console.log(`Model: ${config.model.model} via ${config.model.baseUrl}`);
if (!config.model.apiKey) {
  console.warn("No API key found. Set NVIDIA_API_KEY in .env or in your shell before using !ai.");
}

async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down...`);
  await bridge.stop();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
