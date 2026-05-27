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
    `Return JSON: {"vocabularyItems":[{"text_en":"apple","text_es":"manzana","type":"word","min_age":4,"emoji_unicode":"1f34e"}]}. ` +
    `type: "word" or "phrase". min_age: 4 (simple) or 6 (complex). ` +
    `emoji_unicode: the hex Unicode codepoint of the most representative emoji for the word (e.g. "1f34e" for apple, "1f431" for cat). Use only simple single-codepoint codes, no ZWJ sequences.`
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
    `"lessons":[{"title_en":"Farm Animals","title_es":"Animales de granja","vocab":[{"text_en":"cow","text_es":"vaca","type":"word","min_age":4,"emoji_unicode":"1f404"}]}]}\n` +
    `Rules: type "word" for single words, "phrase" for multi-word. ` +
    `min_age 4 for easy (4-5y), 6 for harder (6-7y). description_es: one sentence in Spanish. ` +
    `emoji_unicode: hex Unicode codepoint of the best matching emoji (e.g. "1f404" for cow). Single codepoint only, no ZWJ.`
  )
}
