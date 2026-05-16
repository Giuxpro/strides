import type { GamePreviewBlockProps } from '@strides/core/kids'

const CARD_ACCENTS = [
  { bg: 'oklch(0.55 0.22 290 / 0.18)', border: 'oklch(0.55 0.22 290 / 0.35)', glow: 'oklch(0.55 0.22 290 / 0.25)' },
  { bg: 'oklch(0.72 0.19 195 / 0.14)', border: 'oklch(0.72 0.19 195 / 0.32)', glow: 'oklch(0.72 0.19 195 / 0.22)' },
  { bg: 'oklch(0.83 0.18 75 / 0.14)',  border: 'oklch(0.83 0.18 75 / 0.32)',  glow: 'oklch(0.83 0.18 75 / 0.22)'  },
]

export function GamePreviewBlock({ heading, game1Emoji, game1Name, game1Desc, game2Emoji, game2Name, game2Desc, game3Emoji, game3Name, game3Desc }: GamePreviewBlockProps) {
  const games = [
    { emoji: game1Emoji, name: game1Name, desc: game1Desc },
    { emoji: game2Emoji, name: game2Name, desc: game2Desc },
    { emoji: game3Emoji, name: game3Name, desc: game3Desc },
  ]

  return (
    <div className="py-12 px-6" style={{ background: 'oklch(0.09 0.025 280)' }}>
      <div className="max-w-sm mx-auto">
        <h2
          className="font-extrabold text-center mb-8 leading-tight"
          style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', color: 'oklch(0.97 0.005 280)', letterSpacing: '-0.02em' }}
        >
          {heading}
        </h2>

        <div className="flex flex-col gap-4">
          {games.map((g, i) => {
            const a = CARD_ACCENTS[i]!
            return (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: a.bg, border: `1.5px solid ${a.border}`, boxShadow: `0 4px 20px ${a.glow}` }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: 'oklch(0.06 0.02 280 / 0.6)' }}
                >
                  {g.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm mb-0.5" style={{ color: 'oklch(0.95 0.01 280)' }}>{g.name}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.62 0.07 280)' }}>{g.desc}</p>
                </div>
                <div className="shrink-0 text-xl" style={{ color: 'oklch(0.75 0.05 280)' }}>›</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
