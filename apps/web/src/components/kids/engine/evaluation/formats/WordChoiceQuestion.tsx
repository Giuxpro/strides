'use client'

import { useState, useEffect } from 'react'
import type { VocabItem } from '@strides/core/kids'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import type { EvalFormatProps } from '../types'
import type { WordChoiceSnapshot } from '../snapshots'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function WordChoiceQuestion({ item, allVocab, onAnswer, onSnapshot, review, autoPlay = true }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const rev = review?.kind === 'wordchoice' ? review : null
  const readOnly = !!rev

  const [options] = useState<VocabItem[]>(() => {
    if (rev) {
      const byId = new Map(allVocab.map(v => [v.id, v]))
      return rev.optionIds.map(id => byId.get(id)).filter((v): v is VocabItem => !!v)
    }
    const distractors = shuffle(allVocab.filter(v => v.id !== vocab.id)).slice(0, Math.max(0, Math.min(4, allVocab.length) - 1))
    return shuffle([vocab, ...distractors])
  })
  const [selected, setSelected] = useState<string | null>(rev ? rev.pickedId : null)
  const imgUrl = getVocabImageUrl(vocab)

  useEffect(() => {
    if (readOnly) return
    onSnapshot?.({ kind: 'wordchoice', optionIds: options.map(o => o.id), pickedId: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (readOnly || !autoPlay) return
    const t = setTimeout(() => speak(vocab.text_en), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  function pick(o: VocabItem) {
    if (readOnly || selected !== null) return
    setSelected(o.id)
    const snapshot: WordChoiceSnapshot = { kind: 'wordchoice', optionIds: options.map(x => x.id), pickedId: o.id }
    onAnswer(o.id === vocab.id, snapshot)
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
              disabled={readOnly || selected !== null}
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
