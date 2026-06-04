'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PERIODS = [
  { value: '7',  label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
]

export function PeriodSelector() {
  const router = useRouter()
  const sp = useSearchParams()
  const current = sp.get('period') ?? '30'

  return (
    <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => router.push(`?period=${p.value}`)}
          className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
          style={current === p.value
            ? { background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }
            : { color: '#6B7280', border: '1px solid transparent' }
          }
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
