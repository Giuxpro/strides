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
  accentColor: string
}

export interface CTABlockProps {
  label: string
  href: string
  variant: 'primary' | 'secondary'
}

export interface StatsBlockProps {
  stat1Emoji: string
  stat1Number: string
  stat1Label: string
  stat2Emoji: string
  stat2Number: string
  stat2Label: string
  stat3Emoji: string
  stat3Number: string
  stat3Label: string
}

export interface BenefitsBlockProps {
  title: string
  benefit1Emoji: string
  benefit1Title: string
  benefit1Sub: string
  benefit2Emoji: string
  benefit2Title: string
  benefit2Sub: string
  benefit3Emoji: string
  benefit3Title: string
  benefit3Sub: string
  benefit4Emoji: string
  benefit4Title: string
  benefit4Sub: string
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
  metric?: string
  bgColor: string
}

export interface VideoBlockProps {
  thumbnailEmoji: string
  title: string
  subtitle: string
  bgColor: string
}

export interface GamePreviewBlockProps {
  heading: string
  game1Emoji: string
  game1Name: string
  game1Desc: string
  game2Emoji: string
  game2Name: string
  game2Desc: string
  game3Emoji: string
  game3Name: string
  game3Desc: string
}

export interface BeforeAfterBlockProps {
  heading: string
  beforeTitle: string
  before1: string
  before2: string
  before3: string
  afterTitle: string
  after1: string
  after2: string
  after3: string
}

export interface SocialProofBlockProps {
  avatars: string
  counter: string
  subtitle: string
}

export type OnboardingBlockType =
  | 'Hero' | 'Feature' | 'CTA' | 'Stats' | 'Benefits'
  | 'HowItWorks' | 'Testimonial' | 'Video'
  | 'GamePreview' | 'BeforeAfter' | 'SocialProof'
