import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { toggleModulePublished } from '@/app/actions/admin'

export default async function AdminContentPage() {
  const supabase = createClient()

  const { data: modules } = await supabase
    .from('modules')
    .select('id, title_es, title_en, slug, is_published, order')
    .order('order')

  const { data: lessonCounts } = await supabase
    .from('lessons')
    .select('module_id')

  const countByModule = (lessonCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.module_id] = (acc[row.module_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
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

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Módulo</th>
              <th className="text-left px-5 py-3">Slug</th>
              <th className="text-center px-5 py-3">Lecciones</th>
              <th className="text-center px-5 py-3">Estado</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(modules ?? []).map(mod => (
              <tr key={mod.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-white">{mod.title_es}</p>
                  <p className="text-xs text-gray-500">{mod.title_en}</p>
                </td>
                <td className="px-5 py-3 text-gray-400 font-mono text-xs">{mod.slug}</td>
                <td className="px-5 py-3 text-center text-gray-300">{countByModule[mod.id] ?? 0}</td>
                <td className="px-5 py-3 text-center">
                  <form action={async () => {
                    'use server'
                    await toggleModulePublished(mod.id, !mod.is_published)
                  }}>
                    <button
                      type="submit"
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        mod.is_published
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {mod.is_published ? 'Publicado' : 'Borrador'}
                    </button>
                  </form>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/content/${mod.id}`}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}

            {(!modules || modules.length === 0) && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-600">
                  Sin módulos aún.{' '}
                  <Link href="/admin/content/new" className="text-violet-400 hover:text-violet-300">
                    Crear el primero →
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
