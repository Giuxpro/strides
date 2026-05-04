import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createVocabItem } from '@/app/actions/admin'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

interface Props { params: { moduleId: string } }

export default async function NewVocabPage({ params }: Props) {
  const supabase = createClient()
  const { data: mod } = await supabase.from('modules').select('id, title_es').eq('id', params.moduleId).single()
  if (!mod) notFound()

  return (
    <div className="p-8 max-w-xl">
      <Link href={`/admin/content/${params.moduleId}`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← {mod.title_es}
      </Link>
      <h1 className="text-xl font-bold text-white mt-2 mb-6">Nuevo vocabulario</h1>

      <form action={createVocabItem} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <input type="hidden" name="module_id" value={params.moduleId} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={L}>Español <span className="text-red-500">*</span></label>
            <input name="text_es" required className={I} placeholder="cerdo" />
          </div>
          <div>
            <label className={L}>Inglés <span className="text-red-500">*</span></label>
            <input name="text_en" required className={I} placeholder="pig" />
          </div>
        </div>

        <div>
          <label className={L}>URL de imagen</label>
          <input
            name="image_url"
            type="url"
            className={I}
            placeholder="https://openmoji.org/data/color/svg/1F437.svg"
          />
          <p className="text-xs text-gray-600 mt-1">
            Usa <a href="https://openmoji.org" target="_blank" rel="noreferrer" className="text-violet-400 hover:text-violet-300">openmoji.org</a> para ilustraciones SVG gratuitas de emojis.
          </p>
        </div>

        <div>
          <label className={L}>URL de audio (opcional)</label>
          <input name="audio_url" type="url" className={I} placeholder="https://..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={L}>Tipo</label>
            <select name="type" defaultValue="word" className={I}>
              <option value="word">Palabra</option>
              <option value="phrase">Frase</option>
            </select>
          </div>
          <div>
            <label className={L}>Edad mínima</label>
            <input name="min_age" type="number" min={4} max={12} defaultValue={4} className={I} />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Crear
          </button>
          <Link href={`/admin/content/${params.moduleId}`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
