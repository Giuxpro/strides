import type { VocabItem } from '../types'
import { EVAL_FORMAT_REGISTRY, getEvalFormat, type EvalFormatMeta, type EvalSkill } from './formats'

// Una estructura colocada a mano: un formato con su palabra objetivo asignada.
export interface EvalManualItem {
  formatId: string
  vocabId: string
}

// Config que vive en lesson_steps.config cuando step_type === 'evaluation'.
// El vocab se guarda aquí (no en tabla aparte); el runtime filtra ids colgados.
export interface EvaluationConfig {
  intro?: string
  timerEnabled: boolean
  timerSeconds?: number
  // 'auto': estructuras y palabras se eligen al azar del pool. 'manual': el admin
  // ordena cada estructura y le asigna su palabra (`items`).
  mode: 'auto' | 'manual'
  // ── auto ──
  receptiveCount: number
  productiveCount: number
  // Subconjunto de formatos a usar; si está vacío/ausente → todos los habilitados.
  formats?: string[]
  // ── manual ──
  // Lista ordenada de estructuras tal cual las verá el niño.
  items?: EvalManualItem[]
  vocabIds: string[]
}

export const DEFAULT_EVALUATION_CONFIG: EvaluationConfig = {
  mode: 'auto',
  timerEnabled: false,
  receptiveCount: 3,
  productiveCount: 3,
  vocabIds: [],
}

// Un ítem concreto a resolver en la evaluación: una palabra bajo un formato.
export interface EvalItem {
  vocab: VocabItem
  formatId: string
  skill: EvalSkill
}

// Formatos usables por habilidad, cruzando: construido (implemented) ∧ encendido
// en BD ∧ apto para la edad ∧ (si config.formats está, incluido en él).
export function resolveEvalFormats(opts: {
  config: EvaluationConfig
  enabled: Record<string, boolean>
  childAge: number
}): { receptive: EvalFormatMeta[]; productive: EvalFormatMeta[] } {
  const { config, enabled, childAge } = opts
  const usable = EVAL_FORMAT_REGISTRY.filter(f =>
    f.implemented &&
    enabled[f.id] !== false &&
    f.minAge <= childAge &&
    (!config.formats?.length || config.formats.includes(f.id))
  )
  return {
    receptive:  usable.filter(f => f.skill === 'receptive'),
    productive: usable.filter(f => f.skill === 'productive'),
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

// Asigna un formato (rotando los barajados) a cada palabra ya elegida.
function itemsFromWords(
  words: VocabItem[],
  formats: EvalFormatMeta[],
  skill: EvalSkill,
): EvalItem[] {
  if (formats.length === 0 || words.length === 0) return []
  const fmts = shuffle(formats)
  return words.map((vocab, idx) => ({ vocab, formatId: fmts[idx % fmts.length]!.id, skill }))
}

// Intercala dos listas alternando una de cada.
function interleave(a: EvalItem[], b: EvalItem[]): EvalItem[] {
  const res: EvalItem[] = []
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    if (i < a.length) res.push(a[i]!)
    if (i < b.length) res.push(b[i]!)
  }
  return res
}

// Regla de oro: dos ítems consecutivos nunca usan el mismo formato.
function breakConsecutiveFormats(items: EvalItem[]): EvalItem[] {
  const arr = [...items]
  for (let k = 1; k < arr.length; k++) {
    if (arr[k]!.formatId === arr[k - 1]!.formatId) {
      const swap = arr.findIndex((it, idx) => idx > k && it.formatId !== arr[k - 1]!.formatId)
      if (swap !== -1) { const t = arr[k]!; arr[k] = arr[swap]!; arr[swap] = t }
    }
  }
  return arr
}

// Modo manual: respeta el orden y la palabra que eligió el admin. Solo descarta
// estructuras apagadas globalmente, no construidas, o cuya palabra ya no existe.
function buildManualItems(opts: {
  vocab: VocabItem[]
  config: EvaluationConfig
  enabled: Record<string, boolean>
}): EvalItem[] {
  const { vocab, config, enabled } = opts
  const byId = new Map(vocab.map(v => [v.id, v]))
  const out: EvalItem[] = []
  for (const it of config.items ?? []) {
    const meta = getEvalFormat(it.formatId)
    const v = byId.get(it.vocabId)
    if (!v || !meta || !meta.implemented || enabled[meta.id] === false) continue
    out.push({ vocab: v, formatId: meta.id, skill: meta.skill })
  }
  return out
}

// Genera los ítems INTERCALADOS (receptivo/productivo alternados) y sin repetir
// formato en posiciones consecutivas → no se siente como bloques de mini-juegos.
// Las palabras NO se repiten entre estructuras (se reparten de un pool barajado).
export function buildEvalItems(opts: {
  vocab: VocabItem[]
  config: EvaluationConfig
  enabled: Record<string, boolean>
  childAge: number
}): EvalItem[] {
  const { vocab, config, enabled, childAge } = opts
  if (config.mode === 'manual') return buildManualItems({ vocab, config, enabled })

  const { receptive, productive } = resolveEvalFormats({ config, enabled, childAge })
  const pool = shuffle(vocab)
  const recWords  = pool.slice(0, config.receptiveCount)
  const prodWords = pool.slice(config.receptiveCount, config.receptiveCount + config.productiveCount)
  const rec  = itemsFromWords(recWords,  receptive,  'receptive')
  const prod = itemsFromWords(prodWords, productive, 'productive')
  return breakConsecutiveFormats(interleave(rec, prod))
}
