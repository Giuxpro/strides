import Link from 'next/link'
import { requestPasswordReset } from '@/app/actions/auth'
import { Nunito } from 'next/font/google'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-nunito',
})

const I = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent'
const L = 'block text-xs font-semibold text-gray-500 mb-1.5'

interface Props {
  searchParams: { sent?: string }
}

export default function ForgotPasswordPage({ searchParams }: Props) {
  const sent = searchParams.sent === 'true'

  return (
    <div
      className={`${nunito.variable} min-h-screen flex items-center justify-center p-6`}
      style={{
        fontFamily: 'var(--font-nunito)',
        background: 'linear-gradient(135deg, #EDE0FF 0%, #E0D5FF 30%, #D5D2FF 60%, #CBE4FF 100%)',
      }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-7">
          <h1
            className="font-black tracking-tight"
            style={{
              fontSize: 40,
              background: 'linear-gradient(135deg, #6D28D9, #4338CA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'var(--font-nunito)',
            }}
          >
            Strides
          </h1>
          <p className="font-semibold mt-1" style={{ fontSize: 13, color: '#7C5DBF' }}>
            Inglés para toda la familia 🚀
          </p>
        </div>

        {/* Card */}
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

          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-5xl">📬</p>
              <h2 className="font-bold text-gray-900" style={{ fontSize: 20 }}>
                ¡Revisa tu correo!
              </h2>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>
                Si esa cuenta existe, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <Link
                href="/login"
                className="block mt-6 text-center font-bold transition-opacity hover:opacity-70"
                style={{ fontSize: 13, color: '#7C3AED' }}
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-bold mb-1 text-gray-900" style={{ fontSize: 22 }}>
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="mb-7" style={{ fontSize: 13, color: '#9CA3AF' }}>
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>

              <form action={requestPasswordReset} className="space-y-5">
                <div>
                  <label className={L}>Correo electrónico</label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="correo@ejemplo.com"
                    className={I}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)' }}
                >
                  Enviar enlace
                </button>
              </form>

              <Link
                href="/login"
                className="block text-center mt-6 transition-opacity hover:opacity-70"
                style={{ fontSize: 13, color: '#9CA3AF' }}
              >
                ← Volver al inicio de sesión
              </Link>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
