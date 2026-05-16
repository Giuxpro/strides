import type { Config } from '@measured/puck'
import type {
  HeroBlockProps, FeatureBlockProps, CTABlockProps,
  StatsBlockProps, BenefitsBlockProps, HowItWorksBlockProps,
  TestimonialBlockProps, VideoBlockProps,
  GamePreviewBlockProps, BeforeAfterBlockProps, SocialProofBlockProps,
} from '@strides/core/kids'
import { HeroBlock }        from './blocks/HeroBlock'
import { FeatureBlock }     from './blocks/FeatureBlock'
import { CTABlock }         from './blocks/CTABlock'
import { StatsBlock }       from './blocks/StatsBlock'
import { BenefitsBlock }    from './blocks/BenefitsBlock'
import { HowItWorksBlock }  from './blocks/HowItWorksBlock'
import { TestimonialBlock } from './blocks/TestimonialBlock'
import { VideoBlock }       from './blocks/VideoBlock'
import { GamePreviewBlock } from './blocks/GamePreviewBlock'
import { BeforeAfterBlock } from './blocks/BeforeAfterBlock'
import { SocialProofBlock } from './blocks/SocialProofBlock'

type PuckComponents = {
  Hero:         HeroBlockProps
  Feature:      FeatureBlockProps
  CTA:          CTABlockProps
  Stats:        StatsBlockProps
  Benefits:     BenefitsBlockProps
  HowItWorks:   HowItWorksBlockProps
  Testimonial:  TestimonialBlockProps
  Video:        VideoBlockProps
  GamePreview:  GamePreviewBlockProps
  BeforeAfter:  BeforeAfterBlockProps
  SocialProof:  SocialProofBlockProps
}

export const puckConfig: Config<PuckComponents> = {
  components: {

    Hero: {
      fields: {
        emoji:      { type: 'text',     label: 'Emoji central' },
        title:      { type: 'textarea', label: 'Título principal' },
        subtitle:   { type: 'textarea', label: 'Subtítulo' },
        bgGradient: { type: 'text',     label: 'Fondo CSS (gradient o color)' },
        showBadge:  { type: 'radio',    label: 'Mostrar badge', options: [{ label: 'Sí', value: 'true' }, { label: 'No', value: 'false' }] },
        badgeText:  { type: 'text',     label: 'Texto del badge' },
      },
      defaultProps: {
        emoji:      '🚀',
        title:      'El inglés que tu hijo PEDIRÁ aprender',
        subtitle:   'Aventuras, juegos y retos que hacen que aprender inglés sea lo mejor del día',
        bgGradient: 'oklch(0.09 0.025 280)',
        showBadge:  true,
        badgeText:  '✨ Precio de fundadores — el precio sube al lanzamiento',
      },
      render: HeroBlock,
    },

    Feature: {
      fields: {
        emoji:       { type: 'text',     label: 'Emoji' },
        title:       { type: 'text',     label: 'Título' },
        description: { type: 'textarea', label: 'Descripción' },
        accentColor: { type: 'text',     label: 'Color acento (oklch o hex)' },
      },
      defaultProps: {
        emoji:       '🎮',
        title:       'Aprenden sin darse cuenta',
        description: 'Los juegos de Strides están diseñados para que los niños quieran seguir jugando. El inglés llega solo.',
        accentColor: 'oklch(0.55 0.22 290)',
      },
      render: FeatureBlock,
    },

    CTA: {
      fields: {
        label:   { type: 'text',   label: 'Texto del botón' },
        href:    { type: 'text',   label: 'Enlace' },
        variant: {
          type:    'select',
          label:   'Estilo',
          options: [
            { label: 'Principal (violeta)', value: 'primary' },
            { label: 'Secundario (blanco)', value: 'secondary' },
          ],
        },
      },
      defaultProps: {
        label:   'Empezar ahora →',
        href:    '/signup',
        variant: 'primary' as const,
      },
      render: CTABlock,
    },

    Stats: {
      fields: {
        stat1Emoji:  { type: 'text', label: 'Stat 1 — emoji' },
        stat1Number: { type: 'text', label: 'Stat 1 — número' },
        stat1Label:  { type: 'text', label: 'Stat 1 — etiqueta' },
        stat2Emoji:  { type: 'text', label: 'Stat 2 — emoji' },
        stat2Number: { type: 'text', label: 'Stat 2 — número' },
        stat2Label:  { type: 'text', label: 'Stat 2 — etiqueta' },
        stat3Emoji:  { type: 'text', label: 'Stat 3 — emoji' },
        stat3Number: { type: 'text', label: 'Stat 3 — número' },
        stat3Label:  { type: 'text', label: 'Stat 3 — etiqueta' },
      },
      defaultProps: {
        stat1Emoji:  '🎮',
        stat1Number: '500+',
        stat1Label:  'palabras que aprenderá tu hijo',
        stat2Emoji:  '⭐',
        stat2Number: '10',
        stat2Label:  'tipos de juegos distintos',
        stat3Emoji:  '🏆',
        stat3Number: '4–12',
        stat3Label:  'años de edad ideal',
      },
      render: StatsBlock,
    },

    Benefits: {
      fields: {
        title:         { type: 'textarea', label: 'Título de sección' },
        benefit1Emoji: { type: 'text',     label: 'Beneficio 1 — emoji' },
        benefit1Title: { type: 'text',     label: 'Beneficio 1 — título' },
        benefit1Sub:   { type: 'textarea', label: 'Beneficio 1 — subtexto' },
        benefit2Emoji: { type: 'text',     label: 'Beneficio 2 — emoji' },
        benefit2Title: { type: 'text',     label: 'Beneficio 2 — título' },
        benefit2Sub:   { type: 'textarea', label: 'Beneficio 2 — subtexto' },
        benefit3Emoji: { type: 'text',     label: 'Beneficio 3 — emoji' },
        benefit3Title: { type: 'text',     label: 'Beneficio 3 — título' },
        benefit3Sub:   { type: 'textarea', label: 'Beneficio 3 — subtexto' },
        benefit4Emoji: { type: 'text',     label: 'Beneficio 4 — emoji' },
        benefit4Title: { type: 'text',     label: 'Beneficio 4 — título' },
        benefit4Sub:   { type: 'textarea', label: 'Beneficio 4 — subtexto' },
      },
      defaultProps: {
        title:         '¿Por qué Strides funciona?',
        benefit1Emoji: '🎮',
        benefit1Title: 'Aprenden jugando',
        benefit1Sub:   'Sin memorización forzada. El cerebro retiene mejor lo que disfruta.',
        benefit2Emoji: '🎤',
        benefit2Title: 'Pronunciación real',
        benefit2Sub:   'Reconocimiento de voz que entrena el oído desde el primer día.',
        benefit3Emoji: '⭐',
        benefit3Title: 'Progreso visible',
        benefit3Sub:   'Tu hijo ve sus logros. Eso mantiene la motivación encendida.',
        benefit4Emoji: '🏠',
        benefit4Title: 'Multiusuario',
        benefit4Sub:   'Varios hijos en una cuenta. Cada uno con su propio avance.',
      },
      render: BenefitsBlock,
    },

    HowItWorks: {
      fields: {
        title:      { type: 'text',     label: 'Título de sección' },
        step1Emoji: { type: 'text',     label: 'Paso 1 — emoji' },
        step1Title: { type: 'text',     label: 'Paso 1 — título' },
        step1Desc:  { type: 'textarea', label: 'Paso 1 — descripción' },
        step2Emoji: { type: 'text',     label: 'Paso 2 — emoji' },
        step2Title: { type: 'text',     label: 'Paso 2 — título' },
        step2Desc:  { type: 'textarea', label: 'Paso 2 — descripción' },
        step3Emoji: { type: 'text',     label: 'Paso 3 — emoji' },
        step3Title: { type: 'text',     label: 'Paso 3 — título' },
        step3Desc:  { type: 'textarea', label: 'Paso 3 — descripción' },
      },
      defaultProps: {
        title:      'Así de simple es comenzar',
        step1Emoji: '📱',
        step1Title: 'Crea la cuenta en 2 minutos',
        step1Desc:  'Sin datos innecesarios. Solo tu email y el perfil de tu hijo.',
        step2Emoji: '🗺️',
        step2Title: 'Elige el módulo',
        step2Desc:  'Animales, colores, familia y más. Tu hijo elige la aventura.',
        step3Emoji: '🎮',
        step3Title: '¡A jugar y aprender!',
        step3Desc:  'Juegos, retos y logros que harán que pida seguir aprendiendo.',
      },
      render: HowItWorksBlock,
    },

    Testimonial: {
      fields: {
        quote:   { type: 'textarea', label: 'Testimonio' },
        author:  { type: 'text',     label: 'Nombre' },
        role:    { type: 'text',     label: 'Rol (ej: Mamá de Lucas, 6 años)' },
        avatar:  { type: 'text',     label: 'Emoji de avatar' },
        metric:  { type: 'text',     label: 'Métrica (ej: 80 palabras en 3 semanas)' },
        bgColor: { type: 'text',     label: 'Fondo CSS' },
      },
      defaultProps: {
        quote:   'Mi hijo lleva un mes con Strides y ya reconoce más de 80 palabras. Lo mejor es que él pide jugar solo, yo no tengo que convencerlo.',
        author:  'Carolina Méndez',
        role:    'Mamá de Mateo, 6 años',
        avatar:  '👩',
        metric:  '80 palabras en 4 semanas',
        bgColor: 'oklch(0.09 0.025 280)',
      },
      render: TestimonialBlock,
    },

    Video: {
      fields: {
        thumbnailEmoji: { type: 'text',     label: 'Emoji del thumbnail' },
        title:          { type: 'text',     label: 'Título del video' },
        subtitle:       { type: 'textarea', label: 'Subtítulo' },
        bgColor:        { type: 'text',     label: 'Fondo CSS' },
      },
      defaultProps: {
        thumbnailEmoji: '🎬',
        title:          'Mira cómo aprenden los niños',
        subtitle:       '2 minutos que muestran por qué Strides es diferente',
        bgColor:        'oklch(0.09 0.025 280)',
      },
      render: VideoBlock,
    },

    GamePreview: {
      fields: {
        heading:   { type: 'text',     label: 'Título de sección' },
        game1Emoji: { type: 'text',    label: 'Juego 1 — emoji' },
        game1Name:  { type: 'text',    label: 'Juego 1 — nombre' },
        game1Desc:  { type: 'textarea',label: 'Juego 1 — descripción' },
        game2Emoji: { type: 'text',    label: 'Juego 2 — emoji' },
        game2Name:  { type: 'text',    label: 'Juego 2 — nombre' },
        game2Desc:  { type: 'textarea',label: 'Juego 2 — descripción' },
        game3Emoji: { type: 'text',    label: 'Juego 3 — emoji' },
        game3Name:  { type: 'text',    label: 'Juego 3 — nombre' },
        game3Desc:  { type: 'textarea',label: 'Juego 3 — descripción' },
      },
      defaultProps: {
        heading:    'Así aprenden jugando',
        game1Emoji: '🃏',
        game1Name:  'Vocabulario en acción',
        game1Desc:  'Asocia imagen, audio y palabra. El cerebro retiene 3x más.',
        game2Emoji: '🎤',
        game2Name:  'Pronunciación real',
        game2Desc:  'Tu hijo habla, Strides escucha y corrige en tiempo real.',
        game3Emoji: '🧠',
        game3Name:  'Juego de memoria',
        game3Desc:  'Parejas de palabras que refuerzan lo aprendido sin aburrirse.',
      },
      render: GamePreviewBlock,
    },

    BeforeAfter: {
      fields: {
        heading:      { type: 'text',     label: 'Título (opcional)' },
        beforeTitle:  { type: 'text',     label: 'Columna izquierda — título' },
        before1:      { type: 'text',     label: 'Antes — ítem 1' },
        before2:      { type: 'text',     label: 'Antes — ítem 2' },
        before3:      { type: 'text',     label: 'Antes — ítem 3' },
        afterTitle:   { type: 'text',     label: 'Columna derecha — título' },
        after1:       { type: 'text',     label: 'Con Strides — ítem 1' },
        after2:       { type: 'text',     label: 'Con Strides — ítem 2' },
        after3:       { type: 'text',     label: 'Con Strides — ítem 3' },
      },
      defaultProps: {
        heading:     '¿Qué cambia con Strides?',
        beforeTitle: 'Métodos típicos',
        before1:     'Repetición mecánica y aburrida',
        before2:     'Tu hijo no quiere practicar',
        before3:     'Sin contexto ni motivación',
        afterTitle:  'Con Strides',
        after1:      'Juegos que pide repetir',
        after2:      'Aprende sin darse cuenta',
        after3:      'Logros que celebrar cada día',
      },
      render: BeforeAfterBlock,
    },

    SocialProof: {
      fields: {
        avatars:  { type: 'text',     label: 'Avatares (emojis separados por coma)' },
        counter:  { type: 'text',     label: 'Número / contador' },
        subtitle: { type: 'textarea', label: 'Subtexto' },
      },
      defaultProps: {
        avatars:  '👩,👨,👩‍👧,👨‍👧‍👦,👩‍👦,👩‍👧‍👦,👨‍👦',
        counter:  'Familias aprendiendo juntas',
        subtitle: 'Padres que ya eligieron que el inglés sea una aventura, no una obligación.',
      },
      render: SocialProofBlock,
    },

  },
}
