'use client'

import { useState, useMemo } from 'react'

type Filter = 'all' | 'unused' | 'used' | 'selected'

export interface VocabItemWithUsage {
  id: string
  text_es: string
  text_en: string
  image_url: string | null
  lessonCount: number
}

interface Props {
  items: VocabItemWithUsage[]
  initialSelected?: string[]
}

export function VocabPicker({ items, initialSelected = [] }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(i => {
      if (q && !i.text_es.toLowerCase().includes(q) && !i.text_en.toLowerCase().includes(q)) return false
      if (filter === 'unused') return i.lessonCount === 0
      if (filter === 'used') return i.lessonCount > 0
      if (filter === 'selected') return selected.has(i.id)
      return true
    })
  }, [items, search, filter, selected])

  const selectedItems = items.filter(i => selected.has(i.id))
  const hiddenSelected = selectedItems.filter(i => !filtered.some(f => f.id === i.id))

  const FILTERS: [Filter, string][] = [
    ['all', 'Todos'],
    ['unused', 'Sin usar'],
    ['used', 'Usados'],
    ['selected', selected.size > 0 ? `Seleccionados (${selected.size})` : 'Seleccionados'],
  ]

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <p className="w-full text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
            Seleccionados ({selectedItems.length})
          </p>
          {selectedItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs rounded-full hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300 transition-colors"
            >
              {item.text_es} / {item.text_en}
              <span className="ml-0.5 text-[10px] leading-none">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar palabra..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-gray-600"
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(([f, label]) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-violet-600 text-white'
                : 'bg-gray-700/60 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-700/50 divide-y divide-gray-800/50">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-600 py-6 text-center">Sin resultados</p>
        ) : filtered.map(item => (
          <label
            key={item.id}
            className="flex items-center gap-3 cursor-pointer px-3 py-2 hover:bg-white/[0.03] transition-colors"
          >
            <input
              type="checkbox"
              name="vocab_ids"
              value={item.id}
              checked={selected.has(item.id)}
              onChange={() => toggle(item.id)}
              className="w-4 h-4 accent-violet-500 flex-shrink-0"
            />
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.text_es} className="w-6 h-6 object-contain flex-shrink-0" />
            )}
            <span className="flex-1 text-sm text-gray-300">
              {item.text_es}
              <span className="text-gray-600 ml-1.5">/ {item.text_en}</span>
            </span>
            <span className={`text-xs shrink-0 ${item.lessonCount === 0 ? 'text-gray-700' : 'text-gray-500'}`}>
              {item.lessonCount === 0
                ? 'Sin usar'
                : `${item.lessonCount} ${item.lessonCount === 1 ? 'lección' : 'lecciones'}`}
            </span>
          </label>
        ))}
      </div>

      {/* Ensure selected-but-filtered-out items still submit with the form */}
      {hiddenSelected.map(item => (
        <input key={`h-${item.id}`} type="hidden" name="vocab_ids" value={item.id} />
      ))}
    </div>
  )
}
