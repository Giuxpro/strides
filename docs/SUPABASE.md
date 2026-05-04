# Strides — Supabase

## Tablas principales

| Tabla | Propósito |
|---|---|
| `modules` | Módulos de contenido (`slug`, `is_published`, `order`) |
| `lessons` | Lecciones por módulo (`cover_url`, `min_age`, `is_published`, `order`) |
| `lesson_steps` | Pasos ordenados de una lección (`step_type`, `position`, `exercise_id?`) |
| `exercises` | Ejercicios individuales (`type`, `phase`) |
| `exercise_items` | Items de un ejercicio (`image_url`, `audio_url`, `text`, `min_age`) |
| `vocabulary_items` | Vocab a nivel de módulo (`text_es`, `text_en`, `image_url`) |
| `profiles` | Perfil del usuario titular (`role: 'parent' \| 'admin'`, `display_name`, `avatar`) |
| `children` | Perfiles de niños vinculados al titular |
| `households` | Agrupa titular + miembros bajo una suscripción |
| `household_members` | Vincula profiles y children al household |
| `user_module_access` | Entitlements (`access_type`, `expires_at`) |
| `child_lesson_completions` | Progreso por lección (`passed`, `score`) |
| `child_word_status` | Estado de cada palabra (`unseen \| learning \| mastered`) |
| `child_streaks` | Racha de actividad diaria |
| `evaluation_results` | Resultado de evaluación de módulo completo |
| `recordings` | Grabación final del niño (1 por módulo, última) |
| `settings` | Config global: provider IA, flujo onboarding, trial days, household config |

## Funciones RPC

- `get_or_create_household(user_id)` — crea o devuelve el household del titular
- `has_module_access(user_id, module_id)` — verifica entitlement (usar siempre esto, nunca lógica manual)
- `grant_free_module_access(user_id, module_id)` — otorga acceso gratuito

## Auth

- Contraseñas en `auth.users` (esquema interno Supabase) — nunca en `profiles`
- Trigger `handle_new_user()` crea row en `profiles` con `role = 'parent'` al registrar
- El trigger tiene `set search_path = public` — sin esto falla
- Auth callback usa PKCE con `verifyOtp({ type, token_hash })` — no `exchangeCodeForSession`
- `NEXT_PUBLIC_SUPABASE_URL` sin trailing slash — con `/` el SDK construye rutas dobles

## Storage buckets

| Bucket | Visibilidad | Contenido |
|---|---|---|
| `lesson-cards` | público | Ilustraciones PNG de lecciones (1380×752) |
| `module-covers` | público | Covers de módulos |
| `vocabulary-images` | público | Imágenes de vocabulario |
| `vocabulary-audio` | público | Audios de vocabulario |
| `child-recordings` | privado | Grabaciones de niños |

`vocabulary_items` actuales usan OpenMoji CDN: `https://openmoji.org/data/color/svg/{codepoint}.svg`

## Migraciones aplicadas

| Archivo | Qué hace |
|---|---|
| `20260427000000_initial_schema.sql` | Schema base, 15 tablas, RLS, settings seed |
| `20260429000000_add_lessons_and_streaks.sql` | lessons, child_lesson_completions, child_streaks |
| `20260430000000_add_households.sql` | households, household_members, RPCs |
| `20260430000001_add_display_name_to_profiles.sql` | profiles.display_name |
| `20260430000002_add_avatar_to_profiles.sql` | profiles.avatar |
| `20260430000003_add_updated_at_missing_tables.sql` | triggers updated_at |
| `20260501000000_add_lesson_steps.sql` | lesson_steps + step_type enum |
| `20260503000000_add_cover_url_to_lessons.sql` | lessons.cover_url — **pendiente ejecutar** |

## Gotchas

- Usar `@supabase/ssr ^0.10.2` con `@supabase/supabase-js ^2.102.1`. Versiones anteriores de ssr dan tipo `never` en todos los queries.
- Join desde `lesson_steps` a `exercises` requiere hint explícito: `exercises!lesson_steps_exercise_id_fkey(...)` (hay dos FKs en la tabla).
- `lesson_steps` y el enum `step_type` se añadieron manualmente a `packages/db/src/types.generated.ts` — pendiente regenerar con `supabase gen types`.
- Para hacer admin: `UPDATE profiles SET role = 'admin' WHERE email = '...';` en SQL Editor.

## Tipos generados

El archivo fuente de verdad es `packages/db/src/types.generated.ts`.
Regenerar tras migraciones: `supabase gen types typescript --local > packages/db/src/types.generated.ts`
