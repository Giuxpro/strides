import type { EvalItem, ModuleConfig, VocabItem } from '@strides/core/kids'

// Un renderer de formato dibuja UNA pregunta (una palabra) y, al responder, llama
// onAnswer(correct) una sola vez. La cáscara de evaluación pone el header, timer,
// progreso y el avance entre ítems.
export interface EvalFormatProps {
  item: EvalItem
  allVocab: VocabItem[]
  moduleConfig: ModuleConfig
  onAnswer: (correct: boolean) => void
  // En el examen continuo todas las tarjetas montan a la vez; solo la tarjeta en
  // foco reproduce su audio (las demás esperan a su turno). Por defecto true.
  autoPlay?: boolean
}
