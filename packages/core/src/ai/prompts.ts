import type { GenerateContentParams, GenerateModuleParams } from './provider.interface'

const SYSTEM_PROMPT =
  'You are an educational content creator for a children\'s English learning app. ' +
  'Always respond with valid JSON only, no markdown, no explanation.'

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT
}

export function buildVocabPrompt(p: GenerateContentParams): string {
  const exclusion = p.existingVocab?.length
    ? `These words already exist — do NOT include them: ${p.existingVocab.join(', ')}. `
    : ''
  return (
    `Generate exactly ${p.wordCount} English vocabulary items for the topic "${p.topic}" ` +
    `for children aged ${p.ageRange}. ` +
    exclusion +
    (p.style ? `Style: ${p.style}. ` : '') +
    `Return JSON: {"vocabularyItems":[{"text_en":"apple","text_es":"manzana","type":"word","min_age":4,"emoji":"🍎"}]}. ` +
    `type: "word" or "phrase". min_age: 4 (simple) or 6 (complex). ` +
    `emoji: the single most representative emoji character for the word (e.g. "🍎" for apple, "🐱" for cat). One emoji only, no text.`
  )
}

export function buildModulePrompt(p: GenerateModuleParams): string {
  const exclusion = p.existingVocab?.length
    ? `These words already exist in this module — do NOT include them: ${p.existingVocab.join(', ')}. `
    : ''
  return (
    `Generate a complete English learning module for children aged ${p.ageRange} about "${p.topic}". ` +
    `Create exactly ${p.lessonCount} lessons, each with exactly ${p.vocabPerLesson} vocabulary items. ` +
    exclusion +
    (p.style ? `Style: ${p.style}. ` : '') +
    `Return JSON only:\n` +
    `{"module":{"title_en":"Animals","title_es":"Animales","description_es":"Aprende los animales en inglés"},` +
    `"lessons":[{"title_en":"Farm Animals","title_es":"Animales de granja","vocab":[{"text_en":"cow","text_es":"vaca","type":"word","min_age":4,"emoji":"🐄"}]}]}\n` +
    `Rules: type "word" for single words, "phrase" for multi-word. ` +
    `min_age 4 for easy (4-5y), 6 for harder (6-7y). description_es: one sentence in Spanish. ` +
    `emoji: the single best matching emoji character (e.g. "🐄" for cow). One emoji only, no text.`
  )
}
