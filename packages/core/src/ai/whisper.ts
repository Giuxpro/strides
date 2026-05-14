import OpenAI from 'openai'

let _client: OpenAI | undefined

// Lazy: el cliente se crea solo cuando se llama evaluateSpeech, no al importar el módulo.
// Esto evita que Next.js reviente en páginas que no usan Whisper si OPENAI_API_KEY no está definida.
function getClient(): OpenAI {
  return (_client ??= new OpenAI())
}

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')
}

function isSpeechMatch(transcript: string, expected: string): boolean {
  const heard = normalize(transcript)
  const target = normalize(expected)
  return heard === target || heard.split(/\s+/).includes(target)
}

export async function evaluateSpeech(
  audio: File,
  expected: string,
): Promise<{ transcript: string; correct: boolean; noSpeech: boolean; lowConfidence: boolean }> {
  // verbose_json gives us per-segment confidence (avg_logprob) and no_speech_prob
  const raw = await getClient().audio.transcriptions.create({
    file: audio,
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
    prompt: expected,
  }) as unknown as {
    text: string
    segments?: Array<{ avg_logprob: number; no_speech_prob: number }>
  }

  const segments = raw.segments ?? []

  // If any segment has high no_speech_prob, the mic likely caught noise
  const maxNoSpeech = segments.length > 0
    ? Math.max(...segments.map(s => s.no_speech_prob))
    : 0

  if (maxNoSpeech > 0.8) {
    return { transcript: '', correct: false, noSpeech: true, lowConfidence: false }
  }

  // avg_logprob: 0 = perfect, -2.5 ≈ very uncertain. Map to 0-100.
  const avgLogProb = segments.length > 0
    ? segments.reduce((s, seg) => s + seg.avg_logprob, 0) / segments.length
    : -1.5
  const confidence = Math.min(100, Math.max(0, Math.round((1 + avgLogProb / 2.5) * 100)))
  const lowConfidence = confidence < 35

  const transcript = raw.text.trim()
  const correct    = isSpeechMatch(transcript, expected)
  return { transcript, correct, noSpeech: false, lowConfidence }
}
