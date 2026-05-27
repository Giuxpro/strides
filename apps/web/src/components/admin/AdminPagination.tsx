'use client'

import { useRouter, usePathname } from 'next/navigation'

interface Props {
  total: number
  pageSize: number
  currentPage: number
  extraParams?: Record<string, string>
  /** Si se pasa, la paginación es client-side (no modifica la URL) */
  onPageChange?: (page: number) => void
}

function getPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const delta = 2
  const left  = current - delta
  const right = current + delta
  const pages: (number | '...')[] = []
  let prev: number | null = null

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= left && i <= right)) {
      if (prev !== null && i - prev > 1) pages.push('...')
      pages.push(i)
      prev = i
    }
  }
  return pages
}

export function AdminPagination({ total, pageSize, currentPage, extraParams = {}, onPageChange }: Props) {
  const router     = useRouter()
  const pathname   = usePathname()
  const totalPages = Math.ceil(total / pageSize)

  if (total === 0) return null

  function goTo(page: number) {
    if (onPageChange) {
      onPageChange(page)
      return
    }
    const params = new URLSearchParams(extraParams)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  const pages = getPageRange(currentPage, totalPages)

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800/60">
      <p className="text-xs text-gray-500 hidden sm:block">
        Página <span className="text-gray-300 font-medium">{currentPage}</span> de <span className="text-gray-300 font-medium">{totalPages}</span>
      </p>

      <div className="flex items-center gap-0.5">
        {/* Prev */}
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 px-2 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-xs ml-1 hidden sm:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-0.5 mx-1">
          {pages.map((p, i) =>
            p === '...' ? (
              <span
                key={`dots-${i}`}
                className="h-8 w-7 flex items-center justify-center text-gray-600 text-xs select-none"
              >
                ···
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p as number)}
                className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  p === currentPage
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/50'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 px-2 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <span className="text-xs mr-1 hidden sm:inline">Siguiente</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
