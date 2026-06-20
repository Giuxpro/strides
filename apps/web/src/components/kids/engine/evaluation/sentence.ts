// Plantillas de frase mínimas a partir de una palabra. Artículo a/an según vocal.
// Suficiente para vocabulario concreto singular (caso típico kids).

export function withArticle(word: string): string {
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`
}

export function seeSentence(word: string): string {
  return `I see ${withArticle(word)}.`
}

export function itsSentence(word: string): string {
  return `It's ${withArticle(word)}.`
}
