'use client'

import { useState, useEffect, useRef, type ComponentType } from 'react'
import type { VocabItem } from '../LessonEngine'
import type { ModuleConfig } from '@/components/kids/moduleConfig'
import type { ModifierConfig, GameResult, ModifierState } from './types'
import type { GameProps } from '../gamePool'
import { GameEventsContext } from './ModifierContext'

interface Props {
  game: ComponentType<GameProps>
  items: VocabItem[]
  modifiers: ModifierConfig[]
  onGameEnd: (result: GameResult) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress?: { current: number; total: number }
}

export function ModifierStack({ game: Game, items, modifiers, onGameEnd, onBack, moduleConfig, progress }: Props) {
  const timerCfg  = modifiers.find((m): m is { type: 'timer'; seconds: number } => m.type === 'timer')
  const livesCfg  = modifiers.find((m): m is { type: 'lives'; count: number } => m.type === 'lives')
  const hasMultiplier = modifiers.some(m => m.type === 'multiplier') && (!!timerCfg || !!livesCfg)

  const [isTerminated, setIsTerminated]   = useState(false)
  const [endReason, setEndReason]         = useState<GameResult['reason'] | null>(null)
  const [modifierState, setModifierState] = useState<ModifierState>({ optionCount: 4 })
  const [timeLeft, setTimeLeft]           = useState(timerCfg?.seconds ?? 0)
  const livesRef                          = useRef(livesCfg?.count ?? 0)
  const [livesLeft, setLivesLeft]         = useState(livesCfg?.count ?? 0)
  const statsRef                          = useRef({ correct: 0, total: 0 })
  const endedRef                          = useRef(false)

  function end(result: GameResult) {
    if (endedRef.current) return
    endedRef.current = true
    setIsTerminated(true)
    setEndReason(result.reason)
    setTimeout(() => onGameEnd(result), 1000)
  }

  // Timer countdown
  useEffect(() => {
    if (!timerCfg || isTerminated) return
    if (timeLeft <= 0) {
      end({ correct: statsRef.current.correct, total: statsRef.current.total, reason: 'timeout' })
      return
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isTerminated])

  function reportCorrect() {
    if (isTerminated) return
    statsRef.current = { correct: statsRef.current.correct + 1, total: statsRef.current.total + 1 }
    if (hasMultiplier) {
      setModifierState(ms => ({ ...ms, optionCount: ms.optionCount * 2 }))
    }
  }

  function reportWrong() {
    if (isTerminated) return
    statsRef.current = { ...statsRef.current, total: statsRef.current.total + 1 }
    if (livesCfg) {
      const next = Math.max(0, livesRef.current - 1)
      livesRef.current = next
      setLivesLeft(next)
      if (next === 0) {
        end({ correct: statsRef.current.correct, total: statsRef.current.total, reason: 'no-lives' })
      }
    }
  }

  function handleNaturalComplete(correct: number, total: number) {
    end({ correct, total, reason: 'completed' })
  }

  const ratio = timerCfg ? timeLeft / timerCfg.seconds : 1
  const timerColor = ratio > 0.5 ? '#22c55e' : ratio > 0.25 ? '#f59e0b' : '#ef4444'

  return (
    <GameEventsContext.Provider value={{ reportCorrect, reportWrong, isTerminated, modifierState }}>
      <div className="relative">
        <Game
          items={items}
          onComplete={handleNaturalComplete}
          onBack={onBack}
          moduleConfig={moduleConfig}
          progress={progress}
        />

        {/* Timer bar */}
        {timerCfg && !endReason && (
          <div className="fixed top-0 left-0 right-0 z-[70] flex flex-col items-center pt-1 gap-0.5 pointer-events-none">
            <div className="w-full h-1.5 bg-black/10">
              <div
                className="h-full transition-all duration-1000 ease-linear"
                style={{ width: `${ratio * 100}%`, background: timerColor }}
              />
            </div>
            <span className="text-xs font-extrabold tabular-nums" style={{ color: timerColor }}>
              {timeLeft}s
            </span>
          </div>
        )}

        {/* Lives */}
        {livesCfg && !endReason && (
          <div className="fixed top-3 right-4 z-[70] flex gap-1 pointer-events-none">
            {Array.from({ length: livesCfg.count }).map((_, i) => (
              <span key={i} style={{ fontSize: '1.2rem' }}>
                {i < livesLeft ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
        )}

        {/* Multiplier badge */}
        {hasMultiplier && !endReason && modifierState.optionCount > 4 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] pointer-events-none">
            <span
              className="font-extrabold text-white px-3 py-1 rounded-full text-sm"
              style={{ background: moduleConfig.gradient }}
            >
              ×{modifierState.optionCount} opciones
            </span>
          </div>
        )}

        {/* Pantalla de fin por modificador */}
        {endReason && endReason !== 'completed' && (
          <div className="fixed inset-0 z-[75] flex flex-col items-center justify-center gap-3 bg-black/60">
            <span style={{ fontSize: '4rem', lineHeight: 1 }}>
              {endReason === 'timeout' ? '⏰' : '💔'}
            </span>
            <p className="font-extrabold text-2xl text-white">
              {endReason === 'timeout' ? '¡Se acabó el tiempo!' : '¡Sin vidas!'}
            </p>
          </div>
        )}
      </div>
    </GameEventsContext.Provider>
  )
}
