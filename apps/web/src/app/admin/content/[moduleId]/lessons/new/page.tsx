import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createLesson } from '@/app/actions/admin'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

interface Props { params: { moduleId: string } }

export default async function NewLessonPage({ params }: Props) {
  const supabase = createClient()

  const [{ data: mod }, { data: lessons }, { data: vocab }] = await Promise.all([
    supabase.from('modules').select('id, title_es').eq('id', params.moduleId).single(),
    supabase.from('lessons').select('order').eq('module_id', params.moduleId).order('order', { ascending: false }).limit(1),
    supabase.from('vocabulary_items').select('id, text_es, text_en, image_url').eq('module_id', params.moduleId).order('order'),
  ])

  if (!mod) notFound()

  const nextOrder = (lessons?.[0]?.order ?? 0) + 1

  return (
    <div className="p-8 max-w-xl">
      <Link href={`/admin/content/${params.moduleId}`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← {mod.title_es}
      </Link>
      <h1 className="text-xl font-bold text-white mt-2 mb-6">Nueva lección</h1>

      <form action={createLesson} className="space-y-5">
        <input type="hidden" name="module_id" value={params.moduleId} />

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={L}>Título en español <span className="text-red-500">*</span></label>
              <input name="title_es" required className={I} placeholder="Animales de granja" />
            </div>
            <div>
              <label className={L}>Título en inglés <span className="text-red-500">*</span></label>
              <input name="title_en" required className={I} placeholder="Farm animals" />
            </div>
          </div>

          <div>
            <label className={L}>Slug <span className="text-red-500">*</span></label>
            <input
              name="slug"
              required
              className={I}
              placeholder="animales-de-granja"
              pattern="[a-z0-9-]+"
              title="Solo letras minúsculas, números y guiones"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={L}>Orden</label>
              <input name="order" type="number" min={1} defaultValue={nextOrder} className={`${I}`} />
            </div>
            <div>
              <label className={L}>Edad mínima</label>
              <input name="min_age" type="number" min={4} max={12} defaultValue={4} className={`${I}`} />
            </div>
          </div>
        </div>

        {/* Vocab selector */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm font-semibold text-gray-300 mb-1">
            Vocabulario de esta lección
          </p>
          <p className="text-xs text-gray-600 mb-4">
            Se crearán automáticamente 1 ejercicio de práctica (memorama) y 1 de evaluación (reconocimiento) con las palabras seleccionadas.
          </p>

          {vocab && vocab.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {vocab.map(item => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="vocab_ids"
                    value={item.id}
                    className="w-4 h-4 accent-violet-500 flex-shrink-0"
                  />
                  {item.image_url && (
                    <img src={item.image_url} alt={item.text_es} className="w-7 h-7 object-contain flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    {item.text_es}
                    <span className="text-gray-600 ml-2">/ {item.text_en}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Este módulo no tiene vocabulario aún.{' '}
              <Link href={`/admin/content/${params.moduleId}/vocab/new`} className="text-violet-400 hover:text-violet-300">
                Añadir vocabulario primero →
              </Link>
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Crear lección
          </button>
          <Link href={`/admin/content/${params.moduleId}`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
