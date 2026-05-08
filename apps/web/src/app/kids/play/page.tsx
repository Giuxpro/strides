import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { KidsMapScene } from '@/components/kids/KidsMapScene'

export default async function KidsPlayPage() {
  const supabase = createClient()
  const selectedChildId = cookies().get('selected_child_id')?.value

  const [{ data: modules }, { data: child }, { data: streak }] = await Promise.all([
    supabase.from('modules').select('*').eq('is_published', true).order('order'),
    selectedChildId
      ? supabase.from('children').select('name, avatar_url').eq('id', selectedChildId).single()
      : Promise.resolve({ data: null }),
    selectedChildId
      ? supabase.from('child_streaks').select('current_streak').eq('child_id', selectedChildId).single()
      : Promise.resolve({ data: null }),
  ])

  return (
    <KidsMapScene
      modules={modules ?? []}
      childName={child?.name ?? null}
      childAvatar={child?.avatar_url ?? '🧒'}
      currentStreak={streak?.current_streak ?? 0}
    />
  )
}
