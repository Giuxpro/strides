'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function CodesRealtimeRefresher() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Solo escuchamos UPDATE en access_codes — es el último write del action.
    // Escuchar code_redemptions causaba race condition: el refresh llegaba
    // antes de que el used_count estuviera actualizado.
    const channel = supabase
      .channel('admin-codes-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'access_codes' }, () => {
        router.refresh()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'access_codes' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [router])

  return null
}
