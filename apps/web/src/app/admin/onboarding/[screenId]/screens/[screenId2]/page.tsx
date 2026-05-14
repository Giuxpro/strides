import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingScreenById, getFlowById } from '@strides/db'
import { updateOnboardingMeta, toggleOnboardingPublished } from '../../../_actions'
import { SubmitButton } from '@/components/admin/SubmitButton'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

interface Props { params: { screenId: string; screenId2: string } }

export default async function ScreenDetailPage({ params }: Props) {
  const { screenId: flowId, screenId2: screenId } = params
  const supabase = createClient()

  const [{ data: screen }, { data: flow }] = await Promise.all([
    getOnboardingScreenById(supabase, screenId),
    getFlowById(supabase, flowId),
  ])

  if (!screen || !flow) notFound()

  const updateMeta = updateOnboardingMeta.bind(null, screen.id)

  return (
    <div className="p-8 max-w-xl">
      <Link href={`/admin/onboarding/${flowId}`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← {flow.name}
      </Link>

      <div className="flex items-center gap-3 mt-2 mb-6">
        <h1 className="text-xl font-bold text-white">{screen.title}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          screen.is_published ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700 text-gray-400'
        }`}>
          {screen.is_published ? 'Publicado' : 'Borrador'}
        </span>
      </div>

      {/* Metadata */}
      <form action={updateMeta} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Configuración</h2>

        <div>
          <label className={L}>Título</label>
          <input name="title" required defaultValue={screen.title} className={I} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={L}>Slug <span className="text-gray-600 font-normal">(URL)</span></label>
            <input
              value={screen.slug}
              readOnly
              className={`${I} font-mono opacity-50 cursor-not-allowed`}
            />
            <p className="text-xs text-gray-700 mt-1">No editable</p>
          </div>
          <div>
            <label className={L}>Orden</label>
            <input name="order" type="number" min={0} defaultValue={screen.order} className={I} />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
        </div>
      </form>

      <form action={toggleOnboardingPublished.bind(null, screen.id, !screen.is_published)} className="mb-4">
        <SubmitButton
          label={screen.is_published ? 'Despublicar' : 'Publicar'}
          pendingLabel="Guardando…"
          variant={screen.is_published ? 'secondary' : 'primary'}
        />
      </form>

      {/* Editar contenido */}
      <Link
        href={`/admin/onboarding/${flowId}/screens/${screen.id}/edit`}
        className="flex items-center justify-between w-full bg-gray-900 border border-gray-800 hover:border-violet-700 rounded-xl p-5 transition-colors group"
      >
        <div>
          <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
            Editar contenido visual
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Abre el editor Puck para diseñar la pantalla</p>
        </div>
        <span className="text-violet-400 text-lg">→</span>
      </Link>
    </div>
  )
}
