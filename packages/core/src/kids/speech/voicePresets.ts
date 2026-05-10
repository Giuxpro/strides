export type VoicePreset = 'man' | 'woman' | 'boy' | 'girl' | 'robot' | 'mujer_mayor'

export interface VoicePresetConfig {
  label: string
  emoji: string
  description: string
  pitch: number
  preferFemale: boolean
}

export const VOICE_PRESET_CONFIGS: Record<VoicePreset, VoicePresetConfig> = {
  man: { label: 'Hombre', emoji: '👨', description: 'Voz masculina grave', pitch: 0.85, preferFemale: false },
  woman: { label: 'Mujer', emoji: '👩', description: 'Voz femenina suave', pitch: 1.1, preferFemale: true },
  boy: { label: 'Niño', emoji: '👦', description: 'Voz de niño aguda', pitch: 1.35, preferFemale: false },
  girl: { label: 'Niña', emoji: '👧', description: 'Voz de niña aguda', pitch: 1.5, preferFemale: true },
  robot: { label: 'Robot', emoji: '🤖', description: 'Voz robótica', pitch: 2, preferFemale: false },
  mujer_mayor: { label: 'Mujer Mayor', emoji: '👵', description: 'Voz de anciana', pitch: 0.5, preferFemale: true },
}

export const DEFAULT_VOICE_PRESET: VoicePreset = 'man'

export function isVoicePreset(v: unknown): v is VoicePreset {
  return v === 'man' || v === 'woman' || v === 'boy' || v === 'girl' || v === 'robot' || v === 'mujer_mayor'
}
