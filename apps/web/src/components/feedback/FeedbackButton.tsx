'use client'

import { useState } from 'react'
import { FeedbackModal } from './FeedbackModal'

export function FeedbackButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full text-center text-sm text-gray-500 hover:text-violet-400 transition-colors py-2"
      >
        💬 Enviar feedback →
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  )
}
