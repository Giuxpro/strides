export interface KidsTheme {
  id: string
  name: string
  emoji: string
  section: 'tematic' | 'pastel' | 'basic'
  previewBg: string
  previewAccent: string
}

export const KIDS_THEMES: KidsTheme[] = [
  // Temáticos
  { id: 'espacial',   name: 'Espacial',   emoji: '🚀', section: 'tematic', previewBg: '#050714', previewAccent: '#7C3AED' },
  { id: 'naturaleza', name: 'Naturaleza', emoji: '🌿', section: 'tematic', previewBg: '#071510', previewAccent: '#16a34a' },
  { id: 'animales',   name: 'Animales',   emoji: '🐾', section: 'tematic', previewBg: '#180e04', previewAccent: '#d97706' },
  // Pasteles
  { id: 'lavanda',    name: 'Lavanda',    emoji: '🪻', section: 'pastel',  previewBg: '#ede8ff', previewAccent: '#7c3aed' },
  { id: 'menta',      name: 'Menta',      emoji: '🍃', section: 'pastel',  previewBg: '#e3fff3', previewAccent: '#10b981' },
  { id: 'melocoton',  name: 'Melocotón',  emoji: '🍑', section: 'pastel',  previewBg: '#fff4e8', previewAccent: '#ea580c' },
  { id: 'cielo',      name: 'Cielo',      emoji: '🩵', section: 'pastel',  previewBg: '#e5f4ff', previewAccent: '#0284c7' },
  { id: 'rosa',       name: 'Rosa',       emoji: '🌸', section: 'pastel',  previewBg: '#ffecf4', previewAccent: '#db2777' },
  // Básico
  { id: 'luz',        name: 'Luz',        emoji: '☀️', section: 'basic',   previewBg: '#f9fafb', previewAccent: '#374151' },
  { id: 'noche',      name: 'Noche',      emoji: '🌑', section: 'basic',   previewBg: '#0d0d0d', previewAccent: '#6b7280' },
]

export const DEFAULT_THEME_ID = 'lavanda'

export function resolveThemeId(cookieValue: string | undefined): string {
  const ids = KIDS_THEMES.map(t => t.id)
  return ids.includes(cookieValue ?? '') ? cookieValue! : DEFAULT_THEME_ID
}
