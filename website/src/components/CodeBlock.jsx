import React, { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'

export default function CodeBlock({ code, lang = 'shell', filename }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    codeToHtml(code, {
      lang,
      theme: 'github-dark'
    }).then(setHtml).catch(() => setHtml(''))
  }, [code, lang])

  return (
    <div className="relative group my-4">
      {filename && (
        <div className="bg-industrial-black text-white font-mono text-[10px] uppercase px-3 py-1 inline-block border-2 border-industrial-black border-b-0">
          {filename}
        </div>
      )}
      {!filename && (
        <div className="bg-industrial-black text-white font-mono text-[10px] uppercase px-3 py-1 inline-block border-2 border-industrial-black border-b-0">
          {lang}
        </div>
      )}
      <div className="border-2 border-industrial-black bg-[#0d1117] p-4 overflow-x-auto text-sm font-mono [&_pre]:!bg-transparent [&_code]:!bg-transparent [&_.shiki]:!bg-transparent">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="text-gray-300"><code>{code}</code></pre>
        )}
      </div>
    </div>
  )
}
