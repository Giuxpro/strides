import { createClient } from '@/lib/supabase/server'
import { getOnboardingScreenBySlug } from '@strides/db'
import { PuckRenderer } from '@/components/shared/PuckRenderer'
import type { Data } from '@measured/puck'
import Link from 'next/link'

const EMPTY_DATA: Data = { content: [], root: { props: {} } }

export default async function WelcomePage() {
  const supabase = createClient()
  const { data: screen } = await getOnboardingScreenBySlug(supabase, 'welcome')

  if (!screen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-900 to-indigo-900 text-center px-6">
        <span className="text-8xl mb-6">🌟</span>
        <h1 className="text-4xl font-extrabold text-white mb-3">¡Aprende inglés jugando!</h1>
        <p className="text-lg text-white/80 mb-10 max-w-xs">Aventuras de inglés para niños de 4 a 12 años</p>
        <Link
          href="/select-profile"
          className="bg-white text-violet-700 font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          Comenzar
        </Link>
      </div>
    )
  }

  const puckData = (screen.content && typeof screen.content === 'object' && 'content' in screen.content)
    ? screen.content as unknown as Data
    : EMPTY_DATA

  return <PuckRenderer data={puckData} />
}
