'use client'

import { useState } from 'react'
import Link from 'next/link'

interface NavItem { href: string; label: string }

interface Props {
  nav: NavItem[]
  profileName?: string | null
}

export function AdminSidebar({ nav, profileName }: Props) {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  const sidebarContent = (
    <>
      <div className="flex-shrink-0 px-5 py-5 border-b border-gray-800 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-violet-400 uppercase">Strides</p>
          <p className="text-xs text-gray-600 mt-0.5">Administración</p>
        </div>
        <button
          className="lg:hidden text-gray-500 hover:text-white text-2xl leading-none px-1"
          onClick={close}
          aria-label="Cerrar menú"
        >
          ×
        </button>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            className="block px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-800">
        <Link
          href="/select-profile"
          onClick={close}
          className="block text-xs text-gray-600 hover:text-gray-400 transition-colors mb-3"
        >
          ← Volver a la app
        </Link>
        <p className="text-xs text-gray-500 truncate">{profileName}</p>
        <p className="text-xs text-gray-700 mt-0.5">Admin</p>
      </div>
    </>
  )

  return (
    <>
      {/* ── Barra superior mobile ── */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#07070a] border-b border-gray-800 flex-shrink-0">
        <button
          onClick={() => setOpen(true)}
          className="text-gray-400 hover:text-white text-xl leading-none"
          aria-label="Abrir menú"
        >
          ☰
        </button>
        <p className="text-xs font-bold tracking-widest text-violet-400 uppercase">Strides</p>
        <p className="text-xs text-gray-600">Administración</p>
      </div>

      {/* ── Backdrop mobile ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={close}
          aria-hidden
        />
      )}

      {/* ── Sidebar desktop (siempre visible) ── */}
      <aside className="hidden lg:flex w-52 flex-shrink-0 flex-col bg-[#07070a] border-r border-gray-800">
        {sidebarContent}
      </aside>

      {/* ── Drawer mobile ── */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-[#07070a] border-r border-gray-800
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
