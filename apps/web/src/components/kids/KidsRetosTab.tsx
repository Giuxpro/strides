'use client'

import { useState } from 'react'
import type { VocabItem } from './engine/LessonEngine'
import type { ModuleConfig } from './moduleConfig'
import { CountdownGame } from './engine/CountdownGame'
import { RecognitionExercise } from './engine/RecognitionExercise'
import { completeDailyChallenge, recordCountdownAttempt } from '@/app/actions/challenges'

// Seeded PRNG — misma selección cada día para el mismo módulo
function seededNext(s: number): number {
  let x = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) | 0)
  x = (Math.imul(x ^ (x >>> 16), 0x45d9f3b) | 0)
  return (x ^ (x >>> 16)) >>> 0
}

function getDailyVocab(vocab: VocabItem[], moduleId: string, dateStr: string, count = 5): VocabItem[] {
  const raw = (moduleId + dateStr).split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 1)
  const seed = raw >>> 0
  const arr = [...vocab]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = seededNext(seed + i) % (i + 1)
    const tmp = arr[i]!; arr[i] = arr[j]!; arr[j] = tmp
  }
  return arr.slice(0, Math.min(count, arr.length))
}

type RetoId = 'contrarreloj' | 'diario'
type Phase  = 'pick' | 'playing' | 'done'

interface Props {
  vocab: VocabItem[]
  moduleConfig: ModuleConfig
  moduleId: string
  selectedChildId: string | null
  dailyDone: boolean
  countdownAttemptsThisWeek: number
}

const COUNTDOWN_WEEKLY_LIMIT = 3

export function KidsRetosTab({ vocab, moduleConfig, moduleId, selectedChildId, dailyDone, countdownAttemptsThisWeek }: Props) {
  const today = new Date().toISOString().split('T')[0] ?? ''
  const [dailyItems] = useState(() => getDailyVocab(vocab, moduleId, today))

  const [phase, setPhase] = useState<Phase>('pick')
  const [activeReto, setActiveReto] = useState<RetoId | null>(null)
  const [lastScore, setLastScore] = useState<{ correct: number; total: number } | null>(null)
  const [completedDaily, setCompletedDaily] = useState(dailyDone)
  const [countdownUsed, setCountdownUsed] = useState(countdownAttemptsThisWeek)

  function startReto(reto: RetoId) {
    if (reto === 'contrarreloj' && selectedChildId) {
      recordCountdownAttempt(selectedChildId, moduleId)
        .then(() => setCountdownUsed(n => n + 1))
        .catch(() => {})
    }
    setActiveReto(reto)
    setLastScore(null)
    setPhase('playing')
  }

  function handleComplete(correct: number, total: number) {
    setLastScore({ correct, total })
    if (activeReto === 'diario' && selectedChildId && !completedDaily) {
      const stars = Math.round((total > 0 ? correct / total : 1) * 3)
      completeDailyChallenge(selectedChildId, moduleId, today, stars)
        .then(() => setCompletedDaily(true))
        .catch(() => { /* silencioso: el usuario ya vio el resultado */ })
    }
    setPhase('done')
  }

  function backToPick() {
    setPhase('pick')
    setActiveReto(null)
  }

  const countdownRemaining = COUNTDOWN_WEEKLY_LIMIT - countdownUsed
  const countdownExhausted = countdownRemaining <= 0

  /* ── Playing ── */
  if (phase === 'playing') {
    return (
      <div className="fixed inset-0 z-[60]" style={{ background: 'var(--kids-bg)' }}>
        {activeReto === 'contrarreloj' && (
          <CountdownGame
            items={vocab}
            onComplete={handleComplete}
            onBack={backToPick}
            moduleConfig={moduleConfig}
          />
        )}
        {activeReto === 'diario' && (
          <RecognitionExercise
            items={dailyItems}
            onComplete={handleComplete}
            onBack={backToPick}
            moduleConfig={moduleConfig}
            progress={{ current: 1, total: 1 }}
          />
        )}
      </div>
    )
  }

  /* ── Done ── */
  if (phase === 'done' && activeReto && lastScore) {
    const ratio  = lastScore.total > 0 ? lastScore.correct / lastScore.total : 1
    const pct    = Math.round(ratio * 100)
    const stars  = Math.round(ratio * 3)
    const passed = pct >= 70

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
          {activeReto === 'contrarreloj' && (
            <p style={{ color: 'var(--kids-text-muted)' }}>
              {lastScore.correct} correctas en 60 segundos
            </p>
          )}
          {activeReto === 'diario' && lastScore.total > 0 && (
            <p style={{ color: 'var(--kids-text-muted)' }}>
              {lastScore.correct} de {lastScore.total} correctas
            </p>
          )}
        </div>
        {stars > 0 && (
          <p className="text-3xl tracking-wider">
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </p>
        )}
        <div className="flex gap-3">
          {activeReto === 'contrarreloj' && countdownRemaining > 0 && (
            <button
              onClick={() => startReto('contrarreloj')}
              className="font-extrabold text-white px-6 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={{ background: moduleConfig.gradient, boxShadow: moduleConfig.shadow }}
            >
              Intentar de nuevo · {countdownRemaining} restante{countdownRemaining !== 1 ? 's' : ''}
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
  const enoughForRecognition = vocab.length >= 4

  return (
    <div className="px-6 pt-4">
      <h2 className="text-center font-extrabold text-lg mb-1" style={{ color: 'var(--kids-text)' }}>
        Retos
      </h2>
      <p className="text-center text-sm mb-6" style={{ color: 'var(--kids-text-muted)' }}>
        Desafíos especiales para poner a prueba lo que sabes
      </p>

      <div className="flex flex-col gap-4 max-w-sm mx-auto">
        <RetoCard
          emoji="⭐"
          title="Reto del día"
          description="5 palabras especiales para hoy. ¡Solo puedes hacerlo una vez!"
          badge="Diario"
          badgeColor="#f59e0b"
          reward="Estrellas"
          completed={completedDaily}
          disabled={!enoughForRecognition || completedDaily}
          onPlay={() => startReto('diario')}
          moduleConfig={moduleConfig}
        />
        <RetoCard
          emoji="⏱️"
          title="Contrarreloj"
          description={
            countdownExhausted
              ? '¡Ya usaste tus 3 intentos esta semana! Vuelve el lunes.'
              : '¿Cuántas puedes acertar en 60 segundos?'
          }
          badge="3 veces por semana"
          badgeColor={moduleConfig.gradientFrom}
          reward="Récord personal"
          counter={{ used: countdownUsed, total: COUNTDOWN_WEEKLY_LIMIT }}
          completed={false}
          disabled={!enoughForRecognition || countdownExhausted}
          onPlay={() => startReto('contrarreloj')}
          moduleConfig={moduleConfig}
        />
        <RetoCard
          emoji="🏆"
          title="Reto semanal"
          description="Completa todos los retos diarios de la semana"
          badge="Próximamente"
          badgeColor="#6b7280"
          reward="Medalla"
          completed={false}
          disabled={true}
          locked
          onPlay={() => {}}
          moduleConfig={moduleConfig}
        />
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
