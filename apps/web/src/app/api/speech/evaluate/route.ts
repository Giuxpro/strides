import { type NextRequest, NextResponse } from 'next/server'
import { evaluateSpeech } from '@strides/core/ai'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    const expected = formData.get('expected')

    console.log('[speech/evaluate] audio type:', audio?.constructor?.name, '| expected:', expected)

    if (!(audio instanceof File) || typeof expected !== 'string' || !expected) {
      return NextResponse.json(
        { error: `audio (File) y expected (string) son requeridos. Recibido: audio=${audio?.constructor?.name}, expected=${String(expected)}` },
        { status: 400 },
      )
    }

    const result = await evaluateSpeech(audio, expected)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[speech/evaluate]', message)
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
