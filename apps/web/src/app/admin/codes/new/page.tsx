import Link from 'next/link'
import { NewCodeForm } from '@/components/admin/NewCodeForm'

export default function NewCodePage() {
  return (
    <div className="p-8 max-w-2xl">
      <Link href="/admin/codes" className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6 inline-block">
        ← Volver a códigos
      </Link>

      <h1 className="text-xl font-bold text-white mb-1">Nuevo código</h1>
      <p className="text-sm text-gray-500 mb-8">Configura el tipo de acceso, límite de usos y fecha de vencimiento.</p>

      <NewCodeForm />
    </div>
  )
}
