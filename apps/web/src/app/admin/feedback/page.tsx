import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedbackTableClient } from './FeedbackTableClient'
import { getFeedback, getFeedbackStats, getFeedbackUserIds } from '@strides/db'

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

  let userIds: string[] | undefined
  if (q) {
    const { data: profiles } = await getFeedbackUserIds(admin, q)
    userIds = (profiles ?? []).map(p => p.id)
  }

  const [{ data: feedbacks, count }, { data: allFeedback }] = await Promise.all([
    getFeedback(admin, { q, userIds, offset, limit: PAGE_SIZE }),
    getFeedbackStats(admin),
  ])

  const total     = count ?? 0
  const newCount  = (allFeedback ?? []).filter(f => f.status === 'new').length
  const ratingCnt = (allFeedback ?? []).filter(f => f.stars).length
  const avgStars  = ratingCnt > 0
    ? ((allFeedback ?? []).reduce((s, f) => s + (f.stars ?? 0), 0) / ratingCnt).toFixed(1)
    : '—'

  return (
    <div className="p-8">
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
