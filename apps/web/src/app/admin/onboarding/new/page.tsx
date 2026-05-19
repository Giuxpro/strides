import Link from 'next/link'
import { createOnboardingFlow } from '../_actions'
import { SubmitButton } from '@/components/admin/SubmitButton'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

export default function NewFlowPage() {
  return (
    <div className="p-4 sm:p-8 max-w-md">
      <Link href="/admin/onboarding" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← Onboarding
      </Link>
      <h1 className="text-xl font-bold text-white mt-2 mb-6">Nuevo flujo</h1>

      <form action={createOnboardingFlow} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <div>
          <label className={L}>Nombre <span className="text-red-500">*</span></label>
          <input
            name="name"
            required
            autoFocus
            className={I}
            placeholder="Ej: Flujo principal, Versión verano 2026"
          />
        </div>

        <div>
          <label className={L}>Descripción</label>
          <input
            name="description"
            className={I}
            placeholder="Ej: Versión corta enfocada en conversión rápida"
          />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <SubmitButton label="Crear flujo →" pendingLabel="Creando…" />
          <Link href="/admin/onboarding" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
