'use client'

import { useState, useEffect } from 'react'
import type { ModuleConfig, ModifierConfig } from '@strides/core/kids'

export interface ModifierSelection {
  timer: number | null    // null = off; 30 | 60 | 120 segundos
  lives: number | null    // null = off; 1 | 3 | 5
  multiplier: boolean
}

export const DEFAULT_MODIFIER_SELECTION: ModifierSelection = {
  timer: null,
  lives: null,
  multiplier: false,
}

export function toModifierConfigs(sel: ModifierSelection): ModifierConfig[] {
  const configs: ModifierConfig[] = []
  if (sel.timer !== null) configs.push({ type: 'timer', seconds: sel.timer })
  if (sel.lives !== null) configs.push({ type: 'lives', count: sel.lives })
  if (sel.multiplier && (sel.timer !== null || sel.lives !== null)) configs.push({ type: 'multiplier' })
  return configs
}

export function modifierLabel(sel: ModifierSelection): string {
  const parts: string[] = []
  if (sel.timer !== null) parts.push(sel.timer >= 60 ? `⏱️ ${sel.timer / 60}min` : `⏱️ ${sel.timer}s`)
  if (sel.lives !== null) parts.push(`❤️ ×${sel.lives}`)
  if (sel.multiplier && (sel.timer !== null || sel.lives !== null)) parts.push('⚡')
  return parts.length > 0 ? parts.join(' · ') : 'Normal'
}

export type AvailableModifiers = {
  timer?: boolean
  lives?: boolean
  multiplier?: boolean
}

interface Props {
  value: ModifierSelection
  onChange: (v: ModifierSelection) => void
  onClose: () => void
  moduleConfig: ModuleConfig
  availableModifiers?: AvailableModifiers | null
}

const TIMER_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Off',   value: null },
  { label: '30s',   value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
]

const LIVES_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Off', value: null },
  { label: '1 ❤️', value: 1 },
  { label: '3 ❤️', value: 3 },
  { label: '5 ❤️', value: 5 },
]

export function ModifierPickerModal({ value, onChange, onClose, moduleConfig, availableModifiers }: Props) {
  const timerOn      = !availableModifiers || availableModifiers.timer      !== false
  const livesOn      = !availableModifiers || availableModifiers.lives      !== false
  const multiplierOn = !availableModifiers || availableModifiers.multiplier !== false
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function close() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const hasTermination = value.timer !== null || value.lives !== null

  function pillStyle(active: boolean) {
    return {
      background: active ? moduleConfig.gradient : 'rgba(0,0,0,0.06)',
      color: active ? '#fff' : 'var(--kids-text-muted)',
      boxShadow: active ? moduleConfig.shadow : 'none',
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col justify-end"
      style={{ background: visible ? 'rgba(0,0,0,0.45)' : 'transparent', transition: 'background 0.28s' }}
      onClick={close}
    >
      <div
        className="rounded-t-[2rem] px-6 pt-5 pb-10"
        style={{
          background: 'var(--kids-bg)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)',
          boxShadow: '0 -12px 40px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--kids-border-color)' }} />

        <div className="flex items-center justify-between mb-6">
          <div className="w-8" />
          <p className="font-extrabold text-xl" style={{ color: 'var(--kids-text)' }}>
            🎮 Modo de juego
          </p>
          <button
            onClick={close}
            className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(0,0,0,0.07)', color: 'var(--kids-text-muted)' }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Timer */}
        {timerOn && (
          <Section label="⏱️ Tiempo">
            {TIMER_OPTIONS.map(opt => (
              <Pill
                key={String(opt.value)}
                label={opt.label}
                active={value.timer === opt.value}
                style={pillStyle(value.timer === opt.value)}
                onTap={() => onChange({ ...value, timer: opt.value })}
              />
            ))}
          </Section>
        )}

        {/* Lives */}
        {livesOn && (
          <Section label="❤️ Vidas">
            {LIVES_OPTIONS.map(opt => (
              <Pill
                key={String(opt.value)}
                label={opt.label}
                active={value.lives === opt.value}
                style={pillStyle(value.lives === opt.value)}
                onTap={() => onChange({ ...value, lives: opt.value })}
              />
            ))}
          </Section>
        )}

        {/* Multiplier */}
        {multiplierOn && (
          <Section label="⚡ Multiplicador">
            <div className="flex items-center gap-2">
              {(['off', 'on'] as const).map(v => {
                const active = v === 'on' ? value.multiplier : !value.multiplier
                const disabled = v === 'on' && !hasTermination
                return (
                  <button
                    key={v}
                    disabled={disabled}
                    onClick={() => !disabled && onChange({ ...value, multiplier: v === 'on' })}
                    className="px-4 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95"
                    style={{
                      ...pillStyle(active && !disabled),
                      opacity: disabled ? 0.35 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {v === 'off' ? 'Off' : 'On ⚡'}
                  </button>
                )
              })}
            </div>
            {!hasTermination && (
              <p className="text-xs mt-1.5 w-full" style={{ color: 'var(--kids-text-muted)' }}>
                Requiere tiempo o vidas activados
              </p>
            )}
          </Section>
        )}

        {/* CTA */}
        <div className="flex justify-center mt-6">
          <button
            onClick={close}
            className="px-10 py-2.5 rounded-2xl font-extrabold text-white text-base transition-all hover:scale-[1.03] active:scale-95"
            style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
          >
            ¡Listo!
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="font-bold text-sm mb-2.5" style={{ color: 'var(--kids-text)' }}>{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function Pill({ label, active, style, onTap }: {
  label: string
  active: boolean
  style: React.CSSProperties
  onTap: () => void
}) {
  return (
    <button
      onClick={onTap}
      className="px-4 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95"
      style={style}
    >
      {label}
    </button>
  )
}
