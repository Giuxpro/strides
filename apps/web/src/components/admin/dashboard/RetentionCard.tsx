'use client'

import { useEffect, useRef, useState } from 'react'
import type { RetentionMetrics } from '@strides/db'
import { InfoTooltip } from '@/components/admin/shared/InfoTooltip'

interface Props extends RetentionMetrics {}

export function RetentionCard({ rate, cohortSize, retained }: Props) {
  const [displayed, setDisplayed] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const duration = 1000
    const start = performance.now()
    function animate(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(eased * rate))
      if (t < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rate])

  const color = rate >= 60 ? '#34D399' : rate >= 35 ? '#FCD34D' : '#FB7185'
  const glow  = rate >= 60 ? 'rgba(16,185,129,0.15)' : rate >= 35 ? 'rgba(245,158,11,0.15)' : 'rgba(244,63,94,0.15)'

  const circumference = 2 * Math.PI * 28
  const offset = circumference * (1 - rate / 100)
  const lost = cohortSize - retained

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: '20px',
      }}
    >
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-white">Retención semanal</h2>
          <InfoTooltip text="Mide cuántos niños que jugaron la semana pasada volvieron esta semana. Compara dos ventanas de 7 días: si un niño estuvo en AMBAS semanas, cuenta como retenido. Un niño nuevo esta semana NO cuenta como retenido. Con pocos usuarios el % fluctúa mucho — es más fiable con más de 10 niños activos." />
        </div>
        <p className="text-[11px] text-gray-600 mt-0.5">Comparación semana anterior → semana actual</p>
      </div>

      {cohortSize === 0 ? (
        <p className="text-[12px] text-gray-700 py-4 text-center">Sin actividad la semana pasada</p>
      ) : (
        <>
          {/* Ring + % */}
          <div className="flex items-center gap-5 mb-5">
            <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
              <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={36} cy={36} r={28} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                <circle
                  cx={36} cy={36} r={28}
                  fill="none"
                  stroke={color}
                  strokeWidth={6}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${glow})`, transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span style={{ fontSize: 16, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
                  {displayed}%
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              <p className="text-xs text-gray-400">
                <span className="font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{retained}</span>
                {' '}de{' '}
                <span className="font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{cohortSize}</span>
                {' '}niños volvieron esta semana
              </p>
              <p className="text-[10px] text-gray-700">
                {lost === 0 ? 'Sin niños perdidos' : `${lost} no regresaron`}
              </p>
            </div>
          </div>

          {/* Barras comparativas semana a semana */}
          <div className="space-y-3">
            {/* Semana anterior */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] text-gray-500">Sem. anterior</span>
                <span className="text-[11px] font-semibold text-gray-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {cohortSize} niños
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: '100%', background: 'rgba(255,255,255,0.18)' }} />
              </div>
            </div>

            {/* Semana actual */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] text-gray-500">Esta semana</span>
                <span className="text-[11px] font-semibold" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
                  {retained} regresaron
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${rate}%`,
                    background: color,
                    boxShadow: `0 0 8px ${glow}`,
                  }}
                />
              </div>
              {/* Diferencia visual */}
              {lost > 0 && (
                <div className="flex justify-end mt-1">
                  <span className="text-[10px] text-gray-700">
                    −{lost} vs sem. anterior
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
