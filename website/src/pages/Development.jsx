import React from 'react'
import Section from '../components/Section'
import CodeBlock from '../components/CodeBlock'

export default function Development() {
  return (
    <div className="p-8 md:p-12 max-w-4xl">
      <div className="border-b-4 border-industrial-black pb-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-masthead font-black uppercase tracking-tight">Development</h1>
        <p className="font-mono text-xs uppercase font-bold mt-2 opacity-50">Testing, diagnostics, and development workflow</p>
      </div>

      <Section title="Dev Server" number="01">
        <p>
          Run the bridge with auto-restart on file changes using Node's built-in <code>--watch</code> mode:
        </p>
        <CodeBlock code="npm run dev" lang="shell" />
        <p className="text-sm opacity-80">
          This watches <code>src/index.js</code> and its dependency tree. On save, the process restarts automatically.
        </p>
      </Section>

      <Section title="Unit Tests" number="02">
        <p>
          The project uses Node's built-in <code>node:test</code> runner — no external test framework required:
        </p>
        <CodeBlock code="npm test" lang="shell" />
        <p>This runs the following test suites:</p>
        <div className="border-2 border-industrial-black bg-white overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b-2 border-industrial-black bg-industrial-black text-white">
                <th className="text-left p-3 uppercase text-xs">File</th>
                <th className="text-left p-3 uppercase text-xs">Tests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-black/20">
              <tr><td className="p-3 text-xs font-bold">commandQueue.test.js</td><td className="p-3 text-xs font-ui">Queue draining, job tracking, dry-run mode</td></tr>
              <tr><td className="p-3 text-xs font-bold">env.test.js</td><td className="p-3 text-xs font-ui">.env parsing, quoting, inline comments</td></tr>
              <tr><td className="p-3 text-xs font-bold">llmDiagnostics.test.js</td><td className="p-3 text-xs font-ui">Diagnostic matrix configuration</td></tr>
              <tr><td className="p-3 text-xs font-bold">modelClient.test.js</td><td className="p-3 text-xs font-ui">Chat completion requests, 202 polling, error redaction</td></tr>
              <tr><td className="p-3 text-xs font-bold">protocol.test.js</td><td className="p-3 text-xs font-ui">Packet building, chat extraction, command sanitization</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="LLM Integration Tests" number="03">
        <p>
          Run a live compatibility check against the NVIDIA NIM API. This uses your <code>NVIDIA_API_KEY</code> from <code>.env</code>:
        </p>
        <CodeBlock code="npm run test:llm" lang="shell" />
        <p className="text-sm opacity-80">
          These tests call <code>POST /v1/chat/completions</code>, validate that each model returns
          OpenAI-compatible <code>choices[0].message.content</code>, and run the response through
          the same command parser used by the bridge.
        </p>
      </Section>

      <Section title="LLM Diagnostics" number="04">
        <p>
          Run a full latency/stability diagnostic matrix and generate a JSON report under <code>reports/</code>:
        </p>
        <CodeBlock code={`# Run against all configured models
npm run llm:diagnose -- --iterations 3

# Limit to specific models
npm run llm:diagnose -- --models deepseek-v4-flash,glm-5.2 --iterations 5

# Use only the core OpenAI request body (no NVIDIA-specific fields)
npm run llm:diagnose -- --models kimi-k2.6 --minimal`} lang="shell" />
        <p>Reports include:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Latency per model</li>
          <li>Success rate</li>
          <li>Parser compatibility (how well the output sanitizes)</li>
          <li>Finish reason</li>
          <li>Token usage (when available)</li>
          <li>First parsed command</li>
        </ul>
        <p className="text-sm bg-industrial-black text-white p-3 font-mono mt-2">
          Reports never include your API key. Provider account identifiers in error bodies are redacted.
        </p>
      </Section>

      <Section title="Simulation Mode" number="05">
        <p>
          Test the full AI pipeline without connecting Minecraft:
        </p>
        <CodeBlock code={`npm run simulate:ai -- --prompt "build me a cozy spruce house"

# Add --raw to see the raw model output before parser cleanup
npm run simulate:ai -- --prompt "build a lighthouse" --raw`} lang="shell" />
        <p className="text-sm opacity-80">
          This sends the prompt to the configured LLM, runs it through the command sanitizer, and
          prints the resulting Bedrock commands to stdout.
        </p>
      </Section>

      <Section title="Project Notes" number="06">
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>The model is instructed to return only executable Minecraft Bedrock commands, one per line, with no comments or markdown.</li>
          <li>Commands are sent without a leading slash because Bedrock WebSocket <code>commandLine</code> expects the command text directly.</li>
          <li>Relative coordinates (<code>~</code>) are preserved, so builds appear relative to the player that connected.</li>
          <li>Large builds should use multiple <code>/fill</code> commands because Bedrock fill volumes are limited to 32×32×32 blocks.</li>
          <li>The bridge ships with a custom <code>.env</code> parser — no <code>dotenv</code> dependency needed.</li>
        </ul>
      </Section>
    </div>
  )
}
