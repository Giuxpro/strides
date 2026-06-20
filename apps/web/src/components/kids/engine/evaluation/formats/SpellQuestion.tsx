'use client'

import { useState, useEffect } from 'react'
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

export function SpellQuestion({ item, moduleConfig, onAnswer }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const word = vocab.text_en.toUpperCase()
  const letters = word.split('')

  const [tiles] = useState(() => shuffle([...letters]))
  const [slots, setSlots] = useState<(string | null)[]>(() => Array(letters.length).fill(null))
  const [usedIdxs, setUsedIdxs] = useState<Set<number>>(new Set())
  const [done, setDone] = useState<null | 'correct' | 'wrong'>(null)

  const imgUrl = getVocabImageUrl(vocab)

  useEffect(() => {
    const t = setTimeout(() => speak(vocab.text_en), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function place(tileIdx: number) {
    if (done || usedIdxs.has(tileIdx)) return
    const nextSlot = slots.findIndex(s => s === null)
    if (nextSlot === -1) return
    const newSlots = [...slots]; newSlots[nextSlot] = tiles[tileIdx]!
    const newUsed = new Set(usedIdxs); newUsed.add(tileIdx)
    setSlots(newSlots); setUsedIdxs(newUsed)
    if (newSlots.every(s => s !== null)) {
      const correct = newSlots.join('') === word
      setDone(correct ? 'correct' : 'wrong')
      setTimeout(() => onAnswer(correct), 800)
    }
  }

  function removeLast() {
    if (done) return
    const lastFilled = [...slots].reverse().findIndex(s => s !== null)
    if (lastFilled === -1) return
    const slotIdx = slots.length - 1 - lastFilled
    const letter = slots[slotIdx]
    const newSlots = [...slots]; newSlots[slotIdx] = null
    const newUsed = new Set(usedIdxs)
    for (const idx of Array.from(usedIdxs).reverse()) {
      if (tiles[idx] === letter) { newUsed.delete(idx); break }
    }
    setSlots(newSlots); setUsedIdxs(newUsed)
  }

  // Por letra: al completar, verde si la letra está en su posición correcta, rojo si no.
  function slotBorder(i: number, letter: string | null): string {
    if (done) return slots[i] === word[i] ? '#22c55e' : '#ef4444'
    return letter ? moduleConfig.accent : 'var(--kids-border-color)'
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

      <div className="flex gap-1.5 flex-wrap justify-center">
        {slots.map((letter, i) => (
          <div
            key={i}
            className="w-[40px] h-[40px] rounded-lg flex items-center justify-center font-extrabold text-lg"
            style={{ border: `2px ${letter ? 'solid' : 'dashed'} ${slotBorder(i, letter)}`, color: 'var(--kids-text)' }}
          >
            {letter ?? ''}
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap justify-center">
        {tiles.map((letter, i) => {
          const used = usedIdxs.has(i)
          return (
            <button
              key={i}
              onClick={() => place(i)}
              disabled={used || !!done}
              className="w-[44px] h-[44px] rounded-lg font-extrabold text-lg transition-all active:scale-90"
              style={{
                background: 'var(--kids-bg)',
                border: `2px solid ${used ? 'transparent' : 'var(--kids-border-color)'}`,
                color: used ? 'transparent' : 'var(--kids-text)',
                opacity: used ? 0.25 : 1,
              }}
            >
              {used ? '' : letter}
            </button>
          )
        })}
      </div>

      {!done && (
        <button onClick={removeLast} className="text-xs font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
          ⌫ Borrar
        </button>
      )}
    </div>
  )
}
