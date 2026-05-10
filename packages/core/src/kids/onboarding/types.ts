export type OnboardingFlow = 'all' | 'a' | 'b'

export interface HeroBlockProps {
  title: string
  subtitle: string
  emoji: string
  buttonLabel: string
  buttonHref: string
  bgColor: string
}

export interface FeatureBlockProps {
  emoji: string
  title: string
  description: string
}

export interface CTABlockProps {
  label: string
  href: string
  variant: 'primary' | 'secondary'
}

export type OnboardingBlockType = 'Hero' | 'Feature' | 'CTA'
