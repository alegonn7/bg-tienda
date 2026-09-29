import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente anon SIN cookies, para lecturas públicas del storefront (store_directory,
// store_catalog, hero_images). El cliente de lib/supabase/server.ts llama a cookies(), y eso
// obliga a Next a renderizar cada página en cada request (sin caché) aunque los datos sean los
// mismos para todos los visitantes. Con este cliente las páginas de la tienda pueden cachearse
// (ISR, ver `revalidate` en app/[slug]/layout.tsx).
//
// Solo para datos públicos: corre siempre como anon, nunca con la sesión del usuario.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
