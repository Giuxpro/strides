import { Baloo_2 } from 'next/font/google'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveThemeId } from '@/lib/kids-theme'
import { ThemeButton } from '@/components/kids/ThemeButton'

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
      {children}
      <ThemeButton currentTheme={themeId} />
    </div>
  )
}
