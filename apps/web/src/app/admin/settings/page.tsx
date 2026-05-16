import { createClient } from '@/lib/supabase/server'
import { updateSettings } from '@/app/admin/_actions'
import { AIModelSelector } from '@/components/admin/AIModelSelector'
import { SpeechProviderSelector } from '@/components/admin/SpeechProviderSelector'
import { AcquisitionSelector } from '@/components/admin/AcquisitionSelector'
import { SubmitButton } from '@/components/admin/SubmitButton'
import { GAME_REGISTRY, VOICE_PRESET_CONFIGS, isVoicePreset, DEFAULT_VOICE_PRESET, isSpeechProvider, DEFAULT_SPEECH_PROVIDER, isAudioConfig, DEFAULT_AUDIO_CONFIG } from '@strides/core/kids'
import { MusicUploaderPanel } from '@/components/admin/MusicUploaderPanel'
import { GlobalDiscountPanel } from '@/components/admin/GlobalDiscountPanel'
import { FeedbackPromptPanel } from '@/components/admin/FeedbackPromptPanel'
import { getAllFlows } from '@strides/db'

export default async function AdminSettingsPage() {
  const supabase = createClient()

  const { data: rows } = await supabase.from('settings').select('key, value')
  const s = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))

  const { data: allFlows } = await getAllFlows(supabase)

  const aiProvider = (s['ai_provider'] as string) ?? 'anthropic'
  const aiModel = (s['ai_model'] as string) ?? 'claude-haiku-4-5'
  const onboardingFlow  = (s['onboarding_flow']  as string) ?? ''
  const landingVariant  = (s['landing_variant']  as string) ?? 'a'
  const trialDays       = (s['trial_days'] as number) ?? 7
  const monthlyPrice    = (s['monthly_price'] as number | null) ?? null
  const globalDiscount  = (s['global_discount'] as { enabled: boolean; percent: number; label: string; duration_months: number | null }) ?? { enabled: false, percent: 10, label: '', duration_months: null }
  const feedbackPrompt  = (s['feedback_prompt_config'] as { enabled: boolean; trigger: 'lesson' | 'module' | 'games' | 'admin_test'; games_threshold: number }) ?? { enabled: false, trigger: 'lesson' as const, games_threshold: 10 }
  const availMods = (s['available_modifiers'] as { timer?: boolean; lives?: boolean; multiplier?: boolean }) ??
    { timer: true, lives: true, multiplier: true }
  const gameConfigs = (s['game_configs'] as Record<string, { minItems?: number; maxItems?: number }>) ?? {}
  const voicePreset    = isVoicePreset(s['voice_preset']) ? s['voice_preset'] : DEFAULT_VOICE_PRESET
  const speechProvider = isSpeechProvider(s['speech_provider']) ? s['speech_provider'] : DEFAULT_SPEECH_PROVIDER
  const audioConfig_   = isAudioConfig(s['audio_config']) ? s['audio_config'] : DEFAULT_AUDIO_CONFIG
  const audioVolume    = audioConfig_.volume
  const clickVolume    = audioConfig_.click_volume ?? audioVolume

  // Fuente de verdad: bucket real (no la config cacheada)
  const MUSIC_BASE = 'https://ievftgzxiwtjocxnrmgv.supabase.co/storage/v1/object/public/background-music'
  const [{ data: navFiles }, { data: gameFiles }] = await Promise.all([
    supabase.storage.from('background-music').list('navigation'),
    supabase.storage.from('background-music').list('game'),
  ])
  const bucketAudioConfig = {
    navigation_tracks: (navFiles ?? []).map(f => `${MUSIC_BASE}/navigation/${f.name}`),
    game_tracks:       (gameFiles ?? []).map(f => `${MUSIC_BASE}/game/${f.name}`),
    volume: audioVolume,
    click_sound_url: audioConfig_.click_sound_url ?? null,
  }

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

            {/* Reconocimiento de voz */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Reconocimiento de voz</h2>
              <SpeechProviderSelector initialProvider={speechProvider} />
            </section>

            {/* Adquisición y Onboarding */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Onboarding</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Modelo de conversión y pantallas</p>
                </div>
                <a href="/admin/onboarding" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Gestionar pantallas →
                </a>
              </div>

              <AcquisitionSelector initialVariant={landingVariant} initialTrialDays={trialDays} />

              <div>
                <label htmlFor="monthly_price" className="block text-sm text-gray-400 mb-1.5">
                  Precio mensual (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    id="monthly_price"
                    name="monthly_price"
                    type="number"
                    min={0}
                    step={0.01}
                    defaultValue={monthlyPrice ?? ''}
                    placeholder="9.99"
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg pl-7 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Precio que se muestra en la página de billing.</p>
              </div>

              <div className="border-t border-gray-800 pt-5">
                <p className="text-xs text-gray-400 font-medium mb-3">Promoción global</p>
                <p className="text-xs text-gray-600 mb-4">Descuento automático para todos los usuarios al pagar. No requiere código.</p>
                <GlobalDiscountPanel initial={globalDiscount} />
              </div>

              <div className="border-t border-gray-800 pt-5">
                <label htmlFor="onboarding_flow" className="block text-sm text-gray-400 mb-1.5">
                  Flujo de pantallas activo
                </label>
                {(!allFlows || allFlows.length === 0) ? (
                  <p className="text-xs text-gray-600">
                    Sin flujos creados.{' '}
                    <a href="/admin/onboarding/new" className="text-violet-400 hover:text-violet-300">
                      Crear flujo →
                    </a>
                  </p>
                ) : (
                  <select
                    id="onboarding_flow"
                    name="onboarding_flow"
                    defaultValue={onboardingFlow}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">— Sin flujo (ir directo a registro) —</option>
                    {allFlows.map(flow => (
                      <option key={flow.id} value={flow.id}>{flow.name}</option>
                    ))}
                  </select>
                )}
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
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
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

            {/* Feedback & NPS */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-0.5">Feedback & NPS</h2>
                <p className="text-xs text-gray-600">Cuándo mostrar la encuesta de satisfacción a los usuarios.</p>
              </div>
              <FeedbackPromptPanel initial={feedbackPrompt} />
            </section>

          </div>
        </div>

        {/* ── Audio de fondo ── */}
        <section className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-1">Música de fondo</h2>
            <p className="text-xs text-gray-600">Un URL por línea. Se reproducen en bucle con orden aleatorio.</p>
          </div>

          <MusicUploaderPanel config={bucketAudioConfig} audioVolume={audioVolume} clickVolume={clickVolume} />
        </section>

        <div className="mt-6">
          <SubmitButton label="Guardar cambios" />
        </div>
      </form>
    </div>
  )
}
