import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersTableClient } from './UsersTableClient'

const PAGE_SIZE = 25

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; plan?: string; status?: string }
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
  const search = q || undefined
  const plan   = searchParams.plan   || undefined
  const status = searchParams.status || undefined

  const [
    { data: users },
    { data: totalRaw },
    { data: priceRow },
    { data: discountRow },
  ] = await Promise.all([
    admin.rpc('get_admin_users_overview', { p_search: search, p_limit: PAGE_SIZE, p_offset: offset, p_plan: plan, p_status: status }),
    admin.rpc('get_admin_users_count',    { p_search: search, p_plan: plan, p_status: status }),
    admin.from('settings').select('value').eq('key', 'monthly_price').maybeSingle(),
    admin.from('settings').select('value').eq('key', 'global_discount').maybeSingle(),
  ])

  const total          = (totalRaw as number) ?? 0
  const monthlyPrice   = (priceRow?.value as number) ?? null
  const globalDiscount = discountRow?.value as { enabled: boolean; percent: number } | null
  const promoPercent   = globalDiscount?.enabled ? (globalDiscount.percent ?? 0) : 0

  const userIds = (users ?? []).map(u => u.id)
  const [{ data: avatarRows }, { data: subs }] = userIds.length > 0
    ? await Promise.all([
        admin.from('profiles').select('id, avatar').in('id', userIds),
        admin.from('subscriptions').select('user_id, redeemed_code_id').in('user_id', userIds),
      ])
    : [{ data: [] }, { data: [] }]

  const avatarByUser: Record<string, string | null> = Object.fromEntries(
    (avatarRows ?? []).map(p => [p.id, p.avatar])
  )
  const codeIdByUser: Record<string, string> = Object.fromEntries(
    (subs ?? []).filter(s => s.redeemed_code_id).map(s => [s.user_id, s.redeemed_code_id as string])
  )

  return (
    <div className="p-4 sm:p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Usuarios</h1>
          <p className="text-sm text-gray-500">
            {total} usuario{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {total === 0 && !q && !plan && !status ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">Aún no hay usuarios registrados.</p>
        </div>
      ) : (
        <UsersTableClient
          users={users as Parameters<typeof UsersTableClient>[0]['users']}
          total={total}
          currentPage={page}
          searchValue={q}
          planFilter={plan ?? ''}
          statusFilter={status ?? ''}
          avatarByUser={avatarByUser}
          codeIdByUser={codeIdByUser}
          monthlyPrice={monthlyPrice}
          promoPercent={promoPercent}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  )
}
