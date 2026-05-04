import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = createClient()

  const [
    { count: modulesTotal },
    { count: modulesPublished },
    { count: lessons },
    { count: vocab },
    { count: parents },
    { count: children },
  ] = await Promise.all([
    supabase.from('modules').select('*', { count: 'exact', head: true }),
    supabase.from('modules').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('vocabulary_items').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
    supabase.from('children').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Módulos',           value: modulesTotal ?? 0,    sub: `${modulesPublished ?? 0} publicados` },
    { label: 'Lecciones',         value: lessons ?? 0,          sub: 'total' },
    { label: 'Vocabulario',       value: vocab ?? 0,            sub: 'palabras / frases' },
    { label: 'Usuarios (padres)', value: parents ?? 0,          sub: 'cuentas activas' },
    { label: 'Perfiles de niños', value: children ?? 0,         sub: 'creados' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">Resumen general de Strides</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm font-medium text-gray-300 mt-1">{stat.label}</p>
            <p className="text-xs text-gray-600 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
