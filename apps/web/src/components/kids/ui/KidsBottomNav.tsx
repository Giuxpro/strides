'use client'

export type TabId = 'aprender' | 'jugar' | 'retos' | 'palabras'

const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 'aprender', emoji: '📚', label: 'Aprender' },
  { id: 'jugar',    emoji: '🎮', label: 'Jugar'    },
  { id: 'retos',    emoji: '⭐', label: 'Retos'    },
  { id: 'palabras', emoji: '🎒', label: 'Palabras' },
]

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
}

export function KidsBottomNav({ active, onChange }: Props) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 select-none">
      <div
        className="flex items-center gap-1 px-3 py-2 rounded-full"
        style={{
          background: 'rgba(255,253,245,0.94)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        }}
      >
        {TABS.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-full transition-all duration-150"
              style={{
                background: isActive ? 'rgba(0,0,0,0.07)' : 'transparent',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: '1.55rem', lineHeight: 1 }}>{tab.emoji}</span>
              <span
                className="text-xs font-extrabold tracking-wide"
                style={{ color: isActive ? '#4a3728' : '#a89880' }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
