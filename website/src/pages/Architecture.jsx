import React from 'react'
import Section from '../components/Section'
import CodeBlock from '../components/CodeBlock'

export default function Architecture() {
  return (
    <div className="p-8 md:p-12 max-w-4xl">
      <div className="border-b-4 border-industrial-black pb-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-masthead font-black uppercase tracking-tight">Architecture</h1>
        <p className="font-mono text-xs uppercase font-bold mt-2 opacity-50">How the bridge is structured internally</p>
      </div>

      <Section title="Overview" number="01">
        <p>
          Orion consists of six core modules, each with a single responsibility. The entry point
          (<code>index.js</code>) loads the <code>.env</code> file, builds a configuration object,
          and starts the <code>MinecraftAiBridge</code> server.
        </p>
        <div className="border-2 border-industrial-black bg-industrial-black text-industrial-bg p-6 font-mono text-xs overflow-x-auto my-4">
          <pre className="text-center leading-loose">{`index.js
  ├─ env.js            .env parser (no dependencies)
  ├─ config.js         Loads + validates all env vars
  └─ server.js         MinecraftAiBridge
       ├─ minecraftProtocol.js   Packet builders, chat extraction, command sanitizer
       ├─ commandQueue.js        MinecraftCommandQueue (bounded, rate-limited)
       ├─ modelClient.js         ChatCompletionsClient (OpenAI-compatible)
       ├─ prompts.js             System prompt for the LLM
       └─ llmModelProfiles.js    NVIDIA NIM model-specific overrides`}</pre>
        </div>
      </Section>

      <Section title="WebSocket Protocol" number="02">
        <p>
          When Minecraft connects via <code>/connect</code>, the bridge creates a
          WebSocket connection. It immediately subscribes to <code>PlayerMessage</code> events
          to listen for in-game chat.
        </p>
        <CodeBlock code={`// Subscribe to player chat events
{
  "header": {
    "version": 1,
    "requestId": "<uuid>",
    "messageType": "commandRequest",
    "messagePurpose": "subscribe"
  },
  "body": { "eventName": "PlayerMessage" }
}`} lang="json" filename="Subscribe Packet" />
        <p>
          Commands are sent using <code>messagePurpose: "commandRequest"</code>. Each command
          gets a unique <code>requestId</code> so the bridge can track which responses
          correspond to which commands.
        </p>
        <CodeBlock code={`// Execute a command in Minecraft
{
  "header": {
    "version": 1,
    "requestId": "<uuid>",
    "messageType": "commandRequest",
    "messagePurpose": "commandRequest"
  },
  "body": {
    "version": 1,
    "commandLine": "setblock ~5 ~0 ~5 stone",
    "origin": { "type": "player" }
  }
}`} lang="json" filename="Command Packet" />
      </Section>

      <Section title="Command Queue" number="03">
        <p>
          Bedrock will reject commands if too many are pending at once. The
          <code> MinecraftCommandQueue</code> class solves this with a bounded in-flight window:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>Commands are pushed into a <strong>send queue</strong>.</li>
          <li>The <code>drain()</code> method sends commands up to the <code>maxInFlight</code> cap (default 50).</li>
          <li>Each command's <code>requestId</code> is tracked in an <strong>in-flight map</strong>.</li>
          <li>When Minecraft responds (either <code>commandResponse</code> or <code>error</code>), the command is removed from the map and the next one is sent.</li>
          <li>An optional <code>commandDelayMs</code> adds artificial throttling between sends.</li>
        </ul>
        <p>
          Commands are organized into <strong>jobs</strong>. Each AI prompt creates a job that tracks
          total/completed/failed counts and calls <code>onJobComplete</code> when finished, which
          the bridge uses to send a status message back to the player.
        </p>
      </Section>

      <Section title="Command Sanitizer" number="04">
        <p>
          Before commands reach the queue, the raw LLM output passes through <code>sanitizeCommands()</code>:
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Strip markdown fences (<code>```</code> lines).</li>
          <li>Strip <code>&lt;think&gt;...&lt;/think&gt;</code> reasoning tags from models like DeepSeek.</li>
          <li>Remove comments (<code>#</code>, <code>//</code>, <code>--</code> lines).</li>
          <li>Remove list prefixes (<code>1.</code>, <code>-</code>, <code>*</code>).</li>
          <li>Normalize the command line — strip leading slashes.</li>
          <li>Validate against the <strong>allowed commands</strong> list (69 Bedrock commands by default).</li>
          <li>Reject <strong>blocked commands</strong> (connect, kick, ban, op, etc.).</li>
          <li>Reject commands exceeding 32,767 characters.</li>
        </ol>
        <p className="text-sm bg-industrial-black text-white p-3 font-mono mt-2">
          Rejected lines are logged but never sent to Minecraft.
        </p>
      </Section>

      <Section title="LLM Client" number="05">
        <p>
          The <code>ChatCompletionsClient</code> wraps any OpenAI-compatible
          <code> POST /v1/chat/completions</code> endpoint. Key behaviors:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>HTTP 202 polling:</strong> NVIDIA NIM returns 202 for queued requests. The client extracts the <code>requestId</code> and polls <code>/status/{'{requestId}'}</code> until completion.</li>
          <li><strong>Timeout:</strong> Configurable via <code>OPENAI_TIMEOUT_MS</code> (default 10 minutes). Uses <code>AbortController</code> for clean cancellation.</li>
          <li><strong>Model profiles:</strong> When <code>OPENAI_USE_PROVIDER_EXTRAS</code> is enabled, the client injects model-specific fields — for example, <code>reasoning_effort: "none"</code> for DeepSeek V4 Pro, or <code>enable_thinking: false</code> for Nemotron.</li>
          <li><strong>Error redaction:</strong> Provider account IDs and bearer tokens are stripped from error messages before logging.</li>
        </ul>
      </Section>

      <Section title="Model Profiles" number="06">
        <p>Five NVIDIA NIM models have built-in profiles:</p>
        <div className="border-2 border-industrial-black bg-white overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b-2 border-industrial-black bg-industrial-black text-white">
                <th className="text-left p-3 uppercase text-xs">Model</th>
                <th className="text-left p-3 uppercase text-xs">Temp</th>
                <th className="text-left p-3 uppercase text-xs">Top-P</th>
                <th className="text-left p-3 uppercase text-xs">Fast?</th>
                <th className="text-left p-3 uppercase text-xs">Extra Fields</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-black/20">
              <tr><td className="p-3 text-xs font-bold">GLM 5.2</td><td className="p-3 text-xs">0.2</td><td className="p-3 text-xs">1</td><td className="p-3 text-xs">No</td><td className="p-3 text-xs">—</td></tr>
              <tr><td className="p-3 text-xs font-bold">DeepSeek V4 Pro</td><td className="p-3 text-xs">0.2</td><td className="p-3 text-xs">0.95</td><td className="p-3 text-xs">No</td><td className="p-3 text-xs">reasoning_effort: none</td></tr>
              <tr><td className="p-3 text-xs font-bold">Kimi K2.6</td><td className="p-3 text-xs">0.2</td><td className="p-3 text-xs">1</td><td className="p-3 text-xs">No</td><td className="p-3 text-xs">thinking: false</td></tr>
              <tr><td className="p-3 text-xs font-bold">Nemotron 3 Ultra</td><td className="p-3 text-xs">0.2</td><td className="p-3 text-xs">0.95</td><td className="p-3 text-xs">No</td><td className="p-3 text-xs">enable_thinking: false</td></tr>
              <tr><td className="p-3 text-xs font-bold">DeepSeek V4 Flash</td><td className="p-3 text-xs">0.2</td><td className="p-3 text-xs">0.95</td><td className="p-3 text-xs">Yes</td><td className="p-3 text-xs">thinking: false, reasoning_effort: none</td></tr>
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
