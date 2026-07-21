import { randomUUID } from "node:crypto";
import { createCommandPacket } from "./minecraftProtocol.js";

export class MinecraftCommandQueue {
  constructor({
    socket,
    maxInFlight = 50,
    commandDelayMs = 0,
    dryRun = false,
    logger = console,
    onJobComplete = () => {}
  }) {
    this.socket = socket;
    this.maxInFlight = maxInFlight;
    this.commandDelayMs = commandDelayMs;
    this.dryRun = dryRun;
    this.logger = logger;
    this.onJobComplete = onJobComplete;
    this.sendQueue = [];
    this.inFlight = new Map();
    this.jobs = new Map();
    this.drainTimer = null;
  }

  enqueue(commands, meta = {}) {
    const job = {
      id: randomUUID(),
      meta,
      total: commands.length,
      completed: 0,
      ok: 0,
      failed: 0,
      errors: [],
      createdAt: new Date()
    };

    this.jobs.set(job.id, job);

    if (this.dryRun) {
      for (const commandLine of commands) {
        this.logger.info(`[dry-run] ${commandLine}`);
      }
      job.completed = commands.length;
      job.ok = commands.length;
      this.#completeJob(job);
      return job;
    }

    for (const commandLine of commands) {
      this.sendQueue.push({
        requestId: randomUUID(),
        commandLine,
        jobId: job.id
      });
    }

    this.drain();
    return job;
  }

  handlePacket(packet) {
    const requestId = packet?.header?.requestId;
    if (!requestId || !this.inFlight.has(requestId)) {
      this.drain();
      return;
    }

    const item = this.inFlight.get(requestId);
    this.inFlight.delete(requestId);

    const job = this.jobs.get(item.jobId);
    if (job) {
      const statusCode = Number(packet?.body?.statusCode ?? 0);
      const failed = packet?.header?.messagePurpose === "error" || statusCode < 0;
      job.completed += 1;
      if (failed) {
        job.failed += 1;
        job.errors.push({
          commandLine: item.commandLine,
          statusCode,
          statusMessage: String(packet?.body?.statusMessage ?? "Unknown Minecraft command error")
        });
      } else {
        job.ok += 1;
      }

      if (job.completed >= job.total) {
        this.#completeJob(job);
      }
    }

    this.drain();
  }

  drain() {
    if (this.dryRun || !this.#isSocketOpen()) return;
    if (this.commandDelayMs > 0) {
      this.#scheduleDelayedDrain();
      return;
    }

    while (this.inFlight.size < this.maxInFlight && this.sendQueue.length > 0) {
      this.#sendNext();
    }
  }

  close() {
    if (this.drainTimer) {
      clearTimeout(this.drainTimer);
      this.drainTimer = null;
    }
    this.sendQueue = [];
    this.inFlight.clear();
    this.jobs.clear();
  }

  #scheduleDelayedDrain() {
    if (this.drainTimer || this.inFlight.size >= this.maxInFlight || this.sendQueue.length === 0) return;
    this.drainTimer = setTimeout(() => {
      this.drainTimer = null;
      if (this.inFlight.size < this.maxInFlight) {
        this.#sendNext();
      }
      this.#scheduleDelayedDrain();
    }, this.commandDelayMs);
  }

  #sendNext() {
    const item = this.sendQueue.shift();
    if (!item || !this.#isSocketOpen()) return;

    const packet = createCommandPacket(item.commandLine, item.requestId);
    this.socket.send(JSON.stringify(packet));
    this.inFlight.set(item.requestId, item);
  }

  #completeJob(job) {
    this.jobs.delete(job.id);
    this.onJobComplete(job);
  }

  #isSocketOpen() {
    return this.socket?.readyState == null || this.socket.readyState === 1;
  }
}
