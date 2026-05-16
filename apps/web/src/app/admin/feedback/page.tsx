import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedbackTableClient } from './FeedbackTableClient'

const PAGE_SIZE = 25

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/kids/play')

  const admin  = createAdminClient()
  const q      = searchParams.q?.trim() ?? ''
  const page   = Math.max(1, parseInt(searchParams.page ?? '1') || 1)
  const offset = (page - 1) * PAGE_SIZE

  // Search by message; for user email/name we do a two-step when q is set
  let userIds: string[] | null = null
  if (q) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id')
      .or(`email.ilike.%${q}%,display_name.ilike.%${q}%`)
    userIds = (profiles ?? []).map(p => p.id)
  }

  // Build query: search by message OR by user IDs found above
  let query = admin
    .from('feedback')
    .select('*, profiles(display_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (q) {
    if (userIds && userIds.length > 0) {
      query = query.or(`message.ilike.%${q}%,user_id.in.(${userIds.join(',')})`)
    } else {
      query = query.ilike('message', `%${q}%`)
    }
  }

  const { data: feedbacks, count } = await query
  const total = count ?? 0

  // Stats (global, not filtered)
  const { data: allFeedback } = await admin.from('feedback').select('stars, status')
  const newCount  = (allFeedback ?? []).filter(f => f.status === 'new').length
  const ratingCnt = (allFeedback ?? []).filter(f => f.stars).length
  const avgStars  = ratingCnt > 0
    ? ((allFeedback ?? []).reduce((s, f) => s + (f.stars ?? 0), 0) / ratingCnt).toFixed(1)
    : '—'

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Feedback</h1>
          <p className="text-sm text-gray-500">{allFeedback?.length ?? 0} entradas · {newCount} nuevas</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{avgStars}</p>
            <p className="text-xs text-gray-500">Promedio ⭐</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-violet-400">{newCount}</p>
            <p className="text-xs text-gray-500">Sin revisar</p>
          </div>
        </div>
      </div>

      {total === 0 && !q ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">Aún no hay feedback registrado.</p>
        </div>
      ) : (
        <FeedbackTableClient
          feedbacks={feedbacks as Parameters<typeof FeedbackTableClient>[0]['feedbacks']}
          total={total}
          currentPage={page}
          searchValue={q}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  )
}
