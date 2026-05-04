export interface ModuleConfig {
  emoji: string
  gradient: string
  gradientFrom: string
  gradientTo: string
  shimmer: string
  shadow: string
  accent: string
  accentLight: string
  bgPastel: string
}

export interface LessonConfig {
  emoji: string
  openmoji: string
  bgTop: string
  bgColor: string
  bgBottom: string
  bgEdge: string
  shadowColor: string
}

export const MODULE_CONFIG: Record<string, ModuleConfig> = {
  animales: {
    emoji: '🐾',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFCD3C 100%)',
    gradientFrom: '#FF6B35',
    gradientTo: '#FFCD3C',
    shimmer: 'rgba(255,255,255,0.15)',
    shadow: '0 8px 32px rgba(255,107,53,0.45)',
    accent: '#FF6B35',
    accentLight: 'rgba(255,107,53,0.15)',
    bgPastel: '#FFF5EE',
  },
  colores: {
    emoji: '🎨',
    gradient: 'linear-gradient(135deg, #E91E8C 0%, #FF5E7D 50%, #FF9EBC 100%)',
    gradientFrom: '#E91E8C',
    gradientTo: '#FF9EBC',
    shimmer: 'rgba(255,255,255,0.12)',
    shadow: '0 8px 32px rgba(233,30,140,0.45)',
    accent: '#E91E8C',
    accentLight: 'rgba(233,30,140,0.15)',
    bgPastel: '#FFF0F8',
  },
  numeros: {
    emoji: '🔢',
    gradient: 'linear-gradient(135deg, #00BCD4 0%, #00E5FF 50%, #80FFEA 100%)',
    gradientFrom: '#00BCD4',
    gradientTo: '#80FFEA',
    shimmer: 'rgba(255,255,255,0.18)',
    shadow: '0 8px 32px rgba(0,188,212,0.45)',
    accent: '#00BCD4',
    accentLight: 'rgba(0,188,212,0.15)',
    bgPastel: '#E8FEFF',
  },
  familia: {
    emoji: '👨‍👩‍👧',
    gradient: 'linear-gradient(135deg, #7C4DFF 0%, #A478FF 50%, #CE93D8 100%)',
    gradientFrom: '#7C4DFF',
    gradientTo: '#CE93D8',
    shimmer: 'rgba(255,255,255,0.12)',
    shadow: '0 8px 32px rgba(124,77,255,0.45)',
    accent: '#7C4DFF',
    accentLight: 'rgba(124,77,255,0.15)',
    bgPastel: '#F5F0FF',
  },
  comida: {
    emoji: '🍎',
    gradient: 'linear-gradient(135deg, #F44336 0%, #FF7043 50%, #FFAB76 100%)',
    gradientFrom: '#F44336',
    gradientTo: '#FFAB76',
    shimmer: 'rgba(255,255,255,0.14)',
    shadow: '0 8px 32px rgba(244,67,54,0.45)',
    accent: '#F44336',
    accentLight: 'rgba(244,67,54,0.15)',
    bgPastel: '#FFF5F5',
  },
  cuerpo: {
    emoji: '🦾',
    gradient: 'linear-gradient(135deg, #00C853 0%, #69F0AE 50%, #CCFF90 100%)',
    gradientFrom: '#00C853',
    gradientTo: '#CCFF90',
    shimmer: 'rgba(255,255,255,0.16)',
    shadow: '0 8px 32px rgba(0,200,83,0.45)',
    accent: '#00C853',
    accentLight: 'rgba(0,200,83,0.15)',
    bgPastel: '#F0FFF5',
  },
}

export const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  emoji: '📚',
  gradient: 'linear-gradient(135deg, #3D5AFE 0%, #7986CB 50%, #B39DDB 100%)',
  gradientFrom: '#3D5AFE',
  gradientTo: '#B39DDB',
  shimmer: 'rgba(255,255,255,0.12)',
  shadow: '0 8px 32px rgba(61,90,254,0.45)',
  accent: '#3D5AFE',
  accentLight: 'rgba(61,90,254,0.15)',
  bgPastel: '#F0F2FF',
}

export function getModuleConfig(slug: string): ModuleConfig {
  return MODULE_CONFIG[slug] ?? DEFAULT_MODULE_CONFIG
}

// ─── Lesson configs ───────────────────────────────────────────────────────────

export const LESSON_CONFIG: Record<string, LessonConfig> = {
  granja: {
    emoji: '🐄',
    openmoji: 'https://openmoji.org/data/color/svg/1F404.svg',
    bgTop: '#86efac',
    bgColor: '#22c55e',
    bgBottom: '#16a34a',
    bgEdge: '#15803d',
    shadowColor: 'rgba(34,197,94,0.55)',
  },
  mascotas: {
    emoji: '🐕',
    openmoji: 'https://openmoji.org/data/color/svg/1F415.svg',
    bgTop: '#93c5fd',
    bgColor: '#3b82f6',
    bgBottom: '#2563eb',
    bgEdge: '#1d4ed8',
    shadowColor: 'rgba(59,130,246,0.55)',
  },
  mar: {
    emoji: '🐠',
    openmoji: 'https://openmoji.org/data/color/svg/1F420.svg',
    bgTop: '#fba35a',
    bgColor: '#f97316',
    bgBottom: '#ea580c',
    bgEdge: '#c2410c',
    shadowColor: 'rgba(249,115,22,0.55)',
  },
  pajaros: {
    emoji: '🦜',
    openmoji: 'https://openmoji.org/data/color/svg/1F99C.svg',
    bgTop: '#c084fc',
    bgColor: '#a855f7',
    bgBottom: '#9333ea',
    bgEdge: '#7e22ce',
    shadowColor: 'rgba(168,85,247,0.55)',
  },
  selva: {
    emoji: '🐒',
    openmoji: 'https://openmoji.org/data/color/svg/1F412.svg',
    bgTop: '#4ade80',
    bgColor: '#16a34a',
    bgBottom: '#15803d',
    bgEdge: '#166534',
    shadowColor: 'rgba(22,163,74,0.55)',
  },
}

export const DEFAULT_LESSON_CONFIG: LessonConfig = {
  emoji: '📚',
  openmoji: 'https://openmoji.org/data/color/svg/1F4DA.svg',
  bgTop: '#a78bfa',
  bgColor: '#8b5cf6',
  bgBottom: '#7c3aed',
  bgEdge: '#6d28d9',
  shadowColor: 'rgba(139,92,246,0.55)',
}

export function getLessonConfig(slug: string): LessonConfig {
  return LESSON_CONFIG[slug] ?? DEFAULT_LESSON_CONFIG
}
