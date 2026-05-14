import { Baloo_2 } from 'next/font/google'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveThemeId, isVoicePreset, DEFAULT_VOICE_PRESET, isAudioConfig, DEFAULT_AUDIO_CONFIG } from '@strides/core/kids'
import { ThemeButton } from '@/components/kids/ThemeButton'
import { VoicePresetProvider } from '@/components/kids/VoicePresetProvider'
import { MusicProvider } from '@/components/kids/MusicProvider'
import { MusicButton } from '@/components/kids/MusicButton'

const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export default async function KidsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar trial
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_ends_at, role')
    .eq('id', user.id)
    .single()

  if (profile && profile.role !== 'admin') {
    if (profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date()) {
      redirect('/trial-expired')
    }
  }

  const themeId = resolveThemeId(cookies().get('kids_theme')?.value)

  const [{ data: voiceRow }, { data: audioRow }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'voice_preset').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'audio_config').maybeSingle(),
  ])

  const voicePreset  = isVoicePreset(voiceRow?.value) ? voiceRow.value : DEFAULT_VOICE_PRESET
  const audioConfig  = isAudioConfig(audioRow?.value) ? audioRow.value : DEFAULT_AUDIO_CONFIG

  return (
    <div
      data-kids-theme={themeId}
      className={baloo.className}
      style={{
        minHeight: '100vh',
        background: 'var(--kids-bg)',
        color: 'var(--kids-text)',
      }}
    >
      <MusicProvider config={audioConfig}>
        <VoicePresetProvider preset={voicePreset}>
          {children}
        </VoicePresetProvider>
        <ThemeButton currentTheme={themeId} />
        <MusicButton />
      </MusicProvider>
    </div>
  )
}
