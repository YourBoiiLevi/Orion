import test from "node:test";
import assert from "node:assert/strict";
import { MinecraftCommandQueue } from "../src/commandQueue.js";

class FakeSocket {
  readyState = 1;
  sent = [];

  send(payload) {
    this.sent.push(JSON.parse(payload));
  }
}

function responseFor(packet, statusCode = 0, statusMessage = "OK") {
  return {
    header: {
      messagePurpose: statusCode < 0 ? "error" : "commandResponse",
      requestId: packet.header.requestId
    },
    body: { statusCode, statusMessage }
  };
}

test("queue respects maxInFlight and sends more after responses", () => {
  const socket = new FakeSocket();
  const completed = [];
  const queue = new MinecraftCommandQueue({
    socket,
    maxInFlight: 2,
    onJobComplete: (job) => completed.push(job)
  });

  queue.enqueue(["setblock ~ ~ ~ stone", "setblock ~1 ~ ~ stone", "setblock ~2 ~ ~ stone"]);

  assert.equal(socket.sent.length, 2);
  assert.equal(queue.inFlight.size, 2);

  queue.handlePacket(responseFor(socket.sent[0]));

  assert.equal(socket.sent.length, 3);
  assert.equal(queue.inFlight.size, 2);

  queue.handlePacket(responseFor(socket.sent[1]));
  queue.handlePacket(responseFor(socket.sent[2]));

  assert.equal(completed.length, 1);
  assert.equal(completed[0].ok, 3);
  assert.equal(completed[0].failed, 0);
});

test("queue records command failures on completed jobs", () => {
  const socket = new FakeSocket();
  const completed = [];
  const queue = new MinecraftCommandQueue({
    socket,
    maxInFlight: 5,
    onJobComplete: (job) => completed.push(job)
  });

  queue.enqueue(["setblock ~ ~ ~ stone", "badcommand"]);

  queue.handlePacket(responseFor(socket.sent[0]));
  queue.handlePacket(responseFor(socket.sent[1], -2147483648, "Syntax error"));

  assert.equal(completed.length, 1);
  assert.equal(completed[0].ok, 1);
  assert.equal(completed[0].failed, 1);
  assert.equal(completed[0].errors[0].commandLine, "badcommand");
  assert.equal(completed[0].errors[0].statusMessage, "Syntax error");
});

test("dry run completes immediately without sending packets", () => {
  const socket = new FakeSocket();
  const completed = [];
  const queue = new MinecraftCommandQueue({
    socket,
    dryRun: true,
    logger: { info() {} },
    onJobComplete: (job) => completed.push(job)
  });

  queue.enqueue(["fill ~ ~ ~ ~1 ~1 ~1 glass"]);

  assert.equal(socket.sent.length, 0);
  assert.equal(completed.length, 1);
  assert.equal(completed[0].ok, 1);
});
