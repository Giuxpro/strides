import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SortableModuleList } from '@/components/admin/SortableModuleList'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { getModulesAdmin, getLessonCountsForModules, getAllModulesForAdmin } from '@strides/db'
import { AIGenerateDialog } from '@/components/admin/AIGenerateDialog'

const PAGE_SIZE = 20

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const supabase = createClient()

  const q      = searchParams.q?.toLowerCase().trim() ?? ''
  const page   = Math.max(1, parseInt(searchParams.page ?? '1') || 1)
  const offset = (page - 1) * PAGE_SIZE

  const [{ data: modules, count }, { data: allModules }] = await Promise.all([
    getModulesAdmin(supabase, { q, offset, limit: PAGE_SIZE }),
    getAllModulesForAdmin(supabase),
  ])

  const moduleIds = (modules ?? []).map(m => m.id)
  const { data: lessonCounts } = moduleIds.length > 0
    ? await getLessonCountsForModules(supabase, moduleIds)
    : { data: [] }

  const countByModule = (lessonCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.module_id] = (acc[row.module_id] ?? 0) + 1
    return acc
  }, {})

  const total     = count ?? 0
  const multiPage = total > PAGE_SIZE

  const moduleOptions = (allModules ?? []).map(m => ({ id: m.id, title_es: m.title_es ?? m.title_en ?? m.id }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Contenido</h1>
          <p className="text-sm text-gray-500">Módulos y lecciones</p>
        </div>
        <div className="flex items-center gap-2">
          <AIGenerateDialog modules={moduleOptions} />
          <Link
            href="/admin/content/new"
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
          >
            + Nuevo módulo
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <AdminSearch initialValue={searchParams.q ?? ''} placeholder="Buscar módulo..." />
      </div>

      {(modules ?? []).length > 0 ? (
        <SortableModuleList
          modules={modules ?? []}
          lessonCounts={countByModule}
          searchActive={!!q || multiPage}
          footer={<AdminPagination total={total} pageSize={PAGE_SIZE} currentPage={page} extraParams={q ? { q } : {}} />}
        />
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-10 text-center text-gray-600">
          {q ? (
            <p>Sin resultados para &quot;{q}&quot;.</p>
          ) : (
            <>
              Sin módulos aún.{' '}
              <Link href="/admin/content/new" className="text-violet-400 hover:text-violet-300">
                Crear el primero →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
