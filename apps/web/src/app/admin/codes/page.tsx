import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getAllAccessCodes } from '@strides/db'
import { CodesRealtimeRefresher } from '@/components/admin/codes/CodesRealtimeRefresher'
import { CodesTableClient } from './CodesTableClient'

const PAGE_SIZE = 25

export default async function CodesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const supabase = createClient()
  const q      = searchParams.q?.trim() ?? ''
  const page   = Math.max(1, parseInt(searchParams.page ?? '1') || 1)
  const offset = (page - 1) * PAGE_SIZE

  const { data: codes, count } = await getAllAccessCodes(supabase, {
    search: q || undefined,
    limit:  PAGE_SIZE,
    offset,
  })

  const total = count ?? 0

  return (
    <div className="p-8">
      <CodesRealtimeRefresher />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Códigos de acceso</h1>
          <p className="text-sm text-gray-500">
            {total} código{total !== 1 ? 's' : ''} creado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/codes/redemptions"
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-colors"
          >
            Ver canjes
          </Link>
          <Link
            href="/admin/codes/new"
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
          >
            + Nuevo código
          </Link>
        </div>
      </div>

      {total === 0 && !q ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm mb-4">Aún no hay códigos creados.</p>
          <Link href="/admin/codes/new" className="text-violet-400 hover:text-violet-300 text-sm">
            Crear primer código →
          </Link>
        </div>
      ) : (
        <CodesTableClient
          codes={codes ?? []}
          total={total}
          currentPage={page}
          searchValue={q}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  )
}
