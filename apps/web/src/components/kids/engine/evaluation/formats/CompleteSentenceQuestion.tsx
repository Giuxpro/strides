'use client'

import { useState, useEffect } from 'react'
import type { VocabItem } from '@strides/core/kids'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import { seeSentence } from '../sentence'
import type { EvalFormatProps } from '../types'
import type { CompleteSnapshot } from '../snapshots'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function CompleteSentenceQuestion({ item, allVocab, moduleConfig, onAnswer, onSnapshot, review, autoPlay = true }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const imgUrl = getVocabImageUrl(vocab)
  const rev = review?.kind === 'complete' ? review : null
  const readOnly = !!rev

  const [options] = useState<VocabItem[]>(() => {
    if (rev) {
      const byId = new Map(allVocab.map(v => [v.id, v]))
      return rev.optionIds.map(id => byId.get(id)).filter((v): v is VocabItem => !!v)
    }
    const distractors = shuffle(allVocab.filter(v => v.id !== vocab.id)).slice(0, Math.max(0, Math.min(3, allVocab.length) - 1))
    return shuffle([vocab, ...distractors])
  })
  const [selected, setSelected] = useState<string | null>(rev ? rev.pickedId : null)

  // Frase con hueco: "I see a ___."
  const sentenceParts = seeSentence(vocab.text_en).split(vocab.text_en)

  useEffect(() => {
    if (readOnly) return
    onSnapshot?.({ kind: 'complete', optionIds: options.map(o => o.id), pickedId: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (readOnly || !autoPlay) return
    const t = setTimeout(() => speak(seeSentence(vocab.text_en)), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  function pick(o: VocabItem) {
    if (readOnly || selected !== null) return
    setSelected(o.id)
    const snapshot: CompleteSnapshot = { kind: 'complete', optionIds: options.map(x => x.id), pickedId: o.id }
    onAnswer(o.id === vocab.id, snapshot)
  }

  const blank = selected ? (options.find(o => o.id === selected)?.text_en ?? '___') : '___'

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'var(--kids-bg)', border: '2px solid var(--kids-border-color)' }}>
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt="" className="w-14 h-14 object-contain" draggable={false} />
        ) : (
          <span className="text-2xl">🖼️</span>
        )}
      </div>

      <p className="text-lg font-bold text-center" style={{ color: 'var(--kids-text)' }}>
        {sentenceParts[0]}
        <span className="px-2 underline decoration-dashed underline-offset-4 capitalize" style={{ color: moduleConfig.accent }}>{blank}</span>
        {sentenceParts[1]}
      </p>

      <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
        {options.map(o => {
          const sel = selected === o.id
          const correct = o.id === vocab.id
          const border = sel ? (correct ? '#22c55e' : '#ef4444') : 'var(--kids-border-color)'
          return (
            <button
              key={o.id}
              onClick={() => pick(o)}
              disabled={readOnly || selected !== null}
              className="py-3 rounded-xl font-bold text-sm capitalize transition-all active:scale-95"
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
