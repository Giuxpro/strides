// Estado serializable de cada formato: lo aleatorio que dibujó + la respuesta
// literal del niño. Se guarda en child_evaluation_attempts.detail y permite
// re-renderizar el examen en modo lectura exactamente como quedó.
//
// Convención: los campos de "answer" admiten null = pregunta sin responder
// (cuenta como incorrecta, se muestra sin selección en el replay).

export type ChoiceSnapshot = {
  kind: 'choice'
  stimulus: 'audio' | 'sentence'
  optionIds: string[]
  pickedId: string | null
}

export type YesNoSnapshot = {
  kind: 'yesno'
  isMatch: boolean
  shownWordId: string
  showText: boolean
  saidYes: boolean | null
}

export type WordChoiceSnapshot = {
  kind: 'wordchoice'
  optionIds: string[]
  pickedId: string | null
}

export type SpellSnapshot = {
  kind: 'spell'
  tiles: string[]
  // Índices de `tiles` colocados en orden en las casillas (parcial si no terminó).
  placedTileIdxs: number[]
}

export type LetterPickSnapshot = {
  kind: 'letterpick'
  mode: 'missing' | 'first'
  blankIdx: number
  options: string[]
  target: string
  picked: string | null
}

export type CompleteSnapshot = {
  kind: 'complete'
  optionIds: string[]
  pickedId: string | null
}

export type OrderSnapshot = {
  kind: 'order'
  tiles: { w: string; i: number }[]
  // Posiciones de `tiles` colocadas en orden en las casillas (parcial si no terminó).
  placedTilePos: number[]
}

export type DragSnapshot = {
  kind: 'drag'
  tileIds: string[]
  droppedId: string | null
}

export type SpeakSnapshot = {
  kind: 'speak'
  result: 'correct' | 'wrong' | null
}

export type EvalSnapshot =
  | ChoiceSnapshot
  | YesNoSnapshot
  | WordChoiceSnapshot
  | SpellSnapshot
  | LetterPickSnapshot
  | CompleteSnapshot
  | OrderSnapshot
  | DragSnapshot
  | SpeakSnapshot
