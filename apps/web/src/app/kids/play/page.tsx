import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { KidsModuleCard } from '@/components/kids/KidsModuleCard'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

export default async function KidsPlayPage() {
  const supabase = createClient()
  const selectedChildId = cookies().get('selected_child_id')?.value

  const [{ data: modules }, { data: child }, { data: streak }] = await Promise.all([
    supabase.from('modules').select('*').eq('is_published', true).order('order'),
    selectedChildId
      ? supabase.from('children').select('name, avatar_url').eq('id', selectedChildId).single()
      : Promise.resolve({ data: null }),
    selectedChildId
      ? supabase.from('child_streaks').select('current_streak').eq('child_id', selectedChildId).single()
      : Promise.resolve({ data: null }),
  ])

  const childName     = child?.name ?? null
  const childAvatar   = child?.avatar_url ?? '🧒'
  const currentStreak = streak?.current_streak ?? 0
  const greeting      = childName ? `¡Hola, ${childName}!` : '¡Hola!'

  return (
    <div className="min-h-screen" style={{ background: 'var(--kids-bg)' }}>

      {/* Top nav */}
      <header className="flex items-center justify-between px-6 pt-6 pb-2">
        <span className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--kids-text-faint)' }}>
          Strides
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/select-profile"
            className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--kids-text-muted)' }}
          >
            <span className="text-lg">{childAvatar}</span>
            <span className="hidden sm:inline">{childName ?? 'Cambiar perfil'}</span>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--kids-text-faint)' }}
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-4 pb-16">

        {/* Hero */}
        <div className="animate-slide-up mb-6 mt-2">
          <h1 className="text-4xl font-extrabold leading-tight" style={{ color: 'var(--kids-text)' }}>
            {greeting} <span className="inline-block animate-float origin-bottom-right">👋</span>
          </h1>
          <p className="text-lg mt-1 font-medium" style={{ color: 'var(--kids-text-muted)' }}>
            ¡Elige tu aventura!
          </p>
        </div>

        {/* Streak badge */}
        {currentStreak > 0 && (
          <div
            className="animate-slide-up animate-pulse-glow inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-6 border border-orange-400/30"
            style={{ background: 'rgba(251,146,60,0.12)', animationDelay: '0.15s' }}
          >
            <span className="text-2xl">🔥</span>
            <div>
              <span className="font-bold text-lg" style={{ color: 'var(--kids-text)' }}>{currentStreak}</span>
              <span className="text-sm font-medium ml-1" style={{ color: 'var(--kids-text-muted)' }}>
                {currentStreak === 1 ? 'día seguido' : 'días seguidos'}
              </span>
            </div>
          </div>
        )}

        {/* Adventure map */}
        {modules && modules.length > 0 ? (
          <div>
            {modules.map((module, index) => (
              <div key={module.id}>
                <KidsModuleCard module={module} index={index} />
                {index < modules.length - 1 && (
                  <div className="flex justify-center py-3">
                    <div
                      className="h-8 w-px border-l-2 border-dashed"
                      style={{ borderColor: 'var(--kids-text-faint)', opacity: 0.6 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🚧</p>
            <p className="font-medium" style={{ color: 'var(--kids-text-muted)' }}>
              Contenido en preparación
            </p>
          </div>
        )}

      </main>
    </div>
  )
}
