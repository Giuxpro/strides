'use client'

import { useRef, useState, useEffect } from 'react'
import { useSpeechProvider } from '../SpeechConfigContext'
import { getSpeechRecognition, isSpeechMatch, type RecognitionInstance, type SpeechEvent } from './matchSpeech'

export type SpeechAttemptState =
  | 'idle' | 'listening' | 'recording' | 'processing' | 'no-speech' | 'unsupported'

// Base compartida de reconocimiento de voz para el cliente. Respeta el provider
// (Whisper graba+VAD+POST /api/speech/evaluate; Web Speech usa la API del navegador
// primando el permiso de micro). Un intento por `start(expected)`; el resultado
// llega por onResult. Reutilizable por la evaluación y por cualquier juego de speaking.
export function useSpeechAttempt(opts: {
  onResult: (r: { correct: boolean; heard: string | null; lowConfidence: boolean }) => void
}) {
  const provider = useSpeechProvider()
  const [state, setState] = useState<SpeechAttemptState>('idle')
  const volumeRef = useRef<HTMLDivElement | null>(null)

  const recRef      = useRef<RecognitionInstance | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const vadRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onResultRef = useRef(opts.onResult)
  onResultRef.current = opts.onResult

  function cleanup() {
    try { recRef.current?.abort() } catch { /* ignore */ }
    try { recorderRef.current?.stop() } catch { /* ignore */ }
    if (vadRef.current) clearInterval(vadRef.current)
    if (maxRef.current) clearTimeout(maxRef.current)
    audioCtxRef.current?.close().catch(() => {})
  }

  useEffect(() => {
    if (provider === 'web-speech' && !getSpeechRecognition()) setState('unsupported')
    return cleanup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function noSpeech() {
    setState('no-speech')
    setTimeout(() => setState(prev => (prev === 'no-speech' ? 'idle' : prev)), 1400)
  }

  // ── Web Speech (prima el permiso de micro antes de start) ──────────────────
  function startWeb(expected: string) {
    const Ctor = getSpeechRecognition()
    if (!Ctor) { setState('unsupported'); return }
    setState('listening')
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop())
        const rec = new Ctor()
        rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 3
        recRef.current = rec
        let handled = false
        rec.onresult = (e: SpeechEvent) => {
          handled = true
          const result = e.results[0]
          let transcript = result?.[0]?.transcript ?? ''
          for (let j = 1; result && j < result.length; j++) {
            const alt = result[j]?.transcript ?? ''
            if (isSpeechMatch(alt, expected)) { transcript = alt; break }
          }
          setState('idle')
          onResultRef.current({ correct: isSpeechMatch(transcript, expected), heard: transcript, lowConfidence: false })
        }
        rec.onnomatch = () => { handled = true; setState('idle'); onResultRef.current({ correct: false, heard: null, lowConfidence: false }) }
        rec.onerror = (ev: { error: string }) => {
          if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') setState('unsupported')
          else if (ev.error === 'no-speech') noSpeech()
          else setState('idle')
        }
        rec.onend = () => { if (!handled) setState(prev => (prev === 'listening' ? 'idle' : prev)) }
        try { rec.start() } catch { setState('idle') }
      })
      .catch(() => setState('unsupported'))
  }

  // ── Whisper (graba + VAD + POST) ──────────────────────────────────────────
  async function startWhisper(expected: string) {
    setState('recording')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
    } catch { setState('unsupported'); return }

    const chunks: Blob[] = []
    const startedAt = Date.now()
    let speechDetected = false
    let speechEndedAt = 0
    let vadWorking = false
    const SPEECH_RMS = 0.012, SILENCE_AFTER = 380, NO_SPEECH_MAX = 3500, MIN_AFTER = 250, HARD_MAX = 6000

    function stopVAD() {
      if (vadRef.current) { clearInterval(vadRef.current); vadRef.current = null }
      audioCtxRef.current?.close().catch(() => {}); audioCtxRef.current = null
      if (volumeRef.current) volumeRef.current.style.width = '0%'
    }
    function stopRecording() {
      if (maxRef.current) { clearTimeout(maxRef.current); maxRef.current = null }
      stopVAD()
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    }

    try {
      const AudioCtxCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioCtxCtor) {
        const ctx = new AudioCtxCtor(); audioCtxRef.current = ctx
        const analyser = ctx.createAnalyser(); analyser.fftSize = 256
        ctx.createMediaStreamSource(stream).connect(analyser)
        const data = new Uint8Array(analyser.fftSize)
        vadWorking = true
        vadRef.current = setInterval(() => {
          if (recorderRef.current?.state !== 'recording') { stopVAD(); return }
          analyser.getByteTimeDomainData(data)
          let sum = 0
          for (const s of data) { const n = (s - 128) / 128; sum += n * n }
          const rms = Math.sqrt(sum / data.length)
          if (volumeRef.current) volumeRef.current.style.width = `${Math.min(100, rms * 6000)}%`
          const elapsed = Date.now() - startedAt
          if (rms > SPEECH_RMS) { speechDetected = true; speechEndedAt = 0 }
          else if (speechDetected) {
            if (speechEndedAt === 0) speechEndedAt = Date.now()
            const silence = Date.now() - speechEndedAt
            const recordedAfter = elapsed - (speechEndedAt - startedAt)
            if (silence > SILENCE_AFTER && recordedAfter > MIN_AFTER) stopRecording()
          } else if (elapsed > NO_SPEECH_MAX) stopRecording()
        }, 50)
      }
    } catch { /* sin AudioContext → hard max */ }

    maxRef.current = setTimeout(stopRecording, HARD_MAX)

    const recorder = new MediaRecorder(stream)
    recorderRef.current = recorder
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = async () => {
      stopVAD()
      stream.getTracks().forEach(t => t.stop())
      if (vadWorking && !speechDetected) { noSpeech(); return }
      const durationMs = Date.now() - startedAt
      setState('processing')
      const blob = new Blob(chunks, { type: recorder.mimeType })
      const ext  = recorder.mimeType.includes('ogg') ? 'audio.ogg' : 'audio.webm'
      const body = new FormData()
      body.append('audio', new File([blob], ext, { type: blob.type }))
      body.append('expected', expected)
      body.append('duration_ms', String(durationMs))
      try {
        const res = await fetch('/api/speech/evaluate', { method: 'POST', body })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const d = await res.json() as { transcript: string; correct: boolean; noSpeech: boolean; lowConfidence: boolean }
        if (d.noSpeech) { noSpeech(); return }
        setState('idle')
        onResultRef.current({ correct: d.correct, heard: d.transcript, lowConfidence: d.lowConfidence })
      } catch { setState('idle') }
    }
    recorder.start()
  }

  function start(expected: string) {
    if (state !== 'idle' && state !== 'no-speech') return
    if (provider === 'whisper') void startWhisper(expected)
    else startWeb(expected)
  }

  return { state, start, volumeRef }
}
