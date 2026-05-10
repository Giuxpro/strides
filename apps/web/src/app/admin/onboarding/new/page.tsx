import Link from 'next/link'
import { createOnboardingScreen } from '../_actions'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

export default function NewOnboardingScreenPage() {
  return (
    <div className="p-8 max-w-md">
      <Link href="/admin/onboarding" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← Onboarding
      </Link>
      <h1 className="text-xl font-bold text-white mt-2 mb-6">Nueva pantalla</h1>

      <form action={createOnboardingScreen} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <div>
          <label className={L}>Título <span className="text-red-500">*</span></label>
          <input name="title" required className={I} placeholder="Bienvenida" />
        </div>

        <div>
          <label className={L}>Slug <span className="text-red-500">*</span></label>
          <input
            name="slug"
            required
            className={I}
            placeholder="welcome"
            pattern="[a-z0-9-]+"
            title="Solo letras minúsculas, números y guiones"
          />
          <p className="text-xs text-gray-600 mt-1">Identificador único. Ej: <code className="text-gray-500">welcome</code></p>
        </div>

        <div>
          <label className={L}>Flujo</label>
          <div className="flex flex-col gap-2">
            {([
              { value: 'all', label: 'Todos los usuarios',  hint: 'Se muestra en cualquier flujo de registro' },
              { value: 'a',   label: 'Solo Flujo A',        hint: 'Onboarding → Pago → App' },
              { value: 'b',   label: 'Solo Flujo B',        hint: 'Onboarding → Trial → App → Pago al vencer' },
            ] as const).map(({ value, label, hint }) => (
              <label key={value} className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="flow"
                  value={value}
                  defaultChecked={value === 'all'}
                  className="accent-violet-500 mt-0.5"
                />
                <span>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
                  <span className="block text-xs text-gray-600">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            Crear y editar con Puck →
          </button>
          <Link href="/admin/onboarding" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
