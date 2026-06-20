import { GAME_REGISTRY } from '../kids/games/registry'

export type ExerciseComponentProps = {
  exerciseId: string
  childId: string
  onComplete: (score: number, failedItemIds: string[]) => void
}

// El catálogo de tipos de ejercicio = GAME_REGISTRY (fuente de verdad en código).
// La columna exercises.type es text; la validez se comprueba aquí, no en BD.
// Agregar un tipo nuevo = una línea en GAME_REGISTRY, cero migraciones.
export const EXERCISE_TYPES: string[] = GAME_REGISTRY.map(g => g.id)

export function isValidExerciseType(type: string): boolean {
  return GAME_REGISTRY.some(g => g.id === type)
}
