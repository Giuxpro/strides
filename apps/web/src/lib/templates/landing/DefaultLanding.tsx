import Link from 'next/link'
import type { LandingTemplateProps } from './types'

const F = 'var(--font-sora, system-ui, sans-serif)'
const N = 'var(--font-nunito, system-ui, sans-serif)'

const FLOATERS = [
  { e: '🌟', top: '9%',     left: '7%',   sz: '2.6rem', d: '0s',   t: '4.2s' },
  { e: '✨', top: '19%',    right: '9%',  sz: '1.9rem', d: '0.9s', t: '5.1s' },
  { e: '🎮', top: '44%',    left: '3%',   sz: '3rem',   d: '1.5s', t: '3.8s' },
  { e: '🔤', top: '30%',    right: '5%',  sz: '2.4rem', d: '0.4s', t: '4.7s' },
  { e: '🏆', bottom: '29%', left: '8%',   sz: '2.7rem', d: '1.9s', t: '4.4s' },
  { e: '🎵', top: '63%',    right: '6%',  sz: '2rem',   d: '2.3s', t: '3.5s' },
  { e: '🦁', bottom: '22%', right: '11%', sz: '3.3rem', d: '0.7s', t: '5.2s' },
  { e: '🚀', top: '4%',     left: '44%',  sz: '2.1rem', d: '1.2s', t: '4.9s' },
  { e: '⭐', bottom: '42%', right: '17%', sz: '1.7rem', d: '1.7s', t: '3.2s' },
  { e: '🎯', top: '57%',    left: '7%',   sz: '1.9rem', d: '2.9s', t: '4.1s' },
]

const STEPS = [
  { n: '01', emoji: '👨‍👩‍👧', title: 'Crea los perfiles',    body: 'Un perfil por hijo. Cada niño tiene su propio avance, tema y personaje favorito.' },
  { n: '02', emoji: '🗺️',    title: 'Elige la aventura',   body: 'Módulos temáticos: animales, colores, números, familia y más. Siempre hay algo nuevo.' },
  { n: '03', emoji: '🎮',    title: '¡A aprender jugando!', body: 'Juegos interactivos, ejercicios de escucha y retos diarios. El inglés pasa a ser lo favorito.' },
]

const FEATURES = [
  { emoji: '🎮', c: '#7c3aed', label: 'Minijuegos únicos',    body: 'Vocabulario, memoria y escucha integrados en juegos que los niños piden repetir.' },
  { emoji: '⭐', c: '#f59e0b', label: 'Sistema de estrellas', body: 'Completar lecciones otorga estrellas. El progreso visible mantiene la motivación.' },
  { emoji: '🎤', c: '#10b981', label: 'Pronunciación real',   body: 'Voces nativas en cada ejercicio. Aprenden a escuchar inglés como se habla.' },
  { emoji: '🏆', c: '#f472b6', label: 'Retos diarios',        body: 'Desafíos cronometrados que crean el hábito de aprender cada día.' },
  { emoji: '👨‍👩‍👧', c: '#38bdf8', label: 'Multi-perfil',    body: 'Varios niños en una cuenta, cada uno con su propio avance y personaje.' },
  { emoji: '📱', c: '#a78bfa', label: 'Web y móvil',          body: 'Funciona en cualquier dispositivo sin descargar nada.' },
]

function formatCount(n: number) {
  if (n === 0) return '—'
  if (n < 10) return `${n}+`
  const mag = Math.pow(10, Math.floor(Math.log10(n)))
  return `${Math.floor(n / mag) * mag}+`
}

export default function DefaultLanding({ copy, stats }: LandingTemplateProps) {
  const STATS = [
    { n: '4–12',                        label: 'años',       sub: 'edad objetivo' },
    { n: formatCount(stats.moduleCount), label: 'módulos',    sub: 'y creciendo'   },
    { n: formatCount(stats.lessonCount), label: 'ejercicios', sub: 'interactivos'  },
    { n: '0',                            label: 'anuncios',   sub: 'nunca jamás'   },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#050714', color: '#fff', fontFamily: N }}>
      {/* Noise grain */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.028]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px',
        }}
      />

      {/* NAV */}
      <nav className="relative z-50 flex items-center justify-between px-4 sm:px-8 py-5 sm:py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <span style={{ fontFamily: F, fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.025em' }}>Strides</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="hidden sm:block text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Iniciar sesión
          </Link>
          <Link href="/login" className="sm:hidden text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Ingresar
          </Link>
          <Link
            href="/onboarding"
            className="text-xs sm:text-sm font-bold px-3 py-1.5 sm:px-5 sm:py-2 rounded-full transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 24px rgba(124,58,237,0.45)' }}
          >
            {copy.navCta}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6" style={{ minHeight: '100svh', paddingTop: '2rem', paddingBottom: '6rem' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div style={{ position: 'absolute', top: '-8%', left: '-4%', width: '52vw', height: '52vw', background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 65%)', filter: 'blur(48px)' }} />
          <div style={{ position: 'absolute', top: '12%', right: '-8%', width: '38vw', height: '38vw', background: 'radial-gradient(circle, rgba(244,114,182,0.18) 0%, transparent 65%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '0%', left: '28%', width: '44vw', height: '36vw', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)', filter: 'blur(52px)' }} />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='800' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.7'%3E%3Ccircle cx='23' cy='45' r='0.9'/%3E%3Ccircle cx='267' cy='18' r='0.7'/%3E%3Ccircle cx='512' cy='89' r='1.1'/%3E%3Ccircle cx='734' cy='34' r='0.8'/%3E%3Ccircle cx='89' cy='167' r='0.6'/%3E%3Ccircle cx='423' cy='201' r='1'/%3E%3Ccircle cx='678' cy='145' r='0.9'/%3E%3Ccircle cx='156' cy='312' r='0.7'/%3E%3Ccircle cx='589' cy='278' r='1.2'/%3E%3Ccircle cx='345' cy='389' r='0.8'/%3E%3Ccircle cx='789' cy='423' r='0.9'/%3E%3Ccircle cx='67' cy='467' r='0.7'/%3E%3Ccircle cx='234' cy='534' r='1'/%3E%3Ccircle cx='612' cy='512' r='0.8'/%3E%3Ccircle cx='456' cy='567' r='0.9'/%3E%3Ccircle cx='178' cy='89' r='0.6'/%3E%3Ccircle cx='701' cy='234' r='0.8'/%3E%3Ccircle cx='334' cy='145' r='0.7'/%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: '800px 600px' }}
        />
        {FLOATERS.map(({ e, top, left, right, bottom, sz, d, t }, i) => (
          <span key={i} className="pointer-events-none absolute select-none animate-float hidden md:block" style={{ top, left, right, bottom, fontSize: sz, animationDelay: d, animationDuration: t, opacity: 0.65, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.25))' }}>
            {e}
          </span>
        ))}
        <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8 tracking-wide" style={{ background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.38)', color: '#c4b5fd' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
            {copy.badge}
          </span>
        </div>
        <h1 className="animate-slide-up" style={{ fontFamily: F, fontWeight: 800, fontSize: 'clamp(2.75rem, 7.5vw, 5.5rem)', lineHeight: 1.04, letterSpacing: '-0.035em', maxWidth: '14ch', animationDelay: '0.18s' }}>
          Inglés que tus hijos{' '}
          <span style={{ background: 'linear-gradient(130deg, #a78bfa 0%, #f472b6 45%, #fb923c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>amarán</span>{' '}
          aprender
        </h1>
        <p className="animate-slide-up mt-7" style={{ fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', color: 'rgba(255,255,255,0.58)', maxWidth: '44ch', lineHeight: 1.7, animationDelay: '0.32s' }}>
          Aventuras interactivas, juegos y retos diseñados para niños de 4 a 12 años. Sin memorización forzada — solo diversión real.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mt-10 animate-slide-up" style={{ animationDelay: '0.46s' }}>
          <Link href="/onboarding" className="flex items-center gap-2 px-9 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95" style={{ fontFamily: F, letterSpacing: '-0.01em', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 4px 32px rgba(124,58,237,0.55), 0 0 0 1px rgba(124,58,237,0.3)' }}>
            {copy.ctaLabel}
          </Link>
        </div>
        <div className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-2 animate-float" style={{ animationDelay: '1.2s', animationDuration: '2.4s' }}>
          <span className="text-[10px] tracking-[0.22em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Descubrir</span>
          <svg width="18" height="28" viewBox="0 0 18 28" fill="none" className="opacity-30">
            <rect x="1" y="1" width="16" height="26" rx="8" stroke="white" strokeWidth="1.5" />
            <circle cx="9" cy="8" r="2.5" fill="white">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="0 9" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.8" to="0" dur="1.6s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 py-28 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16 reveal">
          <p className="text-xs font-bold tracking-[0.26em] uppercase mb-3" style={{ color: '#a78bfa' }}>Cómo funciona</p>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(1.85rem, 4vw, 2.75rem)', letterSpacing: '-0.025em', lineHeight: 1.08 }}>Tres pasos para comenzar</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(({ n, emoji, title, body }, i) => (
            <div key={n} className="relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 reveal" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-[0.65rem] font-bold tracking-[0.2em] mb-4" style={{ color: 'rgba(167,139,250,0.5)' }}>{n}</div>
              <div className="text-5xl mb-5">{emoji}</div>
              <h3 style={{ fontFamily: F, fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', lineHeight: 1.65 }}>{body}</p>
              {i < 2 && <div className="absolute top-12 -right-3 hidden md:block" style={{ width: '24px', height: '1px', background: 'linear-gradient(90deg, rgba(124,58,237,0.4), transparent)' }} />}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 py-24 px-6 max-w-6xl mx-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        </div>
        <div className="text-center mb-16 reveal">
          <p className="text-xs font-bold tracking-[0.26em] uppercase mb-3" style={{ color: '#a78bfa' }}>Características</p>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(1.85rem, 4vw, 2.75rem)', letterSpacing: '-0.025em', lineHeight: 1.08 }}>Diseñado para que no paren</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ emoji, c, label, body }) => (
            <div key={label} className="group p-7 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 reveal" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 transition-transform group-hover:scale-110 duration-300" style={{ background: `${c}1a`, border: `1px solid ${c}33` }}>
                {emoji}
              </div>
              <h3 style={{ fontFamily: F, fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>{label}</h3>
              <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.875rem', lineHeight: 1.65 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 py-16 px-6 reveal">
        <div className="max-w-4xl mx-auto rounded-3xl p-12 grid grid-cols-2 md:grid-cols-4 gap-10" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(91,33,182,0.07) 100%)', border: '1px solid rgba(124,58,237,0.22)', backdropFilter: 'blur(24px)' }}>
          {STATS.map(({ n, label, sub }) => (
            <div key={label} className="text-center">
              <div style={{ fontFamily: F, fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.035em', background: 'linear-gradient(130deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{n}</div>
              <div style={{ fontFamily: F, fontWeight: 700, fontSize: '0.875rem', marginTop: '0.25rem' }}>{label}</div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.75rem', marginTop: '0.15rem' }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* QUOTE */}
      <section className="relative z-10 py-28 px-8 max-w-3xl mx-auto text-center reveal">
        <div className="text-4xl mb-8">💬</div>
        <blockquote style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(1.45rem, 3.2vw, 2.1rem)', letterSpacing: '-0.02em', lineHeight: 1.3, color: 'rgba(255,255,255,0.88)' }}>
          "¿Mi hijo pide aprender inglés solo?<br className="hidden sm:block" /> Sí. Así de diferente es Strides."
        </blockquote>
        <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: '1.5rem', fontSize: '0.82rem' }}>Diseñado con psicología del aprendizaje, no con fichas de ejercicios.</p>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 py-24 px-6 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '70vw', height: '70vh', background: 'radial-gradient(ellipse, rgba(124,58,237,0.22) 0%, transparent 65%)', filter: 'blur(48px)' }} />
        </div>
        <div className="relative max-w-2xl mx-auto reveal">
          <div className="text-6xl mb-7 animate-levitate" style={{ animationDuration: '3.5s' }}>🚀</div>
          <h2 style={{ fontFamily: F, fontWeight: 800, fontSize: 'clamp(2rem, 5.5vw, 3.6rem)', letterSpacing: '-0.035em', lineHeight: 1.08, marginBottom: '1.25rem' }}>
            La aventura empieza{' '}
            <span style={{ background: 'linear-gradient(130deg, #a78bfa 0%, #f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>hoy</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.52)', fontSize: '1.05rem', marginBottom: '2.5rem', lineHeight: 1.65 }}>
            Crea tu cuenta y descubre por qué aprender inglés puede ser la mejor parte del día de tu hijo.
          </p>
          <Link href="/onboarding" className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95" style={{ fontFamily: F, letterSpacing: '-0.01em', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 8px 48px rgba(124,58,237,0.55), 0 0 0 1px rgba(124,58,237,0.3)' }}>
            {copy.finalCta} →
          </Link>
          <p className="mt-7 text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>{copy.finalSub}</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-10 px-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌍</span>
            <span style={{ fontFamily: F, fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>Strides</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.78rem' }}>© {new Date().getFullYear()} Strides. Inglés para niños.</p>
        </div>
      </footer>
    </div>
  )
}
