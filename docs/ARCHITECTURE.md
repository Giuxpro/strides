# Strides — Architecture

## Monorepo (Turborepo)

```
apps/
  web/       → Next.js 14 (App Router) + TypeScript
  mobile/    → Expo + React Native + TypeScript
packages/
  ui/        → Componentes compartidos web+mobile
  core/      → Lógica de negocio compartida
  db/        → Tipos y queries de Supabase
```

## Servicios externos

| Servicio | Uso |
|---|---|
| Supabase | Auth, PostgreSQL, Storage, Realtime |
| Stripe | Suscripciones, trials configurables |
| Anthropic API | Proveedor IA (seleccionable desde admin) |
| OpenAI API | Proveedor IA alternativo |
| Web Speech API | TTS y reconocimiento de voz (gratuito, nativo) |

## Jerarquía de contenido (BD)

```
modules → lessons → lesson_steps → exercises → exercise_items → vocabulary_items
```

`vocabulary_items` está a nivel de módulo. `lesson_steps` define el flujo ordenado dentro de cada lección.

## Decisiones de arquitectura — MVP F1 (no romper sin discutir)

### 1. Entitlements para acceso a módulos

La app nunca pregunta "¿cómo pagó?". Solo consulta `user_module_access`:

```sql
user_module_access (
  user_id, module_id,
  access_type: 'free' | 'purchased' | 'subscription',
  expires_at: timestamp | null  -- null = permanente
)
```

Stripe (Fase 4) solo crea/renueva rows aquí — el resto de la app no cambia.

### 2. Exercise registry pattern

Los tipos de ejercicio son componentes registrados en un mapa, nunca lógica condicional:

```typescript
// packages/core/exercises/registry.ts
export const EXERCISE_REGISTRY: Record<string, ExerciseComponent> = {
  memory:      MemoryGame,
  recognition: RecognitionExercise,
  speaking:    SpeakingExercise,
}
// Motor: const Component = EXERCISE_REGISTRY[exercise.type]
```

Agregar tipo nuevo = nuevo componente + una línea. Cero cambios en código existente.

### 3. Contenido data-driven

Módulos, lecciones y ejercicios viven en BD, no en código.
Agregar contenido = insertar rows, no hacer deploy.

`min_age` en `exercise_items` controla el sub-tier visible — no hay condicionales en componentes.
La edad nunca bloquea acceso, solo determina el tier de UX.

## Rutas de la app

```
/login, /signup, /select-profile
/account/profile, /account/children/new, /account/children/[id]/edit

/kids/play                               ← HOME del niño
/kids/play/[moduleSlug]                  ← lista de lecciones
/kids/play/[moduleSlug]/[lessonSlug]     ← motor de pasos (LessonEngine)
/kids/play/[moduleSlug]/result           ← resultado de módulo

/admin                                   ← dashboard
/admin/content                           ← módulos
/admin/content/[moduleId]                ← lecciones + vocab
/admin/content/[moduleId]/lessons/[id]/edit  ← builder de pasos
/admin/settings                          ← IA + onboarding config

/adult, /teen                            ← futuro
```

## lesson_steps — tipos

| step_type | Componente | Config keys |
|---|---|---|
| `video` | `VideoStep` | `url`, `caption?` |
| `slide` | `SlideStep` | `text_en`, `text_es`, `image_url?` |
| `exercise` | `MemoryGame` / `RecognitionExercise` | — (via `exercise_id` FK) |

## Evaluación

- **Por lección**: palabras de esa lección → guarda en `child_lesson_completions`
- **Por módulo**: mezcla de todas las lecciones → guarda en `evaluation_results`
- Ambos usan `exercise_phase: 'evaluation'` + tipo `recognition`
