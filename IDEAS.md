# Stridess — Ideas & Visión de Producto

> Documento vivo. No es el plan definitivo.
> Captura ideas en bruto, lo que está sólido y lo que aún necesita vuelta.
> Actualizar cada vez que surja algo nuevo en sesiones de ideación.

---

## 🎯 PRODUCTO ACTUAL — Decisiones tomadas (MVP F1)

### Target
- **Niños 4–7 años**, uso en casa (no colegios)
- Dos sub-tiers de UX por edad:
  - **4–5 años**: solo visual + audio + arrastrar/tocar. Cero lectura requerida.
  - **6–7 años**: lo anterior + seleccionar letras para completar palabras (no escritura libre)
- Cliente real: el **padre/madre** que paga. El usuario es el niño.

### Mercado
- **Perú primero** (Lima como beachhead), con potencial de expansión a Latin America vía contenido digital.

### Diferencial central
> El niño no solo reconoce palabras — las produce. Termina el módulo y puede decir frases reales.

Las apps actuales (Duolingo, Lingokids) entrenan reconocimiento. Strides entrena producción.

### Principio de UX — regla de oro
**Nunca texto solo. Siempre los tres juntos:**
```
imagen + audio + palabra escrita simultáneos
🐷  →  "pig"  →  PIG
```
- El niño no necesita saber leer para avanzar
- La asociación imagen→sonido→letra ocurre de forma pasiva por exposición repetida
- Las instrucciones de navegación son solo audio + iconos, nunca texto

### Momentos padre-hijo (diseñados en el flujo, no opcionales)
| Momento | Qué pasa |
|---|---|
| Fin de módulo | El niño llama al padre para mostrar la grabación |
| Evaluación aprobada | Celebración diseñada para ser compartida |
| Reporte semanal | Email al padre con palabras aprendidas y progreso |

La grabación final del niño hablando en inglés es el **motor de marketing orgánico** — el padre la comparte. Ese video es el TikTok.

### Modelo de negocio (fases)
- **MVP**: pago por módulo. S/29–39 por módulo (no competir en precio, posicionarse en resultado).
- **Fase 4+**: suscripción mensual con biblioteca completa.
- Primeros días gratis como enganche → desbloqueo pago.

### Adquisición
1. Padres del colegio del hijo → primeros 10–20 usuarios reales con feedback
2. Grabaciones de niños hablando inglés → contenido para TikTok/Reels
3. Escala orgánica vía contenido

---

## 🧱 ESTRUCTURA DEL MVP

### Tema: Animales
El módulo "Animales" se divide en lecciones temáticas. Cada lección = un checkpoint de logro.
El niño puede completar una lección hoy y otra mañana.

**Lecciones del MVP:**
| Lección | Vocabulario |
|---------|-------------|
| Animales de granja | pig, cow, chicken, duck |
| Mascotas | dog, cat, rabbit |

**Frases objetivo:** "This is a pig" / "This is a dog" / "I like animals"

### Flujo de aprendizaje (por lección)
```
🎮 Juego de memoria (enganche)
👂 Reconocimiento (escuchar + identificar imagen)
🗣️ Producción (escuchar frase → repetir → grabar)
📊 Evaluación de lección (≥70% = aprobado)
🎥 Grabación final (solo al completar el módulo entero)
```

La **unidad de logro y celebración es la lección**. El módulo se completa cuando todas
sus lecciones están aprobadas — ese es el momento de la grabación final.

### Tipos de interacción en MVP (solo 3)
1. **Juego de memoria** — asociar imagen ↔ palabra. Audio al seleccionar. Siempre imagen + audio + texto.
2. **Reconocimiento** — escuchar palabra, seleccionar imagen correcta
3. **Habla** — escuchar frase, repetir, grabar voz

### Evaluación (por lección)
- 5 ejercicios (2 reconocimiento + 2 memoria + 1 habla)
- ≥70%: aprobado → celebración → siguiente lección o grabación final si fue la última
- <70%: redirige directamente a los ejercicios fallados

### Progreso por palabra
- Sin ver / Aprendiendo / Dominada

---

## 🚀 ROADMAP

### Fase 1 — MVP
- 1 tema (animales), 3 tipos de interacción, evaluación simple, grabación final
- Sistema de progreso por palabra
- Reporte básico por email al padre

### Fase 2 — Expansión de contenido
- Nuevos temas: colores, números, familia, el cuerpo, comida
- Nuevos tipos de juego: ordenar, completar, selección múltiple

### Fase 3 — Mejora de UX y producto
- Feedback básico de pronunciación (IA)
- Panel de palabras visual para el niño (álbum coleccionable)
- Dashboard para padres con métricas

### Fase 4 — Modelo de suscripción
- Biblioteca completa de contenidos
- Suscripción mensual reemplaza pago por módulo
- Sistema adaptativo básico

### Fase 5 — IA avanzada
- Evaluación de pronunciación real
- Mini conversaciones guiadas con tutor IA
- Contenido generado/personalizado por IA

---

## 🔄 Ideas con buena dirección — para fases posteriores

**Indicador de capacidades desbloqueadas**
No solo "aprendiste 10 palabras" sino qué puede hacer el niño con eso:
> "Ya puedes presentarte en inglés" / "Ya puedes nombrar 5 animales"
Pendiente: definir umbrales creíbles, no arbitrarios.

**Modo juega con papá/mamá**
El padre muestra la flashcard, el niño dice la palabra. Sin evaluación de IA, solo el padre valida.
Refuerza el vínculo y extiende el aprendizaje fuera de la app.

**Sesión con tutor real como recompensa** (Fase 3+)
Completar módulo → desbloquea sesión con tutor verificado.
Problema operacional pendiente: reclutamiento, verificación, pagos, escala.
Para MVP: Calendly/Cal.com con tutor manual.

**Comparativa social opcional para padres**
"Tu hijo está en el top 30% de su rango de edad."
Pendiente: si motiva o genera ansiedad. No va en MVP.

---

## ❌ Fuera del MVP

- Videos musicales interactivos
- Sistema adaptativo complejo
- IA conversacional
- Sala de reuniones propia
- Chat in-app
- Tutores a escala
- Contenido generado por usuarios
- Múltiples verticales de adultos / teens (eso viene después de validar F1)

---

## ❓ Preguntas abiertas (no bloqueantes para MVP)

- ¿Qué pasa cuando el niño llega a 7 años y outgrows la app? ¿Hay transición a F2 (teens)?
- ¿Cómo se diferencia la UX para un niño de 4 vs uno de 7 dentro del mismo tier?
- ¿B2C solo o hay potencial B2B (colegios, academias) en una fase posterior?
- ¿Cómo evitar que la grabación final se sienta como presión para el niño?

---

_Última actualización: 2026-04-27_
