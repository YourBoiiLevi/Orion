import React from 'react'
import Section from '../components/Section'
import { ExternalLink } from 'lucide-react'

const LINKS = [
  {
    category: 'Minecraft Bedrock',
    items: [
      {
        title: 'Microsoft /wsserver command reference',
        url: 'https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/wsserver?view=minecraft-bedrock-stable',
        desc: 'Official documentation for the /wsserver (aka /connect) command that Bedrock uses to connect to external WebSocket servers.'
      },
      {
        title: 'Bedrock WebSocket packet examples',
        url: 'https://www.s-anand.net/blog/programming-minecraft-with-websockets/',
        desc: 'A practical guide to the Bedrock WebSocket protocol including subscribe, commandRequest, and commandResponse packets, plus queue behavior notes.'
      },
    ]
  },
  {
    category: 'OpenAI API',
    items: [
      {
        title: 'OpenAI Chat Completions API reference',
        url: 'https://developers.openai.com/api/reference/resources/chat',
        desc: 'The specification that all "OpenAI-compatible" endpoints implement. Orion uses the messages/choices/content shape.'
      },
    ]
  },
  {
    category: 'NVIDIA NIM Models',
    items: [
      {
        title: 'GLM 5.2 — NIM page',
        url: 'https://build.nvidia.com/z-ai/glm-5.2',
        desc: 'The default model. Free-tier available. Uses the /v1/chat/completions OpenAI-compatible endpoint.'
      },
      {
        title: 'GLM 5.2 — API reference',
        url: 'https://docs.api.nvidia.com/nim/reference/z-ai-glm-5.2-infer',
        desc: 'Technical documentation for the GLM 5.2 inference endpoint including request/response schemas.'
      },
      {
        title: 'DeepSeek V4 Pro — API reference',
        url: 'https://docs.api.nvidia.com/nim/reference/deepseek-ai-deepseek-v4-pro-infer',
        desc: 'Supports reasoning_effort parameter. Profile disables reasoning for faster command generation.'
      },
      {
        title: 'DeepSeek V4 Flash — NIM page',
        url: 'https://build.nvidia.com/deepseek-ai/deepseek-v4-flash',
        desc: 'Fastest model in the profile set. Marked as expectedFast in the diagnostic matrix.'
      },
      {
        title: 'Kimi K2.6 — NIM page',
        url: 'https://build.nvidia.com/moonshotai/kimi-k2.6',
        desc: 'Moonshot AI model. Profile disables thinking mode and sets seed for deterministic output.'
      },
      {
        title: 'Nemotron 3 Ultra — NIM page',
        url: 'https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b',
        desc: 'NVIDIA\'s own large model. Profile disables thinking and forces non-empty content.'
      },
    ]
  },
]

export default function Research() {
  return (
    <div className="p-8 md:p-12 max-w-4xl">
      <div className="border-b-4 border-industrial-black pb-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-masthead font-black uppercase tracking-tight">Research</h1>
        <p className="font-mono text-xs uppercase font-bold mt-2 opacity-50">Dependencies, references, and further reading</p>
      </div>

      <Section title="Dependencies" number="01">
        <p>Orion has a single production dependency:</p>
        <div className="border-2 border-industrial-black bg-white overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b-2 border-industrial-black bg-industrial-black text-white">
                <th className="text-left p-3 uppercase text-xs">Package</th>
                <th className="text-left p-3 uppercase text-xs">Version</th>
                <th className="text-left p-3 uppercase text-xs">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 text-xs font-bold">ws</td>
                <td className="p-3 text-xs">^8.18.0</td>
                <td className="p-3 text-xs font-ui">WebSocket server implementation. Handles the Bedrock /connect protocol.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm mt-4 opacity-80">
          Everything else — <code>fetch</code>, <code>crypto.randomUUID</code>, <code>node:test</code>,
          <code> node:fs</code> — is built into Node.js &gt;=20. The <code>.env</code> parser is also
          custom-written with no external dependencies.
        </p>
      </Section>

      {LINKS.map((group, i) => (
        <Section key={group.category} title={group.category} number={String(i + 2).padStart(2, '0')}>
          <div className="space-y-4">
            {group.items.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="block border-2 border-industrial-black p-4 bg-white hover:bg-industrial-black hover:text-white transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-mono font-bold text-sm uppercase">{link.title}</h4>
                    <p className="text-xs font-ui mt-1 opacity-80">{link.desc}</p>
                  </div>
                  <ExternalLink size={16} className="flex-shrink-0 mt-1 opacity-40 group-hover:opacity-100" />
                </div>
                <div className="font-mono text-[10px] mt-2 opacity-40 group-hover:opacity-60 truncate">
                  {link.url}
                </div>
              </a>
            ))}
          </div>
        </Section>
      ))}
    </div>
  )
}
