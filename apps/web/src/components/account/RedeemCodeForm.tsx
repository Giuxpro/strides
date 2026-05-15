'use client'
import { useRef, useState, useTransition } from 'react'
import { redeemAccessCode } from '@/app/account/_actions'

export function RedeemCodeForm({ context = 'account' }: { context?: 'signup' | 'account' }) {
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await redeemAccessCode(formData)
      setResult(res)
      if (res?.success) formRef.current?.reset()
    })
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-800">
      <h2 className="text-sm font-semibold text-gray-400 mb-4">Canjear código de acceso</h2>

      <form ref={formRef} action={handleSubmit} className="flex gap-3">
        <input type="hidden" name="context" value={context} />
        <input
          name="code"
          required
          placeholder="STRIDES-VIP"
          className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 uppercase text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
        >
          {isPending ? 'Verificando...' : 'Canjear'}
        </button>
      </form>

      {result?.error && (
        <p className="mt-2 text-sm text-red-400">{result.error}</p>
      )}
      {result?.success && (
        <p className="mt-2 text-sm text-emerald-400">{result.success}</p>
      )}
    </div>
  )
}
