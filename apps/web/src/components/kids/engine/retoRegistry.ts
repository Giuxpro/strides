import type { VocabItem } from './LessonEngine'
import type { ModifierConfig } from './modifiers/types'

export type RetoId = 'diario' | 'contrarreloj' | 'semanal'

export interface RetoConfig {
  countdownWeeklyLimit: number
  dailyWordCount: number
}

export interface RetoState {
  completedDaily: boolean
  countdownUsed: number
  enoughVocab: boolean
}

export interface RetoEntry {
  id: RetoId
  gameId: string | null
  modifiers: ModifierConfig[]
  emoji: string
  title: string
  reward: string
  locked?: boolean
  badgeColor: string | null
  getBadge: (cfg: RetoConfig) => string
  getDescription: (cfg: RetoConfig, st: RetoState) => string
  getCompleted: (st: RetoState) => boolean
  getDisabled: (cfg: RetoConfig, st: RetoState) => boolean
  getCounter: (cfg: RetoConfig, st: RetoState) => { used: number; total: number } | undefined
  getItems: (vocab: VocabItem[], dailyItems: VocabItem[]) => VocabItem[]
  getDoneLabel: (score: { correct: number; total: number }, reason: string) => string
  canRetry: (cfg: RetoConfig, st: RetoState) => boolean
}

export const RETO_REGISTRY: RetoEntry[] = [
  {
    id: 'diario',
    gameId: 'recognition',
    modifiers: [],
    emoji: '⭐',
    title: 'Reto del día',
    reward: 'Estrellas',
    badgeColor: '#f59e0b',
    getBadge: () => 'Diario',
    getDescription: (cfg) => `${cfg.dailyWordCount} palabras especiales para hoy. ¡Solo puedes hacerlo una vez!`,
    getCompleted: (st) => st.completedDaily,
    getDisabled: (_cfg, st) => !st.enoughVocab || st.completedDaily,
    getCounter: () => undefined,
    getItems: (_vocab, dailyItems) => dailyItems,
    getDoneLabel: (s) => s.total > 0 ? `${s.correct} de ${s.total} correctas` : '',
    canRetry: () => false,
  },
  {
    id: 'contrarreloj',
    gameId: 'recognition',
    modifiers: [{ type: 'timer', seconds: 60 }],
    emoji: '⏱️',
    title: 'Contrarreloj',
    reward: 'Récord personal',
    badgeColor: null,
    getBadge: (cfg) => `${cfg.countdownWeeklyLimit} veces por semana`,
    getDescription: (cfg, st) =>
      st.countdownUsed >= cfg.countdownWeeklyLimit
        ? `¡Ya usaste tus ${cfg.countdownWeeklyLimit} intentos esta semana! Vuelve el lunes.`
        : '¿Cuántas puedes acertar en 60 segundos?',
    getCompleted: () => false,
    getDisabled: (cfg, st) => !st.enoughVocab || st.countdownUsed >= cfg.countdownWeeklyLimit,
    getCounter: (cfg, st) => ({ used: st.countdownUsed, total: cfg.countdownWeeklyLimit }),
    getItems: (vocab) => vocab,
    getDoneLabel: (s, reason) =>
      reason === 'timeout' ? `${s.correct} correctas en 60 segundos` : `${s.correct} de ${s.total} correctas`,
    canRetry: (cfg, st) => st.countdownUsed < cfg.countdownWeeklyLimit,
  },
  {
    id: 'semanal',
    gameId: null,
    modifiers: [],
    emoji: '🏆',
    title: 'Reto semanal',
    reward: 'Medalla',
    locked: true,
    badgeColor: '#6b7280',
    getBadge: () => 'Próximamente',
    getDescription: () => 'Completa todos los retos diarios de la semana',
    getCompleted: () => false,
    getDisabled: () => true,
    getCounter: () => undefined,
    getItems: (vocab) => vocab,
    getDoneLabel: () => '',
    canRetry: () => false,
  },
]
