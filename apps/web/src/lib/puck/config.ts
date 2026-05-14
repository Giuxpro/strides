import type { Config } from '@measured/puck'
import type {
  HeroBlockProps, FeatureBlockProps, CTABlockProps,
  StatsBlockProps, BenefitsBlockProps, HowItWorksBlockProps,
  TestimonialBlockProps, VideoBlockProps,
} from '@strides/core/kids'
import { HeroBlock }      from './blocks/HeroBlock'
import { FeatureBlock }   from './blocks/FeatureBlock'
import { CTABlock }       from './blocks/CTABlock'
import { StatsBlock }     from './blocks/StatsBlock'
import { BenefitsBlock }  from './blocks/BenefitsBlock'
import { HowItWorksBlock } from './blocks/HowItWorksBlock'
import { TestimonialBlock } from './blocks/TestimonialBlock'
import { VideoBlock }     from './blocks/VideoBlock'

type PuckComponents = {
  Hero:        HeroBlockProps
  Feature:     FeatureBlockProps
  CTA:         CTABlockProps
  Stats:       StatsBlockProps
  Benefits:    BenefitsBlockProps
  HowItWorks:  HowItWorksBlockProps
  Testimonial: TestimonialBlockProps
  Video:       VideoBlockProps
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
        title:      '¡Aprende inglés jugando!',
        subtitle:   'Aventuras interactivas para niños de 4 a 12 años',
        bgGradient: 'linear-gradient(160deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)',
        showBadge:  true,
        badgeText:  '✨ Prueba gratis 7 días',
      },
      render: HeroBlock,
    },

    Feature: {
      fields: {
        emoji:       { type: 'text',     label: 'Emoji' },
        title:       { type: 'text',     label: 'Título' },
        description: { type: 'textarea', label: 'Descripción' },
      },
      defaultProps: {
        emoji:       '🎮',
        title:       'Aprende jugando',
        description: 'Lecciones interactivas diseñadas para niños de 4 a 12 años.',
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
            { label: 'Principal (violeta)',  value: 'primary' },
            { label: 'Secundario (blanco)',  value: 'secondary' },
          ],
        },
      },
      defaultProps: {
        label:   'Empezar gratis',
        href:    '/signup',
        variant: 'primary' as const,
      },
      render: CTABlock,
    },

    Stats: {
      fields: {
        stat1Number: { type: 'text', label: 'Estadística 1 — número' },
        stat1Label:  { type: 'text', label: 'Estadística 1 — etiqueta' },
        stat2Number: { type: 'text', label: 'Estadística 2 — número' },
        stat2Label:  { type: 'text', label: 'Estadística 2 — etiqueta' },
        stat3Number: { type: 'text', label: 'Estadística 3 — número' },
        stat3Label:  { type: 'text', label: 'Estadística 3 — etiqueta' },
        bgColor:     { type: 'text', label: 'Fondo CSS' },
      },
      defaultProps: {
        stat1Number: '500+',
        stat1Label:  'palabras en inglés',
        stat2Number: '10',
        stat2Label:  'juegos interactivos',
        stat3Number: '4-12',
        stat3Label:  'años de edad',
        bgColor:     'linear-gradient(135deg, #7c3aed, #4f46e5)',
      },
      render: StatsBlock,
    },

    Benefits: {
      fields: {
        emoji:    { type: 'text',     label: 'Emoji de sección' },
        title:    { type: 'textarea', label: 'Título de sección' },
        benefit1: { type: 'text',     label: 'Beneficio 1' },
        benefit2: { type: 'text',     label: 'Beneficio 2' },
        benefit3: { type: 'text',     label: 'Beneficio 3' },
        benefit4: { type: 'text',     label: 'Beneficio 4' },
      },
      defaultProps: {
        emoji:    '🎯',
        title:    '¿Por qué Strides funciona?',
        benefit1: 'Método basado en juego — el niño aprende sin darse cuenta',
        benefit2: 'Pronunciación real con reconocimiento de voz',
        benefit3: 'Progreso visible que motiva a seguir',
        benefit4: 'Contenido adaptado a su edad y nivel',
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
        title:      '¿Cómo funciona?',
        step1Emoji: '📱',
        step1Title: 'Crea el perfil de tu hijo',
        step1Desc:  'En menos de un minuto, sin datos innecesarios.',
        step2Emoji: '🎮',
        step2Title: 'Elige un módulo',
        step2Desc:  'Animales, colores, números… cada módulo es un mundo de juegos.',
        step3Emoji: '📈',
        step3Title: 'Sigue su progreso',
        step3Desc:  'Ve qué palabras ya domina y cuáles sigue practicando.',
      },
      render: HowItWorksBlock,
    },

    Testimonial: {
      fields: {
        quote:   { type: 'textarea', label: 'Testimonio' },
        author:  { type: 'text',     label: 'Nombre del autor' },
        role:    { type: 'text',     label: 'Rol (ej: Mamá de Sofía, 6 años)' },
        avatar:  { type: 'text',     label: 'Emoji de avatar' },
        bgColor: { type: 'text',     label: 'Fondo CSS' },
      },
      defaultProps: {
        quote:   'Mi hija lleva 3 semanas usando Strides y ya sabe más de 50 palabras. Lo mejor es que ella pide jugar sola.',
        author:  'María González',
        role:    'Mamá de Sofía, 6 años',
        avatar:  '👩',
        bgColor: '#0f0a1a',
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
        bgColor:        '#0f0a1a',
      },
      render: VideoBlock,
    },

  },
}

