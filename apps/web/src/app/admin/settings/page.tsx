import { createClient } from '@/lib/supabase/server'
import { updateSettings } from '@/app/admin/_actions'
import { AIModelSelector } from '@/components/admin/AIModelSelector'
import { SubmitButton } from '@/components/admin/SubmitButton'
import { GAME_REGISTRY, VOICE_PRESET_CONFIGS, isVoicePreset, DEFAULT_VOICE_PRESET } from '@strides/core/kids'

export default async function AdminSettingsPage() {
  const supabase = createClient()

  const { data: rows } = await supabase.from('settings').select('key, value')
  const s = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))

  const aiProvider = (s['ai_provider'] as string) ?? 'anthropic'
  const aiModel = (s['ai_model'] as string) ?? 'claude-haiku-4-5'
  const onboardingFlow = (s['onboarding_flow'] as string) ?? 'a'
  const trialDays = (s['trial_days'] as number) ?? 7
  const availMods = (s['available_modifiers'] as { timer?: boolean; lives?: boolean; multiplier?: boolean }) ??
    { timer: true, lives: true, multiplier: true }
  const gameConfigs = (s['game_configs'] as Record<string, { minItems?: number; maxItems?: number }>) ?? {}
  const voicePreset = isVoicePreset(s['voice_preset']) ? s['voice_preset'] : DEFAULT_VOICE_PRESET

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-xl font-bold text-white mb-1">Configuración</h1>
      <p className="text-sm text-gray-500 mb-8">IA, onboarding, juegos y voz</p>

      <form action={updateSettings}>
        <div className="grid grid-cols-2 gap-6 items-stretch">

          {/* ── Columna izquierda: App ── */}
          <div className="flex flex-col gap-6 h-full">

            {/* IA */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Inteligencia Artificial</h2>
              <AIModelSelector initialProvider={aiProvider} initialModel={aiModel} />
            </section>

            {/* Onboarding */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5 flex-1">
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

          </div>

          {/* ── Columna derecha: Experiencia kids ── */}
          <div className="flex flex-col gap-6">

            {/* Voz del sistema */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-8">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Voz del sistema</h2>
              <p className="text-xs text-gray-600">Voz que escuchan los niños durante ejercicios y lecciones.</p>

              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(VOICE_PRESET_CONFIGS) as [keyof typeof VOICE_PRESET_CONFIGS, typeof VOICE_PRESET_CONFIGS[keyof typeof VOICE_PRESET_CONFIGS]][]).map(([key, cfg]) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="voice_preset"
                      value={key}
                      defaultChecked={voicePreset === key}
                      className="accent-violet-500 mt-0.5"
                    />
                    <span>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {cfg.emoji} {cfg.label}
                      </span>
                      <span className="block text-xs text-gray-600">{cfg.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Juegos */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex-1 flex flex-col gap-6">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Juegos</h2>

              <div>
                <p className="text-xs text-gray-400 font-medium mb-3">Modificadores disponibles</p>
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
              </div>

              <div className="border-t border-gray-800 pt-6">
                <p className="text-xs text-gray-400 font-medium mb-1">Límites de palabras por juego</p>
                <p className="text-xs text-gray-600 mb-4">Mín: palabras para habilitar · Máx: palabras por partida</p>
                <div className="flex flex-col gap-3">
                  {GAME_REGISTRY.map(game => (
                    <div key={game.id} className="flex items-center gap-4">
                      <span className="text-sm text-gray-300 w-32 shrink-0">{game.emoji} {game.title}</span>
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
                </div>
              </div>
            </section>

          </div>
        </div>

        <div className="mt-6">
          <SubmitButton label="Guardar cambios" />
        </div>
      </form>
    </div>
  )
}
