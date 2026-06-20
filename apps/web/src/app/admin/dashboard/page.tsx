import { createAdminClient } from '@/lib/supabase/admin'
import {
  getAnalyticsSummary,
  getUserGrowthSeries,
  getEngagementSeries,
  getTopGames,
  getAIUsageToday,
  getAIUsageForMonth,
  getAIUsageAllTime,
  type AIUsagePeriod,
  getRetentionRate,
  getDeviceBreakdown,
  getSetting,
} from '@strides/db'
import { GAME_REGISTRY } from '@strides/core/kids'
import { Suspense } from 'react'
import { AIUsageChip }      from '@/components/admin/dashboard/AIUsageChip'
import { OnlineNow }        from '@/components/admin/dashboard/OnlineNow'
import { StatCard }         from '@/components/admin/dashboard/StatCard'
import { GrowthChart }      from '@/components/admin/dashboard/GrowthChart'
import { EngagementChart }  from '@/components/admin/dashboard/EngagementChart'
import { TopGamesChart }    from '@/components/admin/dashboard/TopGamesChart'
import { SubBreakdown }     from '@/components/admin/dashboard/SubBreakdown'
import { RetentionCard }    from '@/components/admin/dashboard/RetentionCard'
import { DeviceBreakdown }  from '@/components/admin/dashboard/DeviceBreakdown'
import { PeriodSelector }   from '@/components/admin/dashboard/PeriodSelector'
import { LastUpdated }      from '@/components/admin/dashboard/LastUpdated'

function InfoChip({
  label,
  value,
  color,
  tooltip,
  tooltipAlign = 'left',
  muted = false,
}: {
  label: string
  value: string
  color: string
  tooltip?: string
  tooltipAlign?: 'left' | 'right'
  muted?: boolean
}) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color }}>{label}</p>
        {tooltip && (
          <div className="relative group cursor-help flex items-center">
            <span className="text-[11px] leading-none select-none text-slate-400">ⓘ</span>
            <div
              className={`absolute bottom-full mb-2 w-64 bg-gray-900 border border-gray-700 rounded-xl p-3 text-[11px] text-gray-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[200] shadow-xl text-left whitespace-pre-line leading-relaxed ${tooltipAlign === 'right' ? 'right-0' : 'left-0'}`}
            >
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <p className={`text-base font-bold ${muted ? 'text-gray-600' : 'text-white'}`} style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

function ExportButton({ type, period, label }: { type: string; period: number; label: string }) {
  return (
    <a
      href={`/api/admin/analytics/export?type=${type}&period=${period}`}
      download
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-gray-500 hover:text-gray-300"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
    >
      ↓ {label}
    </a>
  )
}

function InventoryCard({ icon, label, value, sub }: { icon: string; label: string; value: number; sub?: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="text-lg shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest truncate">{label}</p>
        <p className="text-xl font-bold text-white leading-tight" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          {value.toLocaleString()}
        </p>
        {sub && <p className="text-[10px] text-gray-700 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

interface PageProps {
  searchParams: { period?: string }
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const rawPeriod = parseInt(searchParams.period ?? '30') || 30
  const period = Math.min(365, Math.max(7, rawPeriod))

  const db = createAdminClient()

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastYear = lastMonthDate.getFullYear()
  const lastMonth = lastMonthDate.getMonth() + 1

  const [summary, growth, engagement, topGames, aiUsage, aiThisMonth, aiAllTime, priceResult, retention, devices, currencyResult, annualDiscResult] = await Promise.all([
    getAnalyticsSummary(db),
    getUserGrowthSeries(db, period),
    getEngagementSeries(db, Math.min(period, 30)),
    getTopGames(db, GAME_REGISTRY.length),
    getAIUsageToday(db),
    getAIUsageForMonth(db, thisYear, thisMonth),
    getAIUsageAllTime(db),
    getSetting(db, 'monthly_price'),
    getRetentionRate(db),
    getDeviceBreakdown(db),
    getSetting(db, 'price_currency'),
    getSetting(db, 'annual_discount_pct'),
  ])

  const monthlyPrice = (priceResult.data?.value as number | undefined) ?? 0
  // Símbolo según la moneda configurada (el MRR es en la moneda de cobro, no siempre USD).
  const currencySymbol = (currencyResult.data?.value as string | undefined) === 'USD' ? '$' : 'S/ '
  // MRR normalizado por ciclo: mensual = precio; anual = mensual-equivalente (precio × (1 − descuento)).
  const annualDiscount = (annualDiscResult.data?.value as number | undefined) ?? 0
  const annualMonthlyEquiv = monthlyPrice * (1 - annualDiscount / 100)
  const mrr = summary.paidActiveMonthly * monthlyPrice + summary.paidActiveAnnual * annualMonthlyEquiv
  const fmtMrr = (n: number) => monthlyPrice === 0 ? 'Sin precio' : `${currencySymbol}${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const mrrMonth = fmtMrr(mrr)
  const mrrAnnual = fmtMrr(mrr * 12)

  function calcCost(byModel: AIUsagePeriod['byModel']): number {
    return byModel.reduce((sum, m) => {
      if (m.totalDurationMs > 0) return sum + (m.totalDurationMs / 60_000) * 0.006
      return sum + (m.inputTokens / 1_000_000) * 0.002 + (m.outputTokens / 1_000_000) * 0.01
    }, 0)
  }

  const costToday = calcCost(aiUsage.byModel)
  const costMonth = calcCost(aiThisMonth.byModel)
  const costTotal = calcCost(aiAllTime.byModel)

  const dateLabel = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div
      className="min-h-full p-5 lg:p-8 space-y-5"
      style={{
        background: `
          radial-gradient(ellipse 100% 45% at 50% -5%, rgba(124,58,237,0.1) 0%, transparent 55%),
          radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px) 0 0 / 24px 24px,
          #050508
        `,
      }}
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white" style={{ letterSpacing: '-0.03em' }}>
            Dashboard
          </h1>
          <p className="text-xs text-gray-600 mt-1 capitalize">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Suspense>
            <PeriodSelector />
          </Suspense>
          <LastUpdated timestamp={Date.now()} />
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <OnlineNow />
        <StatCard
          label="Usuarios totales"
          value={summary.totalParents}
          sub={`+${summary.newUsersThisWeek} esta semana`}
          color="violet"
          icon="👤"
        />
        <StatCard
          label="Acceso activo"
          value={summary.activeTotal}
          sub={[
            summary.paidActive > 0         && `${summary.paidActive} pagado${summary.paidActive !== 1 ? 's' : ''}`,
            summary.trialActive > 0        && `${summary.trialActive} trial`,
            summary.complimentaryActive > 0 && `${summary.complimentaryActive} cortesía`,
          ].filter(Boolean).join(' · ') || 'Sin accesos activos'}
          color="emerald"
          icon="✅"
        />
        <StatCard
          label="Niños registrados"
          value={summary.totalChildren}
          sub={`${summary.childrenActiveThisWeek} activos esta semana`}
          color="sky"
          icon="🧒"
        />
        <StatCard
          label="Lecciones hoy"
          value={summary.lessonsCompletedToday}
          sub={`${summary.gamesPlayedToday} juegos hoy`}
          color="amber"
          icon="📚"
        />
        <StatCard
          label="Racha promedio"
          value={summary.avgStreakActive}
          sub={`${summary.totalStreaksActive} rachas activas`}
          color="rose"
          icon="🔥"
          suffix=" días"
        />
      </div>

      {/* ── Inventario de contenido ── */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-700">Inventario de contenido</p>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InventoryCard
            icon="📦"
            label="Módulos"
            value={summary.totalModules}
            sub={`${summary.publishedModules} publicados · ${summary.totalModules - summary.publishedModules} borrador`}
          />
          <InventoryCard
            icon="📖"
            label="Lecciones"
            value={summary.totalLessons}
          />
          <InventoryCard
            icon="🔤"
            label="Vocabulario"
            value={summary.totalVocab}
            sub="palabras y frases"
          />
          <InventoryCard
            icon="🎮"
            label="Tipos de juego"
            value={GAME_REGISTRY.length}
          />
        </div>
      </div>

      {/* ── Growth chart ── */}
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <ExportButton type="growth" period={period} label="CSV" />
        </div>
        <GrowthChart data={growth} period={period} />
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SubBreakdown
          paidActive={summary.paidActive}
          trialActive={summary.trialActive}
          complimentaryActive={summary.complimentaryActive}
          trialExpired={summary.trialExpired}
          paidExpired={summary.paidExpired}
          checkoutAbandoned={summary.checkoutAbandoned}
          monthlyPrice={monthlyPrice}
        />
        <TopGamesChart data={topGames} />
      </div>

      {/* ── Retention + Device ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RetentionCard
          rate={retention.rate}
          cohortSize={retention.cohortSize}
          retained={retention.retained}
        />
        <DeviceBreakdown
          mobile={devices.mobile}
          tablet={devices.tablet}
          desktop={devices.desktop}
          total={devices.total}
        />
      </div>

      {/* ── Engagement chart ── */}
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <ExportButton type="engagement" period={Math.min(period, 30)} label="CSV" />
        </div>
        <EngagementChart data={engagement} />
      </div>

      {/* ── Info row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <AIUsageChip
          label="Ingreso recurrente"
          color="#34D399"
          defaultPeriod="month"
          periods={['month', 'total']}
          labels={{ month: 'MRR', total: 'ARR' }}
          today={mrrMonth}
          month={mrrMonth}
          total={mrrAnnual}
          tooltip={`MRR — ingreso recurrente mensual.
ARR — proyección anual (MRR × 12).

El MRR estima el ingreso mensual estable. Las suscripciones mensuales se cuentan a su precio completo, y las anuales se reparten entre 12 meses para reflejar cuánto representan por mes (ya con su descuento aplicado).

Es una proyección del ritmo de ingresos, no el dinero que realmente entró este mes. Solo se consideran los padres con una suscripción de pago activa.`}
        />
        <InfoChip
          label="Ingreso real (caja)"
          value="No disponible"
          color="#34D399"
          muted
          tooltip={`Es el dinero que realmente se cobró durante el mes. A diferencia del MRR, aquí una suscripción anual se cuenta completa en el mes en que se paga, en lugar de repartirse.

Todavía no está disponible porque faltan dos cosas: que los pagos reales estén activos en producción (hoy funcionan en modo de prueba, sin montos), y un registro que guarde cada cobro con su monto y su fecha.

Cuando ambas estén listas, esta tarjeta mostrará la suma de los pagos reales del mes.`}
        />
        <AIUsageChip
          label="Costo IA"
          color="#F59E0B"
          today={`$${costToday.toFixed(4)}`}
          month={`$${costMonth.toFixed(4)}`}
          total={`$${costTotal.toFixed(4)}`}
          tooltip="Costo estimado de llamadas a la IA. Token-based: $0.002/M entrada · $0.010/M salida. Audio: $0.006/min. Seleccioná el período con los botones."
        />
        <AIUsageChip
          label="Peticiones IA"
          color="#A78BFA"
          today={aiUsage.requestsToday.toLocaleString('es-AR')}
          month={aiThisMonth.requests.toLocaleString('es-AR')}
          total={aiAllTime.requests.toLocaleString('es-AR')}
          tooltip="Cantidad de llamadas a la IA (generación de ejercicios, evaluaciones de pronunciación, etc.). Seleccioná el período con los botones."
        />
        <InfoChip
          label="Precisión pronunciación"
          value={summary.totalEvals > 0 ? `${summary.avgEvalScore}%` : 'Sin datos'}
          color="#38BDF8"
          tooltipAlign="right"
          tooltip="Promedio del puntaje (0-100) en evaluaciones de módulo completadas. Refleja qué tan bien los niños pronuncian el vocabulario evaluado."
        />
      </div>

      {/* ── Export all ── */}
      <div className="flex items-center gap-3 pt-2 pb-4 flex-wrap">
        <span className="text-xs text-gray-600 font-medium">Exportar a CSV:</span>
        {[
          { label: 'Resumen',      type: 'summary' },
          { label: 'Crecimiento',  type: 'growth' },
          { label: 'Actividad',    type: 'engagement' },
          { label: 'Juegos',       type: 'games' },
        ].map(e => (
          <a
            key={e.type}
            href={`/api/admin/analytics/export?type=${e.type}&period=${period}`}
            download
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all text-gray-500 hover:text-gray-300"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
          >
            ↓ {e.label}
          </a>
        ))}
      </div>
    </div>
  )
}
