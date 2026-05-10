import { Baloo_2 } from 'next/font/google'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveThemeId, isVoicePreset, DEFAULT_VOICE_PRESET } from '@strides/core/kids'
import { ThemeButton } from '@/components/kids/ThemeButton'
import { VoicePresetProvider } from '@/components/kids/VoicePresetProvider'

const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export default async function KidsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const themeId = resolveThemeId(cookies().get('kids_theme')?.value)

  const { data: voiceRow } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'voice_preset')
    .maybeSingle()

  const voicePreset = isVoicePreset(voiceRow?.value) ? voiceRow.value : DEFAULT_VOICE_PRESET

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
      <VoicePresetProvider preset={voicePreset}>
        {children}
      </VoicePresetProvider>
      <ThemeButton currentTheme={themeId} />
    </div>
  )
}
