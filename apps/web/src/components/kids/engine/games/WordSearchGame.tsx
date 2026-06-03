'use client'

import { useState, useRef } from 'react'
import type { VocabItem, ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { useSpeak } from '@/components/kids/audio/VoicePresetProvider'

interface Props {
  items: VocabItem[]
  onComplete: (correct: number, total: number, wordResults?: WordResult[]) => void
  onBack: () => void
  moduleConfig: ModuleConfig
  progress: { current: number; total: number }
}

interface Placement {
  word: string
  id: string
  color: string
  cells: Array<{ r: number; c: number }>
}

const WORD_COLORS = ['#8b5cf6','#06b6d4','#f59e0b','#ec4899','#22c55e','#f97316','#3b82f6','#a855f7','#14b8a6','#ef4444']
const DIRS = [
  [0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]
] as const

function buildGrid(words: string[], size: number): { grid: string[][]; placements: Placement[]; ids: string[] } {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''))
  const placements: Placement[] = []
  const ids: string[] = []

  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi]!.toUpperCase()
    let placed = false
    const shuffledDirs = [...DIRS].sort(() => Math.random() - 0.5)
    outerLoop: for (let attempt = 0; attempt < 100; attempt++) {
      const dr = shuffledDirs[attempt % shuffledDirs.length]!
      const r0 = Math.floor(Math.random() * size)
      const c0 = Math.floor(Math.random() * size)
      const cells: Array<{ r: number; c: number }> = []
      for (let k = 0; k < word.length; k++) {
        const r = r0 + dr[0] * k
        const c = c0 + dr[1] * k
        if (r < 0 || r >= size || c < 0 || c >= size) continue outerLoop
        if (grid[r]![c] !== '' && grid[r]![c] !== word[k]) continue outerLoop
        cells.push({ r, c })
      }
      for (const { r, c } of cells) grid[r]![c] = word[cells.findIndex(x => x.r === r && x.c === c)]! ?? ''
      for (let k = 0; k < word.length; k++) grid[cells[k]!.r]![cells[k]!.c] = word[k]!
      placements.push({ word, id: `w${wi}`, color: WORD_COLORS[wi % WORD_COLORS.length]!, cells })
      placed = true
      break
    }
    if (!placed) {
      // force row placement
      const r = wi % size
      const cells: Array<{ r: number; c: number }> = []
      for (let k = 0; k < Math.min(word.length, size); k++) {
        cells.push({ r, c: k })
        grid[r]![k] = word[k]!
      }
      placements.push({ word, id: `w${wi}`, color: WORD_COLORS[wi % WORD_COLORS.length]!, cells })
    }
  }

  // Fill blanks
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r]![c] === '') grid[r]![c] = alpha[Math.floor(Math.random() * 26)]!

  return { grid, placements, ids: placements.map(p => p.id) }
}

export function WordSearchGame({ items, onComplete, onBack, moduleConfig, progress }: Props) {
  const { reportCorrect, reportWrong, isTerminated } = useGameEvents()
  const speakFn = useSpeak()

  const [selectedItems] = useState(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(shuffled.length, 4))
  })

  const words = selectedItems.map(v => v.text_en)
  const gridSize = Math.max(6, Math.ceil(Math.max(...words.map(w => w.length)) * 1.2))
  const clampedSize = Math.min(gridSize, 7)

  const [{ grid, placements }] = useState(() => buildGrid(words, clampedSize))

  const [foundIds, setFoundIds] = useState<Set<string>>(new Set())
  const [selecting, setSelecting] = useState<Array<{ r: number; c: number }>>([])
  const [wrongFlash, setWrongFlash] = useState(false)
  const [correct, setCorrect] = useState(0)
  const isDragging = useRef(false)
  const dragStart = useRef<{ r: number; c: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectingRef = useRef(selecting)
  selectingRef.current = selecting
  const foundIdsRef = useRef(foundIds)
  foundIdsRef.current = foundIds

  const cellsToWord = (cells: Array<{ r: number; c: number }>) =>
    cells.map(({ r, c }) => grid[r]![c]).join('')

  function checkSelection(sel: Array<{ r: number; c: number }>) {
    if (sel.length < 2) return
    const formed = cellsToWord(sel)
    const formedRev = formed.split('').reverse().join('')

    for (const p of placements) {
      if (foundIdsRef.current.has(p.id)) continue
      if (p.word === formed || p.word === formedRev) {
        reportCorrect()
        speakFn(selectedItems.find(v => v.text_en.toUpperCase() === p.word)?.text_en ?? p.word)
        setFoundIds(prev => new Set([...prev, p.id]))
        setCorrect(prev => {
          const next = prev + 1
          if (next === selectedItems.length) {
            setTimeout(() => {
              onComplete(selectedItems.length, selectedItems.length, selectedItems.map(v => ({ vocabId: v.id, correct: true })))
            }, 900)
          }
          return next
        })
        setSelecting([])
        return
      }
    }

    setWrongFlash(true)
    reportWrong()
    setTimeout(() => { setWrongFlash(false); setSelecting([]) }, 500)
  }

  const getPlacementForCell = (r: number, c: number): Placement | null => {
    for (const p of placements) {
      if (!foundIds.has(p.id)) continue
      if (p.cells.some(cell => cell.r === r && cell.c === c)) return p
    }
    return null
  }

  function inSelecting(r: number, c: number) {
    return selecting.some(s => s.r === r && s.c === c)
  }

  // Calcula la celda desde la posición del pointer relativa al bounding rect del contenedor.
  // Más fiable que elementFromPoint, que con setPointerCapture puede devolver el contenedor.
  function getCellAt(clientX: number, clientY: number): { r: number; c: number } | null {
    const container = containerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    const style = window.getComputedStyle(container)
    const pl = parseFloat(style.paddingLeft)
    const pt = parseFloat(style.paddingTop)
    // Usar innerW para ambos ejes: el grid es cuadrado (celdas con aspectRatio 1)
    const innerW = rect.width - pl - parseFloat(style.paddingRight)
    const x = clientX - rect.left - pl
    const y = clientY - rect.top  - pt
    if (x < 0 || y < 0 || x > innerW || y > innerW) return null
    const c = Math.min(Math.floor((x / innerW) * clampedSize), clampedSize - 1)
    const r = Math.min(Math.floor((y / innerW) * clampedSize), clampedSize - 1)
    return { r, c }
  }

  // Calcula todas las celdas desde start hasta end, snapeando al ángulo más cercano (8 dirs × 45°).
  // Así la diagonal siempre se detecta correctamente aunque el mouse se desvíe un poco.
  function getSnappedSelection(
    start: { r: number; c: number },
    end: { r: number; c: number },
  ): Array<{ r: number; c: number }> {
    const dr = end.r - start.r
    const dc = end.c - start.c
    if (dr === 0 && dc === 0) return [start]
    const angle = Math.atan2(dr, dc)
    const sector = Math.round(angle / (Math.PI / 4))
    const SNAP: Array<[number, number]> = [
      [0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1],
    ]
    const [sdr, sdc] = SNAP[((sector % 8) + 8) % 8]!
    const steps = Math.max(Math.abs(dr), Math.abs(dc))
    const cells: Array<{ r: number; c: number }> = []
    for (let i = 0; i <= steps; i++) {
      const nr = start.r + sdr * i
      const nc = start.c + sdc * i
      if (nr < 0 || nr >= clampedSize || nc < 0 || nc >= clampedSize) break
      cells.push({ r: nr, c: nc })
    }
    return cells
  }

  function onGridPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isTerminated) return
    const cell = getCellAt(e.clientX, e.clientY)
    if (!cell) return
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    dragStart.current = cell
    setSelecting([cell])
  }

  function onGridPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current || isTerminated || !dragStart.current) return
    const cell = getCellAt(e.clientX, e.clientY)
    if (!cell) return
    setSelecting(getSnappedSelection(dragStart.current, cell))
  }

  function onGridPointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    dragStart.current = null
    checkSelection(selectingRef.current)
  }

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-x-hidden"
    >
      <div
        className="absolute top-[-15%] right-[-10%] w-[340px] h-[340px] rounded-full opacity-20 blur-[90px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
      />
      <div
        className="absolute bottom-[-15%] left-[-10%] w-[280px] h-[280px] rounded-full opacity-15 blur-[80px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)` }}
      />

      <header className="relative z-10 px-4 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
            ← Volver
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              Sopa de letras
            </p>
            <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--kids-text)' }}>
              {correct}/{selectedItems.length} palabras
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: progress.total }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < progress.current ? moduleConfig.accent : 'var(--kids-border-color)' }} />
          ))}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-4 sm:gap-5 py-4">

        <p className="text-sm sm:text-base font-semibold text-center" style={{ color: 'var(--kids-text-faint)' }}>
          Arrastra sobre las letras para encontrar las palabras
        </p>

        {/* Word list — w-full evita desborde en teléfonos de 360px */}
        <div className="flex flex-wrap gap-2 justify-center w-full">
          {selectedItems.map(item => {
            const p = placements.find(pl => pl.word === item.text_en.toUpperCase())
            const isFound = p ? foundIds.has(p.id) : false
            return (
              <span
                key={item.id}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200"
                style={{
                  background: isFound ? `${p?.color ?? moduleConfig.accent}22` : 'var(--kids-surface)',
                  color: isFound ? (p?.color ?? moduleConfig.accent) : 'var(--kids-text-muted)',
                  border: `2px solid ${isFound ? (p?.color ?? moduleConfig.accent) : 'var(--kids-border-color)'}`,
                  textDecoration: isFound ? 'line-through' : 'none',
                  opacity: isFound ? 0.7 : 1,
                }}
              >
                {item.text_en}
              </span>
            )
          })}
        </div>

        <div
          ref={containerRef}
          className="rounded-2xl p-2 sm:p-3 select-none"
          style={{
            background: 'var(--kids-surface)',
            border: '2px solid var(--kids-border-color)',
            touchAction: 'none',
            width: '100%',
            maxWidth: `min(calc(100vw - 32px), calc(100vh - 310px))`,
            margin: '0 auto',
          }}
          onPointerDown={onGridPointerDown}
          onPointerMove={onGridPointerMove}
          onPointerUp={onGridPointerUp}
        >
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((letter, c) => {
                const foundP     = getPlacementForCell(r, c)
                const isSelected = inSelecting(r, c)
                const bg = foundP
                  ? `${foundP.color}33`
                  : isSelected
                    ? wrongFlash ? 'rgba(239,68,68,0.25)' : `${moduleConfig.accent}33`
                    : 'transparent'
                const textColor = foundP
                  ? foundP.color
                  : isSelected
                    ? wrongFlash ? '#ef4444' : moduleConfig.accent
                    : 'var(--kids-text)'

                return (
                  <div
                    key={c}
                    className="flex items-center justify-center rounded-md font-extrabold text-base sm:text-lg transition-colors duration-100"
                    style={{
                      width: `${100 / clampedSize}%`,
                      aspectRatio: '1',
                      background: bg,
                      color: textColor,
                    }}
                  >
                    {letter}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
