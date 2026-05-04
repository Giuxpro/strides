# Strides — AI Strategy

## Principio

Toda configuración de IA se guarda en tabla `settings` de Supabase. El código lee desde ahí — sin hardcodear provider ni modelo.

## Abstracción (`packages/core/ai/`)

```
provider.interface.ts   ← contrato único: generateContent(), chat()
anthropic.provider.ts   ← implementación Anthropic
openai.provider.ts      ← implementación OpenAI
index.ts                ← factory que lee provider activo desde BD
```

Nunca llamar al provider directamente desde componentes — siempre a través de server actions o API routes.
No importar `openai` o `@anthropic-ai/sdk` fuera de `packages/core/ai/`.

## Configuración en BD (`settings`)

| Key | Valores posibles |
|---|---|
| `ai_provider` | `anthropic` \| `openai` |
| `ai_model` | cualquier modelo soportado |
| `onboarding_flow` | `A` \| `B` |
| `trial_days` | número |

El modelo puede ser distinto por tarea (generación de contenido vs. tutor conversacional).

## Modelos soportados (`packages/core/ai/models.ts`)

| Provider | Modelos |
|---|---|
| Anthropic | `claude-haiku-4-5`, `claude-sonnet-4-6`, `claude-opus-4-7` |
| OpenAI | `gpt-4o-mini`, `gpt-4.1-mini`, `o4-mini` |
| Google | `gemini-2.0-flash-lite`, `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-pro` |

`ModelMetadata` hardcodeada en `models.ts` (precios y capacidades no cambian frecuente):
```typescript
interface ModelMetadata {
  id: string
  provider: 'anthropic' | 'openai'
  displayName: string
  inputCostPerMTok: number
  outputCostPerMTok: number
  contextWindow: number
  hasReasoning: boolean
  speed: 'fast' | 'medium' | 'slow'
  bestFor: string[]
  limitations: string[]
  description: string
}
```

## Cost Intelligence Layer (panel admin)

El selector de modelos traduce precios raw a métricas de negocio. Todo se calcula en cliente, sin llamadas al servidor.

**Supuestos configurables (se guardan en BD):**
- Mensajes/usuario/día (default: 20)
- Tokens/mensaje promedio (default: 500, 50% input / 50% output)
- Presupuesto mensual USD (default: $50)

**Cálculos:**
```
costo_por_mensaje   = (tokens_input × precio_input/MTok) + (tokens_output × precio_output/MTok)
costo_usuario_mes   = costo_por_mensaje × mensajes_día × 30
usuarios_por_budget = presupuesto_mensual / costo_usuario_mes
```

**Ejemplo con defaults:**

| Modelo | $/mensaje | $/usuario mes | Usuarios con $50 |
|---|---|---|---|
| gpt-4o-mini | $0.0002 | $0.11 | ~450 |
| gpt-4.1-mini | $0.0005 | $0.30 | ~165 |
| claude-haiku-4-5 | $0.0013 | $0.72 | ~69 |
| o4-mini | $0.0014 | $0.83 | ~60 |

Un botón "Ajustar supuestos" abre modal con sliders; recalcula en tiempo real.

## Estrategia de audio (costo mínimo)

- **Web Speech API** — TTS y reconocimiento de voz en web. Gratuito, nativo.
- **Expo Speech** — TTS en mobile. Gratuito, nativo del dispositivo.
- **Audios estáticos en Storage** — solo para fonemas o contenido grabado una vez.
- **Tutor conversacional (adult)** — usa provider activo con prompt caching y límite duro de tokens por sesión.

No usar audio externo pagado si Web Speech API cubre el caso.
