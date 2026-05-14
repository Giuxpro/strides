import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSetting, getPublishedScreensForFlow } from '@strides/db'
import { PuckRenderer } from '@/components/shared/PuckRenderer'
import type { Data } from '@measured/puck'

interface Props {
  params: Promise<{ slug: string }>
}

const EMPTY_DATA: Data = { content: [], root: { props: {} } }

export default async function OnboardingScreenPage({ params }: Props) {
  const { slug } = await params
  const supabase = createClient()

  const { data: flowRow } = await getSetting(supabase, 'onboarding_flow')
  const flowId = flowRow?.value as string | undefined
  if (!flowId) redirect('/signup')

  const { data: screens } = await getPublishedScreensForFlow(supabase, flowId)
  if (!screens || screens.length === 0) redirect('/signup')

  const currentIndex = screens.findIndex(s => s.slug === slug)
  if (currentIndex === -1) notFound()

  const current = screens[currentIndex]!
  const next = screens[currentIndex + 1] ?? null
  const isLast = !next
  const nextHref = isLast ? '/signup' : `/onboarding/${next.slug}`

  const puckData = (current.content && typeof current.content === 'object' && 'content' in current.content)
    ? current.content as unknown as Data
    : EMPTY_DATA

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>

      {/* Barra de progreso */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 pt-5 pb-3 flex items-center justify-between bg-gradient-to-b from-black/30 to-transparent">
        <div className="flex items-center gap-2">
          {screens.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentIndex ? '24px' : '8px',
                height: '8px',
                background: i <= currentIndex ? '#a78bfa' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
        <Link href="/signup" className="text-xs text-white/50 hover:text-white/80 transition-colors">
          Saltar →
        </Link>
      </div>

      {/* Contenido Puck */}
      <div className="flex-1 pt-16">
        <PuckRenderer data={puckData} />
      </div>

      {/* Navegación inferior */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-5 bg-gradient-to-t from-black/40 to-transparent flex items-center justify-between">
        {currentIndex > 0 ? (
          <Link
            href={`/onboarding/${screens[currentIndex - 1]!.slug}`}
            className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2"
          >
            ← Atrás
          </Link>
        ) : <div />}

        <Link
          href={nextHref}
          className="px-8 py-3.5 rounded-2xl font-bold text-base transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: '#fff',
            boxShadow: '0 4px 0 rgba(0,0,0,0.3)',
          }}
        >
          {isLast ? '¡Comenzar!' : 'Siguiente →'}
        </Link>
      </div>
    </div>
  )
}
