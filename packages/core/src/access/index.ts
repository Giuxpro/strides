export type AcquisitionType = 'trial' | 'prepaid' | 'complimentary' | 'preview'
export type LessonLockState = 'progress-locked' | 'preview-locked'
export type ModuleLockState = 'progress-locked' | 'preview-locked'

export interface PreviewConfig {
  scope: 'module' | 'lessons'
  lessons_count: number
}

export interface LockConfig {
  enabled: boolean
  // exempt_roles?: string[]  — futura extensión para roles como 'teacher', 'coordinator'
}

/**
 * sortedModules must be sorted by display order (ascending).
 * allLessons can be in any order — sorted internally per module.
 */
export function computeProgressiveUnlock(
  sortedModules: ReadonlyArray<{ id: string }>,
  allLessons: ReadonlyArray<{ id: string; module_id: string; order: number }>,
  completedLessonIds: Set<string>
): { unlockedModuleIds: Set<string>; unlockedLessonIds: Set<string> } {
  const unlockedModuleIds = new Set<string>()
  const unlockedLessonIds = new Set<string>()

  for (let i = 0; i < sortedModules.length; i++) {
    const mod = sortedModules[i]!
    const modLessons = allLessons
      .filter(l => l.module_id === mod.id)
      .sort((a, b) => a.order - b.order)

    if (i === 0) {
      unlockedModuleIds.add(mod.id)
    } else {
      const prevMod = sortedModules[i - 1]!
      const prevLessons = allLessons.filter(l => l.module_id === prevMod.id)
      if (prevLessons.length > 0 && prevLessons.every(l => completedLessonIds.has(l.id))) {
        unlockedModuleIds.add(mod.id)
      }
    }

    for (let j = 0; j < modLessons.length; j++) {
      const lesson = modLessons[j]!
      if (i === 0 && j === 0) {
        unlockedLessonIds.add(lesson.id)
      } else if (j === 0) {
        if (unlockedModuleIds.has(mod.id)) {
          unlockedLessonIds.add(lesson.id)
        }
      } else {
        const prevLesson = modLessons[j - 1]!
        if (completedLessonIds.has(prevLesson.id)) {
          unlockedLessonIds.add(lesson.id)
        }
      }
    }
  }

  return { unlockedModuleIds, unlockedLessonIds }
}

/**
 * moduleIndex: 0-based position of the module in the sorted list.
 * lessonIndex: 0-based position of the lesson within its module.
 */
export function isWithinPreviewTier(
  moduleIndex: number,
  lessonIndex: number,
  config: PreviewConfig
): boolean {
  if (moduleIndex > 0) return false
  if (config.scope === 'module') return true
  return lessonIndex < config.lessons_count
}

