import Link from 'next/link'

export default function UpgradePage() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-6">🚀</div>
      <h1 className="text-2xl font-bold text-white mb-3">Añade más perfiles</h1>
      <p className="text-gray-400 text-sm max-w-xs mb-8">
        Tu plan actual incluye 2 perfiles. Actualiza tu suscripción para agregar más miembros a tu familia.
      </p>

      <div className="w-full max-w-xs bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <p className="text-violet-400 font-semibold text-sm uppercase tracking-wide mb-1">Perfil adicional</p>
        <p className="text-white text-3xl font-bold mb-1">$2.99<span className="text-gray-500 text-base font-normal">/mes</span></p>
        <p className="text-gray-500 text-xs">Por cada perfil extra que agregues</p>
      </div>

      <button
        disabled
        className="w-full max-w-xs bg-violet-600 opacity-50 cursor-not-allowed text-white font-semibold py-3 rounded-xl mb-4"
      >
        Próximamente
      </button>

      <Link href="/select-profile" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
        ← Volver a perfiles
      </Link>
    </main>
  )
}
