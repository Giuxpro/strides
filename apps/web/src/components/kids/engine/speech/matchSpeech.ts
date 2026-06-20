// Helpers de comparación de voz (compartidos por la evaluación speak y, a futuro,
// el juego de pronunciación). Tolera diferencias menores con Levenshtein.

export function normalizeSpeech(t: string): string {
  return t.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')
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
  const heard = normalizeSpeech(transcript)
  const target = normalizeSpeech(expected)
  if (!heard) return false
  if (heard === target) return true
  for (const word of heard.split(/\s+/)) {
    if (word === target) return true
    if (target.length >= 6 && levenshtein(word, target) <= 1) return true
  }
  return false
}

interface SpeechAlt { transcript: string }
interface SpeechResult extends ArrayLike<SpeechAlt> { isFinal: boolean }
interface SpeechEvent { results: ArrayLike<SpeechResult> }
export interface RecognitionInstance {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number
  onresult: ((e: SpeechEvent) => void) | null
  onnomatch: ((e: SpeechEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void; stop(): void; abort(): void
}
type RecognitionCtor = new () => RecognitionInstance

export function getSpeechRecognition(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type { SpeechEvent }
