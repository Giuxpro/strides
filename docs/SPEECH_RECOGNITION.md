# Reconocimiento de voz — Guía de implementación

Documentación técnica del sistema de evaluación de pronunciación en Strides Kids.
Cubre la arquitectura completa, las decisiones de diseño, los problemas encontrados y cómo se resolvieron.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Flujo de datos](#2-flujo-de-datos)
3. [VAD — Voice Activity Detection](#3-vad--voice-activity-detection)
4. [API de Whisper — parámetros críticos](#4-api-de-whisper--parámetros-críticos)
5. [Evaluación de coincidencia](#5-evaluación-de-coincidencia)
6. [Manejo de alucinaciones](#6-manejo-de-alucinaciones)
7. [Proveedores de voz — Web Speech vs Whisper](#7-proveedores-de-voz--web-speech-vs-whisper)
8. [Archivos clave](#8-archivos-clave)
9. [Problemas conocidos y soluciones](#9-problemas-conocidos-y-soluciones)
10. [Cómo replicar en otro proyecto](#10-cómo-replicar-en-otro-proyecto)

---

## 1. Arquitectura general

```
[Niño habla]
     │
     ▼
[MediaRecorder API]  ←──  [VAD: Web Audio API / RMS]
     │                          │
     │  Corta grabación          │  Detecta inicio y fin de habla
     │  cuando hay silencio       │  sin depender de temporizadores
     ▼
[Blob de audio (.webm/.ogg)]
     │
     ▼
[POST /api/speech/evaluate]   ← Next.js API Route (servidor)
     │
     ▼
[OpenAI Whisper-1]
  - language: 'en'
  - temperature: 0
  - prompt: "The student will say: [palabra esperada]"
  - response_format: 'verbose_json'
     │
     ▼
[Evaluación de coincidencia]
  - Normalización de texto
  - Levenshtein con tolerancias por longitud
  - Tolerancia a plurales
     │
     ▼
[{ correct, transcript, noSpeech, lowConfidence }]
     │
     ▼
[SpeakingExercise — UI]
  correct  → flip card verde + ⭐
  wrong    → flip card roja + reintento
  noSpeech → mensaje + reintentar
```

---

## 2. Flujo de datos

### Cliente (`SpeakingExercise.tsx`)

1. Usuario toca el botón de micrófono.
2. Se solicita acceso al micrófono con `getUserMedia`.
3. Se inicia `MediaRecorder` para capturar el audio.
4. **En paralelo**, `AudioContext` + `AnalyserNode` monitorean el nivel de audio con VAD basado en RMS.
5. El VAD detecta:
   - Inicio de habla (RMS > umbral).
   - Fin de habla (380ms de silencio tras haber hablado).
   - No habla (3.5s sin superar el umbral → aborta).
6. Cuando el VAD para la grabación, el `MediaRecorder` se detiene.
7. El audio se empaqueta en un `FormData` y se envía a `/api/speech/evaluate`.
8. La respuesta actualiza el estado visual de la tarjeta.

### Servidor (`/api/speech/evaluate` → `evaluateSpeech`)

1. Recibe el `File` de audio y la palabra esperada.
2. Llama a Whisper con los parámetros optimizados.
3. Analiza `no_speech_prob` y `avg_logprob` del resultado `verbose_json`.
4. Detecta alucinaciones conocidas de Whisper.
5. Evalúa la coincidencia con `isSpeechMatch`.
6. Registra el uso en `ai_usage` (duración, modelo, proveedor).
7. Devuelve `{ transcript, correct, noSpeech, lowConfidence }`.

---

## 3. VAD — Voice Activity Detection

### Por qué el enfoque anterior fallaba

El VAD original (desactivado por bugs) usaba `getByteFrequencyData` y calculaba el promedio de todas las frecuencias. Este enfoque es poco fiable porque:

- En silencio, el ruido de fondo de alta frecuencia mantiene el promedio elevado.
- La ganancia AGC del micrófono amplifica el ruido cuando no hay señal real.
- El umbral era fijo (`avg > 20`) sin adaptación a la ganancia del dispositivo.

### Solución: RMS sobre datos de tiempo

La técnica correcta para detectar presencia/ausencia de voz es calcular el **Root Mean Square (RMS)** sobre los datos de dominio temporal (`getByteTimeDomainData`).

#### Por qué RMS es mejor

- Mide la **energía real** de la señal, no el contenido espectral.
- Los datos de tiempo están centrados en 128 (silencio = 128, no 0), por lo que se normalizan fácilmente.
- No requiere ajuste de ganancia — el RMS de silencio real es siempre cercano a 0.

#### Implementación

```typescript
const analyser = audioCtx.createAnalyser()
analyser.fftSize = 256  // 256 samples por frame
const timeData  = new Uint8Array(analyser.fftSize)

function getRMS(): number {
  analyser.getByteTimeDomainData(timeData)
  let sum = 0
  for (const sample of timeData) {
    const normalized = (sample - 128) / 128  // rango: -1 a 1
    sum += normalized * normalized
  }
  return Math.sqrt(sum / timeData.length)  // rango: 0 a 1
}
```

#### Parámetros del VAD en producción

| Parámetro | Valor | Razón |
|---|---|---|
| `SPEECH_RMS_THRESHOLD` | `0.012` | ~1.2% de amplitud máxima. Por encima = habla. |
| `SILENCE_AFTER_SPEECH` | `380ms` | Silencio post-habla antes de cortar. |
| `NO_SPEECH_MAX` | `3500ms` | Si no hay habla en 3.5s, abortar. |
| `MIN_RECORD_AFTER_SPEECH` | `250ms` | Mínimo grabado tras detectar habla. Evita cortes prematuros. |
| `HARD_MAX` | `6000ms` | Límite absoluto de grabación. |
| Intervalo de muestreo | `50ms` | 20 checks/segundo. Balance entre reactividad y CPU. |

#### Lógica de decisión

```typescript
if (rms > SPEECH_RMS_THRESHOLD) {
  speechDetected = true
  speechEndedAt  = 0            // reset timer de silencio
} else if (speechDetected) {
  if (speechEndedAt === 0) speechEndedAt = Date.now()
  const silence   = Date.now() - speechEndedAt
  const recorded  = elapsed - (speechEndedAt - startTs)
  if (silence > SILENCE_AFTER_SPEECH && recorded > MIN_RECORD_AFTER_SPEECH) {
    stopRecording()             // corte limpio tras habla
  }
} else if (elapsed > NO_SPEECH_MAX) {
  stopRecording()               // usuario no habló
}
```

#### Resultado práctico

Una palabra de 0.6s ("cat") genera un audio de aproximadamente 1.0–1.2s en lugar de los 3s hardcodeados anteriores. **Reducción de costo: ~65%.**

### Compatibilidad con Safari/iOS

Safari usa `webkitAudioContext`. Siempre instanciar con fallback:

```typescript
const AudioCtxCtor = window.AudioContext ?? window.webkitAudioContext
const audioCtx = new AudioCtxCtor()
```

### Feedback visual sin re-renders

La barra de volumen se actualiza directamente al DOM via `ref` para evitar re-renders de React durante la grabación (que romperían el estado del `MediaRecorder`):

```typescript
// En el intervalo del VAD:
if (volumeBarRef.current) {
  volumeBarRef.current.style.width = `${Math.min(100, rms * 6000)}%`
}
```

---

## 4. API de Whisper — parámetros críticos

### Por qué los parámetros importan tanto para palabras cortas

Whisper fue entrenado principalmente con audio de larga duración (podcasts, conferencias). Para palabras sueltas de 0.5–1.5s, sin los parámetros correctos, el modelo:

- Genera texto aleatorio que no está en el audio ("hallucinations").
- Da resultados distintos para el mismo audio en cada llamada.
- Tiene baja confianza en lo que realmente escuchó.

### Parámetros usados y su efecto

```typescript
await openai.audio.transcriptions.create({
  file:            audio,
  model:           'whisper-1',
  language:        'en',          // (1)
  response_format: 'verbose_json', // (2)
  temperature:     0,              // (3)
  prompt:          `The student is practicing English pronunciation. They will say the word: "${expected}". Transcribe only what is spoken.`, // (4)
})
```

#### (1) `language: 'en'`
- Elimina el proceso de detección de idioma (que para clips cortos puede fallar).
- Mejora latencia y precisión en inglés.

#### (2) `response_format: 'verbose_json'`
- Devuelve metadatos de cada segmento: `avg_logprob` y `no_speech_prob`.
- Sin este formato solo se obtiene el texto, sin métricas de confianza.
- `avg_logprob`: log-probabilidad promedio (0 = perfecto, -2.5 = muy incierto).
- `no_speech_prob`: probabilidad de que el segmento sea silencio (0–1).

#### (3) `temperature: 0`
- Hace a Whisper completamente **determinista**: el mismo audio da siempre el mismo resultado.
- Sin esto, `temperature` por defecto tiene aleatoriedad → inconsistencias inexplicables.
- Para evaluación de pronunciación (donde el mismo audio debe dar siempre el mismo resultado), esto es imprescindible.

#### (4) `prompt`
- El parámetro más impactante para palabras cortas.
- Whisper usa los últimos 224 tokens del prompt para sesgar su decodificación.
- Al decirle exactamente qué palabra esperar, el modelo "busca" esa palabra en el audio.
- Sin prompt, un audio de "cat" puede transcribirse como "cast", "cut", "at", etc.
- **Importante**: el prompt no fuerza la salida — si el audio dice claramente otra cosa, Whisper lo transcribirá correctamente igualmente.

### Métricas de confianza

```typescript
const maxNoSpeech = Math.max(...segments.map(s => s.no_speech_prob))
// Si > 0.7 → tratar como silencio/ruido

const avgLogProb  = segments.reduce((s, seg) => s + seg.avg_logprob, 0) / segments.length
const confidence  = Math.min(100, Math.max(0, Math.round((1 + avgLogProb / 2.5) * 100)))
// Si confidence < 35 → lowConfidence = true
```

La escala de `avg_logprob`:
- `0.0` → confianza perfecta
- `-1.0` → confianza moderada (~60 en la escala 0–100)
- `-2.5` → muy incierto (~0 en la escala)

---

## 5. Evaluación de coincidencia

### Problema con palabras infantiles

El vocabulario básico de inglés para niños tiene palabras muy cortas: cat, dog, pig, hen, cow, fish, bear, etc. El algoritmo anterior solo aplicaba tolerancia Levenshtein a palabras de 6+ caracteres, dejando sin margen de error a exactamente las palabras más comunes.

### Algoritmo actual

```typescript
function isSpeechMatch(transcript: string, expected: string): boolean {
  const heard  = normalize(transcript)  // lowercase, sin puntuación
  const target = normalize(expected)

  // 1. Coincidencia exacta
  if (heard === target) return true

  // 2. Tolerancia a plurales simples
  //    "cats" ↔ "cat", "horses" ↔ "horse"
  if (heard.endsWith('s')  && heard.slice(0, -1) === target) return true
  if (target.endsWith('s') && target.slice(0, -1) === heard)  return true

  // 3. Palabra exacta dentro de una transcripción más larga
  //    Whisper a veces transcribe "a cat" en vez de solo "cat"
  for (const word of heard.split(/\s+/)) {
    if (word === target) return true

    // Plural dentro del texto completo
    if (word.endsWith('s') && word.slice(0, -1) === target) return true

    // Levenshtein con tolerancia por longitud
    const maxEdits = target.length >= 8 ? 2
                   : target.length >= 4 ? 1
                   : 0
    if (maxEdits > 0 && levenshtein(word, target) <= maxEdits) return true
  }

  return false
}
```

### Tabla de tolerancias

| Longitud de la palabra | Ediciones permitidas | Ejemplos |
|---|---|---|
| 1–3 chars | 0 (exacta) | "a", "ox" |
| 4–7 chars | 1 | "cat"→"bat" ✗, "bear"→"beer" ✓ |
| 8+ chars | 2 | "elephant"→"elefant" ✓ |

---

## 6. Manejo de alucinaciones

Whisper tiene tendencia a generar texto estándar cuando el audio es muy corto, silencioso o ambiguo. Estas alucinaciones son siempre las mismas frases.

### Lista de alucinaciones conocidas

```typescript
const WHISPER_HALLUCINATIONS = new Set([
  'i dont know', 'thank you', 'thank you so much', 'thanks for watching',
  'um', 'uh', 'hmm', 'okay', 'ok', 'alright',
  'bye', 'goodbye', 'please subscribe', 'like and subscribe',
  'subtitles by', 'captions by', 'subs by',
  'you', 'the', 'a', 'i',  // palabras sueltas comunes de baja confianza
])

const HALLUCINATION_PREFIXES = ['subs by', 'subtitles by', 'www.', 'http']
```

Cuando se detecta una alucinación, se devuelve `noSpeech: true` para darle al niño otro intento en lugar de marcar la respuesta como incorrecta.

---

## 7. Proveedores de voz — Web Speech vs OpenAI Whisper vs Groq Whisper

El sistema soporta **tres** providers, configurables desde el panel admin en `Settings > Reconocimiento de voz` (`SpeechProvider = 'web-speech' | 'whisper' | 'groq-whisper'`).

| | Web Speech API | OpenAI Whisper | Groq Whisper (v3) |
|---|---|---|---|
| **Costo** | Gratis | ~$0.006/min | Gratis (free tier) |
| **Dónde corre** | Navegador | Servidor (OpenAI) | Servidor (Groq) |
| **Latencia** | Muy baja (~200ms) | Alta (~1.5–3s) | Media (~0.7–1.3s) |
| **Precisión palabras cortas** | Media | Alta | Buena en silencio, floja con ruido |
| **`no_speech_prob` fiable** | n/a | Sí | **No (ver §7.1)** |
| **Para niños pequeños** | Suficiente para MVP | Recomendado (máx fiabilidad) | OK gratis, en ambiente silencioso |

### Cuándo usar cada uno

- **Web Speech** — vocabulario básico, respuesta inmediata, zero costo. Juzga en el navegador.
- **OpenAI Whisper** — máxima fiabilidad (ruido, acento, 1er intento). Cuesta pero es el más robusto.
- **Groq Whisper** — gratis y decente en ambiente silencioso; ver limitaciones abajo.

El proveedor activo se lee de la tabla `settings` con clave `speech_provider` y se inyecta en `SpeechConfigContext` para que llegue a `SpeakingExercise`. `web-speech` juzga en el cliente; `whisper` y `groq-whisper` graban + POST a `/api/speech/evaluate`, que enruta el backend según el setting. La **verificación de coincidencia es única y compartida** (`@strides/core/speech`), así los tres proveedores juzgan idéntico.

### 7.1 Groq Whisper — lecciones aprendidas (2026-07-08)

Groq expone Whisper vía API compatible con OpenAI, pero **no es intercambiable 1:1**:

- **`whisper-large-v3-turbo` NO sirve** para palabras cortas: alucina fuerte ("crab"→"Wow", "bee"→"BING") e **ignora el prompt sesgado**. Se usa el **no-turbo `whisper-large-v3`**, notablemente mejor.
- **`no_speech_prob` no es fiable en Groq.** El turbo lo devuelve siempre `0`; el no-turbo da valores bajos (0.02–0.24) que se **solapan** entre voz real y alucinación. El gate `> 0.7` (que sí funciona en OpenAI) **nunca dispara**. Esta es la señal que OpenAI usaba para convertir el audio marginal del 1er intento en "intenta otra vez"; Groq no la tiene, así que ese audio se transcribe como basura → "mal".
- **`avg_logprob` tampoco separa** basura de acierto en Groq (un acierto tuvo -2.2 y una alucinación -1.0). No usar confianza como gate en Groq.
- **El prompt sesgado se "filtra"** hacia la transcripción en audio marginal ("...will say the word: shark"). Mitigado tratando fragmentos del prompt como alucinación (`PROMPT_ECHO_FRAGMENTS` en `whisper.ts`) → reintento en vez de error.
- **Sensible al ruido de fondo.** Con sonido ambiente captado por el micro, la precisión cae; en silencio acierta la mayoría (~10/12 palabras, casi todo al 2º intento).

**Veredicto:** Groq v3 es usable gratis en ambiente silencioso (MVP en casa). Para máxima fiabilidad (ruido, 1er intento), OpenAI sigue siendo superior por su `no_speech_prob`.

---

## 8. Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `apps/web/src/components/kids/engine/games/SpeakingExercise.tsx` | Componente UI + grabación + VAD |
| `apps/web/src/app/api/speech/evaluate/route.ts` | API Route — recibe audio, llama evaluateSpeech |
| `packages/core/src/ai/whisper.ts` | Llamada a Whisper (OpenAI/Groq según backend) + gates de alucinación/silencio |
| `packages/core/src/speech/matching.ts` | Verificación de coincidencia (`normalizeSpeech`, `isSpeechMatch`) — fuente única compartida por cliente y server |
| `apps/web/src/components/kids/engine/SpeechConfigContext.tsx` | Context que propaga el provider activo |
| `packages/db/src/queries/ai-usage.ts` | Registro de uso y costo de Whisper |

---

## 9. Problemas conocidos y soluciones

### P: El VAD corta demasiado pronto en dispositivos con micrófono de baja ganancia

**Causa**: El umbral `SPEECH_RMS_THRESHOLD = 0.012` puede ser muy alto en micrófonos que capturan con nivel bajo.

**Solución**: Bajar el umbral a `0.008` o implementar calibración automática: medir el RMS de fondo durante los primeros 300ms antes de que el usuario hable.

### P: En iOS Safari, AudioContext requiere ser creado en un gesto del usuario

**Causa**: Safari bloquea AudioContext hasta que haya una interacción directa del usuario.

**Solución**: El contexto se crea dentro de `startListeningWhisper`, que siempre se llama desde el `onClick` del botón. Esto satisface la restricción de Safari.

### P: MediaRecorder no soporta `.webm` en Safari

**Causa**: Safari solo soporta formatos MP4/AAC en MediaRecorder.

**Solución actual**: El código detecta el `mimeType` y envía `.ogg` o `.webm` según corresponda. Whisper acepta ambos. Para Safari que no soporta ninguno, considerar usar `mp4` como fallback adicional.

```typescript
const ext = recorder.mimeType.includes('ogg') ? 'audio.ogg' : 'audio.webm'
```

### P: Whisper transcribe "a cat" en vez de "cat"

**Causa**: Whisper agrega artículos cuando el audio es muy corto y el contexto de la oración es ambiguo.

**Solución**: `isSpeechMatch` verifica cada palabra individual del transcript, no solo el transcript completo. "a cat" → split → ["a", "cat"] → "cat" = "cat" ✓.

### P: Alto costo cuando el usuario habla y luego espera en silencio

**Causa**: Sin VAD, se enviaban 3s de audio aunque la palabra durase 0.5s.

**Solución**: El VAD RMS corta la grabación 380ms después de detectar silencio post-habla. Una palabra de 0.6s genera ~1.0s de audio → ahorro del 65%.

---

## 10. Cómo replicar en otro proyecto

### Requisitos

- OpenAI API key con acceso a Whisper.
- Next.js (o cualquier backend que pueda recibir `multipart/form-data`).
- Navegador moderno con `MediaRecorder` y `AudioContext` (Chrome, Edge, Firefox, Safari 14.1+).

### Pasos

#### 1. Backend — función de evaluación

```typescript
// Instalar: npm install openai
import OpenAI from 'openai'

const openai = new OpenAI()

export async function evaluateSpeech(audio: File, expected: string) {
  const raw = await openai.audio.transcriptions.create({
    file:            audio,
    model:           'whisper-1',
    language:        'en',
    response_format: 'verbose_json',
    temperature:     0,
    prompt:          `The student will say the word: "${expected}". Transcribe only what is spoken.`,
  }) as { text: string; segments?: Array<{ avg_logprob: number; no_speech_prob: number }> }

  const segments    = raw.segments ?? []
  const maxNoSpeech = segments.length > 0 ? Math.max(...segments.map(s => s.no_speech_prob)) : 0

  if (maxNoSpeech > 0.7) return { correct: false, noSpeech: true, transcript: '' }

  const transcript = raw.text.trim()
  const correct    = isSpeechMatch(transcript, expected)

  return { correct, noSpeech: false, transcript }
}
```

#### 2. Backend — API route

```typescript
// Next.js App Router
export async function POST(req: Request) {
  const formData = await req.formData()
  const audio    = formData.get('audio') as File
  const expected = formData.get('expected') as string
  const result   = await evaluateSpeech(audio, expected)
  return Response.json(result)
}
```

#### 3. Cliente — grabación + VAD

```typescript
async function startRecording(expectedWord: string) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
  })

  // VAD setup
  const audioCtx   = new AudioContext()
  const analyser   = audioCtx.createAnalyser()
  analyser.fftSize = 256
  audioCtx.createMediaStreamSource(stream).connect(analyser)
  const timeData   = new Uint8Array(analyser.fftSize)

  let speechDetected = false
  let speechEndedAt  = 0
  const startTs      = Date.now()

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(stream)
  recorder.ondataavailable = e => chunks.push(e.data)

  recorder.onstop = async () => {
    stream.getTracks().forEach(t => t.stop())
    audioCtx.close()

    if (!speechDetected) {
      console.log('No speech detected')
      return
    }

    const blob = new Blob(chunks, { type: recorder.mimeType })
    const file = new File([blob], 'audio.webm', { type: blob.type })
    const body = new FormData()
    body.append('audio', file)
    body.append('expected', expectedWord)

    const res    = await fetch('/api/speech/evaluate', { method: 'POST', body })
    const result = await res.json()
    console.log(result) // { correct, transcript, noSpeech }
  }

  recorder.start()

  const vadInterval = setInterval(() => {
    analyser.getByteTimeDomainData(timeData)
    let sum = 0
    for (const s of timeData) { const n = (s - 128) / 128; sum += n * n }
    const rms     = Math.sqrt(sum / timeData.length)
    const elapsed = Date.now() - startTs

    if (rms > 0.012) {
      speechDetected = true
      speechEndedAt  = 0
    } else if (speechDetected) {
      if (speechEndedAt === 0) speechEndedAt = Date.now()
      if (Date.now() - speechEndedAt > 380 && elapsed > 550) {
        clearInterval(vadInterval)
        recorder.stop()
      }
    } else if (elapsed > 3500) {
      clearInterval(vadInterval)
      recorder.stop()
    }
  }, 50)

  // Hard max
  setTimeout(() => { if (recorder.state === 'recording') recorder.stop() }, 6000)
}
```

### Checklist de calidad

- [ ] `temperature: 0` en la llamada a Whisper
- [ ] `language` especificado explícitamente
- [ ] `prompt` incluye la palabra esperada
- [ ] `response_format: 'verbose_json'` para métricas de confianza
- [ ] VAD basado en RMS (no en frecuencias promedio)
- [ ] Fallback si `AudioContext` no está disponible (hard max timeout)
- [ ] Detección de alucinaciones comunes de Whisper
- [ ] Tolerancia de coincidencia ajustada a la longitud de la palabra
- [ ] Limpieza de recursos: `stream.getTracks().forEach(t => t.stop())`, `audioCtx.close()`
