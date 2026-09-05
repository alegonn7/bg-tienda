// Cliente de la Pexels API (búsqueda de fotos) — usado para sugerir fotos de producto a partir
// del nombre cargado en bg-gestion (ver app/admin/actions.ts). Se eligió Pexels porque es gratis
// sin tarjeta (a diferencia de Brave/SerpApi) y sin límite de "clientes nuevos" (a diferencia de
// Google Custom Search, ya cerrada). A cambio, es un banco de fotos de stock genéricas, no un
// buscador de "toda la web" — para productos muy de nicho puede no encontrar nada, en cuyo caso
// el admin simplemente salta ese producto y lo sube a mano. Requiere PEXELS_API_KEY (dashboard de
// pexels.com/api). No lleva prefijo NEXT_PUBLIC_: solo se usa server-side.

export type ImageCandidate = {
  imageUrl: string
  thumbnailUrl: string
  title: string
  contextLink: string
  photographer: string
  photographerUrl: string
}

type PexelsPhoto = {
  url: string
  alt?: string
  photographer?: string
  photographer_url?: string
  src: { original?: string; large?: string; medium?: string; small?: string }
}

type PexelsSearchResponse = {
  photos?: PexelsPhoto[]
}

const ENDPOINT = 'https://api.pexels.com/v1/search'

export async function searchProductImages(query: string): Promise<ImageCandidate[]> {
  const apiKey = process.env.PEXELS_API_KEY

  if (!apiKey) {
    throw new Error('Falta configurar PEXELS_API_KEY en el servidor.')
  }

  const url = new URL(ENDPOINT)
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '8')

  const res = await fetch(url, { headers: { Authorization: apiKey } })
  const data = (await res.json().catch(() => null)) as PexelsSearchResponse | null

  if (!res.ok) {
    throw new Error(`Error buscando imágenes (${res.status})`)
  }

  return (data?.photos ?? [])
    .filter((p) => p.src?.large || p.src?.original)
    .map((p) => ({
      imageUrl: (p.src.large || p.src.original)!,
      thumbnailUrl: p.src.medium || p.src.small || (p.src.large || p.src.original)!,
      title: p.alt ?? '',
      contextLink: p.url,
      photographer: p.photographer ?? '',
      photographerUrl: p.photographer_url ?? '',
    }))
}

// Pexels indexa mayormente en inglés — los nombres de producto acá están en español (ver
// components/admin/suggest-images-queue.tsx), así que la primera búsqueda de cada producto
// traduce antes de buscar. MyMemory es gratis y sin key, a tono con el resto de esta feature. Si
// la traducción falla por lo que sea, se sigue con el texto original en vez de cortar la búsqueda.
async function translateToEnglish(text: string): Promise<string> {
  try {
    const url = new URL('https://api.mymemory.translated.net/get')
    url.searchParams.set('q', text)
    url.searchParams.set('langpair', 'es|en')

    const res = await fetch(url)
    if (!res.ok) return text

    const data = (await res.json()) as { responseData?: { translatedText?: string } }
    const translated = data?.responseData?.translatedText
    return translated?.trim() || text
  } catch {
    return text
  }
}

// La traducción automática a veces sale peor que el original (p. ej. "chapita" — jerga regional
// para "pin/insignia" — la tradujimos como "plate", y con eso Pexels no encontró nada bueno,
// mientras que buscando "chapita redonda 25mm" tal cual sí había una candidata útil). Por eso acá
// se busca en los dos idiomas en paralelo y se combinan los resultados (sin duplicados), en vez de
// reemplazar la búsqueda en español por la traducida.
export async function translateAndSearchProductImages(
  name: string,
): Promise<{ query: string; candidates: ImageCandidate[] }> {
  const query = await translateToEnglish(name)
  const sameText = query.trim().toLowerCase() === name.trim().toLowerCase()

  const [translatedResults, originalResults] = await Promise.all([
    searchProductImages(query),
    sameText ? Promise.resolve<ImageCandidate[]>([]) : searchProductImages(name),
  ])

  const seen = new Set<string>()
  const candidates: ImageCandidate[] = []
  for (const candidate of [...translatedResults, ...originalResults]) {
    if (seen.has(candidate.imageUrl)) continue
    seen.add(candidate.imageUrl)
    candidates.push(candidate)
  }

  return { query, candidates: candidates.slice(0, 8) }
}
