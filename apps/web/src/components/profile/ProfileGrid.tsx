'use client'

import Link from 'next/link'
import { selectChild, selectSelf, deleteChild } from '@/app/account/_actions'
import { logout } from '@/app/actions/auth'
import type { Database } from '@strides/db'

type Profile = Database['public']['Tables']['profiles']['Row']
type Child = Database['public']['Tables']['children']['Row']

interface Props {
  profile: Profile | null
  children: Child[]
  canAddMore: boolean
  includedSeats: number
  usedSeats: number
}

export function ProfileGrid({ profile, children, canAddMore, includedSeats, usedSeats }: Props) {
  const displayName = profile?.display_name ?? profile?.email?.split('@')[0] ?? 'Mi perfil'
  const avatar = profile?.avatar ?? '👤'

  return (
    <main className="relative min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8">
      <div className="absolute top-6 right-6 flex items-center gap-4">
        {profile?.role === 'admin' && (
          <Link
            href="/admin"
            className="text-xs text-violet-500 hover:text-violet-300 transition-colors font-medium"
          >
            Panel admin →
          </Link>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            Salir
          </button>
        </form>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">¿Quién juega hoy?</h1>
      <p className="text-gray-500 text-sm mb-12">Elige tu perfil para continuar</p>

      <div className="flex gap-8 flex-wrap justify-center">

        {/* Perfil del titular */}
        <div className="flex flex-col items-center gap-2">
          <form action={selectSelf}>
            <button type="submit" className="flex flex-col items-center gap-3 group cursor-pointer">
              <div className="w-28 h-28 rounded-full bg-violet-800 flex items-center justify-center text-5xl group-hover:ring-4 ring-white transition-all">
                {avatar}
              </div>
              <span className="text-white font-medium">{displayName}</span>
            </button>
          </form>
          <Link href="/account/profile" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Editar
          </Link>
        </div>

        {/* Perfiles de hijos */}
        {children.map(child => (
          <div key={child.id} className="flex flex-col items-center gap-2">
            <form action={selectChild.bind(null, child.id)}>
              <button type="submit" className="flex flex-col items-center gap-3 group cursor-pointer">
                <div className="w-28 h-28 rounded-full bg-amber-500 flex items-center justify-center text-5xl group-hover:ring-4 ring-white transition-all">
                  {child.avatar_url ?? '🧒'}
                </div>
                <span className="text-white font-medium">{child.name}</span>
                <span className="text-gray-500 text-xs">{child.age} años</span>
              </button>
            </form>
            <div className="flex items-center gap-3">
              <Link
                href={`/account/children/${child.id}/edit`}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Editar
              </Link>
              <form action={deleteChild.bind(null, child.id)} className="flex">
                <button type="submit" className="text-xs text-red-800 hover:text-red-500 transition-colors">
                  Eliminar
                </button>
              </form>
            </div>
          </div>
        ))}

        {/* Botón agregar — libre o bloqueado */}
        {canAddMore ? (
          <Link href="/account/children/new" className="flex flex-col items-center gap-3 group">
            <div className="w-28 h-28 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center text-4xl text-gray-600 group-hover:border-gray-400 group-hover:text-gray-400 transition-all">
              +
            </div>
            <span className="text-gray-500 text-sm">Agregar</span>
          </Link>
        ) : (
          <Link href="/account/upgrade" className="flex flex-col items-center gap-3 group">
            <div className="w-28 h-28 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center text-3xl text-gray-700 group-hover:border-gray-600 group-hover:text-gray-500 transition-all relative">
              🔒
              <div className="absolute inset-0 rounded-full" />
            </div>
            <span className="text-gray-600 text-sm group-hover:text-gray-400 transition-colors">
              Ver planes
            </span>
            <span className="text-gray-700 text-xs">
              {usedSeats}/{includedSeats} perfiles
            </span>
          </Link>
        )}

      </div>
    </main>
  )
}
