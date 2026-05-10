import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import { AuthForm } from '@/components/auth/AuthForm'

const ILLUSTRATIONS = [
  { emoji: '🌟', size: 72, top: '5%',  left: '3%',  delay: '0s',   dur: '5.2s', hide: false },
  { emoji: '📚', size: 44, top: '20%', left: '7%',  delay: '1.8s', dur: '6s',   hide: true  },
  { emoji: '🎨', size: 64, top: '4%',  left: '83%', delay: '0.5s', dur: '4.8s', hide: false },
  { emoji: '✨', size: 30, top: '16%', left: '77%', delay: '2.4s', dur: '3.6s', hide: true  },
  { emoji: '🦁', size: 58, top: '43%', left: '2%',  delay: '1s',   dur: '5.5s', hide: true  },
  { emoji: '🦊', size: 62, top: '37%', left: '89%', delay: '3s',   dur: '4.2s', hide: true  },
  { emoji: '🐾', size: 70, top: '74%', left: '4%',  delay: '0.3s', dur: '5s',   hide: false },
  { emoji: '🎯', size: 36, top: '85%', left: '13%', delay: '2.5s', dur: '4.5s', hide: true  },
  { emoji: '🔢', size: 54, top: '70%', left: '84%', delay: '1.2s', dur: '5.8s', hide: true  },
  { emoji: '🌈', size: 60, top: '82%', left: '88%', delay: '0.8s', dur: '4s',   hide: false },
  { emoji: '⭐', size: 26, top: '28%', left: '93%', delay: '1.6s', dur: '3s',   hide: true  },
  { emoji: '🎮', size: 46, top: '58%', left: '94%', delay: '2s',   dur: '5.2s', hide: true  },
  { emoji: '🔤', size: 48, top: '62%', left: '1%',  delay: '3.5s', dur: '6.5s', hide: true  },
]

export default function LightSignup() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden"
      style={{
        fontFamily: 'var(--font-nunito, system-ui, sans-serif)',
        background: 'linear-gradient(135deg, #EDE0FF 0%, #E0D5FF 30%, #D5D2FF 60%, #CBE4FF 100%)',
      }}
    >
      {ILLUSTRATIONS.map((il, i) => (
        <span
          key={i}
          className={`absolute select-none pointer-events-none animate-float ${il.hide ? 'hidden sm:block' : ''}`}
          style={{
            top: il.top,
            left: il.left,
            fontSize: il.size,
            animationDelay: il.delay,
            animationDuration: il.dur,
            lineHeight: 1,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))',
          }}
          aria-hidden
        >
          {il.emoji}
        </span>
      ))}

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-7">
          <h1
            className="font-black tracking-tight"
            style={{
              fontSize: 40,
              background: 'linear-gradient(135deg, #6D28D9, #4338CA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'var(--font-nunito, system-ui, sans-serif)',
            }}
          >
            Strides
          </h1>
          <p className="font-semibold mt-1" style={{ fontSize: 13, color: '#7C5DBF' }}>
            Inglés para toda la familia 🚀
          </p>
        </div>

        <div
          className="rounded-3xl p-8"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 24px 64px rgba(109,40,217,0.12), 0 4px 20px rgba(109,40,217,0.08)',
          }}
        >
          <div
            className="h-1 rounded-full mb-7 -mt-1"
            style={{ background: 'linear-gradient(90deg, #7C3AED, #6366F1, #3B82F6)' }}
          />

          <h2
            className="font-bold mb-1"
            style={{ fontSize: 22, color: '#1E1B4B', fontFamily: 'var(--font-nunito, system-ui, sans-serif)' }}
          >
            ¡Crea tu cuenta! ✨
          </h2>
          <p className="mb-7" style={{ fontSize: 13, color: '#9CA3AF' }}>
            Únete a miles de familias aprendiendo inglés
          </p>

          <AuthForm action={signup} submitLabel="Registrarme" />

          <p className="text-center mt-6" style={{ fontSize: 13, color: '#9CA3AF' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-bold transition-opacity hover:opacity-70" style={{ color: '#7C3AED' }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
