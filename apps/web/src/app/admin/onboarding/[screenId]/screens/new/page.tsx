import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFlowById } from '@strides/db'
import { createOnboardingScreen } from '../../../_actions'
import { SubmitButton } from '@/components/admin/SubmitButton'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

interface Props { params: { screenId: string } }

export default async function NewScreenPage({ params }: Props) {
  const flowId = params.screenId
  const supabase = createClient()
  const { data: flow } = await getFlowById(supabase, flowId)
  if (!flow) notFound()

  return (
    <div className="p-8 max-w-md">
      <Link href={`/admin/onboarding/${flowId}`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← {flow.name}
      </Link>
      <h1 className="text-xl font-bold text-white mt-2 mb-6">Nueva pantalla</h1>

      <form action={createOnboardingScreen} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <input type="hidden" name="flow_id" value={flowId} />

        <div>
          <label className={L}>Título <span className="text-red-500">*</span></label>
          <input name="title" required autoFocus className={I} placeholder="Ej: Bienvenida" />
        </div>

        <div>
          <label className={L}>Slug <span className="text-red-500">*</span></label>
          <input
            name="slug"
            required
            className={`${I} font-mono`}
            placeholder="welcome"
            pattern="[a-z0-9-]+"
            title="Solo letras minúsculas, números y guiones"
          />
          <p className="text-xs text-gray-600 mt-1">Forma la URL <code className="text-gray-500">/onboarding/welcome</code> — no se puede cambiar después</p>
        </div>

        <div>
          <label className={L}>Orden</label>
          <input name="order" type="number" min={0} defaultValue={0} className={`${I} w-24`} />
          <p className="text-xs text-gray-600 mt-1">Las pantallas se muestran de menor a mayor</p>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <SubmitButton label="Crear y editar con Puck →" pendingLabel="Creando…" />
          <Link href={`/admin/onboarding/${flowId}`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
