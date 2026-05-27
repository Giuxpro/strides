export type VocabItem = {
  id: string
  text_en: string
  text_es: string
  image_url: string | null
  emoji_unicode: string | null
  audio_url: string | null
}

export type ExerciseData = {
  id: string
  type: string
  phase: 'practice' | 'evaluation'
  order: number
  items: VocabItem[]
}
