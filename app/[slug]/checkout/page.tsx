import { notFound } from 'next/navigation'
import { getStoreBySlug } from '@/lib/tenant'
import { CheckoutForm } from '@/components/checkout-form'

// Página nueva, separada del cart-drawer: es demasiado formulario (nombre, teléfono, hasta 6
// campos de dirección) para un drawer angosto. El carrito sobrevive la navegación acá porque
// CartProvider envuelve todo app/[slug]/layout.tsx -- no hace falta serializarlo en la URL.
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  if (!store) notFound()

  return (
    <div className="mx-auto max-w-[600px] px-6 py-10">
      <CheckoutForm store={store} />
    </div>
  )
}
