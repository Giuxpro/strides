'use client'

import { useState, useEffect, useRef, type ComponentType } from 'react'
import type { VocabItem, ModuleConfig, ModifierConfig, GameResult, WordResult, GameRuntimeConfig } from '@strides/core/kids'
import type { GameProps } from '../gamePool'
import { GameEventsContext } from './ModifierContext'
import { playWrongSound, playVictoryFanfare } from '@/lib/gameAudio'

interface Props {
  game: ComponentType<GameProps>
  items: VocabItem[]
  modifiers: ModifierConfig[]
  onGameEnd: (result: GameResult) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress?: { current: number; total: number }
  gameConfig?: GameRuntimeConfig
}

export function ModifierStack({ game: Game, items, modifiers, onGameEnd, onBack, moduleConfig, progress, gameConfig }: Props) {
  const timerCfg  = modifiers.find((m): m is { type: 'timer'; seconds: number } => m.type === 'timer')
  const livesCfg  = modifiers.find((m): m is { type: 'lives'; count: number } => m.type === 'lives')

  const [isTerminated, setIsTerminated] = useState(false)
  const [endReason, setEndReason]       = useState<GameResult['reason'] | null>(null)
  const [timeLeft, setTimeLeft]         = useState(timerCfg?.seconds ?? 0)
  const livesRef                          = useRef(livesCfg?.count ?? 0)
  const [livesLeft, setLivesLeft]         = useState(livesCfg?.count ?? 0)
  const statsRef                          = useRef({ correct: 0, total: 0 })
  const wordResultsRef                    = useRef<WordResult[] | undefined>(undefined)
  const endedRef                          = useRef(false)

  function end(result: Omit<GameResult, 'wordResults'>) {
    if (endedRef.current) return
    endedRef.current = true
    setIsTerminated(true)
    setEndReason(result.reason)
    // Más tiempo para 'completed' para que el overlay de celebración sea visible
    const delay = result.reason === 'completed' ? 1600 : 1000
    setTimeout(() => onGameEnd({ ...result, wordResults: wordResultsRef.current }), delay)
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
  }

  function reportWrong() {
    if (isTerminated) return
    statsRef.current = { ...statsRef.current, total: statsRef.current.total + 1 }
    playWrongSound()
    if (livesCfg) {
      const next = Math.max(0, livesRef.current - 1)
      livesRef.current = next
      setLivesLeft(next)
      if (next === 0) {
        end({ correct: statsRef.current.correct, total: statsRef.current.total, reason: 'no-lives' })
      }
    }
  }

  function handleNaturalComplete(correct: number, total: number, wordResults?: WordResult[]) {
    wordResultsRef.current = wordResults
    playVictoryFanfare()
    end({ correct, total, reason: 'completed' })
  }

  const ratio = timerCfg ? timeLeft / timerCfg.seconds : 1
  const timerColor = ratio > 0.5 ? '#22c55e' : ratio > 0.25 ? '#f59e0b' : '#ef4444'

  return (
    <GameEventsContext.Provider value={{ reportCorrect, reportWrong, isTerminated }}>
      <div className="relative">
        <Game
          items={items}
          onComplete={handleNaturalComplete}
          onBack={onBack}
          moduleConfig={moduleConfig}
          progress={progress}
          config={gameConfig}
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

        {/* Celebración al completar */}
        {endReason === 'completed' && (
          <div className="fixed inset-0 z-[75] flex items-center justify-center pointer-events-none">
            <div
              className="flex flex-col items-center gap-2 px-10 py-7 rounded-3xl"
              style={{
                background: moduleConfig.gradient,
                boxShadow: `0 12px 48px ${moduleConfig.gradientFrom}88`,
                animation: 'achievement-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards',
              }}
            >
              <span style={{ fontSize: '3.2rem', lineHeight: 1 }}>⭐</span>
              <p className="font-extrabold text-white text-2xl tracking-tight">¡Muy bien!</p>
            </div>
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

        <style>{`
          @keyframes achievement-pop {
            0%   { transform: scale(0.55); opacity: 0 }
            70%  { transform: scale(1.06); opacity: 1 }
            100% { transform: scale(1);   opacity: 1 }
          }
        `}</style>
      </div>
    </GameEventsContext.Provider>
  )
}
