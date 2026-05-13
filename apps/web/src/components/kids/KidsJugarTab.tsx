'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { VocabItem } from './engine/LessonEngine'
import type { ModuleConfig, GameResult } from '@strides/core/kids'
import { GAME_POOL, type PoolEntry, type GameConfigs } from './engine/gamePool'
import { ModifierStack } from './engine/modifiers/ModifierStack'
import { recordVocabMastery } from '@/app/kids/play/_actions'
import {
  ModifierPickerModal,
  type ModifierSelection,
  type AvailableModifiers,
  DEFAULT_MODIFIER_SELECTION,
  toModifierConfigs,
  modifierLabel,
} from './ModifierPickerModal'

interface Props {
  vocab: VocabItem[]
  moduleConfig: ModuleConfig
  selectedChildId: string | null
  availableModifiers?: AvailableModifiers | null
  activeGameIds?: string[] | null
  gameConfigs?: GameConfigs | null
}

type Phase = 'pick' | 'playing' | 'done'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp
  }
  return a
}

export function KidsJugarTab({ vocab, moduleConfig, selectedChildId, availableModifiers, activeGameIds, gameConfigs }: Props) {
  const router = useRouter()
  const [phase, setPhase]               = useState<Phase>('pick')
  const [activeGame, setActiveGame]     = useState<PoolEntry | null>(null)
  const [gameVocab, setGameVocab]       = useState<VocabItem[]>([])
  const [lastResult, setLastResult]     = useState<GameResult | null>(null)
  const [modSel, setModSel]             = useState<ModifierSelection>(DEFAULT_MODIFIER_SELECTION)
  const [showModModal, setShowModModal] = useState(false)

  // Mask out modifiers disabled by admin
  const effectiveModSel: ModifierSelection = {
    timer:      (!availableModifiers || availableModifiers.timer      !== false) ? modSel.timer      : null,
    lives:      (!availableModifiers || availableModifiers.lives      !== false) ? modSel.lives      : null,
    multiplier: (!availableModifiers || availableModifiers.multiplier !== false) ? modSel.multiplier : false,
  }
  const effectivePool = GAME_POOL
    .filter(g => !activeGameIds || activeGameIds.includes(g.id))
    .map(g => {
      const cfg = gameConfigs?.[g.id]
      return cfg ? { ...g, minItems: cfg.minItems ?? g.minItems, maxItems: cfg.maxItems ?? g.maxItems } : g
    })

  const activeModifiers = toModifierConfigs(effectiveModSel)
  const hasModifiers    = activeModifiers.length > 0

  function startGame(game: PoolEntry) {
    setActiveGame(game)
    setGameVocab(shuffle(vocab).slice(0, game.maxItems))
    setLastResult(null)
    setPhase('playing')
  }

  function handleGameEnd(result: GameResult) {
    setLastResult(result)
    if (selectedChildId && result.wordResults?.length) {
      recordVocabMastery(selectedChildId, result.wordResults)
        .then(() => router.refresh())
        .catch(() => {})
    }
    setPhase('done')
  }

  function backToPick() {
    setPhase('pick')
    setActiveGame(null)
  }

  /* ── Playing ── */
  if (phase === 'playing' && activeGame) {
    return (
      <div className="fixed inset-0 z-[60]" style={{ background: 'var(--kids-bg)' }}>
        <ModifierStack
          game={activeGame.component}
          items={gameVocab}
          modifiers={activeModifiers}
          onGameEnd={handleGameEnd}
          onBack={backToPick}
          moduleConfig={moduleConfig}
          progress={{ current: 1, total: 1 }}
        />
      </div>
    )
  }

  /* ── Done ── */
  if (phase === 'done' && activeGame && lastResult) {
    const pct    = lastResult.total > 0 ? Math.round((lastResult.correct / lastResult.total) * 100) : 100
    const passed = pct >= 70
    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 px-8 text-center"
        style={{ background: 'var(--kids-bg)' }}
      >
        <span style={{ fontSize: '4rem', lineHeight: 1 }}>
          {lastResult.reason === 'timeout' ? '⏰' : lastResult.reason === 'no-lives' ? '💔' : passed ? '🏆' : '💪'}
        </span>
        <p className="font-extrabold text-2xl" style={{ color: 'var(--kids-text)' }}>
          {passed ? '¡Excelente!' : '¡Buen intento!'}
        </p>
        {lastResult.total > 0 && (
          <p style={{ color: 'var(--kids-text-muted)' }}>
            {lastResult.correct} de {lastResult.total} correctas
          </p>
        )}
        {hasModifiers && (
          <p className="text-xs font-semibold" style={{ color: 'var(--kids-text-muted)' }}>
            {modifierLabel(effectiveModSel)}
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
    <>
      <div className="px-6 pt-4">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <h2 className="font-extrabold text-lg" style={{ color: 'var(--kids-text)' }}>
            ¿A qué jugamos?
          </h2>
          <button
            onClick={() => setShowModModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              background: hasModifiers ? moduleConfig.gradient : 'rgba(0,0,0,0.07)',
              color: hasModifiers ? '#fff' : 'var(--kids-text-muted)',
              boxShadow: hasModifiers ? moduleConfig.shadow : 'none',
            }}
          >
            {hasModifiers ? modifierLabel(effectiveModSel) : '⚙️ Opciones de juego'}
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▾</span>
          </button>
        </div>

        {/* Game cards */}
        <div className="flex flex-wrap gap-5 justify-center">
          {effectivePool.map(game => {
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

      {showModModal && (
        <ModifierPickerModal
          value={effectiveModSel}
          onChange={setModSel}
          onClose={() => setShowModModal(false)}
          moduleConfig={moduleConfig}
          availableModifiers={availableModifiers}
        />
      )}
    </>
  )
}
