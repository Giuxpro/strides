'use client'

import { useState } from 'react'
import { SPEECH_PROVIDERS } from '@strides/core/kids'
import type { SpeechProvider } from '@strides/core/kids'

interface Props {
  initialProvider: SpeechProvider
}

export function SpeechProviderSelector({ initialProvider }: Props) {
  const [selected, setSelected] = useState<SpeechProvider>(initialProvider)
  const meta = SPEECH_PROVIDERS.find(p => p.id === selected)

  return (
    <>
      <input type="hidden" name="speech_provider" value={selected} />

      <div>
        <label className="block text-sm text-gray-400 mb-3">Proveedor de reconocimiento de voz</label>
        <div className="flex flex-col gap-3">
          {SPEECH_PROVIDERS.map(p => (
            <label key={p.id} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="_speech_provider_ui"
                value={p.id}
                checked={selected === p.id}
                onChange={() => setSelected(p.id)}
                className="accent-violet-500 mt-0.5"
              />
              <span>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {p.emoji} {p.label}
                  <span
                    className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.18)', color: '#a78bfa' }}
                  >
                    {p.badge}
                  </span>
                </span>
                <span className="block text-xs text-gray-600 mt-0.5">{p.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {meta && (
        <p className="text-xs text-gray-600 mt-1">
          Costo estimado: <span className="text-gray-400">{meta.cost}</span>
        </p>
      )}
    </>
  )
}
