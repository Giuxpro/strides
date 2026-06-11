'use client'

import { useEffect, useState } from 'react'

const PARTICLES = [
  { dx: '0px', dy: '-22px', color: '#FFD700' },
  { dx: '18px', dy: '-14px', color: '#FFA500' },
  { dx: '22px', dy: '8px', color: '#FF6B35' },
  { dx: '6px', dy: '22px', color: '#FFD700' },
  { dx: '-18px', dy: '14px', color: '#FFA500' },
  { dx: '-20px', dy: '-8px', color: '#FF6B35' },
  { dx: '-40px', dy: '-50px', color: '#FF6B35' },
  { dx: '-60px', dy: '-60px', color: '#FF6B35' },
]

// ─── Sparkle / Fairy-dust sound engine ───────────────────────────────
// Rango 1700–2600 Hz: zona "sparkle" — agudo, limpio, mágico
const NOTES = [2200, 2700, 3300]
// última estrella resuena más → "bliiing ✨"
const DECAYS = [0.45, 0.65, 1.25]

let _ctx: AudioContext | null = null
let _reverb: ConvolverNode | null = null
let _delay: DelayNode | null = null
let _delayFeedback: GainNode | null = null

function getCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    if (!_ctx || _ctx.state === 'closed') {
      _ctx = new AC()
      _reverb = null
      _delay = null
      _delayFeedback = null
    }
    if (_ctx.state === 'suspended') _ctx.resume()
    return _ctx
  } catch { return null }
}

/** Reverb brillante — impulse response sintético con high-pass para brillo */
function buildReverb(ctx: AudioContext): ConvolverNode {
  const conv = ctx.createConvolver()
  const len = Math.floor(ctx.sampleRate * 0.8) // cola más larga para magia
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) {
      // decaimiento exponencial suave con modulación aleatoria
      const t = i / ctx.sampleRate
      d[i] = (Math.random() * 2 - 1)
        * Math.exp(-3.5 * t)        // decaimiento natural
        * (1 + 0.3 * Math.sin(t * 80)) // modulación sutil para textura
    }
  }
  conv.buffer = buf

  // high-pass en la salida del reverb → solo brillo, sin muddiness
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1200
  hp.Q.value = 0.7

  const wet = ctx.createGain()
  wet.gain.value = 0.28

  conv.connect(hp)
  hp.connect(wet)
  wet.connect(ctx.destination)
  return conv
}

/** Delay sutil — eco "fairy" que extiende el brillo */
function buildDelay(ctx: AudioContext): { delay: DelayNode; feedback: GainNode } {
  const delay = ctx.createDelay(0.5)
  delay.delayTime.value = 0.12 // eco rápido (120ms)

  const feedback = ctx.createGain()
  feedback.gain.value = 0.18 // feedback bajo → solo 1-2 repeticiones

  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 2000 // solo eco del brillo, no los graves

  const wet = ctx.createGain()
  wet.gain.value = 0.15

  // Routing: delay → filter → wet → destination
  //                         ↘ feedback → delay (loop)
  delay.connect(filter)
  filter.connect(wet)
  wet.connect(ctx.destination)
  filter.connect(feedback)
  feedback.connect(delay)

  return { delay, feedback }
}

function playStarDing(noteIndex: number) {
  const ctxNullable = getCtx()
  if (!ctxNullable) return
  const ctx = ctxNullable  // non-null for closures below
  if (!_reverb) _reverb = buildReverb(ctx)
  if (!_delay) {
    const d = buildDelay(ctx)
    _delay = d.delay
    _delayFeedback = d.feedback
  }

  const now = ctx.currentTime
  const freq  = NOTES[noteIndex]  ?? 2200
  const decay = DECAYS[noteIndex] ?? 0.45

  // ── Parcial: oscilador sine + panner + envolvente ──
  function partial(f: number, amp: number, pan: number, dMult: number) {
    const d = decay * dMult
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    const panner = ctx.createStereoPanner()

    osc.type = 'sine'

    // pitch-up swoop: empieza 5% bajo, sube 3% por encima en 30ms → "mágico"
    osc.frequency.setValueAtTime(f * 0.95, now)
    osc.frequency.exponentialRampToValueAtTime(f * 1.03, now + 0.030)
    // luego baja suavemente al target para efecto natural
    osc.frequency.exponentialRampToValueAtTime(f, now + 0.12)

    // ataque casi instantáneo (3ms) + decay suave con cola larga
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(amp, now + 0.003)
    // decay en dos fases: rápido al principio, luego cola suave
    g.gain.exponentialRampToValueAtTime(amp * 0.3, now + d * 0.35)
    g.gain.exponentialRampToValueAtTime(0.001, now + d)

    panner.pan.value = pan

    osc.connect(g)
    g.connect(panner)
    panner.connect(ctx.destination) // señal seca
    panner.connect(_reverb!)        // alimenta reverb
    panner.connect(_delay!)          // alimenta delay

    osc.start(now)
    osc.stop(now + d + 0.15)
  }

  // ── Noise burst: "shhh" de fairy dust ──
  function noiseBurst(dur: number, amp: number, pan: number) {
    const len = Math.floor(ctx.sampleRate * dur)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1)
    }
    const src = ctx.createBufferSource()
    src.buffer = buf

    // bandpass para que suene a "sparkle" no a estática
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = freq * 1.5
    bp.Q.value = 2.0

    const g = ctx.createGain()
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(amp, now + 0.002)
    g.gain.exponentialRampToValueAtTime(0.001, now + dur)

    const panner = ctx.createStereoPanner()
    panner.pan.value = pan

    src.connect(bp)
    bp.connect(g)
    g.connect(panner)
    panner.connect(ctx.destination)
    panner.connect(_reverb!)

    src.start(now)
    src.stop(now + dur + 0.05)
  }

  // ── Composición del sparkle ──

  // Fundamental centrada (sine pura, limpia)
  partial(freq, 0.18, 0, 1.00)

  // 2ª armónica — shimmer izquierda
  partial(freq * 2, 0.08, -0.40, 0.60)

  // 2.5ª armónica — shimmer derecha
  partial(freq * 2.5, 0.05, 0.40, 0.45)

  // 3ª armónica — tinkle muy suave, spread amplio
  partial(freq * 3, 0.03, -0.65, 0.35)

  // 4ª armónica — aire ultra-agudo, apenas perceptible
  partial(freq * 4, 0.015, 0.65, 0.25)

  // Noise burst — textura "fairy dust"
  noiseBurst(decay * 0.3, 0.04, (noteIndex - 1) * 0.2)
}

/** Arpegio de logro (3 notas ascendentes) — reutilizable fuera del componente */
export function playSuccessSound() {
  playStarDing(0)
  setTimeout(() => playStarDing(1), 110)
  setTimeout(() => playStarDing(2), 240)
}

interface Props {
  filled: boolean
  animate?: boolean // true = play animation + sound; false/undefined = show static
  index?: number  // 0, 1, 2 → nota musical
  delay?: number
  size?: number
}

export function AnimatedStar({ filled, animate = false, index = 0, delay = 0, size = 40 }: Props) {
  const [hasFill, setHasFill] = useState(false)
  const [hasParticles, setHasParticles] = useState(false)

  useEffect(() => {
    if (!filled) return

    // Si no debe animar, mostrar llena inmediatamente
    if (!animate) {
      setHasFill(true)
      return
    }

    // Animación completa con sonido solo para estrellas nuevas
    const BASE = 900
    const ts = [
      setTimeout(() => setHasFill(true), BASE + delay),
      // sonido al completar el fill (coincide con el pop)
      setTimeout(() => playStarDing(index), BASE + delay + 560),
      setTimeout(() => setHasParticles(true), BASE + delay + 750),
      setTimeout(() => setHasParticles(false), BASE + delay + 1800),
    ]
    return () => ts.forEach(clearTimeout)
  }, [filled, animate, delay, index])

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {/* Base — siempre gris */}
      <span
        style={{
          fontSize: size,
          lineHeight: 1,
          filter: 'grayscale(1)',
          opacity: 0.28,
          userSelect: 'none',
          position: 'absolute',
        }}
      >
        ⭐
      </span>

      {/* Dorado — con o sin animación */}
      {hasFill && (
        <span
          style={{
            fontSize: size,
            lineHeight: 1,
            userSelect: 'none',
            position: 'absolute',
            ...(animate
              ? {
                  animation:
                    'starFillUp 0.55s ease-out forwards, starPop 0.38s cubic-bezier(0.34,1.56,0.64,1) 0.58s forwards',
                }
              : {}),
          }}
        >
          ⭐
        </span>
      )}

      {/* Partículas */}
      {hasParticles && PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: p.color,
            animationName: 'starParticle',
            animationDuration: '0.75s',
            animationDelay: `${i * 40}ms`,
            animationFillMode: 'forwards',
            animationTimingFunction: 'ease-out',
            ['--dx' as string]: p.dx,
            ['--dy' as string]: p.dy,
          }}
        />
      ))}
    </div>
  )
}
