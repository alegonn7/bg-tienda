// URL canónica del dominio de bg-tienda. La usan metadataBase (app/layout.tsx), app/sitemap.ts,
// app/robots.ts y los JSON-LD, que necesitan URLs absolutas.
//
// Orden de resolución:
//   1. NEXT_PUBLIC_SITE_URL — setearla en Vercel cuando haya dominio propio (ej. bgtienda.com.ar).
//      Es el único cambio necesario en ese momento, sin tocar código.
//   2. https://bg-tienda.vercel.app — el dominio de producción actual. Queda fijo (en vez de leer
//      las variables de sistema de Vercel) para que previews y desarrollo local también apunten
//      sus canonical/sitemap a producción y Google nunca indexe una URL de deploy.
const PRODUCTION_URL = 'https://bg-tienda.vercel.app'

function resolveSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_URL).replace(/\/$/, '')
}

export const SITE_URL = resolveSiteUrl()

// Sitio de Binary Goats, donde vive la página de producto de BG Tienda. Los links cruzados entre
// ambos dominios ayudan a que Google asocie la marca con el producto.
export const BINARY_GOATS_URL = (
  process.env.NEXT_PUBLIC_BINARY_GOATS_URL ?? 'https://www.binarygoats.com.ar'
).replace(/\/$/, '')

export const WHATSAPP_NUMBER = '542241527649'
