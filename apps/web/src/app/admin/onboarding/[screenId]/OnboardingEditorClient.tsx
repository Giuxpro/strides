'use client'

import { useTransition } from 'react'
import type { Data } from '@measured/puck'
import { PuckEditor } from '@/components/shared/PuckEditor'
import { saveOnboardingScreen } from '../_actions'

interface Props {
  id: string
  initialData: Data
}

export function OnboardingEditorClient({ id, initialData }: Props) {
  const [isPending, startTransition] = useTransition()

  function handlePublish(data: Data) {
    startTransition(async () => {
      await saveOnboardingScreen(id, data)
    })
  }

  return (
    <div className="relative h-screen">
      {isPending && (
        <div className="absolute top-3 right-3 z-[9999] flex items-center gap-2 bg-gray-900 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg shadow">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Guardando…
        </div>
      )}
      <PuckEditor data={initialData} onPublish={handlePublish} />
    </div>
  )
}
