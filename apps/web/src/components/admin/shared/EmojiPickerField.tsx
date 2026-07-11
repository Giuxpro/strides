'use client'

import { useMemo, useState } from 'react'
import {
  FLUENT_EMOJI_MAP,
  fluentEmojiUrl,
  EMOJI_CATEGORIES,
  EMOJI_BY_CATEGORY,
  type EmojiCategoryId,
} from '@strides/core/kids'

const L = 'block text-sm text-gray-400 mb-1.5'
const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'

interface Props {
  name: string
  defaultValue?: string
  label?: string
}

const ALL_ENTRIES = Object.entries(FLUENT_EMOJI_MAP)
const PAGE_SIZE = 56 // 8 columnas × 7 filas

// fluentEmojiUrl ya elige la ruta correcta (plana o Default); si aún así falla la
// carga (p. ej. red), avisamos para ocultar el emoji.
function EmojiImg({ codepoint, className, alt, onFail }: { codepoint: string; className: string; alt: string; onFail?: () => void }) {
  const src = fluentEmojiUrl(codepoint)
  if (!src) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => onFail?.()} />
  )
}

export function EmojiPickerField({ name, defaultValue = '', label = 'Emoji' }: Props) {
  const [selected, setSelected] = useState(defaultValue)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<EmojiCategoryId>('smileys')
  const [page, setPage] = useState(0)
  const [failed, setFailed] = useState<Set<string>>(new Set())

  const searching = query.trim().length >= 2

  const entries = useMemo(() => {
    const base: [string, string][] = searching
      ? ALL_ENTRIES.filter(([, n]) => n.toLowerCase().includes(query.trim().toLowerCase()))
      : EMOJI_BY_CATEGORY[category].map(cp => [cp, FLUENT_EMOJI_MAP[cp] ?? ''] as [string, string])
    return base.filter(([cp]) => !failed.has(cp))
  }, [searching, query, category, failed])

  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = entries.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const selectedName = selected ? FLUENT_EMOJI_MAP[selected] : null
  const markFailed = (cp: string) => setFailed(prev => new Set(prev).add(cp))

  return (
    <div>
      <label className={L}>{label}</label>
      <input type="hidden" name={name} value={selected} />

      {selected && (
        <div className="mb-2 flex items-center gap-2">
          <EmojiImg key={selected} codepoint={selected} alt={selectedName ?? ''} className="w-10 h-10 object-contain" onFail={() => markFailed(selected)} />
          <span className="text-sm text-gray-300">{selectedName}</span>
          <button
            type="button"
            onClick={() => setSelected('')}
            className="text-xs text-red-800 hover:text-red-500 transition-colors ml-1"
          >
            Quitar
          </button>
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setPage(0) }}
        placeholder="Buscar emoji (en inglés): pig, bee, apple…"
        className={I}
      />

      {/* Pestañas de categoría (ocultas al buscar) */}
      {!searching && (
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
          {EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              title={cat.label}
              onClick={() => { setCategory(cat.id); setPage(0) }}
              className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${category === cat.id ? 'bg-gray-700 ring-1 ring-violet-500' : 'hover:bg-gray-700/50'}`}
            >
              <EmojiImg key={cat.iconCodepoint} codepoint={cat.iconCodepoint} alt={cat.label} className="w-6 h-6 object-contain" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 bg-gray-800/50 border border-gray-700 rounded-lg p-2">
        <div className="grid grid-cols-8 gap-1 min-h-[14rem] content-start">
          {visible.map(([codepoint, folderName]) => (
            <button
              key={codepoint}
              type="button"
              title={folderName}
              onClick={() => setSelected(codepoint)}
              className={`aspect-square flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors ${selected === codepoint ? 'ring-1 ring-violet-500' : ''}`}
            >
              <EmojiImg codepoint={codepoint} alt={folderName} className="w-7 h-7 object-contain" onFail={() => markFailed(codepoint)} />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/60">
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
            className="text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-default px-2 py-1 transition-colors"
          >
            ‹ Anterior
          </button>
          <span className="text-[11px] text-gray-500">
            {entries.length === 0 ? 'Sin resultados' : `Página ${safePage + 1} de ${pageCount}`}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
            className="text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-default px-2 py-1 transition-colors"
          >
            Siguiente ›
          </button>
        </div>
      </div>
    </div>
  )
}
