'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function OnlineNow() {
  const [count, setCount] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let ch: RealtimeChannel

    ch = supabase.channel('kids-session', {
      config: { presence: { key: '__admin__' } },
    })

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      const n = Object.keys(state).filter(k => k !== '__admin__').length
      setCount(n)
    })

    ch.subscribe((status) => {
      setConnected(status === 'SUBSCRIBED')
    })

    return () => { supabase.removeChannel(ch) }
  }, [])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.04)',
        border: `1px solid ${hovered ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.15)'}`,
        boxShadow: hovered ? '0 0 32px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
        borderRadius: 16,
        padding: '18px 16px 14px',
        transition: 'all 0.2s ease',
        cursor: 'default',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="relative flex h-2 w-2">
          {connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          )}
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: connected ? '#10B981' : '#374151' }}
          />
        </span>
        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: connected ? '#34D399' : '#4B5563' }}>
          {connected ? 'Vivo' : 'Conectando'}
        </span>
      </div>
      <p
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: '#34D399',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          letterSpacing: '-0.03em',
          transition: 'all 0.3s ease',
        }}
      >
        {count}
      </p>
      <p className="text-xs font-medium text-gray-300 mt-2.5 leading-tight">Online ahora</p>
      <p className="text-[11px] text-gray-600 mt-0.5">niños jugando</p>
    </div>
  )
}
