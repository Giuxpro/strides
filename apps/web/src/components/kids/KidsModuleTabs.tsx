'use client'

import { useState } from 'react'
import type { Lesson } from '@strides/db'
import type { VocabItem } from './engine/LessonEngine'
import type { ModuleConfig } from './moduleConfig'
import { LessonCard } from './LessonCard'
import { KidsJugarTab } from './KidsJugarTab'
import { KidsRetosTab } from './KidsRetosTab'
import { KidsBottomNav, type TabId } from './KidsBottomNav'

interface Props {
  moduleSlug: string
  moduleId: string
  lessons: Lesson[]
  starsMap: Record<string, number>
  animLessonId: string | null
  animPrevStars: number
  vocab: VocabItem[]
  moduleConfig: ModuleConfig
  selectedChildId: string | null
  dailyDone: boolean
  countdownAttemptsThisWeek: number
  countdownWeeklyLimit: number
  dailyWordCount: number
}

export function KidsModuleTabs({
  moduleSlug, moduleId, lessons, starsMap, animLessonId, animPrevStars,
  vocab, moduleConfig, selectedChildId, dailyDone, countdownAttemptsThisWeek,
  countdownWeeklyLimit, dailyWordCount,
}: Props) {
  const [tab, setTab] = useState<TabId>('aprender')

  return (
    <div className="pb-36">

      {tab === 'aprender' && (
        <div
          className="flex flex-wrap gap-4 justify-center items-start"
          style={{ padding: '1rem 2rem 3rem' }}
        >
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              moduleSlug={moduleSlug}
              stars={starsMap[lesson.id] ?? 0}
              previousStars={lesson.id === animLessonId ? animPrevStars : undefined}
              animationDelay={`${index * 90}ms`}
              audioUrl={lesson.audio_url ?? undefined}
            />
          ))}
        </div>
      )}

      {tab === 'jugar' && (
        <KidsJugarTab vocab={vocab} moduleConfig={moduleConfig} />
      )}

      {tab === 'retos' && (
        <KidsRetosTab
          vocab={vocab}
          moduleConfig={moduleConfig}
          moduleId={moduleId}
          selectedChildId={selectedChildId}
          dailyDone={dailyDone}
          countdownAttemptsThisWeek={countdownAttemptsThisWeek}
          countdownWeeklyLimit={countdownWeeklyLimit}
          dailyWordCount={dailyWordCount}
        />
      )}
      {tab === 'palabras' && <ComingSoon emoji="🎒" label="Tu diccionario personal del módulo" />}

      <KidsBottomNav active={tab} onChange={setTab} />
    </div>
  )
}

function ComingSoon({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3 px-8 text-center">
      <span style={{ fontSize: '4rem', lineHeight: 1 }}>{emoji}</span>
      <p className="font-extrabold text-xl" style={{ color: 'var(--kids-text)' }}>
        ¡Próximamente!
      </p>
      <p className="text-sm font-medium" style={{ color: 'var(--kids-text-muted)' }}>
        {label}
      </p>
    </div>
  )
}
