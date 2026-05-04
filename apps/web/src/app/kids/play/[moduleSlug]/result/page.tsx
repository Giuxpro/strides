interface Props {
  params: Promise<{ moduleSlug: string }>
}

export default async function ModuleResultPage({ params }: Props) {
  const { moduleSlug } = await params

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 text-center">
      <p className="text-5xl mb-4">🏆</p>
      <h1 className="text-2xl font-bold text-gray-800">¡Módulo completado!</h1>
      <p className="text-gray-400 text-sm mt-2">{moduleSlug}</p>
      <p className="text-gray-300 mt-8">— Próximamente —</p>
    </main>
  )
}
