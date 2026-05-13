import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import { AuthForm } from '@/components/auth/AuthForm'

const F = 'var(--font-sora, system-ui, sans-serif)'
const N = 'var(--font-nunito, system-ui, sans-serif)'

const FLOATERS = [
  { e: '🌟', top: '8%', left: '6%', sz: '2.4rem', d: '0s', t: '4.2s' },
  { e: '🚀', top: '6%', left: '22%', sz: '2rem', d: '0.5s', t: '4.9s' },
  { e: '✨', top: '85%', left: '9%', sz: '1.7rem', d: '0.7s', t: '5.1s' },
  { e: '⭐', top: '18%', left: '40%', sz: '1.5rem', d: '1.9s', t: '4.5s' },
  { e: '🎮', top: '38%', left: '2%', sz: '2.6rem', d: '1.3s', t: '3.8s' },
  { e: '🦁', top: '55%', left: '35%', sz: '1.9rem', d: '2.4s', t: '5.5s' },
  { e: '🏆', bottom: '19%', left: '14%', sz: '2.3rem', d: '1s', t: '4.8s' },
]

const PERKS = [
  { emoji: '🎮', text: 'Juegos y retos para cada edad' },
  { emoji: '📈', text: 'Progreso guardado automáticamente' },
  { emoji: '👨‍👩‍👧', text: 'Hasta varios perfiles por cuenta' },
]

export default function DefaultSignup() {
  return (
    <div style={{ background: '#050714', minHeight: '100svh', fontFamily: N, color: '#fff' }}>
      {/* Noise grain */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.028]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px',
        }}
      />

      <div className="relative z-10 flex min-h-screen">

        {/* ── LEFT PANEL (desktop only) ── */}
        <div className="hidden lg:flex flex-col justify-center flex-1 relative overflow-hidden px-16 xl:px-40">
          <div className="pointer-events-none absolute inset-0">
            <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 65%)', filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', bottom: '-5%', left: '20%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 65%)', filter: 'blur(44px)' }} />
          </div>

          {FLOATERS.map(({ e, top, left, bottom, sz, d, t }, i) => (
            <span
              key={i}
              className="pointer-events-none absolute select-none animate-float"
              style={{ top, left, bottom, fontSize: sz, animationDelay: d, animationDuration: t, opacity: 0.55, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }}
            >
              {e}
            </span>
          ))}

          <div className="relative">
            <div className="flex items-center gap-2.5 mb-14">
              <span className="text-2xl">🌍</span>
              <span style={{ fontFamily: F, fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em' }}>Strides</span>
            </div>

            <h1 style={{ fontFamily: F, fontWeight: 800, fontSize: 'clamp(2.4rem, 4vw, 3.4rem)', lineHeight: 1.08, letterSpacing: '-0.03em' }}>
              Comienza la{' '}
              <span style={{ background: 'linear-gradient(130deg, #fb923c 0%, #f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                aventura
              </span>{' '}
              🚀
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '1rem', fontSize: '1rem', lineHeight: 1.65 }}>
              Miles de niños aprendiendo inglés cada día. Únete gratis.
            </p>

            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {PERKS.map(({ emoji, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {emoji}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px self-stretch my-16" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* ── RIGHT PANEL: Form ── */}
        <div className="flex items-center justify-center w-full lg:w-[460px] xl:w-[520px] px-6 py-12 relative shrink-0">
          <div className="pointer-events-none absolute inset-0 lg:hidden overflow-hidden">
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)', filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(251,146,60,0.1) 0%, transparent 65%)', filter: 'blur(44px)' }} />
          </div>

          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
              <span className="text-2xl">🌍</span>
              <span style={{ fontFamily: F, fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em' }}>Strides</span>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(24px)',
                borderRadius: '1.5rem',
                padding: '2.25rem',
              }}
            >
              <div style={{ height: '3px', borderRadius: '999px', background: 'linear-gradient(90deg, #fb923c, #f472b6, #7c3aed)', marginBottom: '1.75rem' }} />

              <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: '1.35rem', marginBottom: '0.3rem' }}>
                ¡Crea tu cuenta! ✨
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
                Únete a miles de familias aprendiendo inglés
              </p>

              <AuthForm action={signup} submitLabel="Registrarme →" dark />

              <p className="text-center mt-5" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.32)' }}>
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-bold transition-opacity hover:opacity-70" style={{ color: '#a78bfa' }}>
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
