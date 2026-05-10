# Strides — Arquitectura del Proyecto

> Masterclass de 0 a 100. Para que cualquier developer —junior o senior— entienda cómo está organizado este proyecto, por qué se tomó cada decisión, y dónde va cada pieza de código nueva.

---

## 1. ¿Qué es Strides?

Strides es una app de aprendizaje de inglés. Tiene tres facetas de usuario:

| Faceta | Audiencia | Estado |
|--------|-----------|--------|
| `/kids` | Niños 4-10 años | MVP activo |
| `/teen` | Adolescentes | Próximamente |
| `/adult` | Adultos | Próximamente |

El proyecto vive en un **monorepo** — un solo repositorio git que contiene múltiples aplicaciones y librerías compartidas.

---

## 2. El monorepo — Vista general

```
Strides/
├── apps/
│   └── web/          → La app web (Next.js 14 App Router)
│
├── packages/
│   ├── core/         → Lógica de negocio pura (sin React, sin Next.js, sin Supabase)
│   └── db/           → Toda la comunicación con Supabase
│
├── pnpm-workspace.yaml
├── CLAUDE.md
└── docs/
    └── ARCHITECTURE.md   ← estás aquí
```

**¿Por qué un monorepo?**
Porque `apps/web` y el futuro `apps/mobile` (Expo/React Native) necesitan compartir tipos y lógica de negocio. Sin monorepo, terminarías copiando código entre repos y los tipos se desincronizarían. Con monorepo, un cambio en `packages/core` es inmediatamente visible en ambas apps.

---

## 3. La arquitectura en capas (Layered Architecture)

Este es el concepto más importante del proyecto. El código está organizado en **capas**, y cada capa solo puede importar de capas inferiores — **nunca al revés**.

```
┌─────────────────────────────────────────────────────┐
│  CAPA 4 — UI                                        │
│  apps/web/src/components/                           │
│  apps/web/src/app/**/page.tsx                       │
│                                                     │
│  Solo React. Solo presenta datos. No sabe de DB.    │
└───────────────────┬─────────────────────────────────┘
                    │ puede llamar a ↓
┌───────────────────▼─────────────────────────────────┐
│  CAPA 3 — Server Actions                            │
│  apps/web/src/app/**/_actions.ts                    │
│                                                     │
│  Orquesta. Llama a la DB. Valida sesión.            │
│  Revalida caché. Redirige.                          │
└───────────────────┬─────────────────────────────────┘
                    │ importa funciones de ↓
┌───────────────────▼─────────────────────────────────┐
│  CAPA 2 — Data Access                               │
│  packages/db/src/queries/                           │
│                                                     │
│  Solo queries a Supabase. Sin lógica de negocio.    │
│  Recibe el cliente como parámetro.                  │
└───────────────────┬─────────────────────────────────┘
                    │ usa tipos de ↓
┌───────────────────▼─────────────────────────────────┐
│  CAPA 1 — Dominio (Core)                            │
│  packages/core/src/kids/                            │
│                                                     │
│  Tipos, constantes, registros, configuración.       │
│  Sin React. Sin Supabase. Cero deps de plataforma.  │
└─────────────────────────────────────────────────────┘
```

**La regla de oro:** Las flechas solo van hacia abajo. Si ves un import que va "hacia arriba" (e.g., `packages/core` importando de `apps/web`), es un bug de arquitectura.

**¿Por qué esto importa?**
- Puedes cambiar Next.js por Remix mañana y `packages/core` y `packages/db` no cambian nada.
- Puedes lanzar `apps/mobile` en Expo y reusar toda la lógica del core.
- Los tests unitarios de `packages/core` corren en Node.js puro, sin navegador ni servidor.

---

## 4. `packages/core` — El corazón del dominio

Este paquete contiene **lógica pura**: no sabe nada de React, Next.js, ni Supabase. Podría ejecutarse en un servidor Node.js, en el navegador, o en React Native sin cambiar nada.

### Estructura

```
packages/core/src/kids/
├── types.ts              → Tipos base: VocabItem, ExerciseData
├── moduleConfig.ts       → Configuración visual de módulos (colores, gradientes, emojis)
├── theme.ts              → Temas de color para la app kids
├── modifiers/
│   └── types.ts          → ModifierConfig, GameResult, ModifierState, WordResult
├── speech/
│   ├── rates.ts          → SPEECH_RATE_NORMAL (0.85), SPEECH_RATE_SLOW (0.25)
│   └── voicePresets.ts   → VoicePreset, VOICE_PRESET_CONFIGS, isVoicePreset
├── games/
│   └── registry.ts       → GAME_REGISTRY (metadata de juegos disponibles)
├── retos/
│   └── registry.ts       → RETO_REGISTRY (configuración de retos diarios/contrarreloj)
└── index.ts              → Barrel: re-exporta todo lo de arriba
```

### Cómo se importa

```typescript
// Desde cualquier archivo en el monorepo:
import {
  VocabItem,
  ModuleConfig,
  GameResult,
  GAME_REGISTRY,
  RETO_REGISTRY,
  VOICE_PRESET_CONFIGS,
  getModuleConfig,
  resolveThemeId,
} from '@strides/core/kids'
```

El `@strides/core/kids` es un **subpath export** definido en `packages/core/package.json`:

```json
{
  "name": "@strides/core",
  "exports": {
    ".": "./src/index.ts",
    "./kids": "./src/kids/index.ts"
  }
}
```

### ¿Qué es un "registry"?

Un registry es un array de objetos que describe las opciones disponibles de forma declarativa, sin código que dependa de la plataforma.

**Ejemplo — GAME_REGISTRY:**
```typescript
// packages/core/src/kids/games/registry.ts
export interface GameMeta {
  id: string
  emoji: string
  title: string
  description: string
  minItems: number
  maxItems: number
}

export const GAME_REGISTRY: GameMeta[] = [
  {
    id: 'memory',
    emoji: '🃏',
    title: 'Memorama',
    description: 'Empareja imagen con palabra',
    minItems: 4,
    maxItems: 16,
  },
  {
    id: 'recognition',
    emoji: '🎯',
    title: 'Reconocer',
    description: 'Elige la imagen correcta',
    minItems: 2,
    maxItems: 8,
  },
  {
    id: 'speaking',
    emoji: '🎤',
    title: 'Hablar',
    description: 'Di la palabra en voz alta',
    minItems: 2,
    maxItems: 10,
  },
]
```

Este mismo array lo usa:
- El **admin** para mostrar un dropdown de juegos (solo necesita `id`, `emoji`, `title`)
- El **engine** para saber qué opciones existen (y mapearlas a componentes React)
- El **panel de configuración** para los límites de palabras por juego

Agregar un juego nuevo = agregar un objeto al array + crear el componente React.

### Tipos clave del dominio

```typescript
// types.ts
export type VocabItem = {
  id: string
  text_en: string   // "apple"
  text_es: string   // "manzana"
  image_url: string | null
  audio_url: string | null
}

// modifiers/types.ts
export type ModifierConfig =
  | { type: 'timer'; seconds: number }
  | { type: 'lives'; count: number }
  | { type: 'multiplier' }

export type WordResult = {
  vocabId: string
  correct: boolean
}

export type GameResult = {
  correct: number
  total: number
  reason: 'completed' | 'timeout' | 'no-lives'
  wordResults?: WordResult[]
}
```

---

## 5. `packages/db` — El acceso a datos

Este paquete es el **único lugar** donde se habla con Supabase. Ningún componente, página, ni server action escribe queries directamente.

### Estructura

```
packages/db/src/
├── types.generated.ts    → Tipos auto-generados desde el schema de Supabase
│                           (no editar a mano — se regeneran con un comando)
├── index.ts              → Re-exporta todo
└── queries/
    ├── modules.ts        → getPublishedModules, getAllModulesForAdmin, getModuleById...
    ├── lessons.ts        → getPublishedLessonsByModule, getLessonBySlug...
    ├── vocab.ts          → getVocabByModule
    ├── children.ts       → getChildrenByParent, getChildById, getChildProfile
    ├── settings.ts       → getAllSettings, getSetting
    └── progress.ts       → getLessonCompletions, getVocabMastery, getChildStreak...
```

### Patrón de query

Cada función recibe el **cliente de Supabase como parámetro** en lugar de crearlo internamente:

```typescript
// packages/db/src/queries/modules.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

export async function getPublishedModules(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('modules')
    .select('id, title_es, title_en, slug, cover_image_url, order')
    .eq('is_published', true)
    .order('order')

  if (error) throw error
  return data
}
```

**¿Por qué pasar el cliente como parámetro?**
El cliente server-side de Next.js (`createClient()`) lee las cookies de la request HTTP actual para saber quién está logueado. Si `packages/db` creara su propio cliente, no tendría acceso a esas cookies y todas las queries fallarían con error de autenticación.

```typescript
// ❌ MAL — el paquete no puede crear el cliente
import { createClient } from '@supabase/supabase-js'
export function getModules() {
  const supabase = createClient(url, key)  // no tiene contexto de auth
}

// ✅ BIEN — recibe el cliente ya autenticado
export async function getModules(supabase: SupabaseClient<Database>) {
  // supabase ya sabe quién está logueado
}
```

---

## 6. `apps/web` — Solo UI

Después de la migración arquitectural, `apps/web` tiene una responsabilidad muy clara: **presentar datos y capturar interacciones del usuario**. Nada más.

### Estructura

```
apps/web/src/
├── app/                          → Next.js App Router
│   ├── admin/
│   │   ├── _actions.ts           → Server actions del panel admin
│   │   ├── settings/page.tsx
│   │   └── content/
│   │       ├── page.tsx
│   │       ├── new/page.tsx
│   │       └── [moduleId]/
│   │           ├── page.tsx
│   │           ├── edit/page.tsx
│   │           ├── lessons/[lessonId]/edit/page.tsx
│   │           └── vocab/new|[itemId]/edit/page.tsx
│   ├── kids/
│   │   ├── layout.tsx            → Carga tema y voz desde BD; wraps con providers
│   │   └── play/
│   │       ├── _actions.ts       → Server actions del juego (progreso, retos)
│   │       ├── page.tsx          → HOME del niño (mapa de módulos)
│   │       └── [moduleSlug]/
│   │           ├── page.tsx      → Detalle de módulo con tabs
│   │           └── [lessonSlug]/page.tsx → Motor de lección
│   ├── account/
│   │   ├── _actions.ts           → Server actions de cuenta e hijos
│   │   ├── profile/page.tsx
│   │   └── children/new|[id]/edit/page.tsx
│   └── actions/
│       └── auth.ts               → Login/logout (transversal, un solo archivo)
│
├── components/
│   ├── kids/                     → Experiencia del niño
│   │   ├── engine/               → Motor de juegos
│   │   │   ├── gamePool.ts       → GAME_REGISTRY + componentes React
│   │   │   ├── LessonEngine.tsx  → Orquestador de steps de lección
│   │   │   ├── MemoryGame.tsx
│   │   │   ├── RecognitionExercise.tsx
│   │   │   ├── SpeakingExercise.tsx
│   │   │   ├── SlideStep.tsx
│   │   │   ├── VideoStep.tsx
│   │   │   └── modifiers/
│   │   │       ├── ModifierContext.tsx   → Context de eventos (reportCorrect/Wrong)
│   │   │       └── ModifierStack.tsx    → Timer, vidas, multiplicador en runtime
│   │   ├── KidsModuleTabs.tsx
│   │   ├── KidsJugarTab.tsx
│   │   ├── KidsRetosTab.tsx
│   │   ├── KidsPalabrasTab.tsx
│   │   ├── KidsModuleCard.tsx
│   │   ├── VoicePresetProvider.tsx       → Context global de voz (Web Speech API)
│   │   └── ThemeButton.tsx
│   └── admin/                    → Componentes del panel de administración
│
└── lib/
    └── supabase/
        ├── client.ts             → Cliente browser (para 'use client')
        └── server.ts             → Cliente server (para server components y actions)
```

---

## 7. Server Actions — Co-localización

Las server actions son funciones de servidor que los componentes React pueden llamar directamente. En lugar de un archivo global `app/actions/admin.ts`, cada dominio tiene su propio `_actions.ts` co-localizado:

| Archivo | Contenido |
|---------|-----------|
| `app/admin/_actions.ts` | Módulos, lecciones, vocab, steps, settings, reordenar |
| `app/kids/play/_actions.ts` | Progreso de lecciones, retos, mastery de vocab |
| `app/account/_actions.ts` | Crear/editar/borrar hijos, actualizar perfil |
| `app/actions/auth.ts` | Login, logout, set-password (transversal) |

**¿Por qué el prefijo `_`?**
Next.js convierte cada carpeta en `app/` en una ruta URL. El prefijo `_` excluye el archivo del router de Next.js, convirtiéndolo en un módulo privado de ese segmento.

```
app/admin/page.tsx        → URL: /admin
app/admin/_actions.ts     → No es una URL, es solo un módulo TypeScript
```

### Anatomía de una server action

```typescript
// apps/web/src/app/kids/play/_actions.ts
'use server'  // ← esta directiva convierte el archivo en "server-only"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { WordResult } from '@strides/core/kids'

export async function recordVocabMastery(
  childId: string,
  wordResults: WordResult[]
) {
  const supabase = createClient()  // cliente autenticado con las cookies de la request

  const upserts = wordResults.map(wr => ({
    child_id: childId,
    vocab_id: wr.vocabId,
    attempt_count: 1,
    correct_count: wr.correct ? 1 : 0,
  }))

  await supabase
    .from('child_vocab_mastery')
    .upsert(upserts, { onConflict: 'child_id,vocab_id', ignoreDuplicates: false })

  revalidatePath('/kids/play')  // Next.js refresca el caché de esa ruta
}
```

Un componente cliente la llama directamente, como si fuera una función normal:

```typescript
// apps/web/src/components/kids/KidsRetosTab.tsx
'use client'
import { recordVocabMastery } from '@/app/kids/play/_actions'

function handleGameEnd(result: GameResult) {
  if (selectedChildId && result.wordResults?.length) {
    recordVocabMastery(selectedChildId, result.wordResults).catch(() => {})
    // esto se ejecuta en el SERVIDOR, aunque el código esté en un componente cliente
  }
}
```

---

## 8. La distinción GAME_REGISTRY vs GAME_POOL

Esta es la distinción más sutil del proyecto y merece su propia sección.

```
GAME_REGISTRY (packages/core)        GAME_POOL (apps/web)
─────────────────────────────        ────────────────────
Solo metadata.                       Metadata + componente React.
Sin imports de React.                Importa MemoryGame, RecognitionExercise...
Usable en admin, mobile, server.     Solo usable en la web.
```

```typescript
// packages/core/src/kids/games/registry.ts
export const GAME_REGISTRY = [
  { id: 'memory', emoji: '🃏', title: 'Memorama', minItems: 4, maxItems: 16 },
  { id: 'recognition', ... },
  { id: 'speaking', ... },
]

// apps/web/src/components/kids/engine/gamePool.ts
import { GAME_REGISTRY } from '@strides/core/kids'
import { MemoryGame } from './MemoryGame'
import { RecognitionExercise } from './RecognitionExercise'
import { SpeakingExercise } from './SpeakingExercise'

const COMPONENT_MAP = {
  memory: MemoryGame,
  recognition: RecognitionExercise,
  speaking: SpeakingExercise,
}

export const GAME_POOL = GAME_REGISTRY.map(meta => ({
  ...meta,
  component: COMPONENT_MAP[meta.id as keyof typeof COMPONENT_MAP],
}))

export type PoolEntry = (typeof GAME_POOL)[number]
```

**Regla de uso:**
- El **admin** (`RetoConfigForm`, `LessonStepBuilder`, `ModuleJugarConfigForm`) importa `GAME_REGISTRY` — solo necesita mostrar nombres en dropdowns.
- El **engine de juegos** (`KidsJugarTab`, `KidsRetosTab`) importa `GAME_POOL` — necesita el componente React para renderizarlo.

---

## 9. Flujo completo — Un niño completa una lección

Tomemos el caso más completo para ver todas las capas en acción:

```
1. USUARIO
   El niño termina el último ejercicio del último step.
   Toca el botón "¡Listo!".

2. UI — RecognitionExercise.tsx (Capa 4)
   onComplete(correct, total, wordResults) se llama.
   Los wordResults son: [{ vocabId: 'abc', correct: true }, ...]

3. UI — LessonEngine.tsx (Capa 4)
   Recibe onComplete. Calcula las estrellas (0-3).
   Llama a: completeLesson(childId, lessonId, stars, wordResults)
   Esta función viene de: @/app/kids/play/_actions

4. SERVER ACTION — _actions.ts (Capa 3)
   'use server' — corre en el servidor Next.js.
   Crea el cliente Supabase autenticado.
   Inserta/actualiza en child_lesson_completions.
   Llama a recordVocabMastery() con los wordResults.
   Llama a revalidatePath('/kids/play/[moduleSlug]').

5. BASE DE DATOS — Supabase (Capa 2 invocada)
   RLS verifica: "¿este user es el padre de este child_id?"
   Si OK, inserta las filas.
   Triggers de Supabase pueden actualizar stats.

6. UI — Actualización automática (Capa 4)
   Next.js recibe la señal de revalidación.
   El server component de la página re-corre.
   La lección ahora muestra ⭐⭐⭐ en lugar de gris.
   Animación de confetti (si aplica).
```

---

## 10. El sistema de voz — Integración entre capas

La funcionalidad de voz ilustra perfectamente cómo cada capa hace su parte:

```
packages/core/src/kids/speech/voicePresets.ts
  Define QUÉ voces existen y sus parámetros.
  No sabe nada del navegador.

  export type VoicePreset = 'man' | 'woman' | 'boy' | 'girl'
  export const VOICE_PRESET_CONFIGS = {
    man:   { pitch: 0.85, preferFemale: false, emoji: '👨', label: 'Hombre' },
    woman: { pitch: 1.1,  preferFemale: true,  emoji: '👩', label: 'Mujer'  },
    boy:   { pitch: 1.5,  preferFemale: false,  emoji: '👦', label: 'Niño'   },
    girl:  { pitch: 1.9,  preferFemale: true,  emoji: '👧', label: 'Niña'   },
  }
```

```
packages/core/src/kids/speech/rates.ts
  Define las velocidades de habla.

  export const SPEECH_RATE_NORMAL = 0.85
  export const SPEECH_RATE_SLOW   = 0.25
```

```
apps/web/src/app/admin/settings/page.tsx
  El admin elige la voz.
  Guarda 'voice_preset' en la tabla settings de Supabase.
```

```
apps/web/src/app/kids/layout.tsx
  Al cargar la app kids, lee 'voice_preset' de Supabase.
  Pasa el valor a <VoicePresetProvider preset={voicePreset}>.
```

```
apps/web/src/components/kids/VoicePresetProvider.tsx
  Implementa la integración con Web Speech API (browser).
  Lee los parámetros del core (pitch, preferFemale, rates).
  Expone useSpeak() hook para todos los componentes hijos.
```

```
apps/web/src/components/kids/engine/SlideStep.tsx
  Llama a useSpeak() — no sabe nada de cómo funciona la voz.
  const speak = useSpeak()
  speak('apple', { slow: false })
```

Así es como una decisión del admin (qué voz usar) llega hasta el niño sin que ningún componente de UI tenga lógica de negocio.

---

## 11. Dónde poner cada cosa — Guía rápida

| ¿Qué quiero agregar? | ¿Dónde va? |
|----------------------|------------|
| Un tipo TypeScript de dominio | `packages/core/src/kids/types.ts` |
| Configuración visual de un módulo | `packages/core/src/kids/moduleConfig.ts` |
| Un nuevo juego (metadata) | `packages/core/src/kids/games/registry.ts` (1 objeto) |
| Un nuevo juego (componente React) | `apps/web/src/components/kids/engine/NuevoJuego.tsx` + agregarlo a `gamePool.ts` |
| Una query a Supabase | `packages/db/src/queries/[dominio].ts` |
| Una acción del admin | `apps/web/src/app/admin/_actions.ts` |
| Una acción del juego/progreso | `apps/web/src/app/kids/play/_actions.ts` |
| Una acción de cuenta/hijos | `apps/web/src/app/account/_actions.ts` |
| Un componente visual de la app kids | `apps/web/src/components/kids/` |
| Un componente del panel admin | `apps/web/src/components/admin/` |
| Una nueva página | `apps/web/src/app/[ruta]/page.tsx` |

### La prueba del ácido

Antes de escribir código en cualquier archivo, hazte esta pregunta:

> **"¿Necesita este código saber sobre React, Next.js, o Supabase?"**
>
> - **No** → Va en `packages/core`
> - **Solo Supabase** → Va en `packages/db/queries/`
> - **Necesita Next.js (server-side) + Supabase** → Va en `_actions.ts`
> - **Necesita React** → Va en `components/`

---

## 12. El contenido vive en la base de datos

Strides está diseñado para que **agregar contenido nunca requiera un deploy**. Los módulos, lecciones, ejercicios, vocabulario, configuración de juegos y modificadores son todos filas en Supabase.

### Jerarquía de contenido

```
modules
  └── lessons  (orden dentro del módulo)
       └── lesson_steps  (posición dentro de la lección)
            ├── tipo: 'slide'    → config: { text_en, text_es, image_url? }
            ├── tipo: 'video'    → config: { url, caption? }
            └── tipo: 'exercise' → exercise_id FK →
                                   exercises
                                     └── exercise_items (orden)
                                          └── vocabulary_items FK
```

### Implicación práctica

- ¿Nuevo módulo? → Insert en `modules` desde el admin. Cero código.
- ¿Nueva lección? → Insert en `lessons` y sus `lesson_steps`. Cero código.
- ¿Cambiar qué juego usa el reto diario? → Update en `settings`. Cero código.
- ¿Agregar vocabulario? → Insert en `vocabulary_items`. Cero código.

El código nunca tiene datos de contenido hardcodeados.

---

## 13. Servicios externos

| Servicio | Uso en el código |
|----------|-----------------|
| **Supabase** | Auth, PostgreSQL, Storage. Acceso SOLO desde `packages/db` o server actions |
| **Web Speech API** | TTS y reconocimiento de voz. SOLO desde `VoicePresetProvider.tsx` |
| **Anthropic / OpenAI** | IA. SOLO desde `packages/core/ai/` o server actions. NUNCA desde el cliente |
| **Stripe** | Suscripciones (fase futura). SOLO desde server actions |

---

## 14. Reglas que NO se rompen

### Sin queries Supabase inline en componentes

```typescript
// ❌ MAL — mezcla UI con acceso a datos
export default async function MyPage() {
  const supabase = createClient()
  const { data } = await supabase.from('modules').select('*')  // NO
  return <ModuleList modules={data} />
}

// ✅ BIEN — usa la capa de queries
// packages/db/src/queries/modules.ts tiene getPublishedModules()
export default async function MyPage() {
  const supabase = createClient()
  const modules = await getPublishedModules(supabase)  // función del paquete db
  return <ModuleList modules={modules} />
}
```

### Sin React en `packages/core`

```typescript
// ❌ MAL — core no puede depender de React
import { useState } from 'react'  // NO en packages/core

// ✅ BIEN — core es TypeScript puro
export function getModuleConfig(slug: string): ModuleConfig {
  return MODULE_CONFIG[slug] ?? DEFAULT_MODULE_CONFIG
}
```

### Server actions co-localizadas

```typescript
// ❌ MAL — carpeta global de actions
import { updateChild } from '@/app/actions/children'

// ✅ BIEN — co-localizada con su dominio
import { updateChild } from '@/app/account/_actions'
```

### Sin lógica en componentes

```typescript
// ❌ MAL — lógica de negocio en UI
function GameOver({ result }: { result: GameResult }) {
  const stars = result.correct / result.total >= 0.8 ? 3
    : result.correct / result.total >= 0.4 ? 2 : 1
  // Esta lógica pertenece a una función del core o a la action
}

// ✅ BIEN — componente solo presenta
function GameOver({ stars, message }: { stars: number; message: string }) {
  return <div>{'⭐'.repeat(stars)} {message}</div>
}
```

### Nunca `any` en TypeScript

```typescript
// ❌ MAL
const config = settings['game_configs'] as any

// ✅ BIEN — tipo explícito
type GameConfigs = Record<string, { minItems?: number; maxItems?: number }>
const config = settings['game_configs'] as GameConfigs | null
```

---

## 15. La unidad de progreso del niño

Esto confunde a mucha gente al principio:

**La unidad de progreso es la LECCIÓN, no el módulo.**

```
child_lesson_completions    ← aquí se guarda el progreso
  child_id
  lesson_id
  stars (0-3)
  completed_at
```

No hay tabla `child_module_completions`. Si quieres saber si un niño "completó" un módulo, calculas si todas sus lecciones tienen al menos 1 estrella.

También hay:
```
child_vocab_mastery         ← progreso por palabra
  child_id
  vocab_id
  correct_count
  attempt_count

child_daily_challenges      ← reto diario completado
  child_id
  module_id
  date
  stars

child_countdown_attempts    ← intentos del contrarreloj (con límite semanal)
  child_id
  module_id
  attempted_at
```

---

## 16. Cómo agregar un juego nuevo — Paso a paso

Supón que quieres agregar un juego "Ordenar palabras":

**Paso 1 — Registrar en el core:**
```typescript
// packages/core/src/kids/games/registry.ts
export const GAME_REGISTRY: GameMeta[] = [
  // ... juegos existentes ...
  {
    id: 'word-order',
    emoji: '🔤',
    title: 'Ordenar',
    description: 'Pon las letras en orden',
    minItems: 3,
    maxItems: 8,
  },
]
```

**Paso 2 — Crear el componente React:**
```typescript
// apps/web/src/components/kids/engine/WordOrderGame.tsx
'use client'
import type { VocabItem, ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from './modifiers/ModifierContext'

interface Props {
  items: VocabItem[]
  onComplete: (correct: number, total: number, wordResults?: WordResult[]) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

export function WordOrderGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  // ... lógica del juego
}
```

**Paso 3 — Agregar al pool de la web:**
```typescript
// apps/web/src/components/kids/engine/gamePool.ts
import { WordOrderGame } from './WordOrderGame'

const COMPONENT_MAP = {
  memory: MemoryGame,
  recognition: RecognitionExercise,
  speaking: SpeakingExercise,
  'word-order': WordOrderGame,  // ← agregar aquí
}
```

Eso es todo. El admin ya puede seleccionar "Ordenar" en los dropdowns. El motor de juegos ya puede renderizarlo.

---

## 17. Glosario rápido

| Término | Significado en Strides |
|---------|------------------------|
| **Module** | Unidad temática de aprendizaje (e.g., "Animales", "Colores") |
| **Lesson** | Sesión dentro de un módulo, con varios steps ordenados |
| **LessonStep** | Un slide, video o ejercicio dentro de una lección |
| **Exercise** | Un juego específico (memory, recognition, speaking) vinculado a vocab |
| **VocabItem** | Una palabra con traducción, imagen y audio |
| **Modifier** | Regla que cambia la dinámica del juego (timer, lives, multiplier) |
| **Reto** | Desafío especial (diario, contrarreloj) con sus propias reglas |
| **Mastery** | Nivel de dominio de una palabra (0-3) basado en intentos correctos |
| **GAME_REGISTRY** | Metadata pura de juegos (sin React) — vive en `packages/core` |
| **GAME_POOL** | GAME_REGISTRY + componentes React — vive en `apps/web` |
| **Server Action** | Función de Next.js que corre en el servidor, llamable desde componentes cliente |
| **_actions.ts** | Archivo de server actions; el `_` lo excluye del router de Next.js |
| **Barrel (index.ts)** | Archivo que re-exporta todo lo de un directorio para simplificar imports |
| **Subpath export** | `@strides/core/kids` → ruta configurada en package.json exports |
| **RLS** | Row Level Security — Supabase verifica permisos a nivel de fila automáticamente |
| **revalidatePath** | Función de Next.js que invalida el caché de una ruta para que se refresque |
