import type { VocabItem } from '../types'
import { GAME_REGISTRY } from '../games/registry'
import { REVIEW_SESSION_SIZE } from './ranking'

// Una sesión de refuerzo encadena varios juegos distintos sobre el mismo set de
// palabras (repetición espaciada multiformato). Solo se rotan juegos que
// refuerzan vocabulario — los de rol 'literacy' enseñan letras/fonética, no la
// palabra, así que quedan fuera.

export const REVIEW_ROUNDS = 3

export interface ReviewSessionStep {
  gameId: string
  items: VocabItem[]
}

// PRNG determinista (mismo LCG que los retos) — barajar juegos sin repetición
// dentro de la sesión, variando entre sesiones según el seed.
function seededNext(s: number): number {
  let x = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) | 0)
  x = (Math.imul(x ^ (x >>> 16), 0x45d9f3b) | 0)
  return (x ^ (x >>> 16)) >>> 0
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = seededNext(seed + i) % (i + 1)
    const tmp = out[i]!; out[i] = out[j]!; out[j] = tmp
  }
  return out
}

export function buildReviewSession(
  words: VocabItem[],
  activeGameIds: string[],
  seed: number,
  opts?: { rounds?: number; sessionSize?: number },
): ReviewSessionStep[] {
  const rounds = opts?.rounds ?? REVIEW_ROUNDS
  const sessionSize = opts?.sessionSize ?? REVIEW_SESSION_SIZE
  const pool = words.slice(0, sessionSize)
  if (pool.length === 0) return []

  const active = new Set(activeGameIds)
  const candidates = GAME_REGISTRY.filter(
    (g) => g.role !== 'literacy' && active.has(g.id) && g.minItems <= pool.length,
  )
  if (candidates.length === 0) return []

  const chosen = shuffle(candidates, seed).slice(0, rounds)
  return chosen.map((g) => ({
    gameId: g.id,
    items: pool.slice(0, Math.min(pool.length, g.maxItems)),
  }))
}
