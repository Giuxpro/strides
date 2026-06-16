import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckoutPanel } from '@/components/billing/CheckoutPanel'

export default async function TrialExpiredPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: subscription },
    { data: priceRow },
    { data: discountRow },
    { data: currencyRow },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    supabase.from('subscriptions').select('trial_ends_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'monthly_price').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'annual_discount_pct').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'price_currency').maybeSingle(),
  ])

  const expiredAt = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const monthlyPrice      = (priceRow?.value as number) ?? null
  const annualDiscountPct = (discountRow?.value as number) ?? 0
  const currency          = currencyRow?.value === 'USD' ? 'USD' : 'PEN'
  const publicKey         = process.env.MERCADOPAGO_PUBLIC_KEY ?? ''
  const canCheckout       = monthlyPrice !== null && monthlyPrice > 0 && publicKey !== ''

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center"
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)' }}
    >
      <div className="w-full max-w-sm">
        <span className="text-6xl block mb-6">⏰</span>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
          Tu trial ha terminado
        </h1>

        {expiredAt && (
          <p className="text-sm text-gray-500 mb-2">Venció el {expiredAt}</p>
        )}

        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Tu periodo de prueba gratuito ha finalizado. Suscríbete para que{' '}
          {profile?.display_name ? <strong>{profile.display_name}</strong> : 'tu hijo'} siga aprendiendo inglés.
        </p>

        <div className="bg-white rounded-3xl border border-violet-200 p-5 mb-6 text-left shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Lo que conseguiste durante el trial</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> Acceso a todos los módulos</li>
            <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> Juegos, lecciones y desafíos</li>
            <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> Seguimiento de progreso</li>
          </ul>
        </div>

        {canCheckout ? (
          <div className="mb-4">
            <CheckoutPanel
              monthlyPrice={monthlyPrice!}
              annualDiscountPct={annualDiscountPct}
              currency={currency}
              publicKey={publicKey}
            />
          </div>
        ) : (
          <div
            className="w-full py-4 rounded-2xl font-bold text-white text-base text-center opacity-60 cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 0 #4338ca' }}
          >
            Suscribirme — próximamente
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          ¿Preguntas? Escríbenos a{' '}
          <a href="mailto:hola@strides.app" className="text-violet-500 hover:underline">hola@strides.app</a>
        </p>
      </div>
    </main>
  )
}
