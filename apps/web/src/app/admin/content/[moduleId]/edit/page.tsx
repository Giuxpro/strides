import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateModule } from '@/app/actions/admin'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

interface Props { params: { moduleId: string } }

export default async function EditModulePage({ params }: Props) {
  const supabase = createClient()
  const { data: mod } = await supabase
    .from('modules')
    .select('id, title_es, title_en, slug, description_es, order')
    .eq('id', params.moduleId)
    .single()

  if (!mod) notFound()

  return (
    <div className="p-8 max-w-xl">
      <Link href={`/admin/content/${params.moduleId}`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← {mod.title_es}
      </Link>
      <h1 className="text-xl font-bold text-white mt-2 mb-6">Editar módulo</h1>

      <form action={updateModule} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <input type="hidden" name="id" value={mod.id} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={L}>Título en español <span className="text-red-500">*</span></label>
            <input name="title_es" required defaultValue={mod.title_es} className={I} />
          </div>
          <div>
            <label className={L}>Título en inglés <span className="text-red-500">*</span></label>
            <input name="title_en" required defaultValue={mod.title_en} className={I} />
          </div>
        </div>

        <div>
          <label className={L}>Slug</label>
          <input
            name="slug_display"
            disabled
            defaultValue={mod.slug}
            className={`${I} opacity-40 cursor-not-allowed`}
          />
          <p className="text-xs text-gray-700 mt-1">El slug no se puede cambiar para no romper rutas existentes.</p>
        </div>

        <div>
          <label className={L}>Descripción (opcional)</label>
          <textarea
            name="description_es"
            rows={2}
            defaultValue={mod.description_es ?? ''}
            className={I}
          />
        </div>

        <div>
          <label className={L}>Orden</label>
          <input name="order" type="number" min={1} defaultValue={mod.order} className={`${I} w-24`} />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Guardar cambios
          </button>
          <Link href={`/admin/content/${params.moduleId}`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
