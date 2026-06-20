import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

type DB = SupabaseClient<Database>

export interface AnalyticsSummary {
  totalParents: number
  totalChildren: number
  // ── Ciclo de vida de suscripciones (5 estados mutuamente exclusivos) ──
  /** Pagaron vía proveedor de pago, suscripción vigente → base del MRR */
  paidActive: number
  /** De los pagos activos, cuántos en ciclo mensual (incluye sin ciclo definido) */
  paidActiveMonthly: number
  /** De los pagos activos, cuántos en ciclo anual */
  paidActiveAnnual: number
  /** Período de prueba activo (landing B o código trial) */
  trialActive: number
  /** Acceso gratuito permanente por código de cortesía */
  complimentaryActive: number
  /** Trial que venció sin convertirse a pago (problema de adquisición) */
  trialExpired: number
  /** Suscripción de pago que venció sin renovar (churn) */
  paidExpired: number
  /** Se registraron en el flujo de pago pero nunca completaron el checkout */
  checkoutAbandoned: number
  // ── Derivados ──
  /** paidActive + trialActive + complimentaryActive */
  activeTotal: number
  /** trialExpired + paidExpired + checkoutAbandoned */
  conversionPotential: number
  // ── Engagement ──
  lessonsCompletedToday: number
  gamesPlayedToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  totalModules: number
  publishedModules: number
  totalLessons: number
  totalVocab: number
  avgStreakActive: number
  totalStreaksActive: number
  childrenActiveThisWeek: number
  avgEvalScore: number
  totalEvals: number
}

export interface GrowthPoint {
  day: string
  newUsers: number
  cumulative: number
}

export interface EngagementPoint {
  day: string
  lessons: number
  games: number
}

export interface GamePlay {
  gameId: string
  plays: number
}

export async function getAnalyticsSummary(db: DB): Promise<AnalyticsSummary> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekAgo = new Date(Date.now() - 7 * 86_400_000)
  const monthAgo = new Date(Date.now() - 30 * 86_400_000)

  const [
    { count: totalParents },
    { count: totalChildren },
    { data: subs },
    { count: lessonsToday },
    { count: gamesToday },
    { count: newThisWeek },
    { count: newThisMonth },
    { count: totalModules },
    { count: publishedModules },
    { count: totalLessons },
    { count: totalVocab },
    { data: streaks },
    { data: recentActivity },
    { data: evals },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
    db.from('children').select('*', { count: 'exact', head: true }),
    // Solo suscripciones de parents: las cuentas admin/staff NO son clientes y no
    // deben contar en MRR ni en los estados del ciclo de vida (inner join + filtro).
    db.from('subscriptions').select('status, acquisition_type, billing_cycle, stripe_subscription_id, profiles!inner(role)').eq('profiles.role', 'parent'),
    db.from('child_lesson_completions').select('*', { count: 'exact', head: true }).gte('completed_at', todayStart.toISOString()),
    db.from('child_game_plays').select('*', { count: 'exact', head: true }).gte('played_at', todayStart.toISOString()),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent').gte('created_at', weekAgo.toISOString()),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent').gte('created_at', monthAgo.toISOString()),
    db.from('modules').select('*', { count: 'exact', head: true }),
    db.from('modules').select('*', { count: 'exact', head: true }).eq('is_published', true),
    db.from('lessons').select('*', { count: 'exact', head: true }),
    db.from('vocabulary_items').select('*', { count: 'exact', head: true }),
    db.from('child_streaks').select('current_streak').gt('current_streak', 0),
    db.from('child_game_plays').select('child_id').gte('played_at', weekAgo.toISOString()),
    db.from('evaluation_results').select('score'),
  ])

  const subsArr   = subs ?? []
  const streakArr = streaks ?? []
  const evalsArr  = evals ?? []

  const childrenSet = new Set((recentActivity ?? []).map(r => r.child_id))

  // ── 5 estados mutuamente exclusivos del ciclo de vida ──
  // Activo pagado: tiene acceso vigente y fue vía proveedor de pago
  const paidSubs           = subsArr.filter(s => s.status === 'active' && s.acquisition_type !== 'trial' && s.acquisition_type !== 'complimentary')
  const paidActive         = paidSubs.length
  const paidActiveAnnual   = paidSubs.filter(s => s.billing_cycle === 'annual').length
  const paidActiveMonthly  = paidActive - paidActiveAnnual
  // Trial: período de prueba gratuita vigente
  const trialActive        = subsArr.filter(s => s.status === 'active' && s.acquisition_type === 'trial').length
  // Cortesía: acceso gratuito permanente por código
  const complimentaryActive = subsArr.filter(s => s.status === 'active' && s.acquisition_type === 'complimentary').length
  // Trial vencido: llegaron al trial pero no convirtieron a pago
  const trialExpired       = subsArr.filter(s => s.status === 'expired' && s.acquisition_type === 'trial').length
  // Pago vencido: eran clientes pagos que no renovaron (churn)
  const paidExpired        = subsArr.filter(s => s.status === 'expired' && s.acquisition_type !== 'trial').length
  // Abandono de checkout: se registraron en el flujo de pago pero no completaron
  const checkoutAbandoned  = subsArr.filter(s => s.status === 'pending_payment').length

  const activeTotal         = paidActive + trialActive + complimentaryActive
  const conversionPotential = trialExpired + paidExpired + checkoutAbandoned

  return {
    totalParents: totalParents ?? 0,
    totalChildren: totalChildren ?? 0,
    paidActive,
    paidActiveMonthly,
    paidActiveAnnual,
    trialActive,
    complimentaryActive,
    trialExpired,
    paidExpired,
    checkoutAbandoned,
    activeTotal,
    conversionPotential,
    lessonsCompletedToday: lessonsToday ?? 0,
    gamesPlayedToday: gamesToday ?? 0,
    newUsersThisWeek: newThisWeek ?? 0,
    newUsersThisMonth: newThisMonth ?? 0,
    totalModules: totalModules ?? 0,
    publishedModules: publishedModules ?? 0,
    totalLessons: totalLessons ?? 0,
    totalVocab: totalVocab ?? 0,
    totalStreaksActive: streakArr.length,
    avgStreakActive: streakArr.length > 0
      ? Math.round(streakArr.reduce((s, r) => s + (r.current_streak ?? 0), 0) / streakArr.length)
      : 0,
    childrenActiveThisWeek: childrenSet.size,
    totalEvals: evalsArr.length,
    avgEvalScore: evalsArr.length > 0
      ? Math.round(evalsArr.reduce((s, r) => s + (r.score ?? 0), 0) / evalsArr.length)
      : 0,
  }
}

export async function getUserGrowthSeries(db: DB, days = 30): Promise<GrowthPoint[]> {
  const since = new Date(Date.now() - (days - 1) * 86_400_000)
  since.setHours(0, 0, 0, 0)

  const [{ data: recent }, { count: totalBefore }] = await Promise.all([
    db.from('profiles').select('created_at').eq('role', 'parent').gte('created_at', since.toISOString()).order('created_at'),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent').lt('created_at', since.toISOString()),
  ])

  const byDay: Record<string, number> = {}
  for (const row of recent ?? []) {
    const day = (row.created_at as string).slice(0, 10)
    byDay[day] = (byDay[day] ?? 0) + 1
  }

  let cumulative = totalBefore ?? 0
  const result: GrowthPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86_400_000)
    const key = d.toISOString().slice(0, 10)
    const newUsers = byDay[key] ?? 0
    cumulative += newUsers
    result.push({ day: key, newUsers, cumulative })
  }
  return result
}

export async function getEngagementSeries(db: DB, days = 14): Promise<EngagementPoint[]> {
  const since = new Date(Date.now() - (days - 1) * 86_400_000)
  since.setHours(0, 0, 0, 0)

  const [{ data: lessons }, { data: games }] = await Promise.all([
    db.from('child_lesson_completions').select('completed_at').gte('completed_at', since.toISOString()),
    db.from('child_game_plays').select('played_at').gte('played_at', since.toISOString()),
  ])

  const lessonsByDay: Record<string, number> = {}
  for (const r of lessons ?? []) {
    const day = (r.completed_at as string).slice(0, 10)
    lessonsByDay[day] = (lessonsByDay[day] ?? 0) + 1
  }
  const gamesByDay: Record<string, number> = {}
  for (const r of games ?? []) {
    const day = (r.played_at as string).slice(0, 10)
    gamesByDay[day] = (gamesByDay[day] ?? 0) + 1
  }

  const result: EngagementPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86_400_000)
    const key = d.toISOString().slice(0, 10)
    result.push({ day: key, lessons: lessonsByDay[key] ?? 0, games: gamesByDay[key] ?? 0 })
  }
  return result
}

export async function getTopGames(db: DB, limit = 8): Promise<GamePlay[]> {
  const { data } = await db.from('child_game_plays').select('game_id')
  const counts: Record<string, number> = {}
  for (const r of data ?? []) {
    counts[r.game_id] = (counts[r.game_id] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([gameId, plays]) => ({ gameId, plays }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, limit)
}

export interface RetentionMetrics {
  rate: number
  cohortSize: number
  retained: number
}

export async function getRetentionRate(db: DB): Promise<RetentionMetrics> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const twoWeeksAgo = new Date(Date.now() - 14 * 86_400_000).toISOString()

  const [{ data: prevGames }, { data: prevLessons }, { data: currGames }, { data: currLessons }] = await Promise.all([
    db.from('child_game_plays').select('child_id').gte('played_at', twoWeeksAgo).lt('played_at', weekAgo),
    db.from('child_lesson_completions').select('child_id').gte('completed_at', twoWeeksAgo).lt('completed_at', weekAgo),
    db.from('child_game_plays').select('child_id').gte('played_at', weekAgo),
    db.from('child_lesson_completions').select('child_id').gte('completed_at', weekAgo),
  ])

  const prevSet = new Set([
    ...(prevGames ?? []).map(r => r.child_id),
    ...(prevLessons ?? []).map(r => r.child_id),
  ])
  const currSet = new Set([
    ...(currGames ?? []).map(r => r.child_id),
    ...(currLessons ?? []).map(r => r.child_id),
  ])

  const cohortSize = prevSet.size
  const retained = cohortSize > 0 ? [...prevSet].filter(id => currSet.has(id)).length : 0
  const rate = cohortSize > 0 ? Math.round((retained / cohortSize) * 100) : 0

  return { rate, cohortSize, retained }
}

export interface DeviceBreakdown {
  mobile: number
  tablet: number
  desktop: number
  total: number
}

export async function getDeviceBreakdown(db: DB): Promise<DeviceBreakdown> {
  const { data } = await db.from('kid_sessions').select('device_type')
  const arr = data ?? []
  const mobile  = arr.filter(r => r.device_type === 'mobile').length
  const tablet  = arr.filter(r => r.device_type === 'tablet').length
  const desktop = arr.filter(r => r.device_type === 'desktop').length
  return { mobile, tablet, desktop, total: arr.length }
}

export async function getAITotalRequests(db: DB): Promise<number> {
  const { count } = await db.from('ai_usage_logs').select('id', { count: 'exact', head: true })
  return count ?? 0
}
