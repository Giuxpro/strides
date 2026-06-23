'use client'

import { useState, useEffect, useRef } from 'react'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import { useSpeechAttempt } from '../../speech/useSpeechAttempt'
import { itsSentence } from '../sentence'
import type { EvalFormatProps } from '../types'

export function SpeakQuestion({ item, moduleConfig, onAnswer, autoPlay = true }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const expected = item.formatId === 'say-sentence' ? itsSentence(vocab.text_en) : vocab.text_en

  const [done, setDone] = useState<null | 'correct' | 'wrong'>(null)
  const answeredRef = useRef(false)
  const { state, start, volumeRef } = useSpeechAttempt({
    onResult: ({ correct }) => {
      if (answeredRef.current) return
      answeredRef.current = true
      setDone(correct ? 'correct' : 'wrong')
      if (correct) speak(expected)
      setTimeout(() => onAnswer(correct), 1100)
    },
  })

  const imgUrl = getVocabImageUrl(vocab)

  useEffect(() => {
    if (!autoPlay) return
    const t = setTimeout(() => speak(expected), 400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  if (state === 'unsupported') {
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
          onClick={() => start(expected)}
          disabled={active || done !== null}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all active:scale-95"
          style={{
            background: state === 'recording' || state === 'listening' ? '#ef4444' : moduleConfig.accent,
            color: '#fff',
            opacity: done === null ? 1 : 0.6,
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
            : done === 'correct' ? '✓'
            : done === 'wrong' ? 'Inténtalo la próxima'
            : 'Toca y dilo'}
        </p>
      </div>
    </div>
  )
}
