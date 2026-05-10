import DefaultLanding from './DefaultLanding'
import type { LandingTemplateProps } from './types'

export type { LandingTemplateProps }

type LandingTemplate = (props: LandingTemplateProps) => React.ReactNode

const registry: Record<string, LandingTemplate> = {
  default: DefaultLanding as LandingTemplate,
}

export function getLandingTemplate(id: string): LandingTemplate {
  return registry[id] ?? (registry.default as LandingTemplate)
}
