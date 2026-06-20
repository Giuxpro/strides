'use client'

import { useState, useEffect } from 'react'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import type { EvalFormatProps } from '../types'

export function YesNoQuestion({ item, allVocab, moduleConfig, onAnswer }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item

  const [{ isMatch, shownWord }] = useState(() => {
    const others = allVocab.filter(v => v.id !== vocab.id)
    const match = others.length === 0 ? true : Math.random() < 0.5
    const shown = match ? vocab : others[Math.floor(Math.random() * others.length)]!
    return { isMatch: match, shownWord: shown }
  })
  const [answered, setAnswered] = useState<boolean | null>(null)
  const imgUrl = getVocabImageUrl(vocab)

  useEffect(() => {
    const t = setTimeout(() => speak(shownWord.text_en), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function answer(saidYes: boolean) {
    if (answered !== null) return
    setAnswered(saidYes === isMatch)
    setTimeout(() => onAnswer(saidYes === isMatch), 700)
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="flex items-center gap-3">
        <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: 'var(--kids-bg)', border: '2px solid var(--kids-border-color)' }}>
          {imgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt="" className="w-16 h-16 object-contain" draggable={false} />
          ) : (
            <span className="text-3xl">🖼️</span>
          )}
        </div>
        <button
          onClick={() => speak(shownWord.text_en)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-95"
          style={{ background: 'var(--kids-bg)', border: '2px solid var(--kids-border-color)' }}
        >
          <span className="text-lg">🔊</span>
          <span className="font-bold capitalize" style={{ color: 'var(--kids-text)' }}>{shownWord.text_en}</span>
        </button>
      </div>

      <p className="text-xs font-semibold" style={{ color: 'var(--kids-text-muted)' }}>¿Coinciden?</p>

      <div className="flex gap-4">
        <button
          onClick={() => answer(true)}
          disabled={answered !== null}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-90"
          style={{ background: 'var(--kids-bg)', border: `2.5px solid ${answered !== null && isMatch ? '#22c55e' : 'var(--kids-border-color)'}`, color: '#22c55e' }}
        >
          ✓
        </button>
        <button
          onClick={() => answer(false)}
          disabled={answered !== null}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-90"
          style={{ background: 'var(--kids-bg)', border: `2.5px solid ${answered !== null && !isMatch ? '#22c55e' : 'var(--kids-border-color)'}`, color: '#ef4444' }}
        >
          ✗
        </button>
      </div>
    </div>
  )
}
