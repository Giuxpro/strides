'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ModuleConfig, GameResult, ReviewSessionStep, SpeechProvider } from '@strides/core/kids'
import { getGameById } from './gamePool'
import { ModifierStack } from './modifiers/ModifierStack'
import { SpeechConfigProvider } from './SpeechConfigContext'
import { recordVocabMastery } from '@/app/kids/play/_actions'

interface Props {
  steps: ReviewSessionStep[]
  moduleConfig: ModuleConfig
  speechProvider?: SpeechProvider
}

// Motor del refuerzo espaciado: encadena varios juegos (rotados) sobre las
// mismas palabras. No es una lección — no marca completions ni evalúa; solo
// practica y persiste el dominio vía recordVocabMastery.
export function RepasoEngine({ steps, moduleConfig, speechProvider = 'web-speech' }: Props) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [answered, setAnswered] = useState(0)

  function goHome() {
    router.push('/kids/play')
  }

  function handleEnd(result: GameResult) {
    if (result.wordResults?.length) {
      recordVocabMastery(result.wordResults).catch(() => {})
    }
    setAnswered((a) => a + result.total)
    if (index < steps.length - 1) {
      setIndex((i) => i + 1)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div
        className="min-h-svh flex flex-col items-center justify-center gap-6 px-8 text-center relative overflow-hidden"
        style={{ background: moduleConfig.bgPastel }}
      >
        <div
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: moduleConfig.gradientFrom }}
        />
        <span className="relative animate-float" style={{ fontSize: '5rem', lineHeight: 1 }}>💪</span>
        <div className="relative">
          <h2 className="font-extrabold text-3xl mb-1" style={{ color: moduleConfig.accent }}>
            ¡Vocabulario reforzado!
          </h2>
          <p className="text-lg" style={{ color: '#5b6b6a' }}>
            Practicaste {answered} {answered === 1 ? 'vez' : 'veces'}. ¡Sigue así!
          </p>
        </div>
        <button
          onClick={goHome}
          className="relative font-extrabold text-white text-lg px-8 py-4 rounded-2xl transition-transform hover:scale-105 active:scale-95"
          style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  const step = steps[index]
  if (!step) return null
  const game = getGameById(step.gameId)
  if (!game) return null

  return (
    <SpeechConfigProvider provider={speechProvider}>
      <div className="fixed inset-0 z-[60]" style={{ background: moduleConfig.bgPastel }}>
        <ModifierStack
          key={`${step.gameId}-${index}`}
          game={game.component}
          items={step.items}
          modifiers={[]}
          onGameEnd={handleEnd}
          onBack={goHome}
          moduleConfig={moduleConfig}
          progress={{ current: index + 1, total: steps.length }}
        />
      </div>
    </SpeechConfigProvider>
  )
}
