import type { ExerciseType } from '@strides/db'

export type ExerciseComponentProps = {
  exerciseId: string
  childId: string
  onComplete: (score: number, failedItemIds: string[]) => void
}

// Registry pattern: agregar nuevo tipo = una línea aquí, cero cambios en el motor
// Los componentes se importan en la capa de UI (apps/web), no aquí
export const EXERCISE_TYPES: ExerciseType[] = ['memory', 'recognition', 'speaking']

export function isValidExerciseType(type: string): type is ExerciseType {
  return EXERCISE_TYPES.includes(type as ExerciseType)
}
