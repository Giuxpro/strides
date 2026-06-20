import type { GameRole } from './games/registry'

// Receta canónica de una lección kids (4–7), basada en PPP (Presentar → Practicar
// → Producir) sobre input comprensible y liberación gradual.
//
// La receta GUÍA, no obliga: el admin puede usar la plantilla (scaffold) y luego
// editar/añadir/quitar pasos libremente, o construir la lección desde cero.
// El cierre (pantalla de resultados + estrellas) lo aporta el motor, no es un paso.

export type RecipeStepType = 'video' | 'slide' | 'exercise' | 'evaluation'
export type ExercisePhase = 'practice' | 'evaluation'

export interface RecipeSection {
  id: string
  label: string
  // El "por qué" pedagógico — se muestra como ayuda en el admin.
  rationale: string
  stepType: RecipeStepType
  required: boolean
  // Solo para stepType 'exercise':
  phase?: ExercisePhase
  // Rol de juego que corresponde a esta sección (filtra el selector del admin).
  role?: GameRole
  // Juego sugerido por defecto al generar la plantilla.
  defaultGameId?: string
  // Si true, la plantilla genera un paso por cada palabra del vocab de la lección.
  perVocabItem?: boolean
}

export const LESSON_RECIPE: RecipeSection[] = [
  {
    id: 'warmup',
    label: 'Calentamiento',
    rationale: 'Activa y contextualiza el tema. El personaje presenta la lección.',
    stepType: 'video',
    required: false,
  },
  {
    id: 'present',
    label: 'Presentación',
    rationale: 'Input comprensible: cada palabra con imagen + audio + texto. Una slide por palabra.',
    stepType: 'slide',
    required: true,
    perVocabItem: true,
  },
  {
    id: 'practice-receptive',
    label: 'Práctica: reconocer',
    rationale: 'Reconocer antes de producir. Juego receptivo, sin nota.',
    stepType: 'exercise',
    required: true,
    phase: 'practice',
    role: 'receptive',
    defaultGameId: 'recognition',
  },
  {
    id: 'practice-productive',
    label: 'Práctica: producir',
    rationale: 'Producir la palabra (deletreo / habla). Juego productivo, sin nota.',
    stepType: 'exercise',
    required: true,
    phase: 'practice',
    role: 'productive',
    defaultGameId: 'spelling',
  },
  {
    id: 'evaluation',
    label: 'Evaluación',
    rationale: 'Mide lo aprendido (esta es la parte que puntúa). Reconoce y produce el vocabulario de la lección en formatos variados, agrupados por habilidad.',
    stepType: 'evaluation',
    required: true,
  },
]
