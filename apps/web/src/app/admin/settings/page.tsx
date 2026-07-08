import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateSettings } from '@/app/admin/_actions'
import { AIModelSelector } from '@/components/admin/ai/AIModelSelector'
import { SpeechProviderSelector } from '@/components/admin/ai/SpeechProviderSelector'
import { AcquisitionSelector } from '@/components/admin/codes/AcquisitionSelector'
import { SubmitButton } from '@/components/admin/shared/SubmitButton'
import { InfoTooltip } from '@/components/admin/shared/InfoTooltip'
import { GAME_REGISTRY, VOICE_PRESET_CONFIGS, isVoicePreset, DEFAULT_VOICE_PRESET, isSpeechProvider, DEFAULT_SPEECH_PROVIDER, isAudioConfig, DEFAULT_AUDIO_CONFIG, EVAL_FORMAT_REGISTRY, DEFAULT_EVAL_FORMATS, COUNTING_DEFAULTS } from '@strides/core/kids'
import { MusicUploaderPanel } from '@/components/admin/settings/MusicUploaderPanel'
import { GlobalDiscountPanel } from '@/components/admin/codes/GlobalDiscountPanel'
import { FeedbackPromptPanel } from '@/components/admin/settings/FeedbackPromptPanel'
import { PricingPanel } from '@/components/admin/settings/PricingPanel'
import { getAllFlows, getAIUsageToday, getAllSettings } from '@strides/db'
import { getModel } from '@strides/core'
import { PAYMENT_METHOD_REGISTRY, DEFAULT_PAYMENT_METHODS, type PaymentMethodId } from '@strides/core/payments'

export default async function AdminSettingsPage() {
  const supabase = createClient()

  const { data: rows } = await getAllSettings(supabase)
  const s = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))

  const { data: allFlows } = await getAllFlows(supabase)
  const aiUsageToday = await getAIUsageToday(createAdminClient())

  const buildUsage = (modelId: string) => {
    const row = aiUsageToday.byModel.find(m => m.model === modelId)
    return row
      ? { requestsToday: row.requests, inputTokensToday: 0, outputTokensToday: 0, totalDurationMsToday: row.totalDurationMs, byModel: [row] }
      : { requestsToday: 0, inputTokensToday: 0, outputTokensToday: 0, totalDurationMsToday: 0, byModel: [] }
  }
  const whisperUsage = buildUsage('whisper-1')
  const whisperModel = getModel('whisper-1')!
  const groqWhisperUsage = buildUsage('whisper-large-v3-turbo')
  const groqWhisperModel = getModel('whisper-large-v3-turbo')!

  const aiProvider = (s['ai_provider'] as string) ?? 'anthropic'
  const aiModel    = (s['ai_model']    as string) ?? 'claude-haiku-4-5'
  const onboardingFlow = (s['onboarding_flow'] as string) ?? ''
  const landingVariant = (s['landing_variant'] as string) ?? 'a'
  const trialDays = (s['trial_days'] as number) ?? 7
  const monthlyPrice = (s['monthly_price'] as number | null) ?? null
  const annualDiscountPct = (s['annual_discount_pct'] as number | null) ?? null
  const priceCurrency = (s['price_currency'] as string) === 'USD' ? 'USD' : 'PEN'
  const paymentMethods = (s['payment_methods'] as Partial<Record<PaymentMethodId, boolean>> | undefined) ?? DEFAULT_PAYMENT_METHODS
  const evalFormats = (s['eval_formats'] as Record<string, boolean> | undefined) ?? DEFAULT_EVAL_FORMATS
  const globalDiscount = (s['global_discount'] as { enabled: boolean; percent: number; label: string; duration_months: number | null }) ?? { enabled: false, percent: 10, label: '', duration_months: null }
  const previewConfig = (s['preview_config'] as { scope: 'module' | 'lessons'; lessons_count: number }) ?? { scope: 'module' as const, lessons_count: 3 }
  const lockConfig = (s['lock_config'] as { enabled: boolean; applies_to: string[] }) ?? { enabled: false, applies_to: ['preview', 'trial'] }
  const feedbackPrompt = (s['feedback_prompt_config'] as { enabled: boolean; trigger: 'lesson' | 'module' | 'games' | 'admin_test'; games_threshold: number; cooldown_days: number }) ?? { enabled: false, trigger: 'lesson' as const, games_threshold: 10, cooldown_days: 30 }
  const availMods = (s['available_modifiers'] as { timer?: boolean; lives?: boolean }) ??
    { timer: true, lives: true }
  const gameConfigs = (s['game_configs'] as Record<string, { minItems?: number; maxItems?: number; maxCount?: number; rounds?: number }>) ?? {}
  const adminOnlyGames = (s['admin_only_games'] as string[]) ?? []
  const voicePreset = isVoicePreset(s['voice_preset']) ? s['voice_preset'] : DEFAULT_VOICE_PRESET
  const speechProvider = isSpeechProvider(s['speech_provider']) ? s['speech_provider'] : DEFAULT_SPEECH_PROVIDER
  const audioConfig_ = isAudioConfig(s['audio_config']) ? s['audio_config'] : DEFAULT_AUDIO_CONFIG
  const audioVolume = audioConfig_.volume
  const clickVolume = audioConfig_.click_volume ?? audioVolume

  // Fuente de verdad: bucket real (no la config cacheada)
  const [{ data: navFiles }, { data: gameFiles }] = await Promise.all([
    supabase.storage.from('background-music').list('navigation'),
    supabase.storage.from('background-music').list('game'),
  ])
  const bucketAudioConfig = {
    navigation_tracks: (navFiles ?? []).map(f => `background-music/navigation/${f.name}`),
    game_tracks: (gameFiles ?? []).map(f => `background-music/game/${f.name}`),
    volume: audioVolume,
    click_sound_url: audioConfig_.click_sound_url ?? null,
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-1">Configuración</h1>
      <p className="text-sm text-gray-500 mb-8">IA, onboarding, juegos y voz</p>

      <form action={updateSettings}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── Col 1: Técnica ── */}
          <div className="flex flex-col gap-6">

            {/* IA */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Inteligencia Artificial</h2>
              <AIModelSelector
                initialProvider={aiProvider}
                initialModel={aiModel}
                usage={aiUsageToday}
              />
            </section>

            {/* Reconocimiento de voz */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Reconocimiento de voz</h2>
              <SpeechProviderSelector
                initialProvider={speechProvider}
                whisperUsage={whisperUsage}
                whisperModel={whisperModel}
                groqWhisperUsage={groqWhisperUsage}
                groqWhisperModel={groqWhisperModel}
              />
            </section>

            {/* Bloqueo progresivo */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Bloqueo progresivo</h2>
                <p className="text-xs text-gray-600 mt-0.5">El contenido se desbloquea lección a lección según el avance del niño. Aplica a todos los perfiles excepto el admin.</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 shrink-0">Estado</span>
                <div className="flex gap-2">
                  {(['true', 'false'] as const).map((val) => (
                    <label key={val} className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border text-xs transition-all ${(lockConfig.enabled ? 'true' : 'false') === val
                      ? 'border-violet-500 bg-violet-500/5 text-gray-200'
                      : 'border-gray-700 text-gray-500 hover:border-gray-600'
                      }`}>
                      <input
                        type="radio"
                        name="lock_enabled"
                        value={val}
                        defaultChecked={(lockConfig.enabled ? 'true' : 'false') === val}
                        className="accent-violet-500"
                      />
                      {val === 'true' ? 'Activado' : 'Desactivado'}
                    </label>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-600">
                El admin siempre tiene acceso completo. Futuros roles (profesor, coordinador) podrán configurarse como exentos.
              </p>
            </section>

          </div>

          {/* ── Col 2: Onboarding y planes ── */}
          <div className="flex flex-col gap-6">

            {/* Adquisición y Onboarding */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5 pb-20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Onboarding</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Modelo de conversión y pantallas</p>
                </div>
                <a href="/admin/onboarding" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Gestionar pantallas →
                </a>
              </div>

              <AcquisitionSelector
                initialVariant={landingVariant}
                initialTrialDays={trialDays}
                initialPreviewConfig={previewConfig}
              />

              <div className="flex items-start gap-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5">
                <span className="text-base leading-none mt-0.5">💡</span>
                <p className="text-xs text-gray-500 leading-relaxed">
                  El precio mensual es lo que se cobra cada mes. El plan anual usa ese mismo precio con el descuento aplicado — el usuario paga todo el año de una sola vez.
                </p>
              </div>

              <PricingPanel
                initialMonthlyPrice={monthlyPrice}
                initialAnnualDiscount={annualDiscountPct}
                initialCurrency={priceCurrency}
              />

              <div className="border-t border-gray-800 pt-5">
                <p className="text-xs text-gray-400 font-medium mb-1">Métodos de pago</p>
                <p className="text-xs text-gray-600 mb-3">Activa o desactiva cada método del checkout. Úsalo para apagar temporalmente uno con problemas.</p>
                <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-800/50 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                  {PAYMENT_METHOD_REGISTRY.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 bg-gray-800/40 border border-gray-700/50 rounded-lg px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-300">{m.label}</span>
                        <span className="block text-xs text-gray-600 capitalize">{m.provider}</span>
                      </div>
                      <label className="flex items-center shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          name={`pm_${m.id}`}
                          defaultChecked={paymentMethods?.[m.id] === true}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 rounded-full bg-gray-700 transition-colors peer-checked:bg-violet-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-800 pt-5">
                <p className="text-xs text-gray-400 font-medium mb-1">Formatos de evaluación</p>
                <p className="text-xs text-gray-600 mb-3">Activa o desactiva cada formato de la estructura Evaluación en toda la app.</p>
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-800/50 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                  {EVAL_FORMAT_REGISTRY.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 bg-gray-800/40 border border-gray-700/50 rounded-lg px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-300">{f.label}</span>
                        <span className="block text-xs text-gray-600">
                          {f.skill === 'receptive' ? 'Receptivo' : 'Productivo'}
                          {!f.implemented && ' · Próximamente'}
                        </span>
                      </div>
                      <label className={`flex items-center shrink-0 ${f.implemented ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
                        <input
                          type="checkbox"
                          name={`evf_${f.id}`}
                          defaultChecked={f.implemented && evalFormats?.[f.id] === true}
                          disabled={!f.implemented}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 rounded-full bg-gray-700 transition-colors peer-checked:bg-violet-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4" />
                      </label>
                    </div>
                  ))}
                </div>
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

          {/* ── Col 3: Experiencia kids ── */}
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
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6 pb-9">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Juegos</h2>

              <div>
                <p className="text-xs text-gray-400 font-medium mb-3">Modificadores disponibles</p>
                <div className="flex flex-col gap-3">
                  {([
                    { name: 'modifier_timer', label: 'Temporizador', hint: 'Partidas con cuenta atrás' },
                    { name: 'modifier_lives', label: 'Vidas', hint: 'Número de errores permitidos' },
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
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs text-gray-400 font-medium">Configuración por juego</p>
                  <InfoTooltip text="Mín: palabras que debe tener el módulo para que el juego aparezca; por debajo de ese número la tarjeta sale deshabilitada. Máx: palabras que se usan en una partida (el juego toma hasta esa cantidad del vocabulario). 'A contar' no usa palabras: 'Máx objetos' es el mayor número a contar en una ronda (siempre desde 1) y 'Rondas' cuántas veces se repite el ejercicio." />
                </div>
                <p className="text-xs text-gray-600 mb-4">Mín: palabras para habilitar · Máx: palabras por partida · &quot;A contar&quot; usa objetos y rondas</p>
                <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-800/50 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                  {GAME_REGISTRY.map(game => {
                    const isAdminOnly = adminOnlyGames.includes(game.id)
                    // "A contar" no usa palabras del módulo: sus parámetros son objetos y rondas.
                    const isCounting = game.id === 'counting'
                    return (
                      <div key={game.id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-300 flex-1 min-w-0 truncate">{game.emoji} {game.title}</span>
                        {isCounting ? (
                          <>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="text-xs text-gray-500">Máx objetos</label>
                              <input
                                type="number"
                                name="counting_max_count"
                                min={2}
                                max={20}
                                defaultValue={gameConfigs[game.id]?.maxCount ?? COUNTING_DEFAULTS.maxCount}
                                className="w-14 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="text-xs text-gray-500">Rondas</label>
                              <input
                                type="number"
                                name="counting_rounds"
                                min={1}
                                max={15}
                                defaultValue={gameConfigs[game.id]?.rounds ?? COUNTING_DEFAULTS.rounds}
                                className="w-14 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="text-xs text-gray-500">Mín</label>
                              <input
                                type="number"
                                name={`min_${game.id}`}
                                min={1}
                                max={50}
                                defaultValue={gameConfigs[game.id]?.minItems ?? game.minItems}
                                className="w-14 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="text-xs text-gray-500">Máx</label>
                              <input
                                type="number"
                                name={`max_${game.id}`}
                                min={1}
                                max={50}
                                defaultValue={gameConfigs[game.id]?.maxItems ?? game.maxItems}
                                className="w-14 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                              />
                            </div>
                          </>
                        )}
                        <label className="flex items-center gap-1.5 shrink-0 cursor-pointer" title="Solo visible para admin">
                          <input
                            type="checkbox"
                            name={`admin_only_${game.id}`}
                            defaultChecked={isAdminOnly}
                            className="sr-only peer"
                          />
                          <div className="w-7 h-4 rounded-full bg-gray-700 transition-colors peer-checked:bg-amber-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-3" />
                          <span className="text-xs text-gray-600 peer-checked:text-amber-500 transition-colors">🔒</span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* ── Fila inferior: Música (col-span-2) + Feedback ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

          {/* Música de fondo — ocupa las dos primeras columnas */}
          <section className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6 ">
            <div>
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-1">Música de fondo</h2>
              <p className="text-xs text-gray-600">Un URL por línea. Se reproducen en bucle con orden aleatorio.</p>
            </div>
            <MusicUploaderPanel config={bucketAudioConfig} audioVolume={audioVolume} clickVolume={clickVolume} cardSoundsEnabled={audioConfig_.card_sounds_enabled !== false} />
          </section>

          {/* Feedback & NPS — tercera columna */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-0.5">Feedback & NPS</h2>
              <p className="text-xs text-gray-600">Cuándo mostrar la encuesta de satisfacción a los usuarios.</p>
            </div>
            <FeedbackPromptPanel initial={feedbackPrompt} />
          </section>

        </div>

        <div className="mt-6">
          <SubmitButton label="Guardar cambios" />
        </div>
      </form>
    </div>
  )
}
