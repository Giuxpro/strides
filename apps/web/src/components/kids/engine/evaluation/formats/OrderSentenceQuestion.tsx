'use client'

import { useState, useEffect } from 'react'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import { seeSentence, seeSentenceEs } from '../sentence'
import type { EvalFormatProps } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

// Ordena los bloques de palabras (en inglés) para formar la frase. La pista de
// significado va arriba en español. Mecánica de toque tipo "arma la palabra".
export function OrderSentenceQuestion({ item, moduleConfig, onAnswer, autoPlay = true }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const sentence = seeSentence(vocab.text_en)
  const words = sentence.replace(/\.$/, '').split(' ')
  const imgUrl = getVocabImageUrl(vocab)

  const [tiles] = useState(() => shuffle(words.map((w, i) => ({ w, i }))))
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(words.length).fill(null))
  const [done, setDone] = useState<null | 'correct' | 'wrong'>(null)

  useEffect(() => {
    if (!autoPlay) return
    const t = setTimeout(() => speak(sentence), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  const usedTiles = new Set(slots.filter((s): s is number => s !== null))

  function place(tilePos: number) {
    if (done || usedTiles.has(tilePos)) return
    const nextSlot = slots.findIndex(s => s === null)
    if (nextSlot === -1) return
    const newSlots = [...slots]; newSlots[nextSlot] = tilePos
    setSlots(newSlots)
    if (newSlots.every(s => s !== null)) {
      const answer = newSlots.map(p => tiles[p!]!.w).join(' ')
      const correct = answer === words.join(' ')
      setDone(correct ? 'correct' : 'wrong')
      if (correct) speak(sentence)
      setTimeout(() => onAnswer(correct), 900)
    }
  }

  function removeLast() {
    if (done) return
    const lastFilled = [...slots].reverse().findIndex(s => s !== null)
    if (lastFilled === -1) return
    const slotIdx = slots.length - 1 - lastFilled
    const newSlots = [...slots]; newSlots[slotIdx] = null
    setSlots(newSlots)
  }

  function slotBorder(i: number, filled: boolean): string {
    if (done) return tiles[slots[i]!]!.w === words[i] ? '#22c55e' : '#ef4444'
    return filled ? moduleConfig.accent : 'var(--kids-border-color)'
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Pista: español + corneta */}
      <div className="flex items-center gap-3">
        {imgUrl ? (
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--kids-bg)', border: '2px solid var(--kids-border-color)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl} alt="" className="w-10 h-10 object-contain" draggable={false} />
          </div>
        ) : null}
        <p className="text-lg font-bold text-center" style={{ color: 'var(--kids-text)' }}>
          {seeSentenceEs(vocab.text_es)}
        </p>
        <button
          onClick={() => speak(sentence)}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
          style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
          aria-label="Escuchar"
        >
          🔊
        </button>
      </div>

      {/* Frase en construcción */}
      <div className="flex gap-1.5 flex-wrap justify-center min-h-[44px]">
        {slots.map((tilePos, i) => (
          <div
            key={i}
            className="px-3 h-[40px] min-w-[44px] rounded-lg flex items-center justify-center font-bold text-sm capitalize"
            style={{ border: `2px ${tilePos !== null ? 'solid' : 'dashed'} ${slotBorder(i, tilePos !== null)}`, color: 'var(--kids-text)' }}
          >
            {tilePos !== null ? tiles[tilePos]!.w : ''}
          </div>
        ))}
      </div>

      {/* Bloques disponibles */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {tiles.map((tile, pos) => {
          const used = usedTiles.has(pos)
          return (
            <button
              key={pos}
              onClick={() => place(pos)}
              disabled={used || !!done}
              className="px-3 h-[44px] rounded-lg font-bold text-sm capitalize transition-all active:scale-90"
              style={{
                background: 'var(--kids-bg)',
                border: `2px solid ${used ? 'transparent' : 'var(--kids-border-color)'}`,
                color: used ? 'transparent' : 'var(--kids-text)',
                opacity: used ? 0.25 : 1,
              }}
            >
              {used ? '' : tile.w}
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
