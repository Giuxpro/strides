export interface AudioConfig {
  navigation_tracks: string[]
  game_tracks: string[]
  volume: number
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  navigation_tracks: [],
  game_tracks: [],
  volume: 0.3,
}

export function isAudioConfig(v: unknown): v is AudioConfig {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    Array.isArray(o['navigation_tracks']) &&
    Array.isArray(o['game_tracks']) &&
    typeof o['volume'] === 'number'
  )
}
