import React, { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'

const envExample = `NVIDIA_API_KEY=nvapi-your-key-here
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
OPENAI_MODEL=z-ai/glm-5.2
OPENAI_MAX_TOKENS=4096
MC_WS_PORT=3000
MC_MAX_IN_FLIGHT=50`

const mcCommand = `/connect localhost:3000
!ai build a compact wizard tower with lanterns and a spiral staircase`

export default function Docs() {
  return (
    <div className="p-8 md:p-12">
      <div className="border-b-4 border-industrial-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl md:text-5xl font-masthead font-black uppercase tracking-tight">System Manual</h1>
          <p className="font-mono text-sm uppercase font-bold mt-2 opacity-60">Vol. 1 // Orion Protocol</p>
        </div>
        <div className="hidden md:block w-32 h-8 bg-industrial-black"></div> {/* Barcode placeholder */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Column - Content */}
        <div className="lg:col-span-2 space-y-12">
          <Section title="1. Initialization" number="01">
            <p className="mb-4 text-lg">The bridge requires Node.js &gt;=20. Initialize the local server to open the WebSocket port for Bedrock Edition.</p>
            <CodeBlock code="npm install&#10;Copy-Item .env.example .env&#10;npm start" lang="shell" />
            <p className="mt-4 text-sm font-bold uppercase bg-industrial-black text-white p-2 inline-block">Note: Minecraft Bedrock requires admin permission plus cheats enabled.</p>
          </Section>

          <Section title="2. Connection Protocol" number="02">
            <p className="mb-4">From within Minecraft Bedrock, issue the connection command to link the client to the bridge.</p>
            <CodeBlock code={mcCommand} lang="shell" />
            <p className="mt-4">The bridge listens for chat messages starting with <code>!ai</code>, parses them, and executes the generated commands using the bounded <code>MinecraftCommandQueue</code>.</p>
          </Section>
          
          <Section title="3. Architecture: Command Queue" number="03">
            <p className="mb-4">Bedrock can reject excessive pending commands. The bridge tracks command responses and keeps in-flight commands below a configurable cap (<code>MC_MAX_IN_FLIGHT</code>).</p>
            <ul className="list-disc pl-5 space-y-2 font-mono text-sm">
              <li>Handles <code>commandRequest</code> packets.</li>
              <li>Monitors <code>commandResponse</code> and <code>error</code> messages.</li>
              <li>Optional <code>MC_COMMAND_DELAY_MS</code> can artificially rate-limit execution.</li>
            </ul>
          </Section>
          
          <Section title="4. Diagnostics" number="04">
            <p className="mb-4">A robust test matrix is included to measure LLM latency, stability, and parser compatibility.</p>
            <CodeBlock code="npm run llm:diagnose -- --iterations 3&#10;npm run simulate:ai -- --prompt 'build me a cozy spruce house'" lang="shell" />
          </Section>
        </div>

        {/* Right Column - Config Table */}
        <aside className="lg:col-span-1">
          <div className="border-2 border-industrial-black bg-white p-6 sticky top-8 clip-chamfer">
            <h3 className="font-mono font-bold uppercase text-xl mb-4 border-b-2 border-industrial-black pb-2">Configuration Variables</h3>
            
            <div className="space-y-4">
              <ConfigItem name="NVIDIA_API_KEY" desc="API key for NVIDIA's hosted NIM endpoint." defaultVal="empty" />
              <ConfigItem name="OPENAI_BASE_URL" desc="Any OpenAI-compatible base URL." defaultVal="NVIDIA NIM" />
              <ConfigItem name="OPENAI_MODEL" desc="Chat completions model name." defaultVal="z-ai/glm-5.2" />
              <ConfigItem name="MC_WS_PORT" desc="Local WebSocket port." defaultVal="3000" />
              <ConfigItem name="MC_MAX_IN_FLIGHT" desc="Max commands waiting on responses." defaultVal="50" />
              <ConfigItem name="MC_AI_PREFIX" desc="Chat trigger prefix." defaultVal="!ai" />
            </div>
            
            <div className="mt-8">
               <p className="font-mono text-xs uppercase mb-2 font-bold">Example .env:</p>
               <CodeBlock code={envExample} lang="env" />
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}

function Section({ title, number, children }) {
  return (
    <section className="relative">
      <div className="absolute -left-12 top-0 font-mono text-2xl font-black text-industrial-black opacity-20 hidden md:block">
        {number}
      </div>
      <h2 className="text-2xl font-masthead font-bold uppercase mb-4 flex items-center gap-4">
        {title}
        <div className="flex-1 h-px bg-industrial-black opacity-30"></div>
      </h2>
      <div className="font-ui text-industrial-black leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function ConfigItem({ name, desc, defaultVal }) {
  return (
    <div className="border-b border-industrial-black border-dashed pb-3 last:border-0">
      <div className="flex justify-between items-baseline mb-1">
        <code className="font-bold text-sm bg-industrial-bg px-1">{name}</code>
        <span className="font-mono text-[10px] uppercase opacity-70">Def: {defaultVal}</span>
      </div>
      <p className="text-xs font-ui opacity-80">{desc}</p>
    </div>
  )
}

// A simple shiki codeblock component with industrial styling
function CodeBlock({ code, lang }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    codeToHtml(code, {
      lang,
      theme: 'vitesse-dark'
    }).then(resHtml => {
      setHtml(resHtml)
    })
  }, [code, lang])

  return (
    <div className="relative group my-4">
      <div className="absolute top-0 left-0 bg-industrial-black text-white font-mono text-[10px] uppercase px-2 py-1 z-10">
        {lang}
      </div>
      <div className="border-2 border-industrial-black bg-[#121212] p-4 pt-8 overflow-x-auto text-sm font-mono [&>pre]:!bg-transparent">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre><code>{code}</code></pre>
        )}
      </div>
      {/* Decorative cut corner effect */}
      <div className="absolute bottom-0 right-0 w-4 h-4 bg-industrial-bg border-t-2 border-l-2 border-industrial-black"></div>
    </div>
  )
}
