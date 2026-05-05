'use client'

import { useState } from 'react'
import type { VocabItem } from './engine/LessonEngine'
import type { ModuleConfig } from './moduleConfig'
import { GAME_REGISTRY, type GameEntry } from './engine/gameRegistry'

interface Props {
  vocab: VocabItem[]
  moduleConfig: ModuleConfig
}

type Phase = 'pick' | 'playing' | 'done'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i] as T
    a[i] = a[j] as T
    a[j] = tmp
  }
  return a
}

export function KidsJugarTab({ vocab, moduleConfig }: Props) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [activeGame, setActiveGame] = useState<GameEntry | null>(null)
  const [gameVocab, setGameVocab] = useState<VocabItem[]>([])
  const [lastScore, setLastScore] = useState<{ correct: number; total: number } | null>(null)

  function startGame(game: GameEntry) {
    setActiveGame(game)
    setGameVocab(shuffle(vocab).slice(0, game.maxItems))
    setLastScore(null)
    setPhase('playing')
  }

  function handleComplete(correct: number, total: number) {
    setLastScore({ correct, total })
    setPhase('done')
  }

  function backToPick() {
    setPhase('pick')
    setActiveGame(null)
  }

  /* ── Playing ── */
  if (phase === 'playing' && activeGame) {
    const GameComponent = activeGame.component
    return (
      <div className="fixed inset-0 z-[60]" style={{ background: 'var(--kids-bg)' }}>
        <GameComponent
          items={gameVocab}
          onComplete={handleComplete}
          onBack={backToPick}
          moduleConfig={moduleConfig}
          progress={{ current: 1, total: 1 }}
        />
      </div>
    )
  }

  /* ── Done ── */
  if (phase === 'done' && activeGame && lastScore) {
    const pct = lastScore.total > 0 ? Math.round((lastScore.correct / lastScore.total) * 100) : 100
    const passed = pct >= 70
    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 px-8 text-center"
        style={{ background: 'var(--kids-bg)' }}
      >
        <span style={{ fontSize: '4rem', lineHeight: 1 }}>{passed ? '🏆' : '💪'}</span>
        <p className="font-extrabold text-2xl" style={{ color: 'var(--kids-text)' }}>
          {passed ? '¡Excelente!' : '¡Buen intento!'}
        </p>
        {lastScore.total > 0 && (
          <p style={{ color: 'var(--kids-text-muted)' }}>
            {lastScore.correct} de {lastScore.total} correctas
          </p>
        )}
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => startGame(activeGame)}
            className="font-extrabold text-white px-6 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
          >
            Jugar de nuevo
          </button>
          <button
            onClick={backToPick}
            className="font-bold px-6 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
          >
            Elegir juego
          </button>
        </div>
      </div>
    )
  }

  /* ── Picker ── */
  return (
    <div className="px-6 pt-4">
      <h2
        className="text-center font-extrabold text-lg mb-6"
        style={{ color: 'var(--kids-text)' }}
      >
        ¿A qué jugamos?
      </h2>
      <div className="flex flex-wrap gap-5 justify-center">
        {GAME_REGISTRY.map(game => {
          const enough = vocab.length >= game.minItems
          return (
            <button
              key={game.id}
              onClick={() => enough && startGame(game)}
              disabled={!enough}
              className="flex flex-col items-center gap-3 p-6 rounded-3xl transition-all duration-150 hover:-translate-y-1 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(255,253,245,0.85)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
                width: 160,
              }}
            >
              <span style={{ fontSize: '3rem', lineHeight: 1 }}>{game.emoji}</span>
              <div className="text-center">
                <p className="font-extrabold text-base" style={{ color: '#4a3728' }}>
                  {game.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#9e8e7e' }}>
                  {game.description}
                </p>
              </div>
              {!enough && (
                <p className="text-xs" style={{ color: '#c0a080' }}>
                  Necesitas {game.minItems}+ palabras
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
