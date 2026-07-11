import type { VocabItem } from '../types'

// Repaso espaciado (SRS al vuelo, sin next_review_at).
// Una palabra entra al repaso si está floja (debilidad alta) O si lleva tiempo
// sin practicarse aunque se domine — así se mantiene vivo lo aprendido, no solo
// se recuperan errores. El orden lo da: prioridad = recencia × debilidad.

export interface ReviewMasteryRow {
  vocabId: string
  correctCount: number
  attemptCount: number
  // child_vocab_mastery.updated_at: cuándo se practicó por última vez.
  practicedAt: string
  item: VocabItem
}

export interface ReviewRankingOptions {
  // Debilidad mínima (1 - ratio de acierto) para entrar por flojera.
  weakThreshold: number
  // Días sin practicar para entrar por antigüedad aunque esté dominada.
  staleDays: number
  // Días a partir de los cuales el componente de recencia satura en 1.
  recencySaturationDays: number
  weightRecency: number
  weightWeakness: number
}

export const REVIEW_RANKING_DEFAULTS: ReviewRankingOptions = {
  weakThreshold: 0.3,
  staleDays: 7,
  recencySaturationDays: 14,
  weightRecency: 0.5,
  weightWeakness: 0.5,
}

export const REVIEW_SESSION_SIZE = 8
export const REVIEW_MIN_POOL = 5

const DAY_MS = 86_400_000

export interface RankedReviewWord {
  item: VocabItem
  priority: number
}

// Agrupa las filas por palabra (hay una por skill_type), calcula elegibilidad y
// prioridad, y devuelve los elegibles ordenados de mayor a menor prioridad.
export function rankReviewWords(
  rows: ReviewMasteryRow[],
  now: number,
  opts: ReviewRankingOptions = REVIEW_RANKING_DEFAULTS,
): RankedReviewWord[] {
  const grouped = new Map<string, { correct: number; attempt: number; practicedAt: number; item: VocabItem }>()

  for (const row of rows) {
    const practicedAt = new Date(row.practicedAt).getTime()
    const existing = grouped.get(row.vocabId)
    if (existing) {
      existing.correct += row.correctCount
      existing.attempt += row.attemptCount
      if (practicedAt > existing.practicedAt) existing.practicedAt = practicedAt
    } else {
      grouped.set(row.vocabId, { correct: row.correctCount, attempt: row.attemptCount, practicedAt, item: row.item })
    }
  }

  const ranked: RankedReviewWord[] = []
  for (const g of grouped.values()) {
    const ratio = g.attempt > 0 ? g.correct / g.attempt : 0
    const weakness = 1 - ratio
    const days = Math.max(0, (now - g.practicedAt) / DAY_MS)
    if (weakness < opts.weakThreshold && days < opts.staleDays) continue
    const recency = Math.min(days / opts.recencySaturationDays, 1)
    const priority = opts.weightRecency * recency + opts.weightWeakness * weakness
    ranked.push({ item: g.item, priority })
  }

  ranked.sort((a, b) => b.priority - a.priority)
  return ranked
}
