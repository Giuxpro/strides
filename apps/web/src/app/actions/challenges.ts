'use server'

import { createClient } from '@/lib/supabase/server'

export async function recordCountdownAttempt(childId: string, moduleId: string) {
  const supabase = createClient()
  await supabase
    .from('child_countdown_attempts')
    .insert({ child_id: childId, module_id: moduleId })
}

export async function completeDailyChallenge(
  childId: string,
  moduleId: string,
  date: string,
  stars: number,
) {
  const supabase = createClient()
  await supabase
    .from('child_daily_challenges')
    .upsert(
      { child_id: childId, module_id: moduleId, date, stars },
      { onConflict: 'child_id,module_id,date' },
    )
}
