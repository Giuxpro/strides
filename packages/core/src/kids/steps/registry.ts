// Catálogo de tipos de paso de una lección. Fuente de verdad en código:
// lesson_steps.step_type es text en BD, así que agregar un tipo nuevo = una línea
// aquí + su renderer en la UI, sin migración.

export interface StepKindMeta {
  id: string
  label: string
  emoji: string
}

export const STEP_REGISTRY: StepKindMeta[] = [
  { id: 'video',      label: 'Video',       emoji: '🎬' },
  { id: 'slide',      label: 'Diapositiva', emoji: '🖼️' },
  { id: 'exercise',   label: 'Ejercicio',   emoji: '🎮' },
  { id: 'evaluation', label: 'Evaluación',  emoji: '📝' },
]

export function getStepKind(id: string): StepKindMeta | undefined {
  return STEP_REGISTRY.find(s => s.id === id)
}
