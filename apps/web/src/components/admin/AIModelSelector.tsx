'use client'

import { useState } from 'react'
import { MODELS } from '@strides/core'
import type { ModelMetadata } from '@strides/core'

const PROVIDERS: Array<{ value: ModelMetadata['provider']; label: string }> = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai',    label: 'OpenAI' },
  { value: 'google',    label: 'Google' },
]

interface Props {
  initialProvider: string
  initialModel: string
}

export function AIModelSelector({ initialProvider, initialModel }: Props) {
  const validProvider = (PROVIDERS.find(p => p.value === initialProvider)?.value ?? 'anthropic') as ModelMetadata['provider']
  const [provider, setProvider] = useState<ModelMetadata['provider']>(validProvider)

  const providerModels = MODELS.filter(m => m.provider === provider)
  const defaultModel = providerModels.find(m => m.id === initialModel)?.id ?? providerModels[0]?.id ?? ''
  const [model, setModel] = useState(defaultModel)

  function handleProviderChange(next: ModelMetadata['provider']) {
    setProvider(next)
    const first = MODELS.find(m => m.provider === next)?.id ?? ''
    setModel(first)
  }

  const selected = MODELS.find(m => m.id === model)

  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Proveedor activo</label>
        <div className="flex gap-4">
          {PROVIDERS.map(p => (
            <label key={p.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ai_provider"
                value={p.value}
                checked={provider === p.value}
                onChange={() => handleProviderChange(p.value)}
                className="accent-violet-500"
              />
              <span className="text-sm text-gray-300">{p.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="ai_model" className="block text-sm text-gray-400 mb-2">Modelo</label>
        <select
          id="ai_model"
          name="ai_model"
          value={model}
          onChange={e => setModel(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          {providerModels.map(m => (
            <option key={m.id} value={m.id}>
              {m.displayName}
              {m.speed === 'fast' ? ' · Rápido' : m.speed === 'slow' ? ' · Lento' : ' · Medio'}
              {m.hasReasoning ? ' · Razonamiento' : ''}
            </option>
          ))}
        </select>
        {selected && (
          <p className="text-xs text-gray-600 mt-1.5">{selected.description}</p>
        )}
      </div>
    </>
  )
}
