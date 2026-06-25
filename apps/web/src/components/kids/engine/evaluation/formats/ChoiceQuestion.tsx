'use client'

import { useState, useEffect } from 'react'
import type { VocabItem } from '@strides/core/kids'
import { getVocabImageUrl } from '@strides/core/kids'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'
import { seeSentence } from '../sentence'
import type { EvalFormatProps } from '../types'
import type { ChoiceSnapshot } from '../snapshots'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function getOptions(all: VocabItem[], correct: VocabItem, count: number): VocabItem[] {
  const distractors = shuffle(all.filter(v => v.id !== correct.id)).slice(0, Math.max(0, count - 1))
  return shuffle([correct, ...distractors])
}

// Mecánica receptiva "escucha y elige la imagen": el estímulo es siempre auditivo
// para no filtrar la respuesta, pero varía al azar entre la palabra suelta y una
// frase ("I see a cow") para que no se sienta repetida.
type Stimulus = 'audio' | 'sentence'

export function ChoiceQuestion({ item, allVocab, onAnswer, onSnapshot, review, autoPlay = true }: EvalFormatProps) {
  const speak = useSpeak()
  const { vocab } = item
  const rev = review?.kind === 'choice' ? review : null
  const readOnly = !!rev

  const [stimulus] = useState<Stimulus>(() => {
    if (rev) return rev.stimulus
    const modes: Stimulus[] = ['audio', 'sentence']
    return modes[Math.floor(Math.random() * modes.length)]!
  })
  const prompt = stimulus === 'sentence' ? seeSentence(vocab.text_en) : vocab.text_en

  const [options] = useState<VocabItem[]>(() => {
    if (rev) {
      const byId = new Map(allVocab.map(v => [v.id, v]))
      return rev.optionIds.map(id => byId.get(id)).filter((v): v is VocabItem => !!v)
    }
    return getOptions(allVocab, vocab, Math.min(4, allVocab.length))
  })
  const [selected, setSelected] = useState<string | null>(rev ? rev.pickedId : null)

  useEffect(() => {
    if (readOnly) return
    onSnapshot?.({ kind: 'choice', stimulus, optionIds: options.map(o => o.id), pickedId: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (readOnly || !autoPlay) return
    const t = setTimeout(() => speak(prompt), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  function pick(o: VocabItem) {
    if (readOnly || selected !== null) return
    setSelected(o.id)
    const snapshot: ChoiceSnapshot = { kind: 'choice', stimulus, optionIds: options.map(x => x.id), pickedId: o.id }
    onAnswer(o.id === vocab.id, snapshot)
  }

  // Layout fila: corneta en diamante (rotada 45°) a la izquierda + opciones en
  // fila horizontal. Distinto del grid 2×2 de los juegos.
  return (
    <div className="flex items-center justify-center gap-3 w-full">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button
          onClick={() => speak(prompt)}
          className="w-12 h-12 rotate-45 rounded-lg flex items-center justify-center transition-all active:scale-95"
          style={{ background: 'var(--kids-bg)', border: '2px solid var(--kids-border-color)' }}
          aria-label="Escuchar"
        >
          <span className="-rotate-45 text-xl">🔊</span>
        </button>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {options.map(o => {
          const sel = selected === o.id
          const correct = o.id === vocab.id
          const border = sel ? (correct ? '#22c55e' : '#ef4444') : 'var(--kids-border-color)'
          const img = getVocabImageUrl(o)
          return (
            <button
              key={o.id}
              onClick={() => pick(o)}
              disabled={readOnly || selected !== null}
              className="w-[58px] h-[58px] rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'var(--kids-bg)', border: `2.5px solid ${border}` }}
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="w-10 h-10 object-contain" draggable={false} />
              ) : (
                <span className="text-xl font-bold" style={{ color: 'var(--kids-text)' }}>{o.text_en[0]?.toUpperCase()}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
