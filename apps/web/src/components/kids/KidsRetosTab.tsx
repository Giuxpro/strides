'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { VocabItem } from './engine/LessonEngine'
import type { ModuleConfig, ModifierConfig, GameResult, RetoId, RetoConfig, RetoState } from '@strides/core/kids'
import { RETO_REGISTRY } from '@strides/core/kids'
import { getGameById } from './engine/gamePool'
import { ModifierStack } from './engine/modifiers/ModifierStack'
import { completeDailyChallenge, recordCountdownAttempt, recordVocabMastery } from '@/app/kids/play/_actions'

// Seeded PRNG — misma selección cada día para el mismo módulo
function seededNext(s: number): number {
  let x = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) | 0)
  x = (Math.imul(x ^ (x >>> 16), 0x45d9f3b) | 0)
  return (x ^ (x >>> 16)) >>> 0
}

function getDailyVocab(vocab: VocabItem[], moduleId: string, dateStr: string, count: number): VocabItem[] {
  const raw = (moduleId + dateStr).split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 1)
  const seed = raw >>> 0
  const arr = [...vocab]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = seededNext(seed + i) % (i + 1)
    const tmp = arr[i]!; arr[i] = arr[j]!; arr[j] = tmp
  }
  return arr.slice(0, Math.min(count, arr.length))
}

type Phase = 'pick' | 'playing' | 'done'

interface Props {
  vocab: VocabItem[]
  moduleConfig: ModuleConfig
  moduleId: string
  selectedChildId: string | null
  dailyDone: boolean
  countdownAttemptsThisWeek: number
  countdownWeeklyLimit: number
  dailyWordCount: number
  retoGameId?: string | null
  retoModifiers?: ModifierConfig[] | null
  diarioGameId?: string | null
}

export function KidsRetosTab({
  vocab, moduleConfig, moduleId, selectedChildId, dailyDone,
  countdownAttemptsThisWeek, countdownWeeklyLimit, dailyWordCount,
  retoGameId, retoModifiers, diarioGameId,
}: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0] ?? ''
  const [dailyItems] = useState(() => getDailyVocab(vocab, moduleId, today, dailyWordCount))

  const [phase, setPhase] = useState<Phase>('pick')
  const [activeRetoId, setActiveRetoId] = useState<RetoId | null>(null)
  const [lastResult, setLastResult] = useState<GameResult | null>(null)
  const [completedDaily, setCompletedDaily] = useState(dailyDone)
  const [countdownUsed, setCountdownUsed] = useState(countdownAttemptsThisWeek)

  const cfg: RetoConfig = { countdownWeeklyLimit, dailyWordCount }
  const st: RetoState = {
    completedDaily,
    countdownUsed,
    enoughVocab: vocab.length >= 4,
  }

  function startReto(id: RetoId) {
    if (id === 'contrarreloj' && selectedChildId) {
      recordCountdownAttempt(selectedChildId, moduleId)
        .then(() => setCountdownUsed(n => n + 1))
        .catch(() => {})
    }
    setActiveRetoId(id)
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
    if (activeRetoId === 'diario' && selectedChildId && !completedDaily) {
      const stars = Math.round((result.total > 0 ? result.correct / result.total : 1) * 3)
      completeDailyChallenge(selectedChildId, moduleId, today, stars)
        .then(() => setCompletedDaily(true))
        .catch(() => {})
    }
    setPhase('done')
  }

  function backToPick() {
    setPhase('pick')
    setActiveRetoId(null)
  }

  /* ── Playing ── */
  if (phase === 'playing' && activeRetoId) {
    const entry = RETO_REGISTRY.find(r => r.id === activeRetoId)
    const isCountdown = activeRetoId === 'contrarreloj'
    const isDiario    = activeRetoId === 'diario'
    const effectiveGameId =
      (isDiario    && diarioGameId)         ? diarioGameId :
      (isCountdown && retoGameId)           ? retoGameId   :
      entry?.gameId
    const effectiveModifiers = (isCountdown && retoModifiers?.length) ? retoModifiers : entry?.modifiers ?? []
    const game = effectiveGameId ? getGameById(effectiveGameId) : undefined
    if (entry && game) {
      return (
        <div className="fixed inset-0 z-[60]" style={{ background: 'var(--kids-bg)' }}>
          <ModifierStack
            game={game.component}
            items={entry.getItems(vocab, dailyItems)}
            modifiers={effectiveModifiers}
            onGameEnd={handleGameEnd}
            onBack={backToPick}
            moduleConfig={moduleConfig}
            progress={{ current: 1, total: 1 }}
          />
        </div>
      )
    }
  }

  /* ── Done ── */
  if (phase === 'done' && activeRetoId && lastResult) {
    const entry = RETO_REGISTRY.find(r => r.id === activeRetoId)!
    const ratio  = lastResult.total > 0 ? lastResult.correct / lastResult.total : 1
    const pct    = Math.round(ratio * 100)
    const stars  = Math.round(ratio * 3)
    const passed = pct >= 70
    const stAfterComplete: RetoState = { ...st, countdownUsed }

    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 px-8 text-center"
        style={{ background: 'var(--kids-bg)' }}
      >
        <span style={{ fontSize: '4rem', lineHeight: 1 }}>{passed ? '🏆' : '💪'}</span>
        <div>
          <p className="font-extrabold text-2xl mb-1" style={{ color: 'var(--kids-text)' }}>
            {passed ? '¡Reto completado!' : '¡Buen intento!'}
          </p>
          <p style={{ color: 'var(--kids-text-muted)' }}>{entry.getDoneLabel(lastResult, lastResult.reason)}</p>
        </div>
        {stars > 0 && (
          <p className="text-3xl tracking-wider">
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </p>
        )}
        <div className="flex gap-3">
          {entry.canRetry(cfg, stAfterComplete) && (
            <button
              onClick={() => startReto(activeRetoId)}
              className="font-extrabold text-white px-6 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
            >
              Intentar de nuevo · {cfg.countdownWeeklyLimit - stAfterComplete.countdownUsed} restante{cfg.countdownWeeklyLimit - stAfterComplete.countdownUsed !== 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={backToPick}
            className="font-bold px-6 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: moduleConfig.accentLight, color: moduleConfig.accent }}
          >
            Volver a retos
          </button>
        </div>
      </div>
    )
  }

  /* ── Pick ── */
  return (
    <div className="px-6 pt-4">
      <h2 className="text-center font-extrabold text-lg mb-1" style={{ color: 'var(--kids-text)' }}>
        Retos
      </h2>
      <p className="text-center text-sm mb-6" style={{ color: 'var(--kids-text-muted)' }}>
        Desafíos especiales para poner a prueba lo que sabes
      </p>

      <div className="flex flex-col gap-4 max-w-sm mx-auto">
        {RETO_REGISTRY.map(entry => (
          <RetoCard
            key={entry.id}
            emoji={entry.emoji}
            title={entry.title}
            description={entry.getDescription(cfg, st)}
            badge={entry.getBadge(cfg)}
            badgeColor={entry.badgeColor ?? moduleConfig.gradientFrom}
            reward={entry.reward}
            completed={entry.getCompleted(st)}
            disabled={entry.getDisabled(cfg, st)}
            locked={entry.locked}
            counter={entry.getCounter(cfg, st)}
            onPlay={() => startReto(entry.id)}
            moduleConfig={moduleConfig}
          />
        ))}
      </div>
    </div>
  )
}

interface RetoCardProps {
  emoji: string
  title: string
  description: string
  badge: string
  badgeColor: string
  reward: string
  completed: boolean
  disabled: boolean
  locked?: boolean
  counter?: { used: number; total: number }
  onPlay: () => void
  moduleConfig: ModuleConfig
}

function RetoCard({
  emoji, title, description, badge, badgeColor, reward,
  completed, disabled, locked, counter, onPlay, moduleConfig,
}: RetoCardProps) {
  return (
    <div
      className="rounded-3xl p-5 flex items-center gap-4"
      style={{
        background: 'rgba(255,253,245,0.85)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
        opacity: locked ? 0.5 : 1,
      }}
    >
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
        <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>{emoji}</span>
        {counter && (
          <span
            className="font-extrabold tabular-nums"
            style={{ fontSize: '1.1rem', color: '#3a2a1a', lineHeight: 1.1 }}
          >
            {counter.used}/{counter.total}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="font-extrabold text-sm" style={{ color: '#4a3728' }}>{title}</p>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${badgeColor}22`, color: badgeColor }}
          >
            {badge}
          </span>
        </div>
        <p className="text-xs leading-snug" style={{ color: '#9e8e7e' }}>{description}</p>
        <p className="text-xs mt-1 font-semibold" style={{ color: moduleConfig.accent }}>
          🎁 {reward}
        </p>
      </div>

      <div className="flex-shrink-0">
        {completed ? (
          <span className="text-2xl" title="¡Completado hoy!">✅</span>
        ) : locked ? (
          <span className="text-xl">🔒</span>
        ) : (
          <button
            onClick={onPlay}
            disabled={disabled}
            className="font-extrabold text-white px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
          >
            ¡Ir!
          </button>
        )}
      </div>
    </div>
  )
}
