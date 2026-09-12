import type { SupabaseClient } from '@supabase/supabase-js'

// Los Server Actions de Mercado Pago llaman a las Edge Functions de bg-gestion con esto en vez
// de usar supabase.functions.invoke crudo: cuando la función devuelve un error (4xx/5xx),
// invoke() deja el mensaje descriptivo adentro de error.context (la Response cruda) en vez de
// en error.message — este helper lo extrae, así cada acción tira un Error con el texto real
// que puso la Edge Function, en español, en vez de un "non-2xx status code" genérico.
export async function invokeMercadoPagoFunction<T = unknown>(
  supabase: SupabaseClient,
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })

  if (error) {
    const context = (error as { context?: Response }).context
    if (context) {
      const parsed = await context.json().catch(() => null)
      if (parsed?.error) throw new Error(parsed.error)
    }
    throw new Error(error.message)
  }

  return data as T
}
