import OpenAI from 'openai'
import { normalizeSpeech, isSpeechMatch } from '../speech/matching'

export type WhisperBackend = 'openai' | 'groq'

const WHISPER_MODEL: Record<WhisperBackend, string> = {
  openai: 'whisper-1',
  groq: 'whisper-large-v3',
}

let _openai: OpenAI | undefined
let _groq: OpenAI | undefined

function getClient(backend: WhisperBackend): OpenAI {
  if (backend === 'groq') {
    return (_groq ??= new OpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: process.env.GROQ_API_KEY }))
  }
  return (_openai ??= new OpenAI())
}

const WHISPER_HALLUCINATIONS = new Set([
  'i dont know', 'i dont know what', 'i dont know what to say',
  'thank you', 'thank you so much', 'thanks', 'thanks for watching',
  'um', 'uh', 'hmm', 'okay', 'ok', 'alright',
  'bye', 'goodbye', 'see you later', 'all right bye', 'all right',
  'please subscribe', 'like and subscribe',
  'subtitles by', 'captions by', 'subs by',
  'you', 'the', 'a', 'i',
  // Groq (Whisper v3) a veces filtra el prompt hacia la transcripción en silencio.
  'the word', 'word',
])

const HALLUCINATION_PREFIXES = ['subs by', 'subtitles by', 'captions by', 'www.', 'http']

// Groq (v3) a veces hace "eco" del prompt cuando el audio es marginal, p.ej.
// "...will say the word: shark". Se trata como noSpeech (reintento), no como error.
const PROMPT_ECHO_FRAGMENTS = ['say the word', 'will say', 'practicing english', 'transcribe only', 'what is spoken']

export async function evaluateSpeech(
  audio: File,
  expected: string,
  backend: WhisperBackend = 'openai',
): Promise<{ transcript: string; correct: boolean; noSpeech: boolean; lowConfidence: boolean }> {
  const raw = await getClient(backend).audio.transcriptions.create({
    file: audio,
    model: WHISPER_MODEL[backend],
    language: 'en',
    response_format: 'verbose_json',
    // temperature 0 = deterministic, reduce hallucinations in short audio
    temperature: 0,
    // El parámetro más impactante para palabras cortas: sin él "cat" → "cast/cut/at".
    // Sesga la decodificación hacia la palabra esperada. Ver docs/SPEECH_RECOGNITION.md §4.
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
  const normalizedTranscript = normalizeSpeech(transcript)

  const isHallucination =
    WHISPER_HALLUCINATIONS.has(normalizedTranscript) ||
    HALLUCINATION_PREFIXES.some(p => normalizedTranscript.includes(p)) ||
    PROMPT_ECHO_FRAGMENTS.some(p => normalizedTranscript.includes(p))

  if (isHallucination) {
    return { transcript: '', correct: false, noSpeech: true, lowConfidence: false }
  }

  const correct = isSpeechMatch(transcript, expected)
  return { transcript, correct, noSpeech: false, lowConfidence }
}
