'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { VocabItem } from '../engine/LessonEngine'
import type { ModuleConfig, GameResult } from '@strides/core/kids'
import { GAME_POOL, type PoolEntry, type GameConfigs } from '../engine/gamePool'
import { ModifierStack } from '../engine/modifiers/ModifierStack'
import { recordVocabMastery, recordGamePlay } from '@/app/kids/play/_actions'
import {
  ModifierPickerModal,
  type ModifierSelection,
  type AvailableModifiers,
  DEFAULT_MODIFIER_SELECTION,
  toModifierConfigs,
  modifierLabel,
} from '../ui/ModifierPickerModal'
import { PronunciationResultPanel } from '../engine/PronunciationResultPanel'
import { useMusicContext } from '../audio/MusicProvider'
import { NpsPrompt } from '@/components/feedback/NpsPrompt'

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
  const { setMusicContext } = useMusicContext()
  const [phase, setPhase]               = useState<Phase>('pick')
  const [activeGame, setActiveGame]     = useState<PoolEntry | null>(null)
  const [gameVocab, setGameVocab]       = useState<VocabItem[]>([])
  const [lastResult, setLastResult]     = useState<GameResult | null>(null)
  const [modSel, setModSel]             = useState<ModifierSelection>(DEFAULT_MODIFIER_SELECTION)
  const [showModModal, setShowModModal] = useState(false)
  const [showNps, setShowNps]           = useState(false)

  // Mask out modifiers disabled by admin
  const effectiveModSel: ModifierSelection = {
    timer:  (!availableModifiers || availableModifiers.timer  !== false) ? modSel.timer  : null,
    lives:  (!availableModifiers || availableModifiers.lives  !== false) ? modSel.lives  : null,
  }
  const effectivePool = GAME_POOL
    .filter(g => !activeGameIds || activeGameIds.includes(g.id))
    .map((g, _, arr) => {
      const cfg = gameConfigs?.[g.id]
      return {
        ...g,
        minItems:        cfg?.minItems        ?? g.minItems,
        maxItems:        cfg?.maxItems        ?? g.maxItems,
        adminOnly:       cfg?.adminOnly       ?? false,
        disabledForUsers: cfg?.disabledForUsers ?? false,
        globalIdx:       GAME_POOL.indexOf(g),
      }
    })

  const activeModifiers = toModifierConfigs(effectiveModSel)
  const hasModifiers    = activeModifiers.length > 0

  function startGame(game: PoolEntry) {
    setActiveGame(game)
    setGameVocab(shuffle(vocab).slice(0, game.maxItems))
    setLastResult(null)
    setPhase('playing')
    setMusicContext('game')
  }

  function handleGameEnd(result: GameResult) {
    setLastResult(result)
    setPhase('done')

    recordGamePlay(activeGame?.id ?? '', result.correct ?? 0, result.total ?? 0)
      .then((nps) => {
        if (nps) setShowNps(true)
        router.refresh()
      })
      .catch(() => {})

    if (result.wordResults?.length) {
      recordVocabMastery(result.wordResults).catch(() => {})
    }
  }

  function backToPick() {
    setPhase('pick')
    setActiveGame(null)
    setMusicContext('navigation')
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
    const wordResults = lastResult.wordResults ?? []
    const hasSpeaking = wordResults.some(r => r.expected !== undefined)
    const vocabMap = vocab.reduce<Record<string, typeof vocab[number]>>((acc, v) => { acc[v.id] = v; return acc }, {})

    const buttons = (
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
    )

    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-6 overflow-y-auto"
        style={{ background: 'var(--kids-bg)' }}
      >
        <div className={`w-full ${hasSpeaking ? 'max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center' : 'max-w-sm flex flex-col items-center text-center'}`}>

          {/* Score summary */}
          <div className="flex flex-col items-center text-center gap-3">
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
            {buttons}
          </div>

          {/* Panel de pronunciación */}
          {hasSpeaking && (
            <PronunciationResultPanel
              wordResults={wordResults}
              vocabMap={vocabMap}
              moduleConfig={moduleConfig}
            />
          )}

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
          {effectivePool.map((game) => {
            const enough = vocab.length >= game.minItems
            const locked = game.adminOnly
            const disabledTag = game.disabledForUsers
            return (
              <button
                key={game.id}
                onClick={() => !locked && enough && startGame(game)}
                disabled={locked || !enough}
                className="relative flex flex-col items-center gap-3 p-6 rounded-3xl transition-all duration-150 disabled:cursor-not-allowed"
                style={{
                  background: locked ? 'rgba(200,195,190,0.45)' : 'rgba(255,253,245,0.85)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: locked ? 'none' : '0 6px 24px rgba(0,0,0,0.14)',
                  width: 160,
                  opacity: locked ? 0.55 : 1,
                }}
                onMouseEnter={e => { if (!locked) (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.05)' }}
                onMouseLeave={e => { if (!locked) (e.currentTarget as HTMLElement).style.transform = '' }}
              >
                {/* Numeral */}
                <span
                  className="absolute top-2.5 right-3 font-bold text-[10px] leading-none"
                  style={{ color: locked ? '#a09080' : '#c0a080' }}
                >
                  #{game.globalIdx + 1}
                </span>

                {locked && <span className="absolute top-2.5 left-3 text-sm">🔒</span>}

                <span style={{ fontSize: '3rem', lineHeight: 1, filter: locked ? 'grayscale(1)' : 'none' }}>
                  {game.emoji}
                </span>

                <div className="text-center">
                  <p className="font-extrabold text-base" style={{ color: locked ? '#8a7a6a' : '#4a3728' }}>
                    {game.titleEn}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#9e8e7e' }}>
                    {game.title}
                  </p>
                  {locked ? (
                    <p className="text-[10px] mt-1 font-bold" style={{ color: '#e85d5d' }}>
                      🚫 No disponible
                    </p>
                  ) : (
                    <p className="text-[10px] mt-1" style={{ color: '#b8a898' }}>
                      {game.description}
                    </p>
                  )}
                </div>

                {/* Etiqueta admin: avisa que el juego está deshabilitado para users */}
                {disabledTag && (
                  <span
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                  >
                    🚫 Deshabilitado para users
                  </span>
                )}

                {!locked && !enough && (
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

      {showNps && <NpsPrompt onClose={() => setShowNps(false)} />}
    </>
  )
}
