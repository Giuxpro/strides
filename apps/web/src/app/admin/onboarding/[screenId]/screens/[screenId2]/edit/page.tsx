import { notFound } from 'next/navigation'
import type { Data } from '@measured/puck'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingScreenById, getFlowById } from '@strides/db'
import { OnboardingEditorClient } from '../../../OnboardingEditorClient'

interface Props { params: { screenId: string; screenId2: string } }

const EMPTY_DATA: Data = { content: [], root: { props: {} } }

export default async function EditScreenPage({ params }: Props) {
  const { screenId: flowId, screenId2: screenId } = params
  const supabase = createClient()

  const [{ data: screen }, { data: flow }] = await Promise.all([
    getOnboardingScreenById(supabase, screenId),
    getFlowById(supabase, flowId),
  ])

  if (!screen || !flow) notFound()

  const puckData = (screen.content && typeof screen.content === 'object' && 'content' in screen.content)
    ? screen.content as unknown as Data
    : EMPTY_DATA

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-950 border-b border-gray-800 shrink-0">
        <a
          href={`/admin/onboarding/${flowId}/screens/${screenId}`}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← {flow.name}
        </a>
        <span className="text-gray-700">·</span>
        <span className="text-xs text-gray-400">{screen.title}</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
          screen.is_published ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700 text-gray-400'
        }`}>
          {screen.is_published ? 'Publicado' : 'Borrador'}
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <OnboardingEditorClient id={screen.id} initialData={puckData} />
      </div>
    </div>
  )
}
