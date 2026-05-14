import { redirect } from 'next/navigation'

// Redirige al flujo dinámico — la ruta /onboarding/[slug] maneja esta pantalla ahora
export default function WelcomePage() {
  redirect('/onboarding')
}
