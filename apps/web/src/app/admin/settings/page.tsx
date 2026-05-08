import { createClient } from '@/lib/supabase/server'
import { updateSettings } from '@/app/actions/admin'
import { AIModelSelector } from '@/components/admin/AIModelSelector'
import { GAME_POOL } from '@/components/kids/engine/gamePool'

export default async function AdminSettingsPage() {
  const supabase = createClient()

  const { data: rows } = await supabase.from('settings').select('key, value')
  const s = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))

  const aiProvider     = (s['ai_provider']     as string) ?? 'anthropic'
  const aiModel        = (s['ai_model']         as string) ?? 'claude-haiku-4-5'
  const onboardingFlow = (s['onboarding_flow']  as string) ?? 'a'
  const trialDays      = (s['trial_days']        as number) ?? 7
  const availMods   = (s['available_modifiers'] as { timer?: boolean; lives?: boolean; multiplier?: boolean }) ??
    { timer: true, lives: true, multiplier: true }
  const gameConfigs = (s['game_configs'] as Record<string, { minItems?: number; maxItems?: number }>) ?? {}

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-xl font-bold text-white mb-1">Configuración</h1>
      <p className="text-sm text-gray-500 mb-8">IA, onboarding y trial</p>

      <form action={updateSettings} className="space-y-8">

        {/* IA */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Inteligencia Artificial</h2>
          <AIModelSelector initialProvider={aiProvider} initialModel={aiModel} />
        </section>

        {/* Onboarding */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Onboarding</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Flujo de registro</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="onboarding_flow"
                  value="a"
                  defaultChecked={onboardingFlow === 'a'}
                  className="accent-violet-500 mt-0.5"
                />
                <span>
                  <span className="text-sm text-gray-300">Flujo A</span>
                  <span className="block text-xs text-gray-600">Onboarding → Pago → App</span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="onboarding_flow"
                  value="b"
                  defaultChecked={onboardingFlow === 'b'}
                  className="accent-violet-500 mt-0.5"
                />
                <span>
                  <span className="text-sm text-gray-300">Flujo B</span>
                  <span className="block text-xs text-gray-600">Onboarding → Trial → App → Pago al vencer</span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="trial_days" className="block text-sm text-gray-400 mb-2">
              Días de trial <span className="text-gray-600">(Flujo B)</span>
            </label>
            <input
              id="trial_days"
              name="trial_days"
              type="number"
              min={1}
              max={90}
              defaultValue={trialDays}
              className="w-24 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </section>

        {/* Juegos */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Juegos — Modificadores</h2>
          <p className="text-xs text-gray-600">Activa o desactiva los modificadores disponibles en el panel de juegos libre.</p>

          <div className="flex flex-col gap-3">
            {([
              { name: 'modifier_timer',      label: 'Temporizador', hint: 'Partidas con cuenta atrás' },
              { name: 'modifier_lives',      label: 'Vidas',        hint: 'Número de errores permitidos' },
              { name: 'modifier_multiplier', label: 'Multiplicador',hint: 'Duplica opciones (requiere tiempo o vidas)' },
            ] as const).map(({ name, label, hint }) => (
              <label key={name} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name={name}
                  defaultChecked={availMods[name.replace('modifier_', '') as keyof typeof availMods] !== false}
                  className="accent-violet-500 mt-0.5 w-4 h-4"
                />
                <span>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
                  <span className="block text-xs text-gray-600">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Límites de juegos */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Juegos — Límites de palabras</h2>
          <p className="text-xs text-gray-600">
            Mín: palabras necesarias para habilitar el juego. Máx: palabras usadas por partida.
          </p>

          {GAME_POOL.map(game => (
            <div key={game.id} className="flex items-center gap-6">
              <span className="text-sm text-gray-300 w-36">{game.emoji} {game.title}</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Mín</label>
                <input
                  type="number"
                  name={`min_${game.id}`}
                  min={1}
                  max={50}
                  defaultValue={gameConfigs[game.id]?.minItems ?? game.minItems}
                  className="w-16 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Máx</label>
                <input
                  type="number"
                  name={`max_${game.id}`}
                  min={1}
                  max={50}
                  defaultValue={gameConfigs[game.id]?.maxItems ?? game.maxItems}
                  className="w-16 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          ))}
        </section>

        <button
          type="submit"
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  )
}
