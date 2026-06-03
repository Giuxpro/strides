// Sonidos de feedback de logro — Web Audio API puro, sin archivos externos.
// Frecuencias en rango cálido (500–900 Hz) para que no sean estridentes.

let _ctx: AudioContext | null = null
let _reverb: ConvolverNode | null = null

function getCtx(): AudioContext | null {
  try {
    const AC =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    if (!_ctx || _ctx.state === 'closed') { _ctx = new AC(); _reverb = null }
    if (_ctx.state === 'suspended') _ctx.resume()
    return _ctx
  } catch { return null }
}

function buildReverb(ctx: AudioContext): ConvolverNode {
  const len = Math.floor(ctx.sampleRate * 0.55)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.exp(-4.5 * i / len)
  }
  const conv = ctx.createConvolver()
  conv.buffer = buf
  const wet = ctx.createGain()
  wet.gain.value = 0.16
  conv.connect(wet)
  wet.connect(ctx.destination)
  return conv
}

function tone(ctx: AudioContext, freq: number, gain: number, decay: number, at: number) {
  if (!_reverb) _reverb = buildReverb(ctx)
  const osc = ctx.createOscillator()
  const g   = ctx.createGain()
  osc.type = 'sine'
  // micro-glide inicial: empieza 2% bajo y sube — da vida al tono
  osc.frequency.setValueAtTime(freq * 0.98, at)
  osc.frequency.exponentialRampToValueAtTime(freq, at + 0.04)
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(gain, at + 0.006)
  g.gain.exponentialRampToValueAtTime(0.001, at + decay)
  osc.connect(g)
  g.connect(ctx.destination)
  g.connect(_reverb)
  osc.start(at)
  osc.stop(at + decay + 0.1)
}

/** Tono descendente suave para respuesta incorrecta — glide 380→260 Hz, 320 ms */
export function playWrongSound(): void {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g   = ctx.createGain()
  const t   = ctx.currentTime
  osc.type = 'sine'
  osc.frequency.setValueAtTime(380, t)
  osc.frequency.exponentialRampToValueAtTime(260, t + 0.28) // glide hacia abajo = "uh-oh"
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.07, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.36)
}

/** Ding suave para cada respuesta correcta — A5, 280 ms */
export function playCorrectDing(): void {
  const ctx = getCtx()
  if (!ctx) return
  tone(ctx, 880, 0.07, 0.28, ctx.currentTime)
}

/** Arpegio ascendente C-E-G al completar un juego — cálido, 650 ms en total */
export function playVictoryFanfare(): void {
  const ctx = getCtx()
  if (!ctx) return
  const t = ctx.currentTime
  tone(ctx, 523, 0.10, 0.42, t)         // C5
  tone(ctx, 659, 0.11, 0.42, t + 0.14)  // E5
  tone(ctx, 784, 0.13, 0.62, t + 0.28)  // G5 — más largo para resolver la frase
}
