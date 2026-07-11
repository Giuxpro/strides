import type { ModuleConfig } from '../moduleConfig'

// Identidad visual propia del refuerzo (cross-módulo, no hereda de ningún
// módulo). Verde-agua = "refrescar la memoria"; coherente con la pastilla del
// home. Cumple la forma ModuleConfig para alimentar el motor de juegos.
export const REVIEW_MODULE_CONFIG: ModuleConfig = {
  emoji: '💪',
  gradient: 'linear-gradient(135deg, #0E9F9A 0%, #2DD4BF 50%, #99F6E4 100%)',
  gradientFrom: '#0E9F9A',
  gradientTo: '#99F6E4',
  shimmer: 'rgba(255,255,255,0.16)',
  shadow: '0 8px 32px rgba(13,148,136,0.45)',
  accent: '#0E9F9A',
  accentLight: 'rgba(14,159,154,0.15)',
  bgPastel: '#ECFEFF',
}
