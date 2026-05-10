'use client'

import type { ModuleConfig } from '@strides/core/kids'

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}?autoplay=0`
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}?autoplay=0`
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.replace(/^\//, '')
      return `https://player.vimeo.com/video/${id}`
    }
    return url
  } catch {
    return url
  }
}

interface Props {
  title: string | null
  config: { url: string; caption?: string }
  onComplete: () => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

export function VideoStep({ title, config, onComplete, onBack, moduleConfig, progress }: Props) {
  const embedUrl = toEmbedUrl(config.url)
  const isEmbed = embedUrl.includes('youtube.com/embed') || embedUrl.includes('vimeo.com/video')

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-8">
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

      {/* Progress */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: 'var(--kids-text-muted)' }}>
          {progress.current} / {progress.total}
        </span>
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-6 animate-slide-up">
        {title && (
          <h2 className="text-2xl font-extrabold text-center" style={{ color: 'var(--kids-text)' }}>
            {title}
          </h2>
        )}

        <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
          {isEmbed ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={embedUrl} controls className="w-full h-full" />
          )}
        </div>

        {config.caption && (
          <p className="text-center text-sm" style={{ color: 'var(--kids-text-muted)' }}>
            {config.caption}
          </p>
        )}

        <div className="flex justify-center">
          <button
            onClick={onComplete}
            className="text-white font-extrabold text-lg px-10 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  )
}
