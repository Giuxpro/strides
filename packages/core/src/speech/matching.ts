// Verificación única de pronunciación. Fuente de verdad compartida por TODOS los
// proveedores de reconocimiento de voz (Web Speech en cliente, Whisper de OpenAI y
// Groq en servidor): el transcript entra aquí, se compara con lo esperado y sale el
// veredicto. Un solo procesador — no una copia por proveedor.

export function normalizeSpeech(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = i
    for (let j = 1; j <= b.length; j++) {
      const curr = a[i - 1] === b[j - 1]
        ? dp[j - 1]!
        : 1 + Math.min(dp[j]!, dp[j - 1]!, prev)
      dp[j - 1] = prev
      prev = curr
    }
    dp[b.length] = prev
  }
  return dp[b.length]!
}

export function isSpeechMatch(transcript: string, expected: string): boolean {
  const heard  = normalizeSpeech(transcript)
  const target = normalizeSpeech(expected)
  if (!heard) return false
  if (heard === target) return true

  // Tolerar plurales simples: "cats" ↔ "cat"
  const heardDeplural  = heard.endsWith('s')  ? heard.slice(0, -1)  : null
  const targetDeplural = target.endsWith('s') ? target.slice(0, -1) : null
  if (heardDeplural  === target)  return true
  if (targetDeplural === heard)   return true

  for (const word of heard.split(/\s+/)) {
    if (word === target) return true
    if (word.endsWith('s') && word.slice(0, -1) === target) return true
    if (targetDeplural && word === targetDeplural) return true

    // Levenshtein: 1 edición para ≥4 chars, 2 para ≥8 chars
    const maxEdits = target.length >= 8 ? 2 : target.length >= 4 ? 1 : 0
    if (maxEdits > 0 && levenshtein(word, target) <= maxEdits) return true
  }
  return false
}
