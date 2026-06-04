'use client'

import type { GamePlay } from '@strides/db'
import { GAME_REGISTRY } from '@strides/core/kids'
import { InfoTooltip } from '@/components/admin/shared/InfoTooltip'

const registryMap = Object.fromEntries(GAME_REGISTRY.map(g => [g.id, g]))

const GRADIENT_COLORS = [
  '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95',
  '#8B5CF6', '#9333EA', '#A855F7', '#C084FC',
  '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95',
  '#8B5CF6', '#9333EA',
]

interface Props {
  data: GamePlay[]
}

export function TopGamesChart({ data }: Props) {
  const max = data[0]?.plays ?? 1

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '20px 20px 16px' }}>
      <style>{`
        .tg-scroll::-webkit-scrollbar { width: 3px; }
        .tg-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 99px; }
        .tg-scroll::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.5); border-radius: 99px; }
        .tg-scroll::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.8); }
      `}</style>

      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-white">Top juegos</h2>
          <InfoTooltip text="Ranking de todos los juegos ordenados por total de partidas jugadas desde el inicio. Solo aparecen juegos que han sido jugados al menos una vez. Un juego muy arriba puede ser favorito de los niños o aparecer más seguido en los módulos." />
        </div>
        <p className="text-[11px] text-gray-600 mt-0.5">Por partidas totales</p>
      </div>

      <div
        className="tg-scroll space-y-3 overflow-y-auto pr-2"
        style={{
          maxHeight: 264,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(124,58,237,0.5) rgba(255,255,255,0.03)',
        }}
      >
        {data.map((item, i) => {
          const meta  = registryMap[item.gameId]
          const titleEn = meta?.titleEn ?? item.gameId
          const titleEs = meta?.title ?? ''
          const pct   = (item.plays / max) * 100
          const color = GRADIENT_COLORS[i % GRADIENT_COLORS.length]!

          return (
            <div key={item.gameId}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-[10px] font-bold shrink-0 w-6 text-right"
                    style={{ color: 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums' }}
                  >
                    #{i + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-gray-300 truncate block">{titleEn}</span>
                    {titleEs && (
                      <span className="text-[10px] text-gray-600 truncate block">{titleEs}</span>
                    )}
                  </div>
                </div>
                <span
                  className="text-xs font-bold ml-2 shrink-0"
                  style={{ color, fontVariantNumeric: 'tabular-nums' }}
                >
                  {item.plays}
                </span>
              </div>
              <div className="h-1.5 rounded-full ml-8" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
