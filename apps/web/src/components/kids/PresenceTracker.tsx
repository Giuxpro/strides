'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logKidSession } from '@/app/kids/play/_actions'

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

export function PresenceTracker({ childId }: { childId?: string }) {
  useEffect(() => {
    const deviceType = getDeviceType()
    void logKidSession(childId, deviceType)

    const supabase = createClient()
    const channel = supabase.channel('kids-session')
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ childId: childId ?? 'unknown', device: deviceType, ts: Date.now() })
      }
    })
    return () => { supabase.removeChannel(channel) }
  }, [childId])

  return null
}
