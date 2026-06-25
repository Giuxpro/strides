'use client'

import { useState, useEffect } from 'react'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import type { EvalFormatProps } from '../types'
import type { SpellSnapshot } from '../snapshots'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

// Construir la palabra en inglés pulsando letras desordenadas. La pista depende
// del formato: imagen (spell-image), palabra en español (spell-es) o solo audio
// (spell-audio). Son variantes de la misma familia "spell".
type Stimulus = 'image' | 'spanish' | 'audio'

export function SpellQuestion({ item, moduleConfig, onAnswer, onSnapshot, review, autoPlay = true }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const word = vocab.text_en.toUpperCase()
  const letters = word.split('')
  const rev = review?.kind === 'spell' ? review : null
  const readOnly = !!rev

  const imgUrl = getVocabImageUrl(vocab)
  const stimulus: Stimulus =
    item.formatId === 'spell-es'    ? 'spanish'
    : item.formatId === 'spell-audio' ? 'audio'
    : 'image'
  const [tiles] = useState(() => (rev ? rev.tiles : shuffle([...letters])))
  // `placed` = índices de tiles colocados en orden; slots/usados se derivan de él.
  const [placed, setPlaced] = useState<number[]>(() => (rev ? rev.placedTileIdxs : []))

  const slots: (string | null)[] = letters.map((_, i) => (placed[i] !== undefined ? tiles[placed[i]!]! : null))
  const usedIdxs = new Set(placed)
  const complete = placed.length === letters.length
  const done: null | 'correct' | 'wrong' = complete ? (slots.join('') === word ? 'correct' : 'wrong') : null

  useEffect(() => {
    if (readOnly) return
    onSnapshot?.({ kind: 'spell', tiles, placedTileIdxs: [] })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // En modo español la palabra inglesa es la respuesta: no la cantamos al entrar.
    if (readOnly || !autoPlay || stimulus === 'spanish') return
    const t = setTimeout(() => speak(vocab.text_en), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  function place(tileIdx: number) {
    if (readOnly || done || usedIdxs.has(tileIdx) || placed.length === letters.length) return
    const newPlaced = [...placed, tileIdx]
    setPlaced(newPlaced)
    if (newPlaced.length === letters.length) {
      const built = newPlaced.map(idx => tiles[idx]!).join('')
      const correct = built === word
      const snapshot: SpellSnapshot = { kind: 'spell', tiles, placedTileIdxs: newPlaced }
      onAnswer(correct, snapshot)
    }
  }

  function removeLast() {
    if (readOnly || done) return
    setPlaced(placed.slice(0, -1))
  }

  // Por letra: al completar, verde si la letra está en su posición correcta, rojo si no.
  function slotBorder(i: number, letter: string | null): string {
    if (done) return slots[i] === word[i] ? '#22c55e' : '#ef4444'
    return letter ? moduleConfig.accent : 'var(--kids-border-color)'
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {stimulus === 'spanish' ? (
        <div className="flex items-center gap-3">
          <p className="text-lg font-bold capitalize" style={{ color: 'var(--kids-text)' }}>{vocab.text_es}</p>
          <button
            onClick={() => speak(vocab.text_en)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
            aria-label="Escuchar"
          >
            🔊
          </button>
        </div>
      ) : (
        <button
          onClick={() => speak(vocab.text_en)}
          className="w-16 h-16 rotate-45 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{ background: 'var(--kids-bg)', border: '2px solid var(--kids-border-color)' }}
          aria-label="Escuchar"
        >
          <span className="-rotate-45 flex items-center justify-center">
            {stimulus === 'image' && imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl} alt="" className="w-9 h-9 object-contain" draggable={false} />
            ) : (
              <span className="text-2xl">🔊</span>
            )}
          </span>
        </button>
      )}

      {/* Casillas como subrayados (no cajas) → distinto del juego de spelling */}
      <div className="flex gap-2 flex-wrap justify-center">
        {slots.map((letter, i) => (
          <div
            key={i}
            className="w-[34px] h-[40px] flex items-center justify-center font-extrabold text-lg"
            style={{ borderBottom: `3px solid ${slotBorder(i, letter)}`, color: 'var(--kids-text)' }}
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
              disabled={readOnly || used || !!done}
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

      {!done && !readOnly && (
        <button onClick={removeLast} className="text-xs font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
          ⌫ Borrar
        </button>
      )}
    </div>
  )
}
