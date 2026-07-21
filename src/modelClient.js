import { SYSTEM_PROMPT } from "./prompts.js";

export function redactProviderError(text) {
  return String(text)
    .replace(/account '[^']+'/gi, "account '[redacted]'")
    .replace(/Bearer\s+[a-z0-9._~+/=-]+/gi, "Bearer [redacted]");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRequestId(payload, response) {
  return (
    payload?.requestId ??
    payload?.request_id ??
    payload?.id ??
    payload?.status?.requestId ??
    response.headers?.get?.("NVCF-REQID") ??
    response.headers?.get?.("x-request-id") ??
    null
  );
}

export class ChatCompletionsClient {
  constructor({
    apiKey,
    baseUrl,
    model,
    temperature = 0.3,
    topP = 1,
    maxTokens = 4096,
    timeoutMs = 120_000,
    pollIntervalMs = 1000,
    extraBody = {},
    fetchImpl = globalThis.fetch
  }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.temperature = temperature;
    this.topP = topP;
    this.maxTokens = maxTokens;
    this.timeoutMs = timeoutMs;
    this.pollIntervalMs = pollIntervalMs;
    this.extraBody = extraBody;
    this.fetchImpl = fetchImpl;
  }

  async createChatCompletion({
    messages,
    model = this.model,
    temperature = this.temperature,
    topP = this.topP,
    maxTokens = this.maxTokens,
    stream = false,
    extraBody = {}
  }) {
    if (!this.apiKey) {
      throw new Error("Missing API key. Set NVIDIA_API_KEY for the default NIM endpoint, or OPENAI_API_KEY for another OpenAI-compatible endpoint.");
    }
    if (typeof this.fetchImpl !== "function") {
      throw new Error("No fetch implementation is available. Use Node.js 20 or newer.");
    }

    const deadline = Date.now() + this.timeoutMs;

    const { response, responseText, payload } = await this.#fetchJson(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          ...this.extraBody,
          ...extraBody,
          model,
          messages,
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
          stream
        })
      },
      deadline
    );

    if (response.status === 202) {
      const requestId = extractRequestId(payload, response);
      if (!requestId) {
        throw new Error(`Chat completion returned HTTP 202 without a requestId: ${redactProviderError(responseText.slice(0, 1000))}`);
      }

      return this.#pollStatus(requestId, deadline);
    }

    if (!response.ok) {
      throw new Error(`Chat completion failed with HTTP ${response.status}: ${redactProviderError(responseText.slice(0, 1000))}`);
    }

    return payload;
  }

  async createCommandText(prompt, options = {}) {
    const payload = await this.createChatCompletion({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      ...options
    });

      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.trim() === "") {
        throw new Error("Chat completion response did not include choices[0].message.content.");
      }

      return content;
  }

  async #pollStatus(requestId, deadline) {
    while (Date.now() < deadline) {
      await sleep(Math.min(this.pollIntervalMs, Math.max(0, deadline - Date.now())));

      const { response, responseText, payload } = await this.#fetchJson(
        `${this.baseUrl}/status/${encodeURIComponent(requestId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json"
          }
        },
        deadline
      );

      if (response.status === 202) continue;
      if (!response.ok) {
        throw new Error(`Chat completion status poll failed with HTTP ${response.status}: ${redactProviderError(responseText.slice(0, 1000))}`);
      }

      return payload;
    }

    throw new Error(`Chat completion timed out after ${this.timeoutMs}ms while polling status.`);
  }

  async #fetchJson(url, request, deadline) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new Error(`Chat completion timed out after ${this.timeoutMs}ms.`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remainingMs);

    try {
      const response = await this.fetchImpl(url, {
        ...request,
        signal: controller.signal
      });
      const responseText = await response.text();
      let payload = {};

      if (responseText.trim()) {
        try {
          payload = JSON.parse(responseText);
        } catch (error) {
          throw new Error(`Chat completion returned invalid JSON: ${error.message}`);
        }
      }

      return { response, responseText, payload };
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error(`Chat completion timed out after ${this.timeoutMs}ms.`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
