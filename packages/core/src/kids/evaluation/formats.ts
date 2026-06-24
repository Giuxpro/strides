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
    description: 'Escucha la palabra o una frase y elige la imagen (el estímulo varía cada vez)',
    requiresReading: false,
    minAge: 4,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'yes-no',
    skill: 'receptive',
    label: 'Desliza sí o no',
    description: '¿La imagen es la palabra? Desliza la tarjeta: derecha sí, izquierda no',
    requiresReading: false,
    minAge: 4,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'word-choice',
    skill: 'receptive',
    label: 'Elige la palabra',
    description: 'Ve la imagen y elige la palabra escrita correcta',
    requiresReading: true,
    minAge: 6,
    implemented: true,
    defaultEnabled: true,
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
    id: 'order-sentence',
    skill: 'productive',
    label: 'Ordena la oración',
    description: 'Arrastra los bloques para formar la frase en inglés (la pista está en español)',
    requiresReading: true,
    minAge: 6,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'match-word',
    skill: 'productive',
    label: 'Une palabra e imagen',
    description: 'Arrastra la palabra en inglés hasta su imagen',
    requiresReading: true,
    minAge: 6,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'spell-image',
    skill: 'productive',
    label: 'Arma la palabra (imagen)',
    description: 'Ves la imagen y pulsas las letras para construir la palabra en inglés',
    requiresReading: true,
    minAge: 6,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'spell-es',
    skill: 'productive',
    label: 'Arma la palabra (traduce)',
    description: 'Ves la palabra en español y construyes la palabra en inglés con las letras',
    requiresReading: true,
    minAge: 6,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'spell-audio',
    skill: 'productive',
    label: 'Arma la palabra (escucha)',
    description: 'Escuchas la palabra y la construyes en inglés letra por letra',
    requiresReading: true,
    minAge: 6,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'missing-letter',
    skill: 'productive',
    label: 'Letra que falta',
    description: 'Completa la letra que falta en la palabra',
    requiresReading: true,
    minAge: 6,
    implemented: true,
    defaultEnabled: true,
  },
  {
    id: 'first-sound',
    skill: 'productive',
    label: 'Sonido inicial',
    description: '¿Con qué letra empieza la palabra?',
    requiresReading: false,
    minAge: 6,
    implemented: true,
    defaultEnabled: true,
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
