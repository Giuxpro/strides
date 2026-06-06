import OpenAI from 'openai'

let _client: OpenAI | undefined

function getClient(): OpenAI {
  return (_client ??= new OpenAI())
}

function normalize(text: string): string {
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

function isSpeechMatch(transcript: string, expected: string): boolean {
  const heard  = normalize(transcript)
  const target = normalize(expected)
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

const WHISPER_HALLUCINATIONS = new Set([
  'i dont know', 'i dont know what', 'i dont know what to say',
  'thank you', 'thank you so much', 'thanks', 'thanks for watching',
  'um', 'uh', 'hmm', 'okay', 'ok', 'alright',
  'bye', 'goodbye', 'see you later', 'all right bye', 'all right',
  'please subscribe', 'like and subscribe',
  'subtitles by', 'captions by', 'subs by',
  'you', 'the', 'a', 'i',
])

const HALLUCINATION_PREFIXES = ['subs by', 'subtitles by', 'captions by', 'www.', 'http']

export async function evaluateSpeech(
  audio: File,
  expected: string,
): Promise<{ transcript: string; correct: boolean; noSpeech: boolean; lowConfidence: boolean }> {
  const raw = await getClient().audio.transcriptions.create({
    file: audio,
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
    // temperature 0 = deterministic, reduce hallucinations in short audio
    temperature: 0,
    // prompt guides Whisper toward the expected word — clave para palabras cortas
    prompt: `The student is practicing English pronunciation. They will say the word: "${expected}". Transcribe only what is spoken.`,
  }) as unknown as {
    text: string
    segments?: Array<{ avg_logprob: number; no_speech_prob: number }>
  }

  const segments = raw.segments ?? []

  const maxNoSpeech = segments.length > 0
    ? Math.max(...segments.map(s => s.no_speech_prob))
    : 0

  // Threshold bajado a 0.7 — más sensible a silencio real
  if (maxNoSpeech > 0.7) {
    return { transcript: '', correct: false, noSpeech: true, lowConfidence: false }
  }

  const avgLogProb = segments.length > 0
    ? segments.reduce((s, seg) => s + seg.avg_logprob, 0) / segments.length
    : -1.5
  const confidence = Math.min(100, Math.max(0, Math.round((1 + avgLogProb / 2.5) * 100)))
  const lowConfidence = confidence < 35

  const transcript = raw.text.trim()
  const normalizedTranscript = normalize(transcript)

  const isHallucination =
    WHISPER_HALLUCINATIONS.has(normalizedTranscript) ||
    HALLUCINATION_PREFIXES.some(p => normalizedTranscript.includes(p))

  if (isHallucination) {
    return { transcript: '', correct: false, noSpeech: true, lowConfidence: false }
  }

  const correct = isSpeechMatch(transcript, expected)
  return { transcript, correct, noSpeech: false, lowConfidence }
}
