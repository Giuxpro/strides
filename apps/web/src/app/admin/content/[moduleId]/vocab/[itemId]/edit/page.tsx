import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateVocabItem } from '@/app/admin/_actions'
import { ImageUploadField } from '@/components/admin/ImageUploadField'
import { SubmitButton } from '@/components/admin/SubmitButton'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

interface Props { params: { moduleId: string; itemId: string } }

export default async function EditVocabPage({ params }: Props) {
  const supabase = createClient()

  const [{ data: mod }, { data: item }] = await Promise.all([
    supabase.from('modules').select('id, title_es').eq('id', params.moduleId).single(),
    supabase.from('vocabulary_items')
      .select('id, text_es, text_en, image_url, audio_url, type, min_age')
      .eq('id', params.itemId)
      .single(),
  ])

  if (!mod || !item) notFound()

  return (
    <div className="p-8 max-w-xl">
      <Link href={`/admin/content/${params.moduleId}`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← {mod.title_es}
      </Link>
      <h1 className="text-xl font-bold text-white mt-2 mb-6">Editar vocabulario</h1>

      <form action={updateVocabItem} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <input type="hidden" name="id"        value={item.id} />
        <input type="hidden" name="module_id" value={params.moduleId} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={L}>Español <span className="text-red-500">*</span></label>
            <input name="text_es" required defaultValue={item.text_es} className={I} />
          </div>
          <div>
            <label className={L}>Inglés <span className="text-red-500">*</span></label>
            <input name="text_en" required defaultValue={item.text_en} className={I} />
          </div>
        </div>

        <ImageUploadField
          name="image_url"
          bucket="vocabulary-images"
          defaultValue={item.image_url ?? ''}
          label="Imagen"
        />

        <ImageUploadField
          name="audio_url"
          bucket="vocabulary-audio"
          defaultValue={item.audio_url ?? ''}
          label="Audio"
          accept="audio/*"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={L}>Tipo</label>
            <select name="type" defaultValue={item.type} className={I}>
              <option value="word">Palabra</option>
              <option value="phrase">Frase</option>
            </select>
          </div>
          <div>
            <label className={L}>Edad mínima</label>
            <input name="min_age" type="number" min={4} max={12} defaultValue={item.min_age} className={I} />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <SubmitButton label="Guardar cambios" />
          <Link href={`/admin/content/${params.moduleId}`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
