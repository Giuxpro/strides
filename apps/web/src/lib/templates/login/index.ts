import DefaultLogin from './DefaultLogin'
import LightLogin from './LightLogin'

type LoginTemplate = () => React.ReactNode

const registry: Record<string, LoginTemplate> = {
  default: DefaultLogin as LoginTemplate,
  light: LightLogin as LoginTemplate,
}

export function getLoginTemplate(id: string): LoginTemplate {
  return registry[id] ?? (registry.default as LoginTemplate)
}
