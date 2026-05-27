'use client'

import { useState, useRef, useCallback } from 'react'
import type { VocabItem, ModuleConfig, WordResult } from '@strides/core/kids'
import { useGameEvents } from '../modifiers/ModifierContext'
import { useSpeak } from '@/components/kids/VoicePresetProvider'

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

  const words = items.map(v => v.text_en)
  const gridSize = Math.max(8, Math.ceil(Math.max(...words.map(w => w.length)) * 1.5))
  const clampedSize = Math.min(gridSize, 12)

  const [{ grid, placements }] = useState(() => buildGrid(words, clampedSize))

  const [foundIds, setFoundIds] = useState<Set<string>>(new Set())
  const [selecting, setSelecting] = useState<Array<{ r: number; c: number }>>([])
  const [wrongFlash, setWrongFlash] = useState(false)
  const [correct, setCorrect] = useState(0)
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const isDragging = useRef(false)

  function cellKey(r: number, c: number) { return `${r}-${c}` }

  const cellsToWord = (cells: Array<{ r: number; c: number }>) =>
    cells.map(({ r, c }) => grid[r]![c]).join('')

  function checkSelection(sel: Array<{ r: number; c: number }>) {
    if (sel.length < 2) return
    const formed = cellsToWord(sel)
    const formedRev = formed.split('').reverse().join('')

    for (const p of placements) {
      if (foundIds.has(p.id)) continue
      if (p.word === formed || p.word === formedRev) {
        reportCorrect()
        speakFn(items.find(v => v.text_en.toUpperCase() === p.word)?.text_en ?? p.word)
        setFoundIds(prev => {
          const next = new Set([...prev, p.id])
          const nextCount = correct + 1
          if (nextCount === items.length) {
            setTimeout(() => {
              const wordResults = items.map(v => ({
                vocabId: v.id,
                correct: true,
              }))
              onComplete(items.length, items.length, wordResults)
            }, 900)
          }
          return next
        })
        setCorrect(c => c + 1)
        setSelecting([])
        return
      }
    }

    // wrong
    setWrongFlash(true)
    reportWrong()
    setTimeout(() => {
      setWrongFlash(false)
      setSelecting([])
    }, 500)
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

  function onCellPointerDown(r: number, c: number) {
    if (isTerminated) return
    isDragging.current = true
    setSelecting([{ r, c }])
  }

  function onCellPointerEnter(r: number, c: number) {
    if (!isDragging.current || isTerminated) return
    setSelecting(prev => {
      if (prev.some(s => s.r === r && s.c === c)) return prev
      // Only allow straight lines
      if (prev.length >= 2) {
        const dr = prev[1]!.r - prev[0]!.r
        const dc = prev[1]!.c - prev[0]!.c
        const expectedR = prev[prev.length - 1]!.r + dr
        const expectedC = prev[prev.length - 1]!.c + dc
        if (r !== expectedR || c !== expectedC) return prev
      } else if (prev.length === 1) {
        const diffR = Math.abs(r - prev[0]!.r)
        const diffC = Math.abs(c - prev[0]!.c)
        if (diffR > 1 || diffC > 1) return prev
      }
      return [...prev, { r, c }]
    })
  }

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    checkSelection(selecting)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecting, foundIds])

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden"
      onPointerUp={onPointerUp}
    >
      <div
        className="absolute top-[-15%] right-[-10%] w-[340px] h-[340px] rounded-full opacity-20 blur-[90px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientFrom}, transparent)` }}
      />
      <div
        className="absolute bottom-[-15%] left-[-10%] w-[280px] h-[280px] rounded-full opacity-15 blur-[80px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${moduleConfig.gradientTo}, transparent)` }}
      />

      <header className="relative z-10 px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm font-bold transition-opacity hover:opacity-70" style={{ color: moduleConfig.accent }}>
            ← Volver
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
              Sopa de letras
            </p>
            <p className="font-bold text-lg" style={{ color: 'var(--kids-text)' }}>
              {correct}/{items.length} palabras
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: progress.total }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < progress.current ? moduleConfig.accent : 'var(--kids-border-color)' }} />
          ))}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-5">

        <p className="text-base font-semibold" style={{ color: 'var(--kids-text-faint)' }}>
          Arrastra sobre las letras para encontrar las palabras
        </p>

        {/* Word list */}
        <div className="flex flex-wrap gap-2 justify-center" style={{ maxWidth: 360 }}>
          {items.map(item => {
            const p = placements.find(pl => pl.word === item.text_en.toUpperCase())
            const isFound = p ? foundIds.has(p.id) : false
            return (
              <span
                key={item.id}
                className="px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-200"
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

        {/* Grid */}
        <div
          className="rounded-2xl p-3 select-none"
          style={{
            background: 'var(--kids-surface)',
            border: '2px solid var(--kids-border-color)',
            touchAction: 'none',
            width: '100%',
            maxWidth: `min(calc(100vw - 32px), calc(100vh - 290px))`,
            margin: '0 auto',
          }}
        >
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((letter, c) => {
                const foundP = getPlacementForCell(r, c)
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
                  <button
                    key={c}
                    ref={el => { cellRefs.current[cellKey(r, c)] = el }}
                    onPointerDown={() => onCellPointerDown(r, c)}
                    onPointerEnter={() => onCellPointerEnter(r, c)}
                    className="flex items-center justify-center rounded-lg font-extrabold text-xs sm:text-sm transition-colors duration-100 touch-none"
                    style={{
                      width: `${100 / clampedSize}%`,
                      aspectRatio: '1',
                      background: bg,
                      color: textColor,
                    }}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
