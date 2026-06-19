import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { DM_Sans, Geist_Mono } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart-context'
import { createClient } from '@/lib/supabase/server'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'favicon')
    .single()

  const faviconUrl = data?.value ?? '/favicon.png'

  return {
    title: 'PinsCrew — Pins personalizados',
    description:
      'Fabricamos pins personalizados en todos los formatos: llaveros, imanes, destapadores y más. Para empresas, eventos y proyectos propios. Producción local argentina, envíos a todo el país.',
    icons: {
      icon: faviconUrl,
      apple: faviconUrl,
    },
  }
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
        <CartProvider>{children}</CartProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
