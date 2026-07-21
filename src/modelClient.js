import { SYSTEM_PROMPT } from "./prompts.js";

export function redactProviderError(text) {
  return String(text)
    .replace(/account '[^']+'/gi, "account '[redacted]'")
    .replace(/Bearer\s+[a-z0-9._~+/=-]+/gi, "Bearer [redacted]");
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
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
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Chat completion failed with HTTP ${response.status}: ${redactProviderError(responseText.slice(0, 1000))}`);
      }
      if (response.status === 202) {
        throw new Error(`Chat completion returned HTTP 202 pending, which this bridge does not poll yet: ${redactProviderError(responseText.slice(0, 1000))}`);
      }

      let payload;
      try {
        payload = JSON.parse(responseText);
      } catch (error) {
        throw new Error(`Chat completion returned invalid JSON: ${error.message}`);
      }

      return payload;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error(`Chat completion timed out after ${this.timeoutMs}ms.`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
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
}
