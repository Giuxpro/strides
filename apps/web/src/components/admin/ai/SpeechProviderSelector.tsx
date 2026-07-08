'use client'

import { useState } from 'react'
import { SPEECH_PROVIDERS } from '@strides/core/kids'
import type { SpeechProvider } from '@strides/core/kids'
import type { AIUsageSummary } from '@strides/db'
import type { ModelMetadata } from '@strides/core'
import { AIUsageRing } from './AIUsageRing'

interface Props {
  initialProvider: SpeechProvider
  whisperUsage: AIUsageSummary
  whisperModel: ModelMetadata
  groqWhisperUsage: AIUsageSummary
  groqWhisperModel: ModelMetadata
}

export function SpeechProviderSelector({ initialProvider, whisperUsage, whisperModel, groqWhisperUsage, groqWhisperModel }: Props) {
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

      {selected === 'whisper' && (
        <div className="border-t border-gray-800 pt-4 space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-400">Whisper-1 · uso hoy</p>
            <AIUsageRing usage={whisperUsage} model={whisperModel} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Evaluaciones</span>
            <span className="text-gray-300">{whisperUsage.requestsToday}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Duración total</span>
            <span className="text-gray-300">{(whisperUsage.totalDurationMsToday / 60_000).toFixed(1)} min</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Costo est.</span>
            <span className="text-amber-400">
              ${((whisperUsage.totalDurationMsToday / 60_000) * 0.006).toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {selected === 'groq-whisper' && (
        <div className="border-t border-gray-800 pt-4 space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-400">Whisper Large v3 Turbo · uso hoy</p>
            <AIUsageRing usage={groqWhisperUsage} model={groqWhisperModel} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Evaluaciones</span>
            <span className="text-gray-300">
              {groqWhisperUsage.requestsToday}
              {groqWhisperModel.freeTierLimits && (
                <span className="text-gray-600"> / {groqWhisperModel.freeTierLimits.requestsPerDay} día</span>
              )}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Duración total</span>
            <span className="text-gray-300">{(groqWhisperUsage.totalDurationMsToday / 60_000).toFixed(1)} min</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Costo est.</span>
            <span className="text-emerald-400">Gratis</span>
          </div>
        </div>
      )}
    </>
  )
}
