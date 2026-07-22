import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Terminal, Box, Cog, Menu, X, Rocket } from 'lucide-react'

export function Layout({ children }) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const location = useLocation()
  
  const [easterEgg, setEasterEgg] = React.useState(false)

  React.useEffect(() => {
    let keys = []
    const handleKeyDown = (e) => {
      keys.push(e.key.toLowerCase())
      if (keys.length > 9) keys.shift()
      if (keys.join('').includes('minecraft')) {
        setEasterEgg(true)
        setTimeout(() => setEasterEgg(false), 5000)
        keys = []
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`min-h-screen bg-industrial-bg text-industrial-black flex flex-col font-ui border-8 border-industrial-black ${easterEgg ? 'animate-pulse' : ''}`}>
      {/* Top Bar - Newspaper Style */}
      <header className="border-b-4 border-industrial-black bg-industrial-bg relative z-20">
        <div className="flex justify-between items-center border-b border-industrial-black px-4 py-1 text-xs font-mono uppercase font-bold tracking-widest">
          <span>Field Report</span>
          <span>The Paper of Record for the New Industrial Age</span>
          <span className="flex items-center gap-2"><Terminal size={14}/> U.S.A</span>
        </div>
        
        <div className="px-6 py-8 flex flex-col lg:flex-row justify-between items-center gap-6 text-center lg:text-left relative">
          <div className="flex-1">
            <h1 className="text-5xl md:text-7xl font-masthead font-black tracking-tighter uppercase leading-none">
              The Artificial Times
            </h1>
            <p className="mt-2 font-mono text-sm uppercase tracking-wider font-bold">
              Volume 1. Issue 1 • Special Report: Orion Project
            </p>
          </div>
          
          <div className="hidden lg:block w-64 h-32 border-2 border-industrial-black bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCBMIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzExMSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+')] clip-chamfer relative overflow-hidden group cursor-crosshair">
             <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity bg-industrial-black text-industrial-bg">
                <Rocket className="w-12 h-12 animate-bounce" />
             </div>
             <div className="absolute inset-0 border-[4px] border-industrial-red pointer-events-none mix-blend-multiply"></div>
          </div>
        </div>

        {/* Navigation Grid */}
        <nav className="grid grid-cols-2 md:grid-cols-4 border-t-4 border-industrial-black font-mono text-sm uppercase font-bold text-center">
          <Link to="/" className={`block py-3 border-r-2 border-b-2 md:border-b-0 border-industrial-black hover:bg-industrial-red hover:text-white transition-colors ${location.pathname === '/' ? 'bg-industrial-black text-white' : ''}`}>
            Front Page
          </Link>
          <Link to="/docs" className={`block py-3 border-r-0 md:border-r-2 border-b-2 md:border-b-0 border-industrial-black hover:bg-industrial-red hover:text-white transition-colors ${location.pathname === '/docs' ? 'bg-industrial-black text-white' : ''}`}>
            Documentation
          </Link>
          <a href="https://github.com/YourBoiiLevi/Orion" target="_blank" rel="noreferrer" className="block py-3 border-r-2 border-industrial-black hover:bg-industrial-black hover:text-white transition-colors">
            Blueprint (GitHub)
          </a>
          <a href="#" className="block py-3 hover:bg-industrial-black hover:text-white transition-colors relative overflow-hidden group">
            <span className="relative z-10">Status: Online</span>
            <div className="absolute inset-0 bg-industrial-red transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-in-out"></div>
          </a>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row relative">
        {/* Left Grid Gutter */}
        <aside className="hidden xl:flex w-16 border-r-2 border-industrial-black flex-col items-center py-4 gap-8">
           <div className="w-8 h-8 border-2 border-industrial-black rounded-full flex items-center justify-center font-mono text-xs">N</div>
           <div className="w-8 h-8 border-2 border-industrial-black rounded-full flex items-center justify-center font-mono text-xs bg-industrial-red text-white">Y</div>
           <div className="w-8 h-8 border-2 border-industrial-black rounded-full flex items-center justify-center font-mono text-xs">C</div>
           <div className="flex-1 w-px bg-industrial-black"></div>
        </aside>

        <div className="flex-1 w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCBMIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] relative">
          {children}
        </div>

        {/* Right Grid Gutter */}
        <aside className="hidden xl:flex w-16 border-l-2 border-industrial-black flex-col items-center py-4 font-mono text-[10px] uppercase writing-vertical-rl rotate-180">
          <span className="tracking-[0.2em] opacity-50">SYS.LOC :: ACTIVE</span>
          <span className="tracking-[0.2em] opacity-50 mt-4">SEQ.001</span>
        </aside>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-industrial-black bg-industrial-black text-industrial-bg p-6 font-mono text-xs uppercase grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="font-bold mb-2 flex items-center gap-2"><Cog size={16}/> Project Built to Perform for Decades.</h4>
          <p className="opacity-70">Orion Minecraft AI Bridge is an open-source initiative bridging local infrastructure with intelligent systems.</p>
        </div>
        <div className="md:text-center">
          <div className="inline-block border border-industrial-bg p-2 text-center">
            <span className="block font-bold">WARNING</span>
            <span className="block opacity-70">Industrial Grade Equipment</span>
          </div>
        </div>
        <div className="md:text-right">
          <p>© {new Date().getFullYear()} The Artificial Times.</p>
          <p className="opacity-70 mt-1">Printed in U.S.A.</p>
          <div className="mt-4 flex justify-end">
            <div className="w-24 h-8 bg-industrial-bg"></div> {/* Barcode placeholder */}
          </div>
        </div>
      </footer>
    </div>
  )
}
