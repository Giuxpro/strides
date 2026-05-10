import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { deleteVocabItem } from '@/app/admin/_actions'
import { VocabUsagePopover } from '@/components/admin/VocabUsagePopover'
import { RetoConfigForm } from '@/components/admin/RetoConfigForm'
import { ModuleJugarConfigForm } from '@/components/admin/ModuleJugarConfigForm'
import { SortableLessonList } from '@/components/admin/SortableLessonList'
import type { ModifierConfig } from '@strides/core/kids'

interface Props {
  params: { moduleId: string }
  searchParams: { tab?: string }
}

type LessonRef = { id: string; title_es: string }
type ExerciseRow = {
  lesson_id: string | null
  lessons: LessonRef | null
  exercise_items: { vocabulary_item_id: string }[] | null
}

const TB = 'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors'

export default async function AdminModuleDetailPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const tab = searchParams.tab === 'lessons' ? 'lessons'
    : searchParams.tab === 'retos'  ? 'retos'
    : searchParams.tab === 'juegos' ? 'juegos'
    : 'vocab'

  const [{ data: mod }, { data: modGame }, { data: lessons }, { data: vocab }, { data: exercisesRaw }] = await Promise.all([
    supabase.from('modules').select('id, title_es, title_en, slug').eq('id', params.moduleId).single(),
    supabase.from('modules')
      .select('reto_game_id, reto_modifiers, diario_game_id, active_game_ids')
      .eq('id', params.moduleId).single() as unknown as
      Promise<{ data: { reto_game_id: string | null; reto_modifiers: ModifierConfig[] | null; diario_game_id: string | null; active_game_ids: string[] | null } | null }>,
    supabase.from('lessons').select('id, title_es, title_en, order, is_published, cover_url').eq('module_id', params.moduleId).order('order'),
    supabase.from('vocabulary_items').select('id, text_es, text_en, image_url, type, order').eq('module_id', params.moduleId).order('order'),
    supabase.from('exercises').select('lesson_id, lessons(id, title_es), exercise_items(vocabulary_item_id)').eq('module_id', params.moduleId) as unknown as Promise<{ data: ExerciseRow[] | null }>,
  ])

  if (!mod) notFound()

  // Build usage map: vocabId → unique lessons that use it
  const usageMap: Record<string, LessonRef[]> = {}
  for (const ex of exercisesRaw ?? []) {
    const lesson = ex.lessons
    if (!lesson) continue
    for (const item of ex.exercise_items ?? []) {
      const vid = item.vocabulary_item_id
      if (!usageMap[vid]) usageMap[vid] = []
      if (!usageMap[vid].some(l => l.id === lesson.id)) {
        usageMap[vid].push({ id: lesson.id, title_es: lesson.title_es })
      }
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/content" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Contenido
          </Link>
          <h1 className="text-xl font-bold text-white mt-2">{mod.title_es}</h1>
          <p className="text-sm text-gray-500">{mod.title_en} · <span className="font-mono">{mod.slug}</span></p>
        </div>
        <Link
          href={`/admin/content/${params.moduleId}/edit`}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors mt-6"
        >
          Editar módulo
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 w-fit">
        <Link
          href="?tab=vocab"
          className={`${TB} ${tab === 'vocab' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Vocabulario ({vocab?.length ?? 0})
        </Link>
        <Link
          href="?tab=lessons"
          className={`${TB} ${tab === 'lessons' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Lecciones ({lessons?.length ?? 0})
        </Link>
        <Link
          href="?tab=juegos"
          className={`${TB} ${tab === 'juegos' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Juegos
        </Link>
        <Link
          href="?tab=retos"
          className={`${TB} ${tab === 'retos' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Retos
        </Link>
      </div>

      {/* ── Tab: Lecciones ── */}
      {tab === 'lessons' && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Lecciones</h2>
            <Link
              href={`/admin/content/${params.moduleId}/lessons/new`}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              + Nueva lección
            </Link>
          </div>

          <SortableLessonList moduleId={params.moduleId} lessons={lessons ?? []} />
        </section>
      )}

      {/* ── Tab: Retos ── */}
      {tab === 'retos' && (
        <section>
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Configuración de retos</h2>
            <p className="text-xs text-gray-600">
              Juego y modificadores de cada reto para este módulo. Si se deja en &quot;Auto&quot;, se usan los valores por defecto.
            </p>
          </div>
          <RetoConfigForm
            moduleId={params.moduleId}
            initialGameId={modGame?.reto_game_id ?? null}
            initialModifiers={modGame?.reto_modifiers ?? null}
            initialDiarioGameId={modGame?.diario_game_id ?? null}
          />
        </section>
      )}

      {tab === 'juegos' && (
        <section>
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Juegos disponibles</h2>
            <p className="text-xs text-gray-600">
              Controla qué juegos aparecen en el tab Jugar para este módulo.
            </p>
          </div>
          <ModuleJugarConfigForm
            moduleId={params.moduleId}
            initialActiveGameIds={modGame?.active_game_ids ?? null}
          />
        </section>
      )}

      {/* ── Tab: Vocabulario ── */}
      {tab === 'vocab' && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Vocabulario</h2>
            <Link
              href={`/admin/content/${params.moduleId}/vocab/new`}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              + Nuevo
            </Link>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3 w-10">#</th>
                  <th className="text-left px-5 py-3">Español</th>
                  <th className="text-left px-5 py-3">Inglés</th>
                  <th className="text-left px-5 py-3">Imagen</th>
                  <th className="text-center px-5 py-3">Tipo</th>
                  <th className="text-center px-5 py-3">Uso</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {(vocab ?? []).map(item => {
                  const usedIn = usageMap[item.id] ?? []
                  return (
                    <tr key={item.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-gray-600 text-xs">{item.order}</td>
                      <td className="px-5 py-3 font-medium text-white">{item.text_es}</td>
                      <td className="px-5 py-3 text-gray-300">{item.text_en}</td>
                      <td className="px-5 py-3">
                        {item.image_url ? (
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image_url} alt={item.text_es} className="w-7 h-7 object-contain" />
                            <span className="text-xs text-gray-600 truncate max-w-[100px]" title={item.image_url}>
                              {item.image_url.split('/').pop()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-700">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-xs text-gray-500">{item.type}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <VocabUsagePopover count={usedIn.length} lessons={usedIn} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/content/${params.moduleId}/vocab/${item.id}/edit`}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            Editar
                          </Link>
                          <form action={deleteVocabItem}>
                            <input type="hidden" name="item_id"   value={item.id} />
                            <input type="hidden" name="module_id" value={params.moduleId} />
                            <button type="submit" className="text-xs text-red-800 hover:text-red-500 transition-colors">
                              Eliminar
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {(!vocab || vocab.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-600">
                      Sin vocabulario.{' '}
                      <Link href={`/admin/content/${params.moduleId}/vocab/new`} className="text-violet-400 hover:text-violet-300">
                        Añadir el primero →
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
