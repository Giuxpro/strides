'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { KIDS_THEMES, type KidsTheme } from '@strides/core/kids'
import { useMusicContext } from '../audio/MusicProvider'
import { useClickSoundContext } from '../audio/ClickSoundProvider'

interface Props {
  currentTheme: string
}

export function ThemeButton({ currentTheme }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(currentTheme)

  // Ocultar durante gameplay — la ruta de lección tiene la forma
  // /kids/play/[moduleSlug]/[lessonSlug] (4 segmentos después de /kids)
  const segments = pathname.split('/').filter(Boolean)
  const isInLesson = segments[0] === 'kids' && segments[1] === 'play' && segments.length >= 4
  if (isInLesson) return null
  const { muted: musicMuted, toggleMute: toggleMusic, volume: musicVolume, setVolume: setMusicVolume } = useMusicContext()
  const { muted: soundMuted, toggleMute: toggleSound, volume: soundVolume, setVolume: setSoundVolume } = useClickSoundContext()

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
        aria-label="Ajustes"
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
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
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      {open && (
        <div
          className="fixed top-0 right-0 h-full z-50 w-72 flex flex-col animate-slide-right shadow-2xl"
          style={{
            background: 'var(--kids-bg)',
            borderLeft: '1.5px solid var(--kids-border-color)',
          }}
        >
          {/* Header fijo */}
          <div
            className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0"
            style={{ borderBottom: '1px solid var(--kids-border-color)' }}
          >
            <h2 className="font-extrabold text-lg" style={{ color: 'var(--kids-text)' }}>
              Preferencias
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-opacity hover:opacity-70"
              style={{ background: 'var(--kids-surface-alt)', color: 'var(--kids-text-muted)' }}
            >
              ✕
            </button>
          </div>

          {/* Contenido scrollable sin scrollbar */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5 flex flex-col gap-6">

            {/* Sonido */}
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: 'var(--kids-text-muted)' }}
              >
                Sonido
              </p>
              <div className="flex flex-col gap-2">
                <SoundToggle
                  emoji={musicMuted ? '🔇' : '🎵'}
                  label="Música"
                  active={!musicMuted}
                  onToggle={toggleMusic}
                  volume={musicVolume}
                  onVolumeChange={setMusicVolume}
                />
                <SoundToggle
                  emoji={soundMuted ? '🔕' : '🔊'}
                  label="Sonidos de botones"
                  active={!soundMuted}
                  onToggle={toggleSound}
                  volume={soundVolume}
                  onVolumeChange={setSoundVolume}
                />
              </div>
            </div>

            {/* Temas */}
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: 'var(--kids-text-muted)' }}
              >
                Tema
              </p>
              <ThemeSection title="🌌 Temáticos"  themes={tematic} active={active} onSelect={applyTheme} />
              <ThemeSection title="🍬 Pasteles"   themes={pastel}  active={active} onSelect={applyTheme} />
              <ThemeSection title="⚡ Básico"     themes={basic}   active={active} onSelect={applyTheme} />
            </div>

          </div>
        </div>
      )}
    </>
  )
}

function SoundToggle({
  emoji, label, active, onToggle, volume, onVolumeChange,
}: {
  emoji: string
  label: string
  active: boolean
  onToggle: () => void
  volume: number
  onVolumeChange: (v: number) => void
}) {
  const volIcon = volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : volume < 0.75 ? '🔉' : '🔊'
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--kids-surface-alt)' }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span style={{ fontSize: 20 }}>{emoji}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--kids-text)' }}>{label}</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-violet-500' : 'bg-gray-400'}`}
          aria-label={active ? 'Silenciar' : 'Activar'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3">
        <span style={{ fontSize: 13, minWidth: 18, color: 'var(--kids-text-muted)' }}>{volIcon}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={volume}
          onChange={e => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 accent-violet-500"
          style={{ cursor: 'pointer', height: 4 }}
        />
      </div>
    </div>
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
