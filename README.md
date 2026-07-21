# Orion Minecraft AI Bridge

A local WebSocket bridge for Minecraft Bedrock Edition. Minecraft connects to this server with `/connect`; the bridge listens for chat messages starting with `!ai`, asks an OpenAI-compatible chat completions endpoint for Minecraft Bedrock commands, sanitizes the command-only response, and executes the commands through Bedrock's WebSocket command protocol with a bounded queue.

The default model endpoint is NVIDIA NIM's free `z-ai/glm-5.2` OpenAI-compatible chat completions API.

## What It Uses

- Minecraft Bedrock `/wsserver` / `/connect` connects the client to a WebSocket server and requires admin permission plus cheats enabled.
- Bedrock WebSocket JSON packets use `messagePurpose: "subscribe"` for events like `PlayerMessage` and `messagePurpose: "commandRequest"` to run commands.
- Bedrock can reject excessive pending commands, so this bridge tracks command responses and keeps in-flight commands below a configurable cap.
- NVIDIA NIM exposes `POST https://integrate.api.nvidia.com/v1/chat/completions`, defaults GLM-5.2 to `z-ai/glm-5.2`, and is compatible with the OpenAI Chat Completions shape.

## Setup

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` and set:

```text
NVIDIA_API_KEY=nvapi-your-key-here
```

The bridge automatically loads `.env` from the project directory when `npm start` runs. Variables already set in your shell take priority.

Then start the bridge:

```powershell
npm start
```

In Minecraft Bedrock:

```text
/connect localhost:3000
```

Then type a chat prompt:

```text
!ai build a compact wizard tower with lanterns and a spiral staircase
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `NVIDIA_API_KEY` | empty | API key for NVIDIA's hosted NIM endpoint. |
| `OPENAI_BASE_URL` | `https://integrate.api.nvidia.com/v1` | Any OpenAI-compatible base URL. |
| `OPENAI_MODEL` | `z-ai/glm-5.2` | Chat completions model name. |
| `OPENAI_TIMEOUT_MS` | `180000` | Chat completion timeout. GLM 5.2 can be slow on the free endpoint. |
| `MC_WS_HOST` | `0.0.0.0` | Local WebSocket bind host. |
| `MC_WS_PORT` | `3000` | Local WebSocket port. |
| `MC_AI_PREFIX` | `!ai` | Chat trigger prefix. |
| `MC_MAX_IN_FLIGHT` | `50` | Max commands waiting on Minecraft responses. Keep below 100. |
| `MC_COMMAND_DELAY_MS` | `0` | Optional per-command send delay. |
| `MC_BLOCKED_COMMANDS` | admin command list | Comma-separated command names rejected from model output. |
| `MC_ALLOWED_COMMANDS` | Bedrock command list | Comma-separated command names accepted from model output. Use `*` to allow unknown commands. |
| `DRY_RUN_COMMANDS` | `false` | Logs generated commands without sending them to Minecraft. |

## Development

Run tests:

```powershell
npm test
```

Run live LLM compatibility tests against NVIDIA NIM:

```powershell
npm run test:llm
```

Run a latency/stability diagnostic matrix and write a JSON report under `reports/`:

```powershell
npm run llm:diagnose -- --iterations 3
```

Limit the matrix to selected models:

```powershell
npm run llm:diagnose -- --models deepseek-v4-flash,glm-5.2 --iterations 5
```

Run with only the core OpenAI-compatible request body, without NVIDIA/model-specific extension fields:

```powershell
npm run llm:diagnose -- --models kimi-k2.6 --minimal
```

The live checks use `NVIDIA_API_KEY` from `.env`, call `POST /v1/chat/completions`, validate that each model returns OpenAI-compatible `choices[0].message.content`, and run the response through the same command parser used by the Minecraft bridge. Reports include latency, success rate, parser compatibility, finish reason, token usage when available, and first parsed command. They never include your API key, and provider account identifiers in error bodies are redacted.

Run with auto-restart:

```powershell
npm run dev
```

## Notes

- The model is instructed to return only executable Minecraft Bedrock commands, one per line, with no comments or markdown.
- Commands are sent without a leading slash because Bedrock WebSocket `commandLine` expects the command text.
- Relative coordinates are preserved, so builds should appear relative to the Bedrock player/client that connected with `/connect`.
- Large builds should use multiple `/fill` commands because Bedrock fill volumes are limited.

## Research Links

- Microsoft `/wsserver` command reference: https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/wsserver?view=minecraft-bedrock-stable
- Bedrock WebSocket packet examples and queue behavior: https://www.s-anand.net/blog/programming-minecraft-with-websockets/
- OpenAI Chat Completions API reference: https://developers.openai.com/api/reference/resources/chat
- NVIDIA GLM-5.2 NIM page: https://build.nvidia.com/z-ai/glm-5.2
- NVIDIA GLM-5.2 chat completions reference: https://docs.api.nvidia.com/nim/reference/z-ai-glm-5.2-infer
- NVIDIA DeepSeek V4 Pro reference: https://docs.api.nvidia.com/nim/re/reference/deepseek-ai-deepseek-v4-pro-infer
- NVIDIA DeepSeek V4 Flash page: https://build.nvidia.com/deepseek-ai/deepseek-v4-flash
- NVIDIA Kimi K2.6 page: https://build.nvidia.com/moonshotai/kimi-k2.6
- NVIDIA Nemotron 3 Ultra page: https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b
