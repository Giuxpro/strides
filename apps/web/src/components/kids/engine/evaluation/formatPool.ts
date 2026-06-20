import type { ComponentType } from 'react'
import { ChoiceQuestion } from './formats/ChoiceQuestion'
import { SpellQuestion } from './formats/SpellQuestion'
import { SpeakQuestion } from './formats/SpeakQuestion'
import { YesNoQuestion } from './formats/YesNoQuestion'
import { WordChoiceQuestion } from './formats/WordChoiceQuestion'
import { MissingLetter, FirstSound } from './formats/LetterPickQuestion'
import { CompleteSentenceQuestion } from './formats/CompleteSentenceQuestion'
import type { EvalFormatProps } from './types'

// Mapea id de formato → componente, igual que gamePool para los juegos.
const FORMAT_COMPONENTS: Record<string, ComponentType<EvalFormatProps>> = {
  'image-choice':     ChoiceQuestion,
  'audio-choice':     ChoiceQuestion,
  'sentence-choose':  ChoiceQuestion,
  'yes-no':           YesNoQuestion,
  'word-choice':      WordChoiceQuestion,
  speak:              SpeakQuestion,
  'say-sentence':     SpeakQuestion,
  'complete-sentence': CompleteSentenceQuestion,
  spell:              SpellQuestion,
  'missing-letter':   MissingLetter,
  'first-sound':      FirstSound,
}

export function getEvalFormatComponent(id: string): ComponentType<EvalFormatProps> | undefined {
  return FORMAT_COMPONENTS[id]
}
