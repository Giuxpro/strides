# Strides — Product

## Qué es
App de aprendizaje de inglés con tres facetas de usuario, modelo de suscripción, y contenido híbrido (manual + IA). Web primero, luego mobile nativo con React Native.

## Facetas de usuario

| Faceta | Ruta | Público | UX |
|---|---|---|---|
| Kids | `/kids` | Niños 4–7 años (MVP) | Visual, juegos, Lottie, colores vivos |
| Teen | `/teen` | 10–17 años | Formal, narrativa, menos juego |
| Adult | `/adult` | Adultos | Tutor IA opcional, sub-perfiles: general y profesional |

**Kids sub-tiers:**
- 4–5: visual/audio/arrastrar
- 6–7: + selección de letras
- Sin texto en instrucciones — solo audio + iconos

Cada faceta tiene tema de UI propio. Progreso, rachas y reportes son compartidos.

## Modelo de negocio

Suscripción con dos flujos configurables desde admin (sin deploy):
- **Flujo A**: Onboarding → Pago → App
- **Flujo B**: Onboarding → Trial (N días) → App → Pago al vencer

Modelo de asientos por suscripción (households):
```
Account (titular que paga)
 ├── Asiento 1: el titular (siempre incluido)
 ├── Asiento 2: incluido en el plan base (configurable)
 └── Asiento 3+: extras de pago (precio menor, configurable)
```

Settings configurables en BD: `household_included_seats`, `household_extra_seat_price`, `household_max_seats`.

## Contenido

Tres modos configurables desde admin:
- **Manual**: admin crea y edita lecciones
- **IA**: proveedor activo genera dado parámetros (nivel, tema, tipo), se guarda en BD
- **Mixto** (recomendado): IA genera, admin revisa y aprueba antes de publicar

El usuario nunca llama a la IA directamente.

## Funcionalidades core

- Progreso por lección y por faceta
- Sistema de rachas (streaks)
- Reportes de avance del usuario
- Panel admin: gestión de contenido, configuración de onboarding/trial, toggle manual/IA

## Regla de oro UX niños

**Nunca mostrar texto solo.** Siempre los tres juntos: imagen + audio + palabra escrita simultáneos.
Las instrucciones de navegación son solo audio + iconos — nunca texto.

## Lecciones como unidad de logro

La unidad de progreso y celebración es **la lección**, no el módulo.

```
Módulo: Animales
  Lección 1: Animales de granja   → [cerdo, vaca, gallina, pato]
  Lección 2: Mascotas             → [perro, gato, conejo]
  Lección 3: Animales del mar     → [pez, tiburón, delfín]
```

Los niños tienen atención corta — necesitan checkpoints frecuentes.
El progreso se trackea en `child_lesson_completions`. El módulo se "completa" cuando todas sus lecciones publicadas tienen `passed = true`.
