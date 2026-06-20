'use client'

import { useState, useEffect } from 'react'
import type { VocabItem } from '@strides/core/kids'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import type { EvalFormatProps } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function WordChoiceQuestion({ item, allVocab, moduleConfig, onAnswer }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const [options] = useState<VocabItem[]>(() => {
    const distractors = shuffle(allVocab.filter(v => v.id !== vocab.id)).slice(0, Math.max(0, Math.min(4, allVocab.length) - 1))
    return shuffle([vocab, ...distractors])
  })
  const [selected, setSelected] = useState<string | null>(null)
  const imgUrl = getVocabImageUrl(vocab)

  useEffect(() => {
    const t = setTimeout(() => speak(vocab.text_en), 300)
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
        onClick={() => speak(vocab.text_en)}
        className="w-24 h-24 rounded-2xl flex items-center justify-center transition-all active:scale-95"
        style={{ background: 'var(--kids-bg)', border: '2px solid var(--kids-border-color)' }}
      >
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt="" className="w-16 h-16 object-contain" draggable={false} />
        ) : (
          <span className="text-3xl">🔊</span>
        )}
      </button>

      <div className="grid grid-cols-2 gap-2 w-full max-w-[260px]">
        {options.map(o => {
          const sel = selected === o.id
          const correct = o.id === vocab.id
          const border = sel ? (correct ? '#22c55e' : '#ef4444') : 'var(--kids-border-color)'
          return (
            <button
              key={o.id}
              onClick={() => pick(o)}
              disabled={selected !== null}
              className="py-3 rounded-xl font-bold text-base capitalize transition-all active:scale-95"
              style={{ background: 'var(--kids-bg)', border: `2px solid ${border}`, color: sel ? border : 'var(--kids-text)' }}
            >
              {o.text_en}
            </button>
          )
        })}
      </div>
    </div>
  )
}
