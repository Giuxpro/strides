import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { RedeemCodeForm } from '@/components/account/RedeemCodeForm'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  trial:           { label: 'Trial gratuito',    color: 'bg-blue-500/10 text-blue-400' },
  prepaid:         { label: 'Pago anticipado',   color: 'bg-amber-500/10 text-amber-400' },
  complimentary:   { label: 'Acceso cortesía',   color: 'bg-emerald-500/10 text-emerald-400' },
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${clamped}%`,
          background: clamped > 80 ? '#ef4444' : clamped > 50 ? '#f59e0b' : '#7c3aed',
        }}
      />
    </div>
  )
}

function PlaceholderCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-5 flex items-start gap-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-gray-400">{title}</p>
        <p className="text-xs text-gray-600 mt-0.5">{description}</p>
        <span className="inline-block mt-2 text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
          Disponible al integrar Stripe
        </span>
      </div>
    </div>
  )
}

export default async function BillingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: subscription }, { data: priceRow }, { data: trialDaysRow }, { data: discountRow }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*, access_codes(code, label)')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'monthly_price').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'trial_days').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'global_discount').maybeSingle(),
  ])

  const monthlyPrice     = (priceRow?.value as number) ?? null
  const defaultTrialDays = (trialDaysRow?.value as number) ?? 7
  const globalDiscount   = discountRow?.value as { enabled: boolean; percent: number; label: string; duration_months: number | null } | null
  const promoActive      = !!(globalDiscount?.enabled && (globalDiscount.percent ?? 0) > 0)

  // Calcular datos del trial
  let daysRemaining: number | null = null
  let daysTotal: number | null = null
  let trialProgressPct = 0
  let trialExpired = false

  if (subscription?.acquisition_type === 'trial' && subscription.trial_ends_at) {
    const endsAt  = new Date(subscription.trial_ends_at)
    const startsAt = new Date(subscription.created_at)
    daysTotal     = Math.round((endsAt.getTime() - startsAt.getTime()) / 86400000) || defaultTrialDays
    daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000))
    trialExpired  = endsAt < new Date()
    trialProgressPct = ((daysTotal - daysRemaining) / daysTotal) * 100
  }

  const typeInfo = TYPE_LABELS[subscription?.acquisition_type ?? '']
  const hasDiscount = !!subscription?.pending_discount_percent
  const redeemedCode = subscription?.access_codes as { code: string; label: string } | null

  // Precio con descuento
  const discountedPrice = monthlyPrice && hasDiscount
    ? monthlyPrice * (1 - (subscription!.pending_discount_percent! / 100))
    : null

  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-lg mx-auto">
        <Link href="/select-profile" className="text-gray-500 text-sm hover:text-gray-300 mb-8 inline-block transition-colors">
          ← Volver
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1">Mi plan</h1>
        <p className="text-sm text-gray-500 mb-8">Estado de tu suscripción y facturación</p>

        {/* ── Plan actual ─────────────────────────────────────────── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan actual</h2>
            {typeInfo && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
            )}
          </div>

          {!subscription && (
            <p className="text-sm text-gray-500">Sin plan activo. <Link href="/get-access" className="text-violet-400 hover:underline">Activar acceso →</Link></p>
          )}

          {subscription?.acquisition_type === 'trial' && (
            <div className="space-y-3">
              {trialExpired ? (
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-sm font-medium">Trial vencido</span>
                  <Link href="/trial-expired" className="text-xs text-violet-400 hover:underline">Suscribirme →</Link>
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-white">{daysRemaining} <span className="text-base font-normal text-gray-400">días restantes</span></p>
                    <p className="text-xs text-gray-600">{daysTotal} días en total</p>
                  </div>
                  <ProgressBar percent={trialProgressPct} />
                  {subscription.trial_ends_at && (
                    <p className="text-xs text-gray-500">
                      Vence el {new Date(subscription.trial_ends_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  {redeemedCode && !hasDiscount && (
                    <p className="text-xs text-gray-600">
                      Activado con código <span className="font-mono text-gray-400">{redeemedCode.code}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {subscription?.acquisition_type === 'complimentary' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-sm font-medium">Acceso permanente activo</span>
                <span className="text-xs text-gray-600">Sin fecha de vencimiento</span>
              </div>
              {redeemedCode && (
                <p className="text-xs text-gray-600">
                  Activado con código <span className="font-mono text-gray-400">{redeemedCode.code}</span>
                </p>
              )}
            </div>
          )}

          {subscription?.acquisition_type === 'prepaid' && subscription.status === 'active' && (
            <p className="text-sm text-emerald-400 font-medium">Acceso activo</p>
          )}

          {subscription?.acquisition_type === 'prepaid' && subscription.status === 'pending_payment' && (
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-sm font-medium">Pago pendiente</span>
              <Link href="/get-access" className="text-xs text-violet-400 hover:underline">Activar ahora →</Link>
            </div>
          )}
        </section>

        {/* ── Precio mensual ──────────────────────────────────────── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Precio mensual</h2>

          {monthlyPrice ? (
            <div className="flex items-end gap-3">
              {hasDiscount ? (
                <>
                  <span className="text-gray-600 line-through text-lg">${monthlyPrice.toFixed(2)}</span>
                  <span className="text-3xl font-bold text-white">${discountedPrice!.toFixed(2)}</span>
                  <span className="text-gray-400 text-sm mb-0.5">/mes</span>
                  <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-1 rounded-full">
                    -{subscription!.pending_discount_percent}%
                    {subscription!.pending_discount_months ? ` · ${subscription!.pending_discount_months} meses` : ' · siempre'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-bold text-white">${monthlyPrice.toFixed(2)}</span>
                  <span className="text-gray-400 text-sm mb-0.5">/mes</span>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Precio no configurado aún.</p>
          )}

          {hasDiscount && subscription?.acquisition_type === 'trial' && (
            <p className="text-xs text-gray-600 mt-2">El descuento se activará cuando venza tu trial.</p>
          )}
        </section>

        {/* ── Descuento aplicado ──────────────────────────────────── */}
        {hasDiscount && (
          <section className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">🎁</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-400">
                  Descuento del {subscription!.pending_discount_percent}% aplicado
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {subscription!.pending_discount_months
                    ? `Durante ${subscription!.pending_discount_months} meses`
                    : 'Sin límite de tiempo'}
                </p>
                {redeemedCode && (
                  <p className="text-xs text-gray-600 mt-1 font-mono">Código: {redeemedCode.code}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Promoción global ────────────────────────────────────── */}
        {promoActive && !hasDiscount && (
          <section className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">🏷️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-violet-400">
                  {globalDiscount!.label || 'Promoción especial'} — {globalDiscount!.percent}% de descuento
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {globalDiscount!.duration_months
                    ? `Aplica durante ${globalDiscount!.duration_months} meses`
                    : 'Se aplica mientras dure la promoción'}
                </p>
                <p className="text-xs text-gray-600 mt-1">El descuento se aplica automáticamente al activar tu suscripción.</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Stripe placeholders ─────────────────────────────────── */}
        <div className="space-y-4 mb-4">
          <PlaceholderCard
            icon="💳"
            title="Método de pago"
            description="Aquí verás tu tarjeta registrada (últimos 4 dígitos, marca, vencimiento) y podrás cambiarla desde el portal de Stripe."
          />
          <PlaceholderCard
            icon="📅"
            title="Próxima factura"
            description="Fecha y monto de tu próximo cobro automático. Disponible una vez activa la suscripción en Stripe."
          />
          <PlaceholderCard
            icon="🧾"
            title="Historial de pagos"
            description="Lista de facturas anteriores con fecha, monto y enlace de descarga en PDF."
          />
        </div>

        {/* ── Canjear código ──────────────────────────────────────── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Código de acceso</h2>
          <p className="text-xs text-gray-600 mb-4">¿Tienes un código de descuento o acceso? Ingrésalo aquí.</p>
          <RedeemCodeForm context="account" />
        </section>
      </div>
    </main>
  )
}
