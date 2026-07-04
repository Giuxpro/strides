'use client'

import { useState } from 'react'
import { MODELS } from '@strides/core'
import type { ModelMetadata } from '@strides/core'
import type { AIUsageSummary } from '@strides/db'
import { AIUsageRing } from './AIUsageRing'

const PROVIDERS: Array<{ value: ModelMetadata['provider']; label: string }> = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai',    label: 'OpenAI' },
  { value: 'google',    label: 'Google' },
  { value: 'groq',      label: 'Groq' },
]

const SPEED_LABEL: Record<ModelMetadata['speed'], string> = {
  fast: 'Rápido',
  medium: 'Medio',
  slow: 'Lento',
}

// Los modelos de audio (costo por minuto, ej. Whisper) no se generan como contenido:
// su proveedor se elige en la sección "Reconocimiento de voz", no aquí.
const isAudioModel = (m: ModelMetadata) => m.costPerMinute != null
const contentModels = (provider: ModelMetadata['provider']) =>
  MODELS.filter(m => m.provider === provider && !isAudioModel(m))

function PricingChip({ model }: { model: ModelMetadata }) {
  if (model.costPerMinute != null) {
    return (
      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
        Pago · ${model.costPerMinute}/min
      </span>
    )
  }
  if (model.inputCostPerMTok === 0) {
    return (
      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
        Gratis
      </span>
    )
  }
  if (model.hasFreeTier) {
    return (
      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-400">
        Free tier
      </span>
    )
  }
  return (
    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
      Pago
    </span>
  )
}

function ModelFooter({ model }: { model: ModelMetadata }) {
  if (model.costPerMinute != null) {
    return (
      <p className="text-xs text-gray-600">
        Costo: <span className="text-amber-400">${model.costPerMinute}/min de audio</span>
      </p>
    )
  }

  const isFree = model.inputCostPerMTok === 0

  if (isFree) {
    return (
      <p className="text-xs text-gray-600">
        Costo: <span className="text-emerald-400">Siempre gratis</span>
        {model.freeTierLimits && (
          <> · Límite: <span className="text-emerald-400">{model.freeTierLimits.requestsPerDay.toLocaleString()} req/día por modelo</span>
          {' · '}
          <span className="text-gray-500">Cada modelo tiene su propio cupo independiente. Al alcanzarlo se bloquea hasta mañana — sin capa de pago, nunca se cobra.</span></>
        )}
      </p>
    )
  }

  if (model.hasFreeTier && model.freeTierLimits) {
    return (
      <p className="text-xs text-gray-600">
        Free tier: <span className="text-teal-400">{model.freeTierLimits.requestsPerDay.toLocaleString()} req/día gratis</span>
        {' · '}
        Si lo agotás, <span className="text-amber-400">debés activar billing en Google Cloud manualmente</span> para continuar — no se cobra de forma automática.
        {' · '}
        Tarifa pago: <span className="text-gray-400">${model.inputCostPerMTok} entrada / ${model.outputCostPerMTok} salida por MTok</span>
      </p>
    )
  }

  return (
    <p className="text-xs text-gray-600">
      Costo por uso: <span className="text-gray-400">${model.inputCostPerMTok}/MTok entrada</span>
      {' · '}
      <span className="text-gray-400">${model.outputCostPerMTok}/MTok salida</span>
    </p>
  )
}

interface Props {
  initialProvider: string
  initialModel: string
  usage?: AIUsageSummary
}

function filterUsageForModel(all: AIUsageSummary | undefined, modelId: string): AIUsageSummary {
  const empty: AIUsageSummary = { requestsToday: 0, inputTokensToday: 0, outputTokensToday: 0, totalDurationMsToday: 0, byModel: [] }
  if (!all) return empty
  const row = all.byModel.find(m => m.model === modelId)
  if (!row) return empty
  return {
    requestsToday:        row.requests,
    inputTokensToday:     row.inputTokens,
    outputTokensToday:    row.outputTokens,
    totalDurationMsToday: row.totalDurationMs,
    byModel: [row],
  }
}

export function AIModelSelector({ initialProvider, initialModel, usage: allUsage }: Props) {
  const savedProvider = (PROVIDERS.find(p => p.value === initialProvider)?.value ?? 'anthropic') as ModelMetadata['provider']
  const savedModels = contentModels(savedProvider)
  const savedModel = savedModels.find(m => m.id === initialModel)?.id ?? savedModels[0]?.id ?? ''

  const [provider, setProvider] = useState<ModelMetadata['provider']>(savedProvider)
  // '' = ningún modelo elegido en esta pestaña (proveedor no activo, sin selección explícita)
  const [model, setModel] = useState(savedModel)

  const providerModels = contentModels(provider)

  function handleProviderChange(next: ModelMetadata['provider']) {
    setProvider(next)
    // Solo la pestaña del proveedor guardado arranca con su modelo marcado.
    setModel(next === savedProvider ? savedModel : '')
  }

  // Guardado seguro: si no hay selección explícita, se conserva lo guardado (no cambia nada).
  const submitProvider = model ? provider : savedProvider
  const submitModel    = model ? model    : savedModel

  const savedProviderLabel = PROVIDERS.find(p => p.value === savedProvider)?.label ?? savedProvider
  const providerLabel      = PROVIDERS.find(p => p.value === provider)?.label ?? provider
  const willChangeProvider = !!model && submitProvider !== savedProvider

  const selected = model ? MODELS.find(m => m.id === model) : undefined
  const usageForModel = filterUsageForModel(allUsage, model)

  return (
    <>
      <input type="hidden" name="ai_provider" value={submitProvider} />
      <input type="hidden" name="ai_model" value={submitModel} />

      <div>
        <label className="block text-sm text-gray-400 mb-2">Proveedor activo</label>
        <div className="flex flex-wrap items-center gap-2">
          {PROVIDERS.map(p => {
            const isTab    = provider === p.value
            const isActive = savedProvider === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handleProviderChange(p.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  isTab
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                    : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
                }`}
              >
                {p.label}
                {isActive && <span className="ml-1.5 text-[10px] text-emerald-400">● activo</span>}
              </button>
            )
          })}

          {selected && (
            <div className="ml-auto">
              <AIUsageRing usage={usageForModel} model={selected} />
            </div>
          )}
        </div>
      </div>

      {/* Aviso al ver un proveedor que no es el activo */}
      {provider !== savedProvider && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${
          willChangeProvider
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            : 'border-gray-700 bg-gray-800/40 text-gray-400'
        }`}>
          {willChangeProvider ? (
            <>Al guardar cambiarás el proveedor activo de <b>{savedProviderLabel}</b> a <b>{providerLabel}</b> · {selected?.displayName}.</>
          ) : (
            <>Estás viendo <b>{providerLabel}</b>. Tu proveedor activo es <b>{savedProviderLabel}</b>. Elige un modelo para cambiar; si guardas sin elegir, no cambia nada.</>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-2">Modelo</label>
        <div className="flex flex-col gap-2">
          {providerModels.map(m => (
            <label
              key={m.id}
              className={`flex items-start gap-3 cursor-pointer rounded-lg border px-3 py-2.5 transition-all ${
                model === m.id
                  ? 'border-violet-500 bg-violet-500/5'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="_ai_model_ui"
                value={m.id}
                checked={model === m.id}
                onChange={() => setModel(m.id)}
                className="accent-violet-500 mt-0.5 shrink-0"
              />
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm text-gray-200">{m.displayName}</span>
                  <PricingChip model={m} />
                  <span className="text-xs text-gray-600">{SPEED_LABEL[m.speed]}</span>
                  {m.hasReasoning && (
                    <span className="text-xs text-gray-600">· Razonamiento</span>
                  )}
                </span>
                <span className="block text-xs text-gray-600 mt-0.5 leading-relaxed">
                  {m.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {selected && <ModelFooter model={selected} />}
    </>
  )
}
