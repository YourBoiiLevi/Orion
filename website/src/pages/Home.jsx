import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Server, Zap, Shield, Cpu, Activity, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-200px)]">
      
      {/* Newspaper Top Fold */}
      <section className="grid grid-cols-1 md:grid-cols-12 border-b-4 border-industrial-black">
        <div className="md:col-span-8 border-b-2 md:border-b-0 md:border-r-2 border-industrial-black p-8 md:p-12 relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-masthead font-black mb-6 uppercase leading-tight">
              How America's Industrial Core Is Coming Back Online
            </h2>
            <p className="text-lg font-mono font-bold uppercase mb-4 opacity-80">
              &gt;&gt;&gt; Rebuilding The Machine
            </p>
            <p className="text-base font-ui max-w-2xl leading-relaxed">
              A silent revolution is underway. From Austin to Youngstown, new factories, chip fabs, and AI defense startups are redefining what it means to build in America. After decades of offshoring, production is returning home, powered by automation, robotics, and a new generation of engineers who see industrial revival not as nostalgia, but as national strategy.
            </p>
            <p className="text-base font-ui max-w-2xl leading-relaxed mt-4">
              <strong>Orion Project</strong> stands at the forefront of this digital infrastructure. A local WebSocket bridge for Minecraft Bedrock Edition, connecting the physical simulation environment with OpenAI-compatible intelligence.
            </p>
          </div>
          
          <div className="absolute top-10 right-10 opacity-10 font-mono text-9xl font-black pointer-events-none transform -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
            [O]
          </div>
        </div>
        
        <div className="md:col-span-4 p-8 flex flex-col justify-between bg-industrial-black text-industrial-bg relative">
           <div>
             <h3 className="font-mono text-xl font-bold uppercase mb-4 border-b border-industrial-bg pb-2">
               System Status
             </h3>
             <ul className="font-mono text-sm space-y-2 uppercase">
               <li className="flex justify-between"><span>Core Logic</span> <span className="text-green-400">[ STABLE ]</span></li>
               <li className="flex justify-between"><span>WebSocket</span> <span className="text-green-400">[ ONLINE ]</span></li>
               <li className="flex justify-between"><span>Command Queue</span> <span className="text-yellow-400">[ READY ]</span></li>
               <li className="flex justify-between"><span>AI Link</span> <span className="text-industrial-red">[ WAITING ]</span></li>
             </ul>
           </div>
           
           <div className="mt-12 text-center">
             <div className="text-xs font-mono uppercase tracking-widest mb-2 opacity-50">Initialize Sequence</div>
             <Link to="/docs" className="inline-flex items-center gap-2 bg-industrial-red text-white px-6 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-industrial-red transition-colors border-2 border-transparent hover:border-industrial-red">
               Commence Build <ArrowRight size={18} />
             </Link>
           </div>
        </div>
      </section>

      {/* Blueprint Data Section */}
      <section className="p-8 md:p-12">
        <div className="flex justify-between items-end border-b-2 border-industrial-black pb-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-masthead font-bold uppercase">Technical Schematics</h2>
          <span className="font-mono text-sm font-bold uppercase opacity-60">P. 05</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={<Server />}
            title="Local WebSocket"
            desc="Bedrock /wsserver connects directly to your local instance. No external tunneling required for core execution."
          />
          <FeatureCard 
            icon={<Cpu />}
            title="NVIDIA NIM Default"
            desc="Pre-configured for z-ai/glm-5.2 via NVIDIA's integrate API. Compatible with any OpenAI Chat completions endpoint."
          />
          <FeatureCard 
            icon={<Activity />}
            title="Bounded Queue"
            desc="Tracks command responses and keeps in-flight commands below a configurable cap to prevent server rejection."
          />
          <FeatureCard 
            icon={<Shield />}
            title="Sanitized Execution"
            desc="Strict parser blocks harmful commands and strips markdown/comments before sending to the Minecraft protocol."
          />
        </div>
      </section>
      
      {/* Decorative Blueprint Image Placeholder */}
      <section className="px-8 pb-12">
        <div className="w-full h-48 border-2 border-industrial-black bg-industrial-black text-industrial-bg flex flex-col items-center justify-center relative overflow-hidden group">
           {/* Grid overlay */}
           <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCBMIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')]"></div>
           
           <div className="relative z-10 flex items-center justify-center">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="w-24 h-24 border-4 border-dashed border-industrial-bg rounded-full flex items-center justify-center"
             >
                <div className="w-12 h-12 border-2 border-industrial-red rounded-sm rotate-45"></div>
             </motion.div>
           </div>
           
           <div className="absolute bottom-4 right-4 font-mono text-xs uppercase tracking-widest">
             (LOADING SCHEMATIC...)
           </div>
           <div className="absolute top-4 left-4 font-mono text-[10px] uppercase">
             FIG 1. CORE ARCHITECTURE
           </div>
        </div>
      </section>

    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="border-2 border-industrial-black p-6 hover:bg-industrial-black hover:text-industrial-bg transition-colors group relative clip-chamfer-bottom bg-white">
      <div className="mb-4 text-industrial-red group-hover:text-white transition-colors">
        {React.cloneElement(icon, { size: 32, strokeWidth: 1.5 })}
      </div>
      <h4 className="font-mono font-bold uppercase mb-2">{title}</h4>
      <p className="font-ui text-sm opacity-80">{desc}</p>
      
      {/* Decorative crosshair */}
      <div className="absolute top-2 right-2 w-4 h-4 border border-industrial-black opacity-30 group-hover:border-industrial-bg">
        <div className="absolute top-1/2 left-0 w-full h-px bg-industrial-black group-hover:bg-industrial-bg"></div>
        <div className="absolute left-1/2 top-0 h-full w-px bg-industrial-black group-hover:bg-industrial-bg"></div>
      </div>
    </div>
  )
}
