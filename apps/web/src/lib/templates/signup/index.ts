import DefaultSignup from './DefaultSignup'
import LightSignup from './LightSignup'

type SignupTemplate = () => React.ReactNode

const registry: Record<string, SignupTemplate> = {
  default: DefaultSignup as SignupTemplate,
  light:   LightSignup   as SignupTemplate,
}

export function getSignupTemplate(id: string): SignupTemplate {
  return registry[id] ?? (registry.default as SignupTemplate)
}
