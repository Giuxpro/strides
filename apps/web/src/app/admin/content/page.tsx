import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SortableModuleList } from '@/components/admin/SortableModuleList'
import { AdminSearch } from '@/components/admin/AdminSearch'

export default async function AdminContentPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient()

  const { data: modules } = await supabase
    .from('modules')
    .select('id, title_es, title_en, slug, is_published, order, cover_image_url')
    .order('order')

  const { data: lessonCounts } = await supabase
    .from('lessons')
    .select('module_id')

  const countByModule = (lessonCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.module_id] = (acc[row.module_id] ?? 0) + 1
    return acc
  }, {})

  const q = searchParams.q?.toLowerCase().trim() ?? ''
  const filteredModules = q
    ? (modules ?? []).filter(m =>
        m.title_es.toLowerCase().includes(q) ||
        m.title_en.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q)
      )
    : modules ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Contenido</h1>
          <p className="text-sm text-gray-500">Módulos y lecciones</p>
        </div>
        <Link
          href="/admin/content/new"
          className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo módulo
        </Link>
      </div>

      <div className="mb-4">
        <AdminSearch initialValue={searchParams.q ?? ''} placeholder="Buscar módulo..." />
      </div>

      {filteredModules.length > 0 ? (
        <SortableModuleList modules={filteredModules} lessonCounts={countByModule} searchActive={!!q} />
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
