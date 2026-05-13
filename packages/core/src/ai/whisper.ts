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
): Promise<{ transcript: string; correct: boolean }> {
  const transcription = await getClient().audio.transcriptions.create({
    file: audio,
    model: 'whisper-1',
    language: 'en',
  })

  const transcript = transcription.text.trim()
  return { transcript, correct: isSpeechMatch(transcript, expected) }
}
