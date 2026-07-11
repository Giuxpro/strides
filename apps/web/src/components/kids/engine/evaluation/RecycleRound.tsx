'use client'

import { useRef, useState } from 'react'
import type { ModuleConfig, VocabItem } from '@strides/core/kids'
import { getVocabImageUrl, getEvalFormat } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import { getEvalFormatComponent } from './formatPool'
import { ChoiceQuestion } from './formats/ChoiceQuestion'

interface Props {
  words: VocabItem[]
  allVocab: VocabItem[]
  moduleConfig: ModuleConfig
  // Formatos usables (edad + habilitados), para variar la dinámica entre palabras.
  formatIds: string[]
  onDone: (recovered: Set<string>) => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

// Asigna un formato a cada palabra rotando sobre la lista barajada, de modo que
// dos palabras seguidas no usen el mismo formato (salvo que solo haya uno).
function assignFormats(count: number, formatIds: string[]): string[] {
  const pool = formatIds.length > 0 ? shuffle(formatIds) : ['audio-choice']
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]!)
}

// Reciclaje correctivo al cierre del examen. Primero una pantalla única y animosa
// que muestra las palabras falladas (enseña las correctas de una vez); luego se
// practican de corrido con formatos variados, avanzando solo al responder.
// Acertar marca la palabra como recuperada → mejora la nota (segunda oportunidad).
export function RecycleRound({ words, allVocab, moduleConfig, formatIds, onDone }: Props) {
  const speak = useSpeak()
  const [phase, setPhase] = useState<'intro' | 'test'>('intro')
  const [idx, setIdx] = useState(0)
  const recoveredRef = useRef<Set<string>>(new Set())
  // Asignación estable de formato por palabra (no re-barajar en cada render).
  const [formats] = useState<string[]>(() => assignFormats(words.length, formatIds))

  function advance(recovered: boolean) {
    const word = words[idx]
    if (recovered && word) recoveredRef.current.add(word.id)
    if (idx < words.length - 1) {
      setIdx(idx + 1)
    } else {
      onDone(recoveredRef.current)
    }
  }

  // ── Intro: estas fueron las que se te escaparon ──
  if (phase === 'intro') {
    return (
      <div className="min-h-screen px-4 py-6 sm:py-8 flex flex-col" style={{ background: 'var(--kids-bg)' }}>
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          <div className="text-center mb-5">
            <span className="text-5xl leading-none">💪</span>
            <h2 className="text-2xl font-extrabold leading-tight mt-2" style={{ color: 'var(--kids-text)' }}>
              ¡Ya casi lo tienes!
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--kids-text-muted)' }}>
              Practiquemos juntas estas {words.length === 1 ? 'palabra' : 'palabras'} y las dominarás.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {words.map((w) => {
              const img = getVocabImageUrl(w)
              return (
                <button
                  key={w.id}
                  onClick={() => speak(w.text_en)}
                  className="rounded-2xl p-3 flex items-center gap-3 text-left transition-transform active:scale-95"
                  style={{ background: 'var(--kids-surface)', border: '2px solid var(--kids-border-color)' }}
                  aria-label={`Escuchar ${w.text_en}`}
                >
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: 'var(--kids-bg)' }}>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="w-9 h-9 object-contain" draggable={false} />
                    ) : (
                      <span className="text-lg font-extrabold" style={{ color: 'var(--kids-text)' }}>{w.text_en[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold truncate" style={{ color: 'var(--kids-text)' }}>{w.text_en}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--kids-text-muted)' }}>{w.text_es}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setPhase('test')}
            className="w-full mt-6 text-white font-extrabold px-6 py-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: moduleConfig.accent }}
          >
            ¡A practicar! →
          </button>
        </div>
      </div>
    )
  }

  // ── Prueba: cada palabra de corrido con formato variado, avanza al responder ──
  const word = words[idx]
  if (!word) return null

  const formatId = formats[idx] ?? 'audio-choice'
  const FormatComp = getEvalFormatComponent(formatId) ?? ChoiceQuestion
  const skill = getEvalFormat(formatId)?.skill ?? 'receptive'

  return (
    <div className="min-h-screen px-4 flex flex-col items-center justify-center" style={{ background: 'var(--kids-bg)' }}>
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold" style={{ color: 'var(--kids-text)' }}>
            Repaso
          </h2>
          <p className="text-sm mt-1 tabular-nums" style={{ color: 'var(--kids-text-muted)' }}>
            {idx + 1} de {words.length}
          </p>
        </div>

        <div className="rounded-3xl px-4 py-6" style={{ background: 'var(--kids-surface)', border: '2px solid var(--kids-border-color)' }}>
          <FormatComp
            key={`${word.id}-${idx}`}
            item={{ vocab: word, formatId, skill }}
            allVocab={allVocab}
            moduleConfig={moduleConfig}
            onAnswer={(correct) => { setTimeout(() => advance(correct), 950) }}
            autoPlay
          />
        </div>
      </div>
    </div>
  )
}
