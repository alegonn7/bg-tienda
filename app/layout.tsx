import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { DM_Sans, Geist_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Metadata específico de cada tienda (título, favicon) se resuelve en app/[slug]/layout.tsx,
// que la sobreescribe. Esto queda como fallback neutro para /admin y para el caso de una URL
// sin slug. El ícono default sale de app/icon.png (convención de archivo de Next — no se
// declara acá a mano para no pisarse con la generación automática de /favicon.ico).
export const metadata: Metadata = {
  title: 'bg-tienda',
  description: 'Tiendas online de bg-tienda.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} ${geistMono.variable}`}
      style={{ backgroundColor: '#fafaf9' }}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
