export type TemplatePageType = 'landing' | 'login' | 'signup'

export interface PageTemplate {
  id: string
  name: string
  emoji: string
  description: string
  tags: readonly string[]
  appliesTo: readonly TemplatePageType[]
}

export const TEMPLATE_REGISTRY: readonly PageTemplate[] = [
  {
    id: 'default',
    name: 'Espacial',
    emoji: '🌌',
    description: 'Estilo espacial oscuro. Diseño base del producto.',
    tags: ['default'],
    appliesTo: ['landing', 'login', 'signup'],
  },
  {
    id: 'light',
    name: 'Lavanda',
    emoji: '🎨',
    description: 'Fondo degradado claro con emojis flotantes y tarjeta blanca.',
    tags: ['claro'],
    appliesTo: ['login', 'signup'],
  },
]

export function getTemplatesFor(page: TemplatePageType): PageTemplate[] {
  return TEMPLATE_REGISTRY.filter(t => t.appliesTo.includes(page))
}
