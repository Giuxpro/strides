import type { Tables as SupaTables, Database } from './types.generated'

// Convenient row-level aliases
export type Profile = SupaTables<'profiles'>
export type Child = SupaTables<'children'>
export type Module = SupaTables<'modules'>
export type Lesson = SupaTables<'lessons'>
export type VocabularyItem = SupaTables<'vocabulary_items'>
export type Exercise = SupaTables<'exercises'>
export type ExerciseItem = SupaTables<'exercise_items'>
export type UserModuleAccess = SupaTables<'user_module_access'>
export type ChildWordStatus = SupaTables<'child_word_status'>
export type ChildLessonCompletion = SupaTables<'child_lesson_completions'>
export type ChildStreak = SupaTables<'child_streaks'>
export type EvaluationResult = SupaTables<'evaluation_results'>
export type Recording = SupaTables<'recordings'>
export type ContentGenerationJob = SupaTables<'content_generation_jobs'>
export type Setting = SupaTables<'settings'>
export type Subscription = SupaTables<'subscriptions'>
export type AccessCode = SupaTables<'access_codes'>
export type CodeRedemption = SupaTables<'code_redemptions'>

// Enum aliases
export type UserRole = Database['public']['Enums']['user_role']
export type AccessType = Database['public']['Enums']['access_type']
export type WordStatus = Database['public']['Enums']['word_status']
// exercises.type es text en BD; el catálogo válido vive en GAME_REGISTRY (core).
export type ExerciseType = string
export type ExercisePhase = Database['public']['Enums']['exercise_phase']
export type VocabularyType = Database['public']['Enums']['vocabulary_type']
export type JobStatus = Database['public']['Enums']['job_status']
// lesson_steps.step_type es text en BD; el catálogo vive en STEP_REGISTRY (core).
export type StepType = string
export type LessonStep = SupaTables<'lesson_steps'>
