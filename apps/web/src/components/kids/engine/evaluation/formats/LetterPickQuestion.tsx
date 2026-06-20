'use client'

import { useState, useEffect } from 'react'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import type { EvalFormatProps } from '../types'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function buildOptions(target: string): string[] {
  const distractors = shuffle(ALPHABET.filter(l => l !== target)).slice(0, 3)
  return shuffle([target, ...distractors])
}

function LetterPick({ item, moduleConfig, onAnswer, mode }: EvalFormatProps & { mode: 'missing' | 'first' }) {
  const speak = useSpeak()
  const { vocab } = item
  const word = vocab.text_en.toUpperCase()
  const imgUrl = getVocabImageUrl(vocab)

  const [{ blankIdx, target, options }] = useState(() => {
    const idx = mode === 'first' ? 0 : Math.floor(Math.random() * word.length)
    const t = word[idx] ?? word[0]!
    return { blankIdx: idx, target: t, options: buildOptions(t) }
  })
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => speak(vocab.text_en), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pick(letter: string) {
    if (selected !== null) return
    setSelected(letter)
    setTimeout(() => onAnswer(letter === target), 800)
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

      {mode === 'missing' ? (
        <div className="flex gap-1.5">
          {word.split('').map((letter, i) => (
            <div
              key={i}
              className="w-[36px] h-[36px] rounded-lg flex items-center justify-center font-extrabold text-base"
              style={{
                border: `2px ${i === blankIdx ? 'dashed' : 'solid'} ${i === blankIdx ? moduleConfig.accent : 'var(--kids-border-color)'}`,
                color: 'var(--kids-text)',
              }}
            >
              {i === blankIdx ? (selected ?? '') : letter}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs font-semibold" style={{ color: 'var(--kids-text-muted)' }}>¿Con qué letra empieza?</p>
      )}

      <div className="flex gap-2 flex-wrap justify-center">
        {options.map(letter => {
          const sel = selected === letter
          const correct = letter === target
          const border = sel ? (correct ? '#22c55e' : '#ef4444') : 'var(--kids-border-color)'
          return (
            <button
              key={letter}
              onClick={() => pick(letter)}
              disabled={selected !== null}
              className="w-[48px] h-[48px] rounded-xl font-extrabold text-xl transition-all active:scale-90"
              style={{ background: 'var(--kids-bg)', border: `2.5px solid ${border}`, color: sel ? border : 'var(--kids-text)' }}
            >
              {letter}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MissingLetter(props: EvalFormatProps) {
  return <LetterPick {...props} mode="missing" />
}

export function FirstSound(props: EvalFormatProps) {
  return <LetterPick {...props} mode="first" />
}
