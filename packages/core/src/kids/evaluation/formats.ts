// Catálogo de formatos de la estructura Evaluación. Independiente de GAME_REGISTRY:
// cada formato es una micro-pregunta (una palabra/frase evaluada de una forma).
// Fuente de verdad en código; el on/off por formato vive en BD (settings).

export type EvalSkill = 'receptive' | 'productive'

export interface EvalFormatMeta {
  id: string
  skill: EvalSkill
  label: string
  description: string
  requiresReading: boolean
  minAge: number
  implemented: boolean
  defaultEnabled: boolean
}

export const EVAL_FORMAT_REGISTRY: EvalFormatMeta[] = [
  // ── Receptivos ──────────────────────────────────────────────────────────
  {
    id: 'audio-choice',
    skill: 'receptive',
    label: 'Escucha y elige',
    description: 'Escucha la palabra y elige la imagen correcta',
    requiresReading: false,
    minAge: 4,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'image-choice',
    skill: 'receptive',
    label: 'Mira y elige',
    description: 'Oye/ve la palabra y elige la imagen correcta',
    requiresReading: false,
    minAge: 4,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'sentence-choose',
    skill: 'receptive',
    label: 'Escucha la frase',
    description: 'Escucha una frase ("I see a cow") y elige la imagen',
    requiresReading: false,
    minAge: 4,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'yes-no',
    skill: 'receptive',
    label: 'Sí o no',
    description: '¿Esta imagen es la palabra? Responde sí o no',
    requiresReading: false,
    minAge: 4,
    implemented: true,
    defaultEnabled: false,
  },
  {
    id: 'word-choice',
    skill: 'receptive',
    label: 'Elige la palabra',
    description: 'Ve la imagen y elige la palabra escrita correcta',
    requiresReading: true,
    minAge: 6,
    implemented: true,
    defaultEnabled: false,
  },
  // ── Productivos ─────────────────────────────────────────────────────────
  {
    id: 'speak',
    skill: 'productive',
    label: 'Dilo',
    description: 'Ve la imagen y di la palabra en inglés',
    requiresReading: false,
    minAge: 4,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'complete-sentence',
    skill: 'productive',
    label: 'Completa la frase',
    description: 'Completa "I see a ___" eligiendo la palabra',
    requiresReading: true,
    minAge: 6,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'say-sentence',
    skill: 'productive',
    label: 'Di la frase',
    description: 'Di una frase corta ("It\'s a duck")',
    requiresReading: false,
    minAge: 6,
    implemented: true,
    defaultEnabled: false,
  },
  {
    id: 'spell',
    skill: 'productive',
    label: 'Arma la palabra',
    description: 'Construye la palabra letra por letra (bonus, ocasional)',
    requiresReading: true,
    minAge: 6,
    implemented: true,
    defaultEnabled: false,
  },
  {
    id: 'missing-letter',
    skill: 'productive',
    label: 'Letra que falta',
    description: 'Completa la letra que falta en la palabra',
    requiresReading: true,
    minAge: 6,
    implemented: true,
    defaultEnabled: false,
  },
  {
    id: 'first-sound',
    skill: 'productive',
    label: 'Sonido inicial',
    description: '¿Con qué letra empieza la palabra?',
    requiresReading: false,
    minAge: 6,
    implemented: true,
    defaultEnabled: false,
  },
]

export const DEFAULT_EVAL_FORMATS: Record<string, boolean> = Object.fromEntries(
  EVAL_FORMAT_REGISTRY.map(f => [f.id, f.defaultEnabled])
)

export function getEvalFormat(id: string): EvalFormatMeta | undefined {
  return EVAL_FORMAT_REGISTRY.find(f => f.id === id)
}

export function getEvalFormatsBySkill(skill: EvalSkill): EvalFormatMeta[] {
  return EVAL_FORMAT_REGISTRY.filter(f => f.skill === skill)
}
