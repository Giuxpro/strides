'use client'

import type { VocabItem } from './engine/LessonEngine'
import type { ModuleConfig } from './moduleConfig'
import { SPEECH_RATE_NORMAL } from './engine/speechRates'

interface Props {
  vocab: VocabItem[]
  masteryMap: Record<string, number>   // vocab_id → 0-3
  moduleConfig: ModuleConfig
}

function masteryBg(stars: number): string {
  if (stars === 0) return 'rgba(180,180,180,0.12)'
  if (stars === 1) return 'rgba(239,68,68,0.12)'
  if (stars === 2) return 'rgba(245,158,11,0.12)'
  return 'rgba(34,197,94,0.12)'
}

function masteryBorder(stars: number): string {
  if (stars === 0) return '1.5px solid rgba(180,180,180,0.3)'
  if (stars === 1) return '1.5px solid rgba(239,68,68,0.5)'
  if (stars === 2) return '1.5px solid rgba(245,158,11,0.6)'
  return '1.5px solid rgba(34,197,94,0.6)'
}

function masteryDot(stars: number): string {
  if (stars === 0) return '#c0c0c0'
  if (stars === 1) return '#ef4444'
  if (stars === 2) return '#f59e0b'
  return '#22c55e'
}

function speakWord(item: VocabItem) {
  if (item.audio_url) {
    const audio = new Audio(item.audio_url)
    audio.play().catch(() => fallbackSpeak(item.text_en))
    return
  }
  fallbackSpeak(item.text_en)
}

function fallbackSpeak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'en-US'
  utt.rate = SPEECH_RATE_NORMAL
  window.speechSynthesis.speak(utt)
}

export function KidsPalabrasTab({ vocab, masteryMap, moduleConfig }: Props) {
  if (vocab.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3 px-8 text-center">
        <span style={{ fontSize: '4rem', lineHeight: 1 }}>📭</span>
        <p className="font-extrabold text-xl" style={{ color: 'var(--kids-text)' }}>
          Sin palabras aún
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--kids-text-muted)' }}>
          Las palabras aparecerán cuando se agreguen lecciones
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Legend */}
      <div className="flex justify-center gap-4 mb-5 flex-wrap">
        {[
          { color: '#c0c0c0', label: 'Sin ver' },
          { color: '#ef4444', label: 'Aprendiendo' },
          { color: '#f59e0b', label: 'Casi' },
          { color: '#22c55e', label: '¡Dominada!' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-w-4xl mx-auto">
        {vocab.map(item => {
          const stars = masteryMap[item.id] ?? 0
          return (
            <button
              key={item.id}
              onClick={() => speakWord(item)}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-all hover:scale-[1.03] active:scale-95"
              style={{
                background: masteryBg(stars),
                border: masteryBorder(stars),
                opacity: stars === 0 ? 0.6 : 1,
              }}
              aria-label={`Escuchar ${item.text_en}`}
            >
              {/* Image */}
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.55)' }}
              >
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.text_en}
                    className="w-8 h-8 object-contain"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <span className="text-lg font-extrabold" style={{ color: 'var(--kids-text-muted)' }}>
                    {item.text_en[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm truncate" style={{ color: 'var(--kids-text)' }}>
                  {item.text_en}
                </p>
                <p className="text-xs font-medium truncate" style={{ color: 'var(--kids-text-muted)' }}>
                  {item.text_es}
                </p>
              </div>

              {/* Mastery dot */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: masteryDot(stars) }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
