import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RedeemCodeForm } from '@/components/account/RedeemCodeForm'

export default async function SetupPlanPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: subscription }, { data: priceRow }, { data: discountRow }] = await Promise.all([
    supabase.from('subscriptions').select('acquisition_type, status, trial_ends_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'monthly_price').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'global_discount').maybeSingle(),
  ])

  const monthlyPrice   = (priceRow?.value as number) ?? null
  const globalDiscount = discountRow?.value as { enabled: boolean; percent: number; label: string; duration_months: number | null } | null
  const promoActive    = globalDiscount?.enabled && (globalDiscount.percent ?? 0) > 0
  const promoPrice     = promoActive && monthlyPrice ? monthlyPrice * (1 - globalDiscount!.percent / 100) : null

  const isTrial = subscription?.acquisition_type === 'trial'

  if (isTrial) {
    const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null
    const trialDays = trialEndsAt
      ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 7
    const expiryLabel = trialEndsAt
      ? trialEndsAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
        style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)' }}
      >
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-2 rounded-full bg-violet-300" />
            <div className="w-8 h-2 rounded-full bg-violet-600" />
          </div>

          <div className="mb-8">
            <span className="text-5xl block mb-4">🎉</span>
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">¡Todo listo!</h1>
            <p className="text-gray-500 text-sm">
              Tienes <strong>{trialDays} días gratis</strong> para explorar todo.
              {expiryLabel && <span className="block mt-1 text-xs text-gray-400">Tu trial vence el {expiryLabel}.</span>}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-violet-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-900">Trial gratuito</span>
              <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-1 rounded-full">
                {trialDays} días gratis
              </span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Acceso completo a todos los módulos</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Juegos, lecciones y desafíos diarios</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Seguimiento de progreso del niño</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Sin compromiso — cancela cuando quieras</li>
            </ul>
          </div>

          <Link
            href="/select-profile"
            className="block w-full text-center py-4 rounded-2xl font-bold text-white text-base transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 0 #4338ca' }}
          >
            Empezar mi trial gratis 🚀
          </Link>

          <p className="text-center text-xs text-gray-400 mt-4">Te avisaremos antes de que venza tu trial.</p>

          <RedeemCodeForm context="signup" />
        </div>
      </main>
    )
  }

  // Variante A — Pago anticipado
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-2 rounded-full bg-violet-300" />
          <div className="w-8 h-2 rounded-full bg-violet-600" />
        </div>

        <div className="mb-8">
          <span className="text-5xl block mb-4">🔐</span>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">¡Cuenta creada!</h1>
          <p className="text-gray-500 text-sm">
            Un último paso: activa tu acceso para que tu hijo empiece a aprender inglés.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-violet-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-gray-900">Precio de fundadores</span>
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-1 rounded-full">
              Precio especial
            </span>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Acceso completo a todos los módulos</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Juegos, lecciones y desafíos diarios</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Seguimiento de progreso del niño</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> El precio sube al lanzamiento oficial</li>
          </ul>
        </div>

        {/* Precio */}
        {monthlyPrice && (
          <div className="bg-white rounded-2xl border border-violet-100 p-4 mb-4 flex items-center justify-between shadow-sm">
            <div>
              {promoActive ? (
                <>
                  <p className="text-xs text-gray-400 line-through">${monthlyPrice.toFixed(2)}/mes</p>
                  <p className="text-2xl font-extrabold text-gray-900">${promoPrice!.toFixed(2)}<span className="text-sm font-normal text-gray-400">/mes</span></p>
                </>
              ) : (
                <p className="text-2xl font-extrabold text-gray-900">${monthlyPrice.toFixed(2)}<span className="text-sm font-normal text-gray-400">/mes</span></p>
              )}
            </div>
            {promoActive && (
              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
                -{globalDiscount!.percent}%{globalDiscount!.label ? ` · ${globalDiscount!.label}` : ''}
              </span>
            )}
          </div>
        )}

        {/* Placeholder — se conectará a Stripe */}
        <div
          className="w-full py-4 rounded-2xl font-bold text-white text-base text-center opacity-60 cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 0 #4338ca' }}
        >
          Activar acceso — próximamente
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          ¿Preguntas? Escríbenos a{' '}
          <a href="mailto:hola@strides.app" className="text-violet-500 hover:underline">hola@strides.app</a>
        </p>

        <RedeemCodeForm context="signup" />
      </div>
    </main>
  )
}
