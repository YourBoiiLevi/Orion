import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Terminal } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Overview' },
  { to: '/docs', label: 'Quickstart' },
  { to: '/docs/architecture', label: 'Architecture' },
  { to: '/docs/development', label: 'Development' },
  { to: '/docs/research', label: 'Research' },
]

export function Layout({ children }) {
  const location = useLocation()

  const [easterEgg, setEasterEgg] = React.useState(false)

  React.useEffect(() => {
    let keys = []
    const handleKeyDown = (e) => {
      keys.push(e.key.toLowerCase())
      if (keys.length > 9) keys.shift()
      if (keys.join('').includes('minecraft')) {
        setEasterEgg(true)
        setTimeout(() => setEasterEgg(false), 3000)
        keys = []
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`min-h-screen bg-industrial-bg text-industrial-black flex flex-col font-ui border-8 border-industrial-black ${easterEgg ? 'animate-pulse' : ''}`}>
      {/* Header */}
      <header className="border-b-4 border-industrial-black bg-industrial-bg relative z-20">
        {/* Top utility bar */}
        <div className="flex justify-between items-center border-b border-industrial-black px-4 py-1 text-[10px] font-mono uppercase font-bold tracking-widest">
          <span>Technical Documentation</span>
          <span className="hidden md:inline">Orion Minecraft AI Bridge</span>
          <span className="flex items-center gap-1.5"><Terminal size={12} /> v0.1.0</span>
        </div>

        {/* Project Title */}
        <div className="px-6 py-6 flex justify-between items-center">
          <Link to="/" className="group">
            <h1 className="text-4xl md:text-5xl font-masthead font-black tracking-tighter uppercase leading-none group-hover:text-industrial-red transition-colors">
              Orion
            </h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider font-bold opacity-60">
              Minecraft Bedrock AI Bridge
            </p>
          </Link>

          <a
            href="https://github.com/YourBoiiLevi/Orion"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-2 border-2 border-industrial-black px-4 py-2 font-mono text-xs uppercase font-bold hover:bg-industrial-black hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> View on GitHub
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex overflow-x-auto border-t-2 border-industrial-black font-mono text-xs uppercase font-bold">
          {NAV_ITEMS.map((item, i) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-shrink-0 px-5 py-3 border-r border-industrial-black hover:bg-industrial-red hover:text-white transition-colors ${isActive ? 'bg-industrial-black text-white' : ''}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 relative">
        <div className="bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCBMIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')]">
          {children}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t-4 border-industrial-black bg-industrial-black text-industrial-bg px-6 py-3 font-mono text-[10px] uppercase flex justify-between items-center tracking-wider">
        <span>© {new Date().getFullYear()} Orion Project</span>
        <span className="opacity-50">Open Source · MIT</span>
        <span className="opacity-50">Node &gt;=20 · ws</span>
      </footer>
    </div>
  )
}
