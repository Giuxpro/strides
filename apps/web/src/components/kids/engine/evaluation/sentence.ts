// Plantillas de frase mínimas a partir de una palabra. Artículo a/an según vocal.
// Suficiente para vocabulario concreto singular (caso típico kids).

export function withArticle(word: string): string {
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`
}

export function seeSentence(word: string): string {
  return `I see ${withArticle(word)}.`
}

// Artículo indefinido español por heurística: termina en -a → "una", si no "un".
// Acierta el grueso del vocab concreto infantil; excepciones (la flor, la mano)
// son minoría y se afinarían con género en BD si hiciera falta.
export function withArticleEs(wordEs: string): string {
  return /a$/i.test(wordEs.trim()) ? `una ${wordEs}` : `un ${wordEs}`
}

// Glosa en español de seeSentence, como pista de significado ("Veo un pato").
export function seeSentenceEs(wordEs: string): string {
  return `Veo ${withArticleEs(wordEs)}.`
}
