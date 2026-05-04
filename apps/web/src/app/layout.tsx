import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Strides',
  description: 'English learning for kids',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
