'use client'

import { useEffect, useRef, useState } from 'react'

type CardColor = 'violet' | 'emerald' | 'sky' | 'amber' | 'rose' | 'indigo'

interface Props {
  label: string
  value: number
  sub: string
  color: CardColor
  icon: string
  prefix?: string
  suffix?: string
}

const COLORS: Record<CardColor, { text: string; glow: string; border: string; bg: string }> = {
  violet:  { text: '#A78BFA', glow: 'rgba(139,92,246,0.18)',  border: 'rgba(139,92,246,0.3)',  bg: 'rgba(139,92,246,0.06)' },
  emerald: { text: '#34D399', glow: 'rgba(16,185,129,0.18)',  border: 'rgba(16,185,129,0.3)',  bg: 'rgba(16,185,129,0.06)' },
  sky:     { text: '#38BDF8', glow: 'rgba(56,189,248,0.18)',  border: 'rgba(56,189,248,0.3)',  bg: 'rgba(56,189,248,0.06)' },
  amber:   { text: '#FCD34D', glow: 'rgba(245,158,11,0.18)',  border: 'rgba(245,158,11,0.3)',  bg: 'rgba(245,158,11,0.06)' },
  rose:    { text: '#FB7185', glow: 'rgba(244,63,94,0.18)',   border: 'rgba(244,63,94,0.3)',   bg: 'rgba(244,63,94,0.06)'  },
  indigo:  { text: '#818CF8', glow: 'rgba(99,102,241,0.18)',  border: 'rgba(99,102,241,0.3)',  bg: 'rgba(99,102,241,0.06)' },
}

export function StatCard({ label, value, sub, color, icon, prefix, suffix }: Props) {
  const [displayed, setDisplayed] = useState(0)
  const [hovered, setHovered] = useState(false)
  const rafRef = useRef<number>(0)
  const c = COLORS[color]

  useEffect(() => {
    const duration = 900
    const start = performance.now()
    function animate(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(eased * value))
      if (t < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? c.bg : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? c.border : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered ? `0 0 32px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
        borderRadius: 16,
        padding: '18px 16px 14px',
        transition: 'all 0.2s ease',
        cursor: 'default',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      <span style={{ fontSize: 18, display: 'block', marginBottom: 10 }}>{icon}</span>
      <p
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: c.text,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        {prefix}{displayed.toLocaleString()}{suffix}
      </p>
      <p className="text-xs font-medium text-gray-300 mt-2.5 leading-tight">{label}</p>
      <p className="text-[11px] text-gray-600 mt-0.5">{sub}</p>
    </div>
  )
}
