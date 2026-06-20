'use client'

import { useState, useEffect } from 'react'
import type { VocabItem } from '@strides/core/kids'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import { seeSentence } from '../sentence'
import type { EvalFormatProps } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function getOptions(all: VocabItem[], correct: VocabItem, count: number): VocabItem[] {
  const distractors = shuffle(all.filter(v => v.id !== correct.id)).slice(0, Math.max(0, count - 1))
  return shuffle([correct, ...distractors])
}

// image-choice (muestra la palabra), audio-choice (solo sonido de la palabra),
// sentence-choose (suena una frase "I see a cow"). Todos → elegir imagen.
export function ChoiceQuestion({ item, allVocab, onAnswer }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const showWord = item.formatId === 'image-choice'
  const prompt = item.formatId === 'sentence-choose' ? seeSentence(vocab.text_en) : vocab.text_en

  const [options] = useState(() => getOptions(allVocab, vocab, Math.min(4, allVocab.length)))
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => speak(prompt), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pick(o: VocabItem) {
    if (selected !== null) return
    setSelected(o.id)
    setTimeout(() => onAnswer(o.id === vocab.id), 700)
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <button
        onClick={() => speak(prompt)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-95"
        style={{ background: 'var(--kids-bg)', border: '2px solid var(--kids-border-color)' }}
      >
        <span className="text-xl">🔊</span>
        {showWord && <span className="font-bold capitalize" style={{ color: 'var(--kids-text)' }}>{vocab.text_en}</span>}
      </button>

      <div className="grid grid-cols-2 gap-2.5">
        {options.map(o => {
          const sel = selected === o.id
          const correct = o.id === vocab.id
          const border = sel ? (correct ? '#22c55e' : '#ef4444') : 'var(--kids-border-color)'
          const img = getVocabImageUrl(o)
          return (
            <button
              key={o.id}
              onClick={() => pick(o)}
              disabled={selected !== null}
              className="w-[76px] h-[76px] rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'var(--kids-bg)', border: `2.5px solid ${border}` }}
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="w-12 h-12 object-contain" draggable={false} />
              ) : (
                <span className="text-2xl font-bold" style={{ color: 'var(--kids-text)' }}>{o.text_en[0]?.toUpperCase()}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
