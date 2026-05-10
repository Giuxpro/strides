import type { Config } from '@measured/puck'
import type { HeroBlockProps, FeatureBlockProps, CTABlockProps } from '@strides/core/kids'
import { HeroBlock } from './blocks/HeroBlock'
import { FeatureBlock } from './blocks/FeatureBlock'
import { CTABlock } from './blocks/CTABlock'

type PuckComponents = {
  Hero:    HeroBlockProps
  Feature: FeatureBlockProps
  CTA:     CTABlockProps
}

export const puckConfig: Config<PuckComponents> = {
  components: {
    Hero: {
      fields: {
        title:       { type: 'text',  label: 'Título' },
        subtitle:    { type: 'text',  label: 'Subtítulo' },
        emoji:       { type: 'text',  label: 'Emoji' },
        buttonLabel: { type: 'text',  label: 'Texto del botón' },
        buttonHref:  { type: 'text',  label: 'Destino del botón' },
        bgColor:     { type: 'text',  label: 'Color de fondo (CSS gradient o color)' },
      },
      defaultProps: {
        title:       '¡Aprende inglés jugando!',
        subtitle:    'Aventuras de inglés para niños de 4 a 12 años',
        emoji:       '🌟',
        buttonLabel: 'Comenzar',
        buttonHref:  '/select-profile',
        bgColor:     'linear-gradient(135deg, #6d28d9, #4f46e5)',
      },
      render: HeroBlock,
    },
    Feature: {
      fields: {
        emoji:       { type: 'text', label: 'Emoji' },
        title:       { type: 'text', label: 'Título' },
        description: { type: 'text', label: 'Descripción' },
      },
      defaultProps: {
        emoji:       '🎮',
        title:       'Aprende jugando',
        description: 'Lecciones interactivas diseñadas para niños',
      },
      render: FeatureBlock,
    },
    CTA: {
      fields: {
        label:   { type: 'text',   label: 'Texto' },
        href:    { type: 'text',   label: 'Enlace' },
        variant: {
          type:    'select',
          label:   'Estilo',
          options: [
            { label: 'Principal',  value: 'primary' },
            { label: 'Secundario', value: 'secondary' },
          ],
        },
      },
      defaultProps: {
        label:   'Empezar gratis',
        href:    '/register',
        variant: 'primary' as const,
      },
      render: CTABlock,
    },
  },
}
