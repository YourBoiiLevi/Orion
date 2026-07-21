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

test("redactProviderError removes account ids and bearer tokens from provider errors", () => {
  const redacted = redactProviderError("Not found for account 'abc123' using Bearer nvapi-secret");

  assert.equal(redacted, "Not found for account '[redacted]' using Bearer [redacted]");
});
