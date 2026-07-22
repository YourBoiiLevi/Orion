import React from 'react'
import Section from '../components/Section'
import CodeBlock from '../components/CodeBlock'

const envExample = `NVIDIA_API_KEY=nvapi-your-key-here
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
OPENAI_MODEL=z-ai/glm-5.2
OPENAI_MAX_TOKENS=4096
MC_WS_PORT=3000
MC_MAX_IN_FLIGHT=50`

export default function Docs() {
  return (
    <div className="p-8 md:p-12 max-w-4xl">
      <div className="border-b-4 border-industrial-black pb-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-masthead font-black uppercase tracking-tight">Quickstart</h1>
        <p className="font-mono text-xs uppercase font-bold mt-2 opacity-50">Get running in under 2 minutes</p>
      </div>

      <Section title="Prerequisites" number="01">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Node.js &gt;=20</strong> — the bridge uses native <code>fetch</code>, <code>node:test</code>, and ESM.</li>
          <li><strong>Minecraft Bedrock Edition</strong> — with cheats enabled and admin (operator) permission.</li>
          <li><strong>An NVIDIA NIM API key</strong> — free tier available at <a href="https://build.nvidia.com" target="_blank" rel="noreferrer" className="underline hover:text-industrial-red">build.nvidia.com</a>.</li>
        </ul>
      </Section>

      <Section title="Installation" number="02">
        <CodeBlock code={`git clone https://github.com/YourBoiiLevi/Orion.git\ncd Orion\nnpm install`} lang="shell" />
        <p>Copy the example environment file and add your API key:</p>
        <CodeBlock code={`cp .env.example .env\n# then edit .env and set NVIDIA_API_KEY`} lang="shell" />
        <div className="border-2 border-industrial-black p-4 bg-white">
          <p className="font-mono text-xs uppercase font-bold mb-2">Example .env</p>
          <CodeBlock code={envExample} lang="ini" filename=".env" />
        </div>
      </Section>

      <Section title="Start the Bridge" number="03">
        <CodeBlock code="npm start" lang="shell" />
        <p>
          The bridge starts a WebSocket server on <code>0.0.0.0:3000</code> by default.
          It automatically loads <code>.env</code> from the project root. Environment variables
          already set in your shell take priority.
        </p>
      </Section>

      <Section title="Connect from Minecraft" number="04">
        <p>In Minecraft Bedrock, open chat and run:</p>
        <CodeBlock code="/connect localhost:3000" lang="shell" />
        <p>Then type an AI prompt:</p>
        <CodeBlock code="!ai build a compact wizard tower with lanterns and a spiral staircase" lang="shell" />
        <p className="text-sm opacity-80">
          The bridge will send the prompt to the LLM, parse the response into Bedrock commands, and
          execute them through the bounded command queue. You'll see status messages in chat as it works.
        </p>
      </Section>

      <Section title="Configuration" number="05">
        <p className="mb-4">All configuration is done through environment variables in <code>.env</code>:</p>
        <div className="border-2 border-industrial-black bg-white overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b-2 border-industrial-black bg-industrial-black text-white">
                <th className="text-left p-3 uppercase text-xs">Variable</th>
                <th className="text-left p-3 uppercase text-xs">Default</th>
                <th className="text-left p-3 uppercase text-xs">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-black/20">
              <ConfigRow name="NVIDIA_API_KEY" def="—" desc="API key for NVIDIA's hosted NIM endpoint." />
              <ConfigRow name="OPENAI_BASE_URL" def="integrate.api.nvidia.com/v1" desc="Any OpenAI-compatible base URL." />
              <ConfigRow name="OPENAI_MODEL" def="z-ai/glm-5.2" desc="Chat completions model name." />
              <ConfigRow name="OPENAI_USE_PROVIDER_EXTRAS" def="true" desc="Apply NVIDIA model profile fields (e.g. disabled reasoning)." />
              <ConfigRow name="OPENAI_MAX_TOKENS" def="4096" desc="Max tokens for generated command lists." />
              <ConfigRow name="OPENAI_TIMEOUT_MS" def="600000" desc="Chat completion timeout (ms). Large builds can take minutes on free endpoints." />
              <ConfigRow name="OPENAI_POLL_INTERVAL_MS" def="1000" desc="Poll interval for NVIDIA HTTP 202 pending responses." />
              <ConfigRow name="DEBUG_LLM" def="false" desc="Log sanitized request/response timing metadata." />
              <ConfigRow name="MC_WS_HOST" def="0.0.0.0" desc="Local WebSocket bind host." />
              <ConfigRow name="MC_WS_PORT" def="3000" desc="Local WebSocket port." />
              <ConfigRow name="MC_AI_PREFIX" def="!ai" desc="Chat trigger prefix." />
              <ConfigRow name="MC_MAX_IN_FLIGHT" def="50" desc="Max commands waiting on Minecraft responses. Keep below 100." />
              <ConfigRow name="MC_COMMAND_DELAY_MS" def="0" desc="Optional per-command send delay." />
              <ConfigRow name="MC_BLOCKED_COMMANDS" def="admin list" desc="Comma-separated command names rejected from model output." />
              <ConfigRow name="MC_ALLOWED_COMMANDS" def="Bedrock list" desc="Comma-separated command names accepted. Use * to allow all." />
              <ConfigRow name="DRY_RUN_COMMANDS" def="false" desc="Log generated commands without sending them to Minecraft." />
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}

function ConfigRow({ name, def, desc }) {
  return (
    <tr className="hover:bg-industrial-bg/50">
      <td className="p-3 font-bold text-xs whitespace-nowrap">{name}</td>
      <td className="p-3 text-xs opacity-70 whitespace-nowrap">{def}</td>
      <td className="p-3 text-xs font-ui">{desc}</td>
    </tr>
  )
}
