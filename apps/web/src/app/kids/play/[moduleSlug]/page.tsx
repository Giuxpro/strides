import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { KidsModuleTabs } from '@/components/kids/KidsModuleTabs'
import { getModuleConfig, isSpeechProvider, DEFAULT_SPEECH_PROVIDER } from '@strides/core/kids'
import type { ModifierConfig } from '@strides/core/kids'
import type { AvailableModifiers } from '@/components/kids/ModifierPickerModal'
import type { GameConfigs } from '@/components/kids/engine/gamePool'

interface Props {
  params: Promise<{ moduleSlug: string }>
  searchParams: Promise<{ anim?: string }>
}

export default async function ModulePage({ params, searchParams }: Props) {
  const { moduleSlug } = await params
  const { anim } = await searchParams
  const supabase = createClient()
  const selectedChildId = cookies().get('selected_child_id')?.value

  const { data: module } = await supabase
    .from('modules')
    .select('*')
    .eq('slug', moduleSlug)
    .eq('is_published', true)
    .single()

  if (!module) notFound()

  const today = new Date().toISOString().split('T')[0] ?? ''

  // Inicio de semana (lunes a las 00:00 UTC)
  const now = new Date()
  const daysToMonday = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysToMonday))

  const [{ data: lessons }, { data: completions }, { data: vocab }, { data: dailyRow }, { count: countdownCount }, { data: availModRow }, { data: gameConfigsRow }, { data: speechRow }, { data: masteryRows }] = await Promise.all([
    supabase
      .from('lessons')
      .select('*')
      .eq('module_id', module.id)
      .eq('is_published', true)
      .order('order'),
    selectedChildId
      ? supabase
        .from('child_lesson_completions')
        .select('lesson_id, stars')
        .eq('child_id', selectedChildId)
      : Promise.resolve({ data: [] }),
    supabase
      .from('vocabulary_items')
      .select('id, text_en, text_es, image_url, audio_url')
      .eq('module_id', module.id),
    selectedChildId
      ? supabase
        .from('child_daily_challenges')
        .select('id')
        .eq('child_id', selectedChildId)
        .eq('module_id', module.id)
        .eq('date', today)
        .maybeSingle()
      : Promise.resolve({ data: null }),
    selectedChildId
      ? supabase
        .from('child_countdown_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('child_id', selectedChildId)
        .eq('module_id', module.id)
        .gte('attempted_at', weekStart.toISOString())
      : Promise.resolve({ count: 0 }),
    supabase.from('settings').select('value').eq('key', 'available_modifiers').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'game_configs').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'speech_provider').maybeSingle(),
    selectedChildId
      ? supabase
        .from('child_vocab_mastery')
        .select('vocab_id, skill_type, correct_count, attempt_count')
        .eq('child_id', selectedChildId)
      : Promise.resolve({ data: [] }),
  ])

  const config = getModuleConfig(moduleSlug)
  const availableModifiers = (availModRow?.value as AvailableModifiers | null) ?? null
  const gameConfigs = (gameConfigsRow?.value as GameConfigs | null) ?? null
  const speechProvider = isSpeechProvider(speechRow?.value) ? speechRow.value : DEFAULT_SPEECH_PROVIDER
  const starsMap = (completions ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.lesson_id] = Math.max(acc[c.lesson_id] ?? 0, c.stars)
    return acc
  }, {})

  // vocab_id → mastery level 0-3
  // Agrupa por vocab+skill, calcula ratio por skill, toma el mínimo entre skills
  // Una palabra es verde solo si TODAS las habilidades practicadas superan el umbral
  const skillsByVocab = (masteryRows ?? []).reduce<Record<string, number[]>>((acc, row) => {
    const ratio = row.attempt_count > 0 ? row.correct_count / row.attempt_count : 0
    const level = ratio >= 0.8 ? 3 : ratio >= 0.4 ? 2 : 1
    if (!acc[row.vocab_id]) acc[row.vocab_id] = []
    acc[row.vocab_id]!.push(level)
    return acc
  }, {})
  const vocabMasteryMap = Object.fromEntries(
    Object.entries(skillsByVocab).map(([vocabId, levels]) => [vocabId, Math.min(...levels)])
  )

  // Parse animation info: "lessonId:previousStars"
  let animLessonId: string | null = null
  let animPrevStars = 0
  if (anim) {
    const [lid, prev] = anim.split(':')
    if (lid) {
      animLessonId = lid
      animPrevStars = Number(prev) || 0
    }
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--kids-bg)' }}>

      {/* ── Decoraciones de fondo ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Manchas de color suaves */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-30"
          style={{ background: 'var(--kids-blob-1)' }}
        />
        <div
          className="absolute -top-12 right-0 w-56 h-56 rounded-full blur-3xl opacity-25"
          style={{ background: 'var(--kids-blob-2)' }}
        />
        <div
          className="absolute bottom-10 left-1/3 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--kids-blob-3)' }}
        />

        {/* Chispas y estrellas decorativas */}
        <span className="absolute text-2xl animate-twinkle" style={{ top: '6%', left: '9%', animationDelay: '0s' }}>✨</span>
        <span className="absolute text-xl  animate-twinkle" style={{ top: '9%', right: '9%', animationDelay: '0.7s' }}>⭐</span>
        <span className="absolute text-lg  animate-twinkle" style={{ top: '42%', left: '3%', animationDelay: '1.3s' }}>✨</span>
        <span className="absolute text-xl  animate-twinkle" style={{ top: '58%', right: '5%', animationDelay: '0.4s' }}>⭐</span>
        <span className="absolute text-base animate-twinkle" style={{ top: '76%', left: '9%', animationDelay: '1.9s' }}>✨</span>
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 px-5 pt-6 pb-2 flex items-center">
        <Link
          href="/kids/play"
          className="flex items-center gap-1.5 text-sm font-extrabold px-4 py-2 rounded-2xl transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.22)',
            color: 'var(--kids-text)',
            boxShadow: '0 3px 0 rgba(0,0,0,0.12)',
          }}
        >
          🏠 Inicio
        </Link>

      </header>

      <main className="relative z-10 pb-20">

        {/* ── Título estilo videojuego ── */}
        <div className="text-center px-6 mb-10 mt-2 animate-slide-up">
          <h1
            className="game-title text-5xl font-extrabold leading-tight"
            style={{
              color: config.gradientFrom,
              textShadow: '0 5px 0 rgba(0,0,0,0.12)',
              letterSpacing: '0.02em',
            }}
          >
            {module.title_es}
          </h1>
        </div>

        {lessons && lessons.length > 0 ? (
          <KidsModuleTabs
            moduleSlug={moduleSlug}
            moduleId={module.id}
            lessons={lessons}
            starsMap={starsMap}
            animLessonId={animLessonId}
            animPrevStars={animPrevStars}
            vocab={vocab ?? []}
            moduleConfig={config}
            selectedChildId={selectedChildId ?? null}
            dailyDone={dailyRow !== null}
            countdownAttemptsThisWeek={countdownCount ?? 0}
            countdownWeeklyLimit={module.countdown_weekly_limit}
            dailyWordCount={module.daily_challenge_word_count}
            retoGameId={module.reto_game_id ?? null}
            retoModifiers={(module.reto_modifiers as ModifierConfig[] | null) ?? null}
            diarioGameId={module.diario_game_id ?? null}
            availableModifiers={availableModifiers}
            activeGameIds={(module.active_game_ids as string[] | null) ?? null}
            gameConfigs={gameConfigs}
            vocabMasteryMap={vocabMasteryMap}
            speechProvider={speechProvider}
          />
        ) : (
          <div className="text-center py-16 px-6">
            <p className="text-5xl mb-4">🚧</p>
            <p className="font-medium" style={{ color: 'var(--kids-text-muted)' }}>
              Lecciones en preparación
            </p>
          </div>
        )}

      </main>
    </div>
  )
}
