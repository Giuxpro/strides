'use client'

import { useState, useRef, useEffect } from 'react'
import type { VocabItem } from '@strides/core/kids'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import type { EvalFormatProps } from '../types'
import type { DragSnapshot } from '../snapshots'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

// Arrastra la palabra escrita (en inglés) hasta la imagen que la representa.
// Gesto de arrastre real (Pointer Events → funciona en touch y mouse), distinto
// del "toca una opción" del resto de formatos receptivos.
export function DragWordQuestion({ item, allVocab, moduleConfig, onAnswer, onSnapshot, review, autoPlay = true }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const imgUrl = getVocabImageUrl(vocab)
  const zoneRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const rev = review?.kind === 'drag' ? review : null
  const readOnly = !!rev

  const [tiles] = useState<VocabItem[]>(() => {
    if (rev) {
      const byId = new Map(allVocab.map(v => [v.id, v]))
      return rev.tileIds.map(id => byId.get(id)).filter((v): v is VocabItem => !!v)
    }
    const distractors = shuffle(allVocab.filter(v => v.id !== vocab.id)).slice(0, 2)
    return shuffle([vocab, ...distractors])
  })
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const [over, setOver] = useState(false)
  const [droppedId, setDroppedId] = useState<string | null>(rev ? rev.droppedId : null)
  const result: null | 'correct' | 'wrong' = droppedId === null ? null : (droppedId === vocab.id ? 'correct' : 'wrong')

  useEffect(() => {
    if (readOnly) return
    onSnapshot?.({ kind: 'drag', tileIds: tiles.map(t => t.id), droppedId: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (readOnly || !autoPlay) return
    const t = setTimeout(() => speak(vocab.text_en), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  function inZone(clientX: number, clientY: number): boolean {
    const r = zoneRef.current?.getBoundingClientRect()
    return !!r && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
  }

  function onPointerDown(e: React.PointerEvent, id: string) {
    if (readOnly || result) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    startRef.current = { x: e.clientX, y: e.clientY }
    setDrag({ id, x: 0, y: 0 })
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return
    setDrag({ id: drag.id, x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y })
    setOver(inZone(e.clientX, e.clientY))
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!drag) return
    if (inZone(e.clientX, e.clientY)) {
      const correct = drag.id === vocab.id
      setDroppedId(drag.id)
      const snapshot: DragSnapshot = { kind: 'drag', tileIds: tiles.map(t => t.id), droppedId: drag.id }
      onAnswer(correct, snapshot)
    }
    setDrag(null)
    setOver(false)
  }

  const zoneBorder =
    result === 'correct' ? '#22c55e'
    : result === 'wrong' ? '#ef4444'
    : over               ? moduleConfig.accent
    :                      'var(--kids-border-color)'

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Imagen objetivo = zona de destino */}
      <div className="flex items-center gap-2">
        <div
          ref={zoneRef}
          className="w-24 h-24 rounded-2xl flex items-center justify-center transition-all"
          style={{ background: 'var(--kids-bg)', border: `2.5px dashed ${zoneBorder}`, transform: over ? 'scale(1.05)' : 'none' }}
        >
          {imgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt="" className="w-16 h-16 object-contain" draggable={false} />
          ) : (
            <span className="text-3xl">🖼️</span>
          )}
        </div>
        <button
          onClick={() => speak(vocab.text_en)}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
          style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
          aria-label="Escuchar"
        >
          🔊
        </button>
      </div>

      <p className="text-xs font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
        Arrastra la palabra a la imagen
      </p>

      {/* Fichas de palabras arrastrables */}
      <div className="flex gap-2 flex-wrap justify-center">
        {tiles.map(t => {
          const dragging = drag?.id === t.id
          const dropped = result !== null && t.id === droppedId
          const dropBorder = dropped ? (result === 'correct' ? '#22c55e' : '#ef4444') : 'var(--kids-border-color)'
          return (
            <button
              key={t.id}
              onPointerDown={e => onPointerDown(e, t.id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              disabled={readOnly || result !== null}
              className="px-4 h-[44px] rounded-xl font-bold text-sm capitalize select-none"
              style={{
                touchAction: 'none',
                background: 'var(--kids-bg)',
                border: `2px solid ${dropBorder}`,
                color: dropped ? dropBorder : 'var(--kids-text)',
                transform: dragging ? `translate(${drag!.x}px, ${drag!.y}px)` : 'none',
                transition: dragging ? 'none' : 'transform 0.2s',
                zIndex: dragging ? 10 : 1,
                position: 'relative',
              }}
            >
              {t.text_en}
            </button>
          )
        })}
      </div>
    </div>
  )
}
