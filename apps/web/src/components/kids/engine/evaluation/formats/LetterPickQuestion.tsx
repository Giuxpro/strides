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

function LetterPick({ item, moduleConfig, onAnswer, autoPlay = true, mode }: EvalFormatProps & { mode: 'missing' | 'first' }) {
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
    if (!autoPlay) return
    const t = setTimeout(() => speak(vocab.text_en), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  function pick(letter: string) {
    if (selected !== null) return
    setSelected(letter)
    setTimeout(() => onAnswer(letter === target), 800)
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Corneta + palabra en fila; la letra que falta es un subrayado resaltado */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={() => speak(vocab.text_en)}
          className="w-12 h-12 rotate-45 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-95"
          style={{ background: 'var(--kids-bg)', border: '2px solid var(--kids-border-color)' }}
          aria-label="Escuchar"
        >
          <span className="-rotate-45 flex items-center justify-center">
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl} alt="" className="w-7 h-7 object-contain" draggable={false} />
            ) : (
              <span className="text-lg">🔊</span>
            )}
          </span>
        </button>

        {mode === 'missing' ? (
          <div className="flex gap-1.5 items-end">
            {word.split('').map((letter, i) => (
              <div
                key={i}
                className="w-[30px] h-[38px] flex items-center justify-center font-extrabold text-lg"
                style={{
                  borderBottom: i === blankIdx ? `3px dashed ${selected ? (selected === target ? '#22c55e' : '#ef4444') : moduleConfig.accent}` : 'none',
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
      </div>

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
