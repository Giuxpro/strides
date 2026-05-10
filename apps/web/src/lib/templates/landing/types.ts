export interface LandingCopy {
  badge: string
  ctaLabel: string
  ctaSub: string
  navCta: string
  finalCta: string
  finalSub: string
}

export interface LandingTemplateProps {
  copy: LandingCopy
  stats: { moduleCount: number; lessonCount: number }
}
