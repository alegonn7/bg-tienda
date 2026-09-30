// URL canónica del dominio de bg-tienda. La usan metadataBase (app/layout.tsx), app/sitemap.ts,
// app/robots.ts y los bloques JSON-LD de la landing, que necesitan URLs absolutas.
//
// Orden de resolución:
//   1. NEXT_PUBLIC_SITE_URL — setearla en Vercel cuando haya dominio propio (ej. bgtienda.com).
//      Es el único cambio necesario en ese momento, sin tocar código.
//   2. NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL — la provee Vercel sola: es el dominio de
//      producción ESTABLE del proyecto, no la URL de cada deploy (VERCEL_URL cambia en cada deploy
//      y rompería el sitemap/canonical en Search Console).
//   3. http://localhost:3000 — fallback de desarrollo.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  if (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return 'http://localhost:3000'
}

export const SITE_URL = resolveSiteUrl()

// Sitio de Binary Goats, donde vive la página de producto de BG Tienda. Los links cruzados entre
// ambos dominios ayudan a que Google asocie la marca con el producto.
export const BINARY_GOATS_URL = (
  process.env.NEXT_PUBLIC_BINARY_GOATS_URL ?? 'https://binarygoats.vercel.app'
).replace(/\/$/, '')

export const WHATSAPP_NUMBER = '542241527649'
