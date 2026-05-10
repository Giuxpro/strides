'use client'

import { useState } from 'react'
import { KIDS_THEMES, type KidsTheme } from '@strides/core/kids'

interface Props {
  currentTheme: string
}

export function ThemeButton({ currentTheme }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(currentTheme)

  function applyTheme(themeId: string) {
    setActive(themeId)
    const wrapper = document.querySelector('[data-kids-theme]')
    if (wrapper) wrapper.setAttribute('data-kids-theme', themeId)
    document.cookie = `kids_theme=${themeId}; path=/; max-age=31536000; SameSite=Lax`
    setOpen(false)
  }

  const tematic = KIDS_THEMES.filter(t => t.section === 'tematic')
  const pastel  = KIDS_THEMES.filter(t => t.section === 'pastel')
  const basic   = KIDS_THEMES.filter(t => t.section === 'basic')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Cambiar tema"
        className="fixed bottom-6 right-5 z-40 w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{
          background: 'var(--kids-surface-alt)',
          border: '1.5px solid var(--kids-border-color)',
          boxShadow: '0 3px 0 rgba(0,0,0,0.12)',
        }}
      >
        <span style={{ fontSize: 18 }}>⚙️</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      {open && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up"
          style={{
            background: 'var(--kids-bg)',
            borderTop: '1.5px solid var(--kids-border-color)',
          }}
        >
          {/* Handle */}
          <div
            className="w-10 h-1 rounded-full mx-auto mb-5"
            style={{ background: 'var(--kids-border-color)' }}
          />

          <div className="flex items-center justify-between mb-6">
            <h2
              className="font-extrabold text-xl"
              style={{ color: 'var(--kids-text)' }}
            >
              Elige tu tema
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-opacity hover:opacity-70"
              style={{ background: 'var(--kids-surface-alt)', color: 'var(--kids-text-muted)' }}
            >
              ✕
            </button>
          </div>

          <ThemeSection title="🌌 Temáticos"  themes={tematic} active={active} onSelect={applyTheme} />
          <ThemeSection title="🍬 Pasteles"   themes={pastel}  active={active} onSelect={applyTheme} />
          <ThemeSection title="⚡ Básico"     themes={basic}   active={active} onSelect={applyTheme} />
        </div>
      )}
    </>
  )
}

function ThemeSection({
  title, themes, active, onSelect,
}: {
  title: string
  themes: KidsTheme[]
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="mb-7">
      <p
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: 'var(--kids-text-muted)' }}
      >
        {title}
      </p>
      <div className="flex flex-wrap gap-4">
        {themes.map(theme => {
          const isActive = active === theme.id
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
                style={{
                  background: theme.previewBg,
                  boxShadow: isActive
                    ? `0 0 0 3px ${theme.previewAccent}`
                    : '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <span style={{ fontSize: 26 }}>{theme.emoji}</span>
                {isActive && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: theme.previewAccent, fontSize: 10 }}
                  >
                    ✓
                  </div>
                )}
              </div>
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--kids-text-muted)' }}
              >
                {theme.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
