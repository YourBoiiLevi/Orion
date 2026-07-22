import React from 'react'

export default function Section({ title, number, children }) {
  return (
    <section className="relative pl-0 md:pl-14 mb-12">
      {number && (
        <div className="absolute left-0 top-0 font-mono text-3xl font-black text-industrial-red opacity-40 hidden md:block leading-none">
          {number}
        </div>
      )}
      <h2 className="text-xl md:text-2xl font-masthead font-bold uppercase mb-4 flex items-center gap-4">
        <span className="flex-shrink-0">{title}</span>
        <div className="flex-1 h-px bg-industrial-black opacity-20"></div>
      </h2>
      <div className="font-ui text-industrial-black leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  )
}
