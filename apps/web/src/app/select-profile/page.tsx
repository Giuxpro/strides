import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileGrid } from '@/components/profile/ProfileGrid'

export default async function SelectProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: children }, { data: seatsSetting }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('children').select('*').eq('parent_id', user.id).order('created_at'),
    supabase.from('settings').select('value').eq('key', 'household_included_seats').single(),
  ])

  const includedSeats = (seatsSetting?.value as number) ?? 2
  const usedSeats = 1 + (children?.length ?? 0) // 1 = el titular siempre ocupa un asiento
  const canAddMore = usedSeats < includedSeats

  return (
    <ProfileGrid
      profile={profile}
      children={children ?? []}
      canAddMore={canAddMore}
      includedSeats={includedSeats}
      usedSeats={usedSeats}
    />
  )
}
