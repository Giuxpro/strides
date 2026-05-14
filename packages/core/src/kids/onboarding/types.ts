export type OnboardingFlow = string

export interface HeroBlockProps {
  title: string
  subtitle: string
  emoji: string
  bgGradient: string
  showBadge: boolean
  badgeText: string
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

export interface StatsBlockProps {
  stat1Number: string
  stat1Label: string
  stat2Number: string
  stat2Label: string
  stat3Number: string
  stat3Label: string
  bgColor: string
}

export interface BenefitsBlockProps {
  title: string
  benefit1: string
  benefit2: string
  benefit3: string
  benefit4: string
  emoji: string
}

export interface HowItWorksBlockProps {
  title: string
  step1Emoji: string
  step1Title: string
  step1Desc: string
  step2Emoji: string
  step2Title: string
  step2Desc: string
  step3Emoji: string
  step3Title: string
  step3Desc: string
}

export interface TestimonialBlockProps {
  quote: string
  author: string
  role: string
  avatar: string
  bgColor: string
}

export interface VideoBlockProps {
  thumbnailEmoji: string
  title: string
  subtitle: string
  bgColor: string
}

export type OnboardingBlockType = 'Hero' | 'Feature' | 'CTA' | 'Stats' | 'Benefits' | 'HowItWorks' | 'Testimonial' | 'Video'
