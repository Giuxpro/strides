import { createClient } from '@/lib/supabase/server'
import { getSetting } from '@strides/db'
import { getTemplatesFor } from '@strides/core'
import { setPageTemplate } from './_actions'
import type { TemplatePageType } from '@strides/core'

const PAGE_META: Record<TemplatePageType, { label: string; route: string; description: string }> = {
  landing: { label: 'Inicio',    route: '/',       description: 'Página principal que ven los visitantes' },
  login:   { label: 'Login',     route: '/login',  description: 'Pantalla de inicio de sesión' },
  signup:  { label: 'Registro',  route: '/signup', description: 'Pantalla de creación de cuenta' },
}

export default async function AdminTemplatesPage() {
  const supabase = createClient()
  const [landingRes, loginRes, signupRes] = await Promise.all([
    getSetting(supabase, 'landing_template'),
    getSetting(supabase, 'login_template'),
    getSetting(supabase, 'signup_template'),
  ])

  const active: Record<TemplatePageType, string> = {
    landing: (landingRes.data?.value as string) ?? 'default',
    login:   (loginRes.data?.value   as string) ?? 'default',
    signup:  (signupRes.data?.value  as string) ?? 'default',
  }

  const pages: TemplatePageType[] = ['landing', 'login', 'signup']

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-xl font-bold text-white mb-1">Plantillas de páginas</h1>
      <p className="text-sm text-gray-500 mb-8">
        Selecciona el diseño visual de cada página. El cambio es inmediato, sin deploy.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {pages.map(page => {
          const templates = getTemplatesFor(page)
          const meta      = PAGE_META[page]

          return (
            <section key={page} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{meta.label}</h2>
                <a
                  href={meta.route}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {meta.route} ↗
                </a>
              </div>
              <p className="text-xs text-gray-600 mb-5">{meta.description}</p>

              <div className="flex flex-col gap-3">
                {templates.map(tmpl => {
                  const isActive = active[page] === tmpl.id

                  return (
                    <div
                      key={tmpl.id}
                      className="flex items-center gap-3 p-4 rounded-xl transition-all"
                      style={{
                        background: isActive ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.02)',
                        border: isActive ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <span className="text-2xl shrink-0">{tmpl.emoji}</span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-200">{tmpl.name}</span>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                              Activa
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tmpl.description}</p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {tmpl.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {!isActive && (
                        <form action={setPageTemplate.bind(null, page, tmpl.id)}>
                          <button
                            type="submit"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0 bg-gray-800 text-gray-300 hover:bg-violet-600 hover:text-white"
                          >
                            Activar
                          </button>
                        </form>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-8 p-4 rounded-xl bg-gray-900 border border-gray-800">
        <p className="text-xs text-gray-500">
          <span className="text-gray-400 font-medium">¿Cómo agregar más plantillas?</span>{' '}
          Añade una entrada en{' '}
          <code className="text-gray-400 bg-gray-800 px-1 py-0.5 rounded">packages/core/src/templates/registry.ts</code>{' '}
          y crea el componente en{' '}
          <code className="text-gray-400 bg-gray-800 px-1 py-0.5 rounded">apps/web/src/lib/templates/</code>.
          Aparecerá aquí automáticamente.
        </p>
      </div>
    </div>
  )
}
