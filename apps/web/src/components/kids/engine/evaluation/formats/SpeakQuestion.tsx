'use client'

import { useState, useEffect, useRef } from 'react'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import { useSpeechAttempt } from '../../speech/useSpeechAttempt'
import type { EvalFormatProps } from '../types'
import type { SpeakSnapshot } from '../snapshots'

export function SpeakQuestion({ item, moduleConfig, onAnswer, onSnapshot, review, autoPlay = true }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const expected = vocab.text_en
  const rev = review?.kind === 'speak' ? review : null
  const readOnly = !!rev

  const [done, setDone] = useState<null | 'correct' | 'wrong'>(rev ? rev.result : null)
  const [retry, setRetry] = useState(false)
  const answeredRef = useRef(false)
  const attemptsRef = useRef(0)
  const MAX_ATTEMPTS = 2
  const { state, start, volumeRef } = useSpeechAttempt({
    onResult: ({ correct }) => {
      if (answeredRef.current) return
      if (correct) {
        answeredRef.current = true
        setRetry(false)
        setDone('correct')
        onAnswer(true, { kind: 'speak', result: 'correct' })
        return
      }
      // Primer fallo: pudo ser ruido → damos otra oportunidad sin marcar mal aún.
      attemptsRef.current += 1
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        answeredRef.current = true
        setRetry(false)
        setDone('wrong')
        onAnswer(false, { kind: 'speak', result: 'wrong' })
      } else {
        setRetry(true)
      }
    },
  })

  const imgUrl = getVocabImageUrl(vocab)

  useEffect(() => {
    if (readOnly) return
    onSnapshot?.({ kind: 'speak', result: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (readOnly || !autoPlay) return
    const t = setTimeout(() => speak(expected), 400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  if (state === 'unsupported' && !readOnly) {
    return (
      <div className="flex flex-col items-center gap-3 text-center px-6">
        <span className="text-4xl">🎤</span>
        <p className="font-bold text-sm" style={{ color: 'var(--kids-text)' }}>El micrófono no está disponible</p>
      </div>
    )
  }

  const active = state === 'listening' || state === 'recording' || state === 'processing'
  const ring = done === 'correct' ? '#22c55e' : done === 'wrong' ? '#ef4444' : 'var(--kids-border-color)'

  // Layout horizontal: imagen a la izquierda, micrófono a la derecha. Sin la
  // palabra escrita (es productivo) y distinto del juego de hablar.
  return (
    <div className="flex items-center justify-center gap-6 w-full py-1">
      <button
        onClick={() => speak(expected)}
        className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95"
        style={{ background: 'var(--kids-bg)', border: `2.5px solid ${ring}` }}
      >
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt="" className="w-16 h-16 object-contain" draggable={false} />
        ) : (
          <span className="text-3xl">🔊</span>
        )}
      </button>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => { setRetry(false); start(expected) }}
          disabled={readOnly || active || done !== null}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all active:scale-95"
          style={{
            background: state === 'recording' || state === 'listening' ? '#ef4444' : moduleConfig.accent,
            color: '#fff',
            opacity: done === null && !readOnly ? 1 : 0.6,
          }}
        >
          {state === 'processing' ? '⏳' : active ? '🔴' : '🎤'}
        </button>

        <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--kids-border-color)' }}>
          <div ref={volumeRef} className="h-full rounded-full" style={{ width: '0%', background: moduleConfig.accent, transition: 'width 40ms linear' }} />
        </div>

        <p className="text-xs font-semibold text-center" style={{ color: 'var(--kids-text-muted)' }}>
          {state === 'recording' || state === 'listening' ? 'Escuchando…'
            : state === 'processing' ? 'Procesando…'
            : state === 'no-speech' ? 'No te escuché'
            : retry ? 'No te entendí, intenta otra vez 🎤'
            : done === 'correct' ? '✓'
            : done === 'wrong' ? 'Inténtalo la próxima'
            : 'Toca y dilo'}
        </p>

        {done === 'wrong' && !readOnly && (
          <span
            className="correct-glow inline-block px-3 py-1 rounded-full text-sm font-extrabold capitalize"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#16a34a' }}
          >
            {expected}
          </span>
        )}
      </div>
    </div>
  )
}
