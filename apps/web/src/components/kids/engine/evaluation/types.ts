import type { EvalItem, ModuleConfig, VocabItem } from '@strides/core/kids'
import type { EvalSnapshot } from './snapshots'

// Un renderer de formato dibuja UNA pregunta (una palabra) y, al responder, llama
// onAnswer(correct, snapshot) una sola vez. La cáscara de evaluación pone el header,
// timer, progreso y el avance entre ítems.
export interface EvalFormatProps {
  item: EvalItem
  allVocab: VocabItem[]
  moduleConfig: ModuleConfig
  // Al responder: si acertó + el snapshot con el layout aleatorio y la respuesta.
  onAnswer: (correct: boolean, snapshot: EvalSnapshot) => void
  // En el examen continuo todas las tarjetas montan a la vez; solo la tarjeta en
  // foco reproduce su audio (las demás esperan a su turno). Por defecto true.
  autoPlay?: boolean
  // Reporta el layout aleatorio recién montado (respuesta aún vacía), para poder
  // re-renderizar incluso las preguntas que el niño deje sin responder.
  onSnapshot?: (snapshot: EvalSnapshot) => void
  // Si viene, el formato se dibuja en modo lectura desde este snapshot (replay),
  // sin interacción y sin audio automático.
  review?: EvalSnapshot
}
