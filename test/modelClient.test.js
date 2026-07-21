import test from "node:test";
import assert from "node:assert/strict";
import { ChatCompletionsClient, redactProviderError } from "../src/modelClient.js";

test("ChatCompletionsClient sends an OpenAI-compatible non-streaming chat completion request", async () => {
  let capturedUrl = "";
  let capturedRequest = null;
  const fetchImpl = async (url, request) => {
    capturedUrl = url;
    capturedRequest = request;
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: "setblock ~ ~ ~ stone" } }]
      }),
      { status: 200 }
    );
  };

  const client = new ChatCompletionsClient({
    apiKey: "test-key",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    model: "z-ai/glm-5.2",
    fetchImpl
  });

  const content = await client.createCommandText("build a stone marker");
  const body = JSON.parse(capturedRequest.body);

  assert.equal(content, "setblock ~ ~ ~ stone");
  assert.equal(capturedUrl, "https://integrate.api.nvidia.com/v1/chat/completions");
  assert.equal(capturedRequest.method, "POST");
  assert.equal(capturedRequest.headers.Authorization, "Bearer test-key");
  assert.equal(body.model, "z-ai/glm-5.2");
  assert.equal(body.stream, false);
  assert.equal(body.messages[0].role, "system");
  assert.equal(body.messages[1].role, "user");
});

test("ChatCompletionsClient can include provider-specific OpenAI-compatible extension fields", async () => {
  let capturedBody = null;
  const fetchImpl = async (_url, request) => {
    capturedBody = JSON.parse(request.body);
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: "setblock ~ ~ ~ stone" } }]
      }),
      { status: 200 }
    );
  };

  const client = new ChatCompletionsClient({
    apiKey: "test-key",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    model: "deepseek-ai/deepseek-v4-pro",
    extraBody: { reasoning_effort: "none" },
    fetchImpl
  });

  await client.createCommandText("build a stone marker", {
    extraBody: { seed: 0 }
  });

  assert.equal(capturedBody.reasoning_effort, "none");
  assert.equal(capturedBody.seed, 0);
  assert.equal(capturedBody.model, "deepseek-ai/deepseek-v4-pro");
});

test("ChatCompletionsClient polls NVIDIA status results when chat completions returns HTTP 202", async () => {
  const calls = [];
  const fetchImpl = async (url, request) => {
    calls.push({ url, request });
    if (String(url).endsWith("/chat/completions")) {
      return new Response(JSON.stringify({ requestId: "request-1" }), { status: 202 });
    }

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: "setblock ~ ~ ~ stone" } }]
      }),
      { status: 200 }
    );
  };

  const client = new ChatCompletionsClient({
    apiKey: "test-key",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    model: "z-ai/glm-5.2",
    pollIntervalMs: 1,
    fetchImpl
  });

  const content = await client.createCommandText("build a stone marker");

  assert.equal(content, "setblock ~ ~ ~ stone");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, "https://integrate.api.nvidia.com/v1/status/request-1");
  assert.equal(calls[1].request.method, "GET");
});

test("ChatCompletionsClient rejects HTTP 202 responses without a request id", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ status: "pending" }), { status: 202 });
  const client = new ChatCompletionsClient({
    apiKey: "test-key",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    model: "z-ai/glm-5.2",
    fetchImpl
  });

  await assert.rejects(
    () => client.createCommandText("build a stone marker"),
    /HTTP 202 without a requestId/
  );
});

test("redactProviderError removes account ids and bearer tokens from provider errors", () => {
  const redacted = redactProviderError("Not found for account 'abc123' using Bearer nvapi-secret");

  assert.equal(redacted, "Not found for account '[redacted]' using Bearer [redacted]");
});
