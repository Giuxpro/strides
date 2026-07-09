import { type NextRequest, NextResponse } from 'next/server'
import { evaluateSpeech } from '@strides/core/ai'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSetting, logAIUsage } from '@strides/db'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    const expected = formData.get('expected')
    const durationMs = Number(formData.get('duration_ms') ?? 0) || 0

    if (!(audio instanceof File) || typeof expected !== 'string' || !expected) {
      return NextResponse.json(
        { error: `audio (File) y expected (string) son requeridos. Recibido: audio=${audio?.constructor?.name}, expected=${String(expected)}` },
        { status: 400 },
      )
    }

    const admin = createAdminClient()
    const { data: providerRow } = await getSetting(admin, 'speech_provider')
    const useGroq = providerRow?.value === 'groq-whisper'

    const { transcript, correct, noSpeech, lowConfidence } = await evaluateSpeech(
      audio,
      expected,
      useGroq ? 'groq' : 'openai',
    )

    void logAIUsage(admin, {
      provider: useGroq ? 'groq' : 'openai',
      model: useGroq ? 'whisper-large-v3' : 'whisper-1',
      inputTokens: 0,
      outputTokens: 0,
      durationMs,
    })

    return NextResponse.json({ transcript, correct, noSpeech, lowConfidence })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[speech/evaluate]', message)
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
