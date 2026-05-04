# Strides — Design

## UI Frameworks

| Framework | Uso |
|---|---|
| Tailwind CSS | Web |
| NativeWind | Mobile (mismas clases que Tailwind) |
| Framer Motion | Animaciones web (teens/adultos) |
| Lottie | Animaciones web+mobile (niños) |

## Faceta Kids — Cosmic Playground

**Fondo:** `#050714` dark space con aurora blobs (violeta, cyan, rosa) y estrellas CSS animadas.

**Font:** Baloo 2 (Google Fonts), aplicada en `kids/layout.tsx`.

**Cards de módulos:** gradiente por slug, emoji flotante, hover scale + glow.

**Racha:** badge ámbar con `animate-pulse-glow`, visible solo si `current_streak > 0`.

**Animaciones en `globals.css`:**
- `twinkle` — estrellas decorativas
- `float` — emojis flotantes
- `slide-up` — entrada de títulos
- `pop-in` — aparición de cards
- `pulse-glow` — badge de racha

**Cards de lección (`LessonCard`):**
- PNG completa 1380×752, fondo transparente, ratio 1.835
- `drop-shadow` con `filter` CSS — sigue la forma del PNG, no el bounding box
- Hover: `-translate-y-2 scale-[1.04]`; active: `translate-y-1 scale-[0.97]`
- Dimensión renderizada: 290px × 149px
- Botón "IR 🐾" con gradiente crema y sombra dorada
- Estrellas ⭐⭐⭐ con `opacity: 0.28` si no completada

**Layout de módulo (`/kids/play/[moduleSlug]`):**
- `flex flex-wrap justify-center gap-8` — cards centradas, wrapping en filas
- No usar `snap-x` con `flex-wrap` — se contradicen

## Variables CSS kids

```css
--kids-bg            /* fondo principal */
--kids-text          /* texto principal */
--kids-text-muted    /* texto secundario */
--kids-blob-1/2/3    /* colores de los blobs de fondo */
```

Definidas en `globals.css`, aplicadas en el layout de kids.

## Principio UX niños

Nunca texto solo. Siempre: imagen + audio + texto escrito juntos.
Instrucciones: solo audio + iconos, sin texto.
