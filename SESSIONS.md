# Stridess — Log de Sesiones

Resumen de decisiones y cambios por sesión.
Actualizado al final de cada sesión de trabajo.

---

## 2026-04-27 — Configuración + Ideación + Arquitectura MVP

### Configuración de Claude Code
- Configurado hook `Stop` en `.claude/settings.json` → genera `session_transcript.md` automáticamente al final de cada respuesta
- MCPs configurados en `.claude/settings.local.json` (gitignoreado): Supabase + GitHub
- Eliminado `Desktop/CLAUDE.md` que cargaba instrucciones incorrectas
- Script del hook en `~/.claude/scripts/update-stride-memory.js`

### Decisiones de producto
- **Target MVP**: niños 4–7 años, uso en casa, mercado Perú
- **Dos sub-tiers de UX**: 4–5 (visual/audio/arrastrar) y 6–7 (+ selección de letras)
- **Diferencial**: el niño produce lenguaje, no solo reconoce — termina el módulo diciendo frases reales
- **Regla de oro UX**: imagen + audio + palabra escrita siempre juntos, nunca texto solo
- **Edad no bloquea acceso**: controla el tier de UX via `min_age` en ejercicios
- **Modelo de precio**: pago por módulo en MVP (S/29–39), suscripción en Fase 4 cuando haya biblioteca suficiente
- **Adquisición**: colegio del hijo → grabaciones de niños hablando → TikTok/Reels

### Decisiones de arquitectura
- **Entitlements model**: tabla `user_module_access` — la app solo pregunta "¿tiene acceso?" sin importar cómo lo consiguió
- **Exercise registry pattern**: tipos de ejercicio como componentes registrados en un mapa, no lógica condicional
- **Contenido data-driven**: módulos, ejercicios y vocabulary items en BD — agregar contenido = insertar rows, no hacer deploy

### Archivos modificados
- `CLAUDE.md` — actualizado con decisiones de arquitectura MVP, sub-tiers, regla UX, entitlements, exercise registry
- `IDEAS.md` — reescrito con product brief completo, roadmap por fases, decisiones tomadas vs. pendientes
- `SESSIONS.md` — creado (este archivo)

### Pendiente próxima sesión
- Escribir SQL del schema completo de BD
- Incluir: roles/permisos (RLS), content_generation_jobs, config jsonb en exercises

---

## 2026-04-29 — Evaluación Supabase + Decisiones de arquitectura

### Evaluación del schema inicial
- Schema base evaluado: tablas, RLS, triggers, índices — estructura sólida
- Identificados gaps críticos: lecciones, streaks, progreso por lección, trigger `updated_at` en `child_word_status`

### Decisiones tomadas

#### Lecciones como nivel intermedio (módulo → lección → ejercicio)
- **Decisión**: agregar tabla `lessons` entre `modules` y `exercises`
- **Razón**: los módulos crecen con sub-temas (animales de granja, mascotas, del mar...). Sin lecciones, agregar contenido extiende la sesión obligatoria. Con lecciones, cada bloque temático es un checkpoint independiente — el niño puede completar una lección hoy y otra mañana.
- **Impacto**: la unidad de logro/celebración pasa a ser la lección, no el módulo completo.

#### Tabla `child_streaks`
- Agregada — faltaba aunque CLAUDE.md la listaba como funcionalidad core

#### Tabla `child_lesson_completions`
- Reemplaza la idea de `child_exercise_completions` — el tracking principal es por lección

### Archivos modificados
- `supabase/migrations/20260429000000_add_lessons_and_streaks.sql` — nueva migración
- `CLAUDE.md` — agregada decisión #5 sobre lecciones como unidad de logro
- `IDEAS.md` — actualizado flujo de aprendizaje con lecciones
- `SESSIONS.md` — este entry

### Storage buckets (pendiente configurar en Supabase)
- `module-covers` (público), `vocabulary-images` (público), `vocabulary-audio` (público), `child-recordings` (privado)

### Pendiente próxima sesión
- ~~Inicializar monorepo Turborepo~~ ✓ (hecho en sesión siguiente)

---

## 2026-04-29 (continuación) — Monorepo + Auth + Primeras pantallas

### Monorepo inicializado
- `root/package.json` + `turbo.json` + `pnpm-workspace.yaml` con Turborepo 2.5.4
- Packages: `packages/db`, `packages/core`, `packages/ui`
- Apps: `apps/web` (Next.js 14 App Router + TypeScript estricto)
- Comandos: `pnpm dev`, `pnpm typecheck`, `pnpm build`, `pnpm lint`, `pnpm test`

### Tipos Supabase generados
- Tipos generados vía CLI de Supabase contra el proyecto real (`ievftgzxiwtjocxnrmgv`)
- Guardados en `packages/db/src/types.generated.ts`
- Re-exportados como aliases en `packages/db/src/types.ts` (Profile, Child, Module, Lesson, etc.)

### Auth implementada
- `apps/web/src/middleware.ts` — protege `/kids`, `/teen`, `/adult`, `/admin`; redirige a `/login?next=`
- `apps/web/src/lib/supabase/server.ts` — `createClient()` síncrono con `@supabase/ssr`
- `apps/web/src/app/actions/auth.ts` — server actions `login`, `signup`, `logout`
- `apps/web/src/app/login/page.tsx` y `/signup/page.tsx` — formularios funcionales

### Primeras pantallas kids
- `apps/web/src/app/kids/layout.tsx` — guarda de auth + header con logout
- `apps/web/src/app/kids/page.tsx` — lista módulos publicados con `ModuleCard`
- `apps/web/src/app/kids/modules/[slug]/page.tsx` — detalle de módulo con lecciones via `LessonCard`

### Fix crítico: versión @supabase/ssr incompatible
- **Problema**: `@supabase/ssr` 0.6.1 usaba la firma vieja de 3 generics de `SupabaseClient`. `@supabase/supabase-js` 2.105.1 cambió la firma — todos los queries devolvían `never`.
- **Fix**: actualizar `@supabase/ssr` a `^0.10.2` (diseñado para `^2.102.1`). La nueva firma usa `Omit<Database, "__InternalSupabase">` que encaja exactamente con supabase-js 2.105.1.
- **Resultado**: `pnpm typecheck` pasa 4/4 paquetes limpio.

### Versiones fijadas (importante)
- `@supabase/ssr`: `^0.10.2`
- `@supabase/supabase-js`: `^2.102.1`
- No volver a usar `@supabase/ssr` < 0.10.0 con este schema de tipos.

### Agent skills instalados
- `supabase/agent-skills@supabase` — contexto general Supabase (auth, RLS, storage, queries)
- `supabase/agent-skills@supabase-postgres-best-practices` — buenas prácticas PostgreSQL/Supabase
- Ubicación: `.agents/skills/` + symlink a Claude Code. Activos en sesiones futuras automáticamente.

### Decisiones de arquitectura confirmadas (Q&A)
- **`profiles` vs `users`**: Supabase tiene `auth.users` interno. `profiles` es la extensión de negocio en `public`.
- **Sin contraseña en `profiles`**: las contraseñas las gestiona Supabase en `auth.users`. El trigger `handle_new_user()` crea el row en `profiles` automáticamente al registrarse.
- **Portabilidad**: datos y schema son 100% PostgreSQL estándar y portables. El único trabajo real al migrar sería reemplazar el sistema de auth (Supabase Auth → Clerk/Auth.js/etc.) — estimado ~1 semana, no un bloqueante arquitectural.

### Pendiente próxima sesión
- Levantar dev server y probar flujo de auth en browser (login → /kids → modules → lessons)
- Seed de datos: al menos 1 módulo + 2 lecciones desde Supabase Table Editor o SQL Editor
- Crear componentes `ModuleCard` y `LessonCard` con diseño real kids (colores, iconos, emojis)
- Configurar Storage buckets en Supabase (module-covers, vocabulary-images, vocabulary-audio, child-recordings)

---
