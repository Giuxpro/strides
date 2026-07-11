'use client'

import { useState, useEffect } from 'react'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import { seeSentence, seeSentenceEs } from '../sentence'
import type { EvalFormatProps } from '../types'
import type { OrderSnapshot } from '../snapshots'

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
export function OrderSentenceQuestion({ item, moduleConfig, onAnswer, onSnapshot, review, autoPlay = true }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const sentence = seeSentence(vocab.text_en)
  const words = sentence.replace(/\.$/, '').split(' ')
  const imgUrl = getVocabImageUrl(vocab)
  const rev = review?.kind === 'order' ? review : null
  const readOnly = !!rev

  const [tiles] = useState(() => (rev ? rev.tiles : shuffle(words.map((w, i) => ({ w, i })))))
  // `placed` = posiciones de tiles colocadas en orden; las casillas se derivan.
  const [placed, setPlaced] = useState<number[]>(() => (rev ? rev.placedTilePos : []))

  const slots: (number | null)[] = words.map((_, i) => (placed[i] !== undefined ? placed[i]! : null))
  const usedTiles = new Set(placed)
  const complete = placed.length === words.length
  const builtAnswer = placed.map(p => tiles[p]!.w).join(' ')
  const done: null | 'correct' | 'wrong' = complete ? (builtAnswer === words.join(' ') ? 'correct' : 'wrong') : null

  useEffect(() => {
    if (readOnly) return
    onSnapshot?.({ kind: 'order', tiles, placedTilePos: [] })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (readOnly || !autoPlay) return
    const t = setTimeout(() => speak(sentence), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  function place(tilePos: number) {
    if (readOnly || done || usedTiles.has(tilePos) || placed.length === words.length) return
    const newPlaced = [...placed, tilePos]
    setPlaced(newPlaced)
    if (newPlaced.length === words.length) {
      const answer = newPlaced.map(p => tiles[p]!.w).join(' ')
      const correct = answer === words.join(' ')
      const snapshot: OrderSnapshot = { kind: 'order', tiles, placedTilePos: newPlaced }
      onAnswer(correct, snapshot)
    }
  }

  function removeLast() {
    if (readOnly || done) return
    setPlaced(placed.slice(0, -1))
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
              disabled={readOnly || used || !!done}
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

      {!done && !readOnly && (
        <button onClick={removeLast} className="text-xs font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
          ⌫ Borrar
        </button>
      )}

      {done === 'wrong' && !readOnly && (
        <span
          className="correct-glow inline-block px-3 py-1.5 rounded-full text-sm font-extrabold capitalize"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#16a34a' }}
        >
          Era: {words.join(' ')}
        </span>
      )}
    </div>
  )
}
