export const NIM_LLM_MODEL_PROFILES = [
  {
    id: "glm-5.2",
    label: "GLM 5.2",
    model: "z-ai/glm-5.2",
    temperature: 0.2,
    topP: 1,
    maxTokens: 512,
    timeoutMs: 180_000,
    expectedFast: false
  },
  {
    id: "deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    model: "deepseek-ai/deepseek-v4-pro",
    temperature: 0.2,
    topP: 0.95,
    maxTokens: 512,
    timeoutMs: 180_000,
    expectedFast: false,
    extraBody: {
      reasoning_effort: "none"
    }
  },
  {
    id: "kimi-k2.6",
    label: "Kimi K2.6",
    model: "moonshotai/kimi-k2.6",
    temperature: 0.2,
    topP: 1,
    maxTokens: 512,
    timeoutMs: 180_000,
    expectedFast: false,
    extraBody: {
      seed: 0,
      include_reasoning: false,
      chat_template_kwargs: {
        thinking: false
      }
    }
  },
  {
    id: "nemotron-3-ultra",
    label: "Nemotron 3 Ultra",
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    temperature: 0.2,
    topP: 0.95,
    maxTokens: 512,
    timeoutMs: 180_000,
    expectedFast: false,
    extraBody: {
      chat_template_kwargs: {
        enable_thinking: false,
        force_nonempty_content: true
      }
    }
  },
  {
    id: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    model: "deepseek-ai/deepseek-v4-flash",
    temperature: 0.2,
    topP: 0.95,
    maxTokens: 512,
    timeoutMs: 90_000,
    expectedFast: true,
    extraBody: {
      chat_template_kwargs: {
        thinking: false,
        reasoning_effort: "none"
      }
    }
  }
];

export function findModelProfiles(selection = "all", profiles = NIM_LLM_MODEL_PROFILES) {
  const requested = String(selection || "all")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (requested.length === 0 || requested.includes("all")) return profiles;

  const byKey = new Map();
  for (const profile of profiles) {
    byKey.set(profile.id.toLowerCase(), profile);
    byKey.set(profile.model.toLowerCase(), profile);
    byKey.set(profile.label.toLowerCase(), profile);
  }

  return requested.map((key) => {
    const profile = byKey.get(key);
    if (!profile) {
      throw new Error(`Unknown LLM model profile "${key}". Known profiles: ${profiles.map((item) => item.id).join(", ")}`);
    }
    return profile;
  });
}
