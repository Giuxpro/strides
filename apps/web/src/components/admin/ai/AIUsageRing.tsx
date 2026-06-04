'use client'

import { useState } from 'react'
import type { AIUsageSummary } from '@strides/db'
import type { ModelMetadata } from '@strides/core'

interface Props {
  usage: AIUsageSummary
  model: ModelMetadata
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 16
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 1))

  return (
    <svg width={40} height={40} className="rotate-[-90deg]">
      <circle cx={20} cy={20} r={r} fill="none" stroke="#1f2937" strokeWidth={4} />
      <circle
        cx={20} cy={20} r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-gray-500">
      <span>{label}</span>
      <span className="text-gray-300 shrink-0">{value}</span>
    </div>
  )
}

export function AIUsageRing({ usage, model }: Props) {
  const [open, setOpen] = useState(false)

  const isAudioModel = !!model.costPerMinute
  const isFreeTier = model.hasFreeTier && model.freeTierLimits
  const isFree = model.inputCostPerMTok === 0 && !model.costPerMinute

  const limit = isFreeTier ? model.freeTierLimits!.requestsPerDay : null
  const current = usage.requestsToday
  const pct = limit ? current / limit : 0

  const color = pct > 0.85 ? '#ef4444' : pct > 0.6 ? '#f59e0b' : '#8b5cf6'

  const totalTokens = usage.inputTokensToday + usage.outputTokensToday
  const totalDurationMin = (usage.totalDurationMsToday ?? 0) / 60_000
  const estimatedCost = isAudioModel
    ? totalDurationMin * model.costPerMinute!
    : isFree
      ? 0
      : ((usage.inputTokensToday / 1_000_000) * model.inputCostPerMTok) +
        ((usage.outputTokensToday / 1_000_000) * model.outputCostPerMTok)

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        aria-label="Ver uso de IA hoy"
        className="relative flex items-center justify-center"
      >
        <Ring pct={pct} color={color} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {limit ? (
            <>
              <span className="text-[9px] font-bold text-gray-200 leading-none">{current}</span>
              <span className="text-[7px] text-gray-600 leading-none">/{limit}</span>
            </>
          ) : (
            <span className="text-[8px] text-gray-400 leading-none">{formatTokens(totalTokens)}</span>
          )}
        </div>
      </button>

      {/* Popover — se abre hacia abajo */}
      {open && (
        <div className="absolute top-full mt-2 right-0 z-50 w-52 bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl text-xs space-y-2">
          {/* flecha superior */}
          <div className="absolute bottom-full right-3 border-4 border-transparent border-b-gray-700" />

          <p className="text-gray-300 font-medium truncate">{model.displayName}</p>

          <div className="space-y-1.5">
            <Row label="Requests hoy" value={limit ? `${current} / ${limit}` : String(current)} />
            {isAudioModel ? (
              <Row label="Duración total" value={`${totalDurationMin.toFixed(1)} min`} />
            ) : (
              <>
                <Row label="Tokens entrada" value={formatTokens(usage.inputTokensToday)} />
                <Row label="Tokens salida" value={formatTokens(usage.outputTokensToday)} />
                <Row label="Total tokens" value={formatTokens(totalTokens)} />
              </>
            )}
          </div>

          <div className="border-t border-gray-800 pt-2">
            {isFree ? (
              <p className="text-emerald-400">Siempre gratis · $0.00</p>
            ) : isFreeTier ? (
              <p className="text-teal-400">
                {pct < 1
                  ? `${(limit! - current).toLocaleString()} req restantes hoy`
                  : 'Límite free tier alcanzado'}
              </p>
            ) : (
              <p className="text-gray-400">
                Costo est.: <span className="text-amber-400">${estimatedCost.toFixed(4)}</span>
              </p>
            )}
          </div>

          {usage.byModel.length > 1 && (
            <div className="border-t border-gray-800 pt-2 space-y-1">
              <p className="text-gray-600 mb-1">Por modelo hoy</p>
              {usage.byModel.map(m => (
                <div key={m.model} className="flex justify-between text-gray-500">
                  <span className="truncate max-w-[110px]">{m.model}</span>
                  <span>{m.requests} req</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
