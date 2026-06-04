import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserGrowthSeries, getEngagementSeries, getTopGames, getAnalyticsSummary } from '@strides/db'
import { redirect } from 'next/navigation'

function toCSV(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0]!)
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => String(r[h] ?? '')).join(','))]
  return lines.join('\n')
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 })

  const sp = req.nextUrl.searchParams
  const period = Math.min(365, Math.max(7, parseInt(sp.get('period') ?? '30') || 30))
  const type   = sp.get('type') ?? 'growth'

  const db = createAdminClient()
  let csv = ''
  let filename = ''

  if (type === 'growth') {
    const data = await getUserGrowthSeries(db, period)
    csv = toCSV(data.map(r => ({ Día: r.day, 'Nuevos usuarios': r.newUsers, Acumulado: r.cumulative })))
    filename = `strides-crecimiento-${period}d.csv`
  } else if (type === 'engagement') {
    const data = await getEngagementSeries(db, period)
    csv = toCSV(data.map(r => ({ Día: r.day, Lecciones: r.lessons, Juegos: r.games })))
    filename = `strides-actividad-${period}d.csv`
  } else if (type === 'games') {
    const data = await getTopGames(db, 50)
    csv = toCSV(data.map(r => ({ Juego: r.gameId, Partidas: r.plays })))
    filename = 'strides-juegos.csv'
  } else if (type === 'summary') {
    const s = await getAnalyticsSummary(db)
    csv = toCSV([{
      'Usuarios totales': s.totalParents,
      'Niños': s.totalChildren,
      'Activas total': s.activeTotal,
      'Activas pagadas': s.paidActive,
      'Trial activo': s.trialActive,
      'Cortesía': s.complimentaryActive,
      'Trial vencido': s.trialExpired,
      'Pago vencido': s.paidExpired,
      'Abandono checkout': s.checkoutAbandoned,
      'Conversiones potenciales': s.conversionPotential,
      'Lecciones hoy': s.lessonsCompletedToday,
      'Juegos hoy': s.gamesPlayedToday,
      'Nuevos esta semana': s.newUsersThisWeek,
      'Nuevos este mes': s.newUsersThisMonth,
      'Racha promedio (días)': s.avgStreakActive,
    }])
    filename = 'strides-resumen.csv'
  }

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
