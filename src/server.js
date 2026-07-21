import { WebSocketServer } from "ws";
import { ChatCompletionsClient } from "./modelClient.js";
import { MinecraftCommandQueue } from "./commandQueue.js";
import {
  createSubscribePacket,
  createTellRawCommand,
  extractAiPrompt,
  extractChatEvent,
  isCommandResponsePacket,
  parseSocketMessage,
  sanitizeCommands
} from "./minecraftProtocol.js";

export class MinecraftAiBridge {
  constructor(config, { logger = console, modelClient = new ChatCompletionsClient(config.model) } = {}) {
    this.config = config;
    this.logger = logger;
    this.modelClient = modelClient;
    this.server = null;
    this.queues = new Map();
  }

  async start() {
    const { host, port } = this.config.minecraft;
    this.server = new WebSocketServer({ host, port });

    this.server.on("connection", (socket, request) => this.#handleConnection(socket, request));
    this.server.on("error", (error) => this.logger.error("WebSocket server error:", error));

    await new Promise((resolve) => this.server.once("listening", resolve));
  }

  async stop() {
    for (const queue of this.queues.values()) {
      queue.close();
    }
    this.queues.clear();

    if (!this.server) return;
    await new Promise((resolve, reject) => {
      this.server.close((error) => (error ? reject(error) : resolve()));
    });
    this.server = null;
  }

  #handleConnection(socket, request) {
    const peer = `${request.socket.remoteAddress}:${request.socket.remotePort}`;
    this.logger.info(`Minecraft connected from ${peer}`);

    const queue = new MinecraftCommandQueue({
      socket,
      maxInFlight: this.config.minecraft.maxInFlight,
      commandDelayMs: this.config.minecraft.commandDelayMs,
      dryRun: this.config.behavior.dryRun,
      logger: this.logger,
      onJobComplete: (job) => this.#handleJobComplete(queue, job)
    });

    this.queues.set(socket, queue);
    socket.send(JSON.stringify(createSubscribePacket("PlayerMessage")));
    this.#enqueueStatus(queue, `AI bridge connected. Type ${this.config.behavior.commandPrefix} followed by a build prompt.`);

    socket.on("message", (raw) => {
      void this.#handleSocketMessage(queue, raw);
    });
    socket.on("close", () => {
      queue.close();
      this.queues.delete(socket);
      this.logger.info(`Minecraft disconnected from ${peer}`);
    });
    socket.on("error", (error) => this.logger.error("Minecraft socket error:", error));
  }

  async #handleSocketMessage(queue, raw) {
    const packet = parseSocketMessage(raw);
    if (!packet) {
      this.logger.warn("Ignoring non-JSON WebSocket message from Minecraft.");
      return;
    }

    if (isCommandResponsePacket(packet)) {
      queue.handlePacket(packet);
      return;
    }

    const chat = extractChatEvent(packet);
    if (!chat) return;

    const prompt = extractAiPrompt(chat.message, this.config.behavior.commandPrefix);
    if (prompt == null) return;

    await this.#handleAiPrompt(queue, prompt, chat);
  }

  async #handleAiPrompt(queue, prompt, chat) {
    if (!prompt) {
      this.#enqueueStatus(queue, `Usage: ${this.config.behavior.commandPrefix} build a small glass greenhouse`);
      return;
    }

    const sender = chat.sender ? `${chat.sender}: ` : "";
    this.logger.info(`AI prompt from ${chat.sender || "unknown player"}: ${prompt}`);
    this.#enqueueStatus(queue, `AI is planning: ${sender}${prompt}`);

    try {
      const rawCommands = await this.modelClient.createCommandText(prompt);
      const { commands, rejected } = sanitizeCommands(rawCommands, {
        blockedCommands: this.config.behavior.blockedCommands,
        allowedCommands: this.config.behavior.allowedCommands
      });

      if (rejected.length > 0) {
        this.logger.warn(`Rejected ${rejected.length} generated line(s):`, rejected);
      }

      if (commands.length === 0) {
        this.#enqueueStatus(queue, "AI returned no executable commands.");
        return;
      }

      this.logger.info(`Queueing ${commands.length} Minecraft command(s).`);
      queue.enqueue(commands, {
        kind: "ai-build",
        prompt,
        sender: chat.sender,
        rejectedCount: rejected.length
      });
    } catch (error) {
      this.logger.error("AI request failed:", error);
      this.#enqueueStatus(queue, `AI request failed: ${error.message}`);
    }
  }

  #handleJobComplete(queue, job) {
    if (job.meta?.kind !== "ai-build") return;

    const rejectedText = job.meta.rejectedCount ? ` Rejected ${job.meta.rejectedCount} invalid line(s).` : "";
    if (job.failed > 0) {
      const firstError = job.errors[0];
      this.logger.warn(`AI build completed with ${job.failed} failed command(s). First error:`, firstError);
      this.#enqueueStatus(queue, `AI build finished: ${job.ok}/${job.total} commands succeeded.${rejectedText}`);
      return;
    }

    this.#enqueueStatus(queue, `AI build finished: ${job.ok}/${job.total} commands succeeded.${rejectedText}`);
  }

  #enqueueStatus(queue, message) {
    if (!this.config.behavior.includeStatusMessages) return;
    queue.enqueue([createTellRawCommand(message, this.config.behavior.statusTarget)], { kind: "status" });
  }
}
