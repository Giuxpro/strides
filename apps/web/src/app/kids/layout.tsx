import { Baloo_2 } from 'next/font/google'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveThemeId, isVoicePreset, DEFAULT_VOICE_PRESET, isAudioConfig, DEFAULT_AUDIO_CONFIG } from '@strides/core/kids'
import { getStorageUrl } from '@strides/core'
import { ThemeButton } from '@/components/kids/ThemeButton'
import { VoicePresetProvider } from '@/components/kids/VoicePresetProvider'
import { MusicProvider } from '@/components/kids/MusicProvider'
import { ClickSoundProvider } from '@/components/kids/ClickSoundProvider'

const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export default async function KidsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('subscriptions').select('acquisition_type, status, trial_ends_at').eq('user_id', user.id).maybeSingle(),
  ])

  if (profile && profile.role !== 'admin') {
    if (!subscription) redirect('/get-access')

    if (subscription.acquisition_type === 'complimentary') {
      // acceso permanente — sin chequeo adicional
    } else if (subscription.acquisition_type === 'prepaid') {
      if (subscription.status !== 'active') redirect('/get-access')
    } else {
      // trial
      const expired = subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date()
      if (expired || subscription.status === 'expired') redirect('/trial-expired')
    }
  }

  const themeId = resolveThemeId(cookies().get('kids_theme')?.value)

  const [{ data: voiceRow }, { data: audioRow }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'voice_preset').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'audio_config').maybeSingle(),
  ])

  const voicePreset  = isVoicePreset(voiceRow?.value) ? voiceRow.value : DEFAULT_VOICE_PRESET
  const rawConfig    = isAudioConfig(audioRow?.value) ? audioRow.value : DEFAULT_AUDIO_CONFIG
  const audioConfig  = {
    ...rawConfig,
    navigation_tracks: rawConfig.navigation_tracks.map(p => getStorageUrl(p) ?? p),
    game_tracks:       rawConfig.game_tracks.map(p => getStorageUrl(p) ?? p),
    click_sound_url:   getStorageUrl(rawConfig.click_sound_url ?? null),
  }

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
        <ClickSoundProvider
          soundUrl={audioConfig.click_sound_url ?? null}
          volume={audioConfig.click_volume ?? audioConfig.volume}
        >
          <VoicePresetProvider preset={voicePreset}>
            {children}
          </VoicePresetProvider>
          <ThemeButton currentTheme={themeId} />
        </ClickSoundProvider>
      </MusicProvider>
    </div>
  )
}
