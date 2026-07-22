import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Server, Shield, Cpu, Activity, ArrowRight, Blocks } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 border-b-4 border-industrial-black">
        <div className="md:col-span-8 border-b-2 md:border-b-0 md:border-r-2 border-industrial-black p-8 md:p-12 relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-masthead font-black mb-6 uppercase leading-tight">
              Build With AI,<br />Inside Minecraft.
            </h2>
            <p className="text-base font-ui max-w-2xl leading-relaxed">
              Orion is a local WebSocket bridge for Minecraft Bedrock Edition. It listens for
              in-game <code className="bg-industrial-black text-white px-1.5 py-0.5 text-sm">!ai</code> chat
              prompts, sends them to an OpenAI-compatible LLM, and executes the generated
              Bedrock commands through a bounded, rate-limited queue.
            </p>
            <p className="text-base font-ui max-w-2xl leading-relaxed mt-4 opacity-80">
              Type a prompt. Watch it build. No mods, no plugins — just a WebSocket and an API key.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/docs" className="inline-flex items-center gap-2 bg-industrial-red text-white px-6 py-3 font-mono font-bold text-sm uppercase tracking-wider hover:bg-industrial-black transition-colors">
                Get Started <ArrowRight size={16} />
              </Link>
              <a href="https://github.com/YourBoiiLevi/Orion" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-2 border-industrial-black px-6 py-3 font-mono font-bold text-sm uppercase tracking-wider hover:bg-industrial-black hover:text-white transition-colors">
                View Source
              </a>
            </div>
          </div>

          {/* Background watermark */}
          <div className="absolute top-6 right-6 opacity-[0.04] font-mono text-[12rem] font-black pointer-events-none leading-none select-none transform group-hover:scale-105 transition-transform duration-1000">
            ⛏
          </div>
        </div>

        {/* Sidebar quick info */}
        <div className="md:col-span-4 p-8 flex flex-col justify-between bg-industrial-black text-industrial-bg relative">
          <div>
            <h3 className="font-mono text-sm font-bold uppercase mb-4 border-b border-industrial-bg/30 pb-2 tracking-wider">
              At a Glance
            </h3>
            <ul className="font-mono text-sm space-y-3">
              <li className="flex justify-between"><span className="opacity-70">Runtime</span> <span>Node.js &gt;=20</span></li>
              <li className="flex justify-between"><span className="opacity-70">Protocol</span> <span>Bedrock WebSocket</span></li>
              <li className="flex justify-between"><span className="opacity-70">Default LLM</span> <span>GLM 5.2 (NIM)</span></li>
              <li className="flex justify-between"><span className="opacity-70">Dependencies</span> <span>1 (ws)</span></li>
              <li className="flex justify-between"><span className="opacity-70">License</span> <span>MIT</span></li>
            </ul>
          </div>

          <div className="mt-8 p-4 border border-industrial-bg/20 font-mono text-xs">
            <div className="text-industrial-red font-bold uppercase mb-1">Quick Start</div>
            <pre className="text-industrial-bg/80 leading-relaxed">npm install{'\n'}cp .env.example .env{'\n'}npm start</pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="p-8 md:p-12">
        <div className="flex justify-between items-end border-b-2 border-industrial-black pb-3 mb-8">
          <h2 className="text-2xl md:text-3xl font-masthead font-bold uppercase">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Server />}
            title="WebSocket Bridge"
            desc="Minecraft connects via /connect. The bridge subscribes to PlayerMessage events and forwards AI-triggered prompts."
          />
          <FeatureCard
            icon={<Cpu />}
            title="LLM Integration"
            desc="Any OpenAI-compatible endpoint works. Default is NVIDIA NIM's free GLM-5.2 API with built-in model profiles."
          />
          <FeatureCard
            icon={<Activity />}
            title="Command Queue"
            desc="A bounded queue tracks in-flight commands and drains them at a configurable rate to avoid Bedrock rejection."
          />
          <FeatureCard
            icon={<Shield />}
            title="Command Sanitizer"
            desc="Strips markdown fences, comments, and thinking tags. Blocks admin commands. Validates against an allowlist."
          />
        </div>
      </section>

      {/* Architecture diagram placeholder */}
      <section className="px-8 pb-12">
        <div className="w-full border-2 border-industrial-black bg-industrial-black text-industrial-bg p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCBMIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')]"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 font-mono text-sm uppercase">
            <FlowNode label="Minecraft Bedrock" sub="/connect localhost:3000" />
            <FlowArrow />
            <FlowNode label="Orion Bridge" sub="WebSocket Server" highlight />
            <FlowArrow />
            <FlowNode label="LLM API" sub="OpenAI-compatible" />
          </div>

          <div className="absolute bottom-3 right-4 font-mono text-[10px] uppercase tracking-widest opacity-30">
            FIG 1. DATA FLOW
          </div>
        </div>
      </section>

    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="border-2 border-industrial-black p-6 hover:bg-industrial-black hover:text-industrial-bg transition-colors group relative bg-white">
      <div className="mb-4 text-industrial-red group-hover:text-white transition-colors">
        {React.cloneElement(icon, { size: 28, strokeWidth: 1.5 })}
      </div>
      <h4 className="font-mono font-bold uppercase text-sm mb-2">{title}</h4>
      <p className="font-ui text-sm opacity-80">{desc}</p>
    </div>
  )
}

function FlowNode({ label, sub, highlight }) {
  return (
    <div className={`border-2 ${highlight ? 'border-industrial-red text-industrial-red' : 'border-industrial-bg/40'} px-6 py-4 text-center min-w-[160px]`}>
      <div className="font-bold text-xs">{label}</div>
      <div className="text-[10px] opacity-60 mt-1">{sub}</div>
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="font-mono text-industrial-red text-lg hidden md:block">→</div>
  )
}
