'use client'

import { useMusicContext } from './MusicProvider'

export function MusicButton() {
  const { muted, toggleMute } = useMusicContext()

  return (
    <button
      onClick={toggleMute}
      aria-label={muted ? 'Activar música' : 'Silenciar música'}
      className="fixed bottom-20 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      style={{
        background: 'rgba(255,255,255,0.18)',
        border: '1.5px solid rgba(255,255,255,0.28)',
        backdropFilter: 'blur(8px)',
        fontSize: '1.1rem',
      }}
    >
      {muted ? '🔇' : '🎵'}
    </button>
  )
}
