import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-config'

// Landing y catálogos de las tiendas, indexables. El panel, el checkout y el seguimiento de
// pedidos no aportan nada en buscadores (y el seguimiento es por pedido), así que se excluyen.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/*/checkout', '/*/pedido/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
