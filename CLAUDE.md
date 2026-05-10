# Strides — Guía para Claude

App de aprendizaje de inglés. Web (Next.js 14) + Mobile (Expo). Tres facetas: `/kids` (MVP), `/teen`, `/adult`.

> Documentación detallada en `docs/`: PRODUCT · ARCHITECTURE · SUPABASE · AI_STRATEGY · DESIGN

## Convenciones de código

- TypeScript estricto en todo el monorepo. Sin `any`.
- Componentes en PascalCase, funciones y variables en camelCase.
- Rutas de Next.js en kebab-case.
- Toda lógica de negocio va en `packages/core`, no en los apps.
- Las queries a Supabase van en `packages/db/src/queries/`, nunca inline en páginas ni componentes.
- Variables de entorno con prefijo por servicio: `SUPABASE_*`, `STRIPE_*`, `ANTHROPIC_*`.

## Comandos principales

```bash
pnpm dev                 # web + mobile
pnpm dev --filter web    # solo web
pnpm typecheck           # TypeScript en todo el monorepo
pnpm lint
pnpm build
```

## Estructura de packages

### `packages/core` — lógica pura, sin React ni Next.js
- `@strides/core/ai` — providers, modelos, interfaces IA
- `@strides/core/exercises` — EXERCISE_REGISTRY, tipos de ejercicio
- `@strides/core/kids` — VocabItem, ModuleConfig, ModifierConfig, speechRates, voicePresets, theme, GAME_REGISTRY, RETO_REGISTRY

### `packages/db` — toda comunicación con Supabase
- Los tipos generados viven en `src/types.generated.ts`
- Las queries van en `src/queries/` como funciones que reciben el cliente como parámetro
- Subdivisión: `modules.ts · lessons.ts · vocab.ts · children.ts · settings.ts · progress.ts`

## Server actions — co-ubicación obligatoria

El prefijo `_` excluye el archivo del router de Next.js. Nunca usar `app/actions/` salvo auth.

| Dominio | Archivo |
|---|---|
| Admin (módulos, lecciones, vocab, steps, settings) | `app/admin/_actions.ts` |
| Cuenta (hijos, perfil) | `app/account/_actions.ts` |
| Kids play (progreso, retos, completions) | `app/kids/play/_actions.ts` |
| Auth — transversal | `app/actions/auth.ts` |

## Reglas de arquitectura — no romper sin discutir

- La app nunca pregunta "¿cómo pagó?". Solo consulta `user_module_access` o `has_module_access()`.
- Los tipos de ejercicio se registran en `EXERCISE_REGISTRY` (`packages/core/exercises/registry.ts`), nunca con lógica condicional.
- La unidad de progreso del niño es la **lección**, no el módulo. Se trackea en `child_lesson_completions`.
- Contenido (módulos, lecciones, ejercicios) vive en BD. Agregar contenido = insertar rows, no deploy.
- UX kids: nunca texto solo — siempre imagen + audio + texto escrito juntos.
- `GAME_REGISTRY` (de `@strides/core/kids`) es metadata pura sin React. `gamePool.ts` (en web) lo extiende con componentes React. Admin importa de core; engine importa de gamePool.

## Lo que NO hacer

- No llamar a APIs de IA desde el cliente — solo desde server actions o API routes.
- No hardcodear provider de IA, modelo, duración del trial ni flujo de onboarding — siempre desde BD.
- No importar `openai` o `@anthropic-ai/sdk` fuera de `packages/core/ai/`.
- No verificar método de pago en UI — solo verificar `user_module_access`.
- No poner lógica de Stripe en componentes — va en `packages/core` o server actions.
- No usar audio externo pagado si Web Speech API cubre el caso.
- No escribir queries Supabase inline en páginas o componentes — usar `packages/db/queries/`.
- No crear server actions en `app/actions/` salvo `auth.ts`.
