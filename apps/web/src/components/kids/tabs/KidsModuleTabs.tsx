'use client'

import { useState } from 'react'
import type { Lesson } from '@strides/db'
import type { VocabItem } from '../engine/LessonEngine'
import type { ModuleConfig, ModifierConfig } from '@strides/core/kids'
import { LessonCard } from '../cards/LessonCard'
import { KidsJugarTab } from './KidsJugarTab'
import { KidsRetosTab } from './KidsRetosTab'
import { KidsPalabrasTab } from './KidsPalabrasTab'
import { KidsBottomNav, type TabId } from '../ui/KidsBottomNav'
import type { AvailableModifiers } from '../ui/ModifierPickerModal'
import type { GameConfigs } from '../engine/gamePool'
import { SpeechConfigProvider } from '../engine/SpeechConfigContext'
import type { SpeechProvider } from '@strides/core/kids'
import { NpsPrompt } from '@/components/feedback/NpsPrompt'
import type { LessonLockState } from '@strides/core'
import { getStorageUrl } from '@strides/core'

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
  retoGameId: string | null
  retoModifiers: ModifierConfig[] | null
  diarioGameId: string | null
  availableModifiers: AvailableModifiers | null
  activeGameIds: string[] | null
  gameConfigs: GameConfigs | null
  vocabMasteryMap: Record<string, number>
  speechProvider?: SpeechProvider
  showNps?: boolean
  lessonLockStates?: Record<string, LessonLockState>
}

export function KidsModuleTabs({
  moduleSlug, moduleId, lessons, starsMap, animLessonId, animPrevStars,
  vocab, moduleConfig, selectedChildId, dailyDone, countdownAttemptsThisWeek,
  countdownWeeklyLimit, dailyWordCount, retoGameId, retoModifiers, diarioGameId,
  availableModifiers, activeGameIds, gameConfigs, vocabMasteryMap,
  speechProvider = 'web-speech',
  showNps = false,
  lessonLockStates = {},
}: Props) {
  const [tab, setTab] = useState<TabId>('aprender')
  const [npsVisible, setNpsVisible] = useState(showNps)

  return (
    <SpeechConfigProvider provider={speechProvider}>
    <div className="pb-36">

      {tab === 'aprender' && (
        <div
          className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4 sm:justify-center sm:items-start"
          style={{ padding: '1rem 1rem 3rem' }}
        >
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              moduleSlug={moduleSlug}
              stars={starsMap[lesson.id] ?? 0}
              previousStars={lesson.id === animLessonId ? animPrevStars : undefined}
              animationDelay={`${index * 90}ms`}
              audioUrl={getStorageUrl(lesson.audio_url) ?? undefined}
              lockState={lessonLockStates[lesson.id]}
            />
          ))}
        </div>
      )}

      {tab === 'jugar' && (
        <KidsJugarTab
          vocab={vocab}
          moduleConfig={moduleConfig}
          selectedChildId={selectedChildId}
          availableModifiers={availableModifiers}
          activeGameIds={activeGameIds}
          gameConfigs={gameConfigs}
        />
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
          retoGameId={retoGameId}
          retoModifiers={retoModifiers}
          diarioGameId={diarioGameId}
        />
      )}
      {tab === 'palabras' && (
        <KidsPalabrasTab
          vocab={vocab}
          masteryMap={vocabMasteryMap}
          moduleConfig={moduleConfig}
        />
      )}

      <KidsBottomNav active={tab} onChange={setTab} />

      {npsVisible && <NpsPrompt onClose={() => setNpsVisible(false)} />}
    </div>
    </SpeechConfigProvider>
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
