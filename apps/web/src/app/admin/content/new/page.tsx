import Link from 'next/link'
import { createModule } from '@/app/admin/_actions'
import { ImageUploadField } from '@/components/admin/ImageUploadField'
import { SubmitButton } from '@/components/admin/SubmitButton'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

export default function NewModulePage() {
  return (
    <div className="p-8 max-w-xl">
      <Link href="/admin/content" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← Contenido
      </Link>
      <h1 className="text-xl font-bold text-white mt-2 mb-6">Nuevo módulo</h1>

      <form action={createModule} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={L}>Título en español <span className="text-red-500">*</span></label>
            <input name="title_es" required className={I} placeholder="Animales" />
          </div>
          <div>
            <label className={L}>Título en inglés <span className="text-red-500">*</span></label>
            <input name="title_en" required className={I} placeholder="Animals" />
          </div>
        </div>

        <div>
          <label className={L}>Slug <span className="text-red-500">*</span></label>
          <input
            name="slug"
            required
            className={I}
            placeholder="animales"
            pattern="[a-z0-9-]+"
            title="Solo letras minúsculas, números y guiones"
          />
          <p className="text-xs text-gray-600 mt-1">Minúsculas y guiones, sin espacios. Ej: <code className="text-gray-500">animales-del-mar</code></p>
        </div>

        <div>
          <label className={L}>Descripción (opcional)</label>
          <textarea
            name="description_es"
            rows={2}
            className={I}
            placeholder="Aprende los nombres de los animales más comunes"
          />
        </div>

        <ImageUploadField
          name="cover_image_url"
          bucket="module-covers"
          label="Imagen de portada (opcional)"
        />

        <ImageUploadField
          name="audio_url"
          bucket="module-audio"
          label="Audio del módulo (opcional)"
          accept="audio/*"
        />

        <div className="flex items-center gap-4 pt-2">
          <SubmitButton label="Crear módulo" pendingLabel="Creando…" />
          <Link href="/admin/content" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
