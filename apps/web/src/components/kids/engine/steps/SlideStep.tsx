'use client'

import { useState, useEffect } from 'react'
import type { ModuleConfig } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/VoicePresetProvider'

interface Props {
  title: string | null
  config: { image_url?: string; text_en: string; text_es: string }
  onComplete: () => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

export function SlideStep({ title, config, onComplete, onBack, moduleConfig, progress }: Props) {
  const speakFn = useSpeak()
  const [speaking, setSpeaking] = useState(false)

  function speak(slow: boolean) {
    setSpeaking(true)
    speakFn(config.text_en, { slow, onEnd: () => setSpeaking(false) })
  }

  useEffect(() => {
    const timer = setTimeout(() => speak(false), 700)
    return () => {
      clearTimeout(timer)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSpeaker() { speak(false) }
  function handleTurtle()  { speak(true)  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 py-8">
      <div
        className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
      />

      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-70"
        style={{ color: moduleConfig.accent }}
      >
        ← Volver
      </button>

      <div className="absolute top-6 right-6 z-20">
        <span className="text-xs font-bold" style={{ color: 'var(--kids-text-muted)' }}>
          {progress.current} / {progress.total}
        </span>
      </div>

      <div className="relative z-10 text-center max-w-sm w-full space-y-6 animate-slide-up">
        {title && (
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--kids-text-muted)' }}>
            {title}
          </p>
        )}

        {config.image_url && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={config.image_url}
              alt={config.text_en}
              className="w-48 h-48 object-contain drop-shadow-2xl animate-float"
            />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-5xl font-extrabold leading-tight" style={{ color: 'var(--kids-text)' }}>
              {config.text_en}
            </h2>

            {/* Audio controls */}
            <div className="flex flex-col gap-2">
              {/* Speaker — normal / slow speed based on current mode */}
              <button
                onClick={handleSpeaker}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
                aria-label="Escuchar pronunciación"
              >
                {speaking ? '🔊' : '🔈'}
              </button>

              {/* Turtle — toggle slow mode */}
              <button
                onClick={handleTurtle}
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95"
                style={{ background: moduleConfig.accentLight }}
                aria-label="Reproducir más lento"
                title="Más lento"
              >
                🐢
              </button>
            </div>
          </div>

          <p className="text-xl font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
            {config.text_es}
          </p>
        </div>

        <button
          onClick={onComplete}
          className="text-white font-extrabold text-lg px-10 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
          style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}
