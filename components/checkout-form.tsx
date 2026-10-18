'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Lock, ShoppingBag } from 'lucide-react'
import { useCart } from '@/components/cart-context'
import { productImage } from '@/lib/products'
import { formatPrice } from '@/lib/format'
import type { Store } from '@/lib/tenant'
import { freeShippingFrom, pickupText } from '@/lib/store-info'
import { createMercadoPagoCheckout, createTransferOrder, quoteShipping } from '@/app/[slug]/actions'
import { ARGENTINA_PROVINCES } from '@/lib/argentina-provinces'

// Comisión fija de la plataforma, la paga el cliente (ver mercadopago-checkout en bg-gestion,
// que es quien la cobra de verdad vía marketplace_fee -- esto acá es solo para mostrarla antes
// de llegar a Mercado Pago). Si algún día cambia el % de MP_PLATFORM_FEE_PERCENTAGE, actualizar
// también acá.
const PLATFORM_FEE_PERCENTAGE = 1

type DeliveryMethod = 'pickup' | 'shipping'
type PaymentMethod = 'mercadopago' | 'transfer'
type Quote = { cost: number; originalCost: number; isFree: boolean; estimatedDays: number | null }

function Section({ n, title, aside, children }: { n: number; title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section className="border-b pb-7 last:border-b-0 md:pb-[30px] [&:not(:first-child)]:pt-7 md:[&:not(:first-child)]:pt-[30px]" style={{ borderColor: 'var(--st-line2)' }}>
      <div className="mb-[18px] flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold text-white" style={{ backgroundColor: 'var(--st-ink)' }}>
          {n}
        </span>
        <h2 className="text-[18px] font-bold tracking-[-0.01em] md:text-[20px]">{title}</h2>
        {aside && (
          <small className="ml-auto text-[13px]" style={{ color: 'var(--st-mut)' }}>
            {aside}
          </small>
        )}
      </div>
      {children}
    </section>
  )
}

function Option({
  checked,
  onSelect,
  title,
  text,
  right,
  children,
}: {
  checked: boolean
  onSelect: () => void
  title: React.ReactNode
  text: string
  right?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-[14px] border-[1.5px]" style={{ borderColor: checked ? 'var(--st-ink)' : 'var(--st-line)', backgroundColor: checked ? '#fcfcfb' : '#fff' }}>
      <button type="button" role="radio" aria-checked={checked} onClick={onSelect} className="flex w-full items-start gap-3.5 px-3.5 py-3.5 text-left md:px-[18px] md:py-4">
        <span className="mt-px h-5 w-5 flex-shrink-0 rounded-full" style={{ border: checked ? '6px solid var(--st-ink)' : '1.5px solid var(--st-line)' }} />
        <span className="min-w-0 flex-1">
          <b className="block text-[15px]">{title}</b>
          <small className="mt-0.5 block text-[13px]" style={{ color: 'var(--st-mut)' }}>
            {text}
          </small>
        </span>
        {right}
      </button>
      {checked && children && <div className="px-3.5 pb-4 md:pl-[52px] md:pr-[18px]">{children}</div>}
    </div>
  )
}

export function CheckoutForm({ store }: { store: Store }) {
  const router = useRouter()
  const { items } = useCart()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(store.mercadopagoAvailable ? 'mercadopago' : 'transfer')
  const [method, setMethod] = useState<DeliveryMethod>(store.shippingEnabled ? 'shipping' : 'pickup')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerNote, setCustomerNote] = useState('')

  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [floorApartment, setFloorApartment] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const [quoting, setQuoting] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteError, setQuoteError] = useState('')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const subtotal = items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
  const freeFrom = freeShippingFrom(store)
  // La comisión de plataforma solo existe para Mercado Pago -- transferencia no tiene forma de
  // cobrarla, la plata va directo banco a banco.
  const feeAmount = paymentMethod === 'mercadopago' ? Math.round(subtotal * PLATFORM_FEE_PERCENTAGE) / 100 : 0
  const shippingCost = method === 'shipping' ? (quote?.cost ?? 0) : 0
  const total = subtotal + feeAmount + shippingCost
  const count = items.reduce((n, i) => n + i.quantity, 0)
  const itemsKey = items.map((i) => `${i.product.id}:${i.quantity}`).join(',')

  // El envío se cotiza solo apenas hay código postal y provincia (se recotiza si cambia el carrito).
  useEffect(() => {
    if (method !== 'shipping' || postalCode.trim().length < 4 || !province) return
    let cancelled = false
    const t = setTimeout(async () => {
      setQuoting(true)
      setQuoteError('')
      try {
        const result = await quoteShipping(
          store.organizationId,
          postalCode.trim(),
          province,
          items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        )
        if (!cancelled) setQuote({ cost: result.cost, originalCost: result.originalCost, isFree: result.isFree, estimatedDays: result.estimatedDays })
      } catch (err) {
        if (!cancelled) setQuoteError(err instanceof Error ? err.message : 'No se pudo calcular el envío')
      } finally {
        if (!cancelled) setQuoting(false)
      }
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, postalCode, province, itemsKey, store.organizationId])

  function delivery() {
    return {
      method,
      customerName,
      customerPhone,
      customerEmail,
      customerNote: customerNote || undefined,
      address: method === 'shipping' ? { street, number, floorApartment: floorApartment || undefined, city, province, postalCode } : undefined,
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (method === 'shipping' && !quote) {
      setError(quoting ? 'Esperá un segundo, estamos calculando el envío.' : 'Completá la provincia y el código postal para calcular el envío.')
      return
    }
    setPaying(true)
    const cart = items.map((item) => ({ productId: item.product.id, size: item.size, quantity: item.quantity }))
    try {
      if (paymentMethod === 'transfer') {
        // Sin checkout externo: el pedido queda pendiente hasta que el dueño confirme el pago.
        const { orderId } = await createTransferOrder(store.organizationId, store.branchId, cart, delivery())
        router.push(`/${store.slug}/pedido/${orderId}`)
      } else {
        const { checkoutUrl } = await createMercadoPagoCheckout(store.organizationId, store.branchId, store.slug, cart, delivery())
        window.location.href = checkoutUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el pedido')
      setPaying(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="st-wrap flex flex-col items-center py-24 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full" style={{ backgroundColor: 'var(--st-sf)' }}>
          <ShoppingBag className="h-6 w-6" />
        </span>
        <p className="mt-3 font-semibold">Tu carrito está vacío</p>
        <Link href={`/${store.slug}/productos`} className="st-btn st-btn-sm mt-4">
          Ver productos
        </Link>
      </div>
    )
  }

  const payLabel = paying
    ? paymentMethod === 'transfer'
      ? 'Confirmando…'
      : 'Te llevamos a Mercado Pago…'
    : paymentMethod === 'transfer'
      ? 'Confirmar pedido'
      : 'Pagar con Mercado Pago'

  const shippingValue =
    method === 'pickup' ? (
      <span style={{ color: 'var(--st-ok)' }}>Gratis</span>
    ) : quote ? (
      quote.isFree ? (
        <span style={{ color: 'var(--st-ok)' }}>Gratis</span>
      ) : (
        formatPrice(quote.cost)
      )
    ) : (
      <span style={{ color: 'var(--st-mut)' }}>{quoting ? 'Calculando…' : 'Falta tu código postal'}</span>
    )

  const totals = (
    <>
      <div className="flex justify-between py-1 text-[14px]" style={{ color: 'var(--st-mut)' }}>
        <span>Subtotal</span>
        <span style={{ color: 'var(--st-ink)' }}>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between py-1 text-[14px]" style={{ color: 'var(--st-mut)' }}>
        <span>Envío</span>
        <span style={{ color: 'var(--st-ink)' }}>{shippingValue}</span>
      </div>
      {feeAmount > 0 && (
        <div className="flex justify-between py-1 text-[14px]" style={{ color: 'var(--st-mut)' }}>
          <span>Servicio Mercado Pago ({PLATFORM_FEE_PERCENTAGE}%)</span>
          <span style={{ color: 'var(--st-ink)' }}>{formatPrice(feeAmount)}</span>
        </div>
      )}
    </>
  )

  const itemList = (
    <ul>
      {items.map((item) => (
        <li key={item.key} className="grid grid-cols-[62px_1fr_auto] gap-3.5 border-b py-3.5 last:border-b-0" style={{ borderColor: '#e9e6e1' }}>
          <span className="relative h-[76px] w-[62px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productImage(item.product)} alt="" className="h-full w-full rounded-[10px] object-cover" />
            <em className="absolute -right-[7px] -top-[7px] grid h-[22px] min-w-[22px] place-items-center rounded-full px-1 text-[12px] font-bold not-italic text-white" style={{ backgroundColor: 'var(--st-ink)' }}>
              {item.quantity}
            </em>
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-medium leading-[1.3]">{item.product.name}</span>
            {item.size && (
              <span className="mt-0.5 block text-[13px]" style={{ color: 'var(--st-mut)' }}>
                Talle {item.size}
              </span>
            )}
          </span>
          <b className="text-[15px]">{formatPrice((item.product.price ?? 0) * item.quantity)}</b>
        </li>
      ))}
    </ul>
  )

  return (
    <form onSubmit={submit} className="st-wrap pb-[120px] md:grid md:grid-cols-[1fr_380px] md:gap-10 md:pb-16 md:pt-9 lg:grid-cols-[1fr_420px] lg:gap-14">
      <div>
        {/* Celular: resumen plegable */}
        <div className="-mx-4 mb-[22px] border-b md:hidden" style={{ backgroundColor: 'var(--st-sf)', borderColor: 'var(--st-line2)' }}>
          <button type="button" onClick={() => setSummaryOpen((o) => !o)} className="flex w-full items-center gap-2.5 px-4 py-3.5 text-[14px]">
            <ShoppingBag className="h-4 w-4" />
            {summaryOpen ? 'Ocultar resumen' : `Ver resumen (${count} ${count === 1 ? 'producto' : 'productos'})`}
            <ChevronDown className={`h-4 w-4 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
            <b className="ml-auto text-[16px]">{formatPrice(total)}</b>
          </button>
          {summaryOpen && (
            <div className="px-4 pb-4">
              {itemList}
              <div className="mt-2 border-t pt-2" style={{ borderColor: '#e3dfd9' }}>
                {totals}
              </div>
            </div>
          )}
        </div>

        <Section n={1} title="Tus datos">
          <div className="grid gap-3.5">
            <div className="grid gap-3.5 md:grid-cols-2">
              <label>
                <span className="st-label">Nombre y apellido</span>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required autoComplete="name" className="st-input" />
              </label>
              <label>
                <span className="st-label">Teléfono (WhatsApp)</span>
                <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required autoComplete="tel" className="st-input" />
              </label>
            </div>
            <label>
              <span className="st-label">Email</span>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required autoComplete="email" className="st-input" />
              <span className="mt-1.5 block text-[12px]" style={{ color: 'var(--st-mut)' }}>
                Te mandamos ahí el detalle de tu compra.
              </span>
            </label>
          </div>
        </Section>

        <Section n={2} title="Entrega">
          <div className="grid gap-2.5" role="radiogroup" aria-label="Entrega">
            {store.shippingEnabled && (
              <Option
                checked={method === 'shipping'}
                onSelect={() => setMethod('shipping')}
                title="Envío a domicilio"
                text={quote?.estimatedDays ? `Llega en ${quote.estimatedDays} días hábiles aprox.` : 'A todo el país'}
                right={method === 'shipping' && quote ? <span className="text-[15px] font-bold">{quote.isFree ? <span style={{ color: 'var(--st-ok)' }}>Gratis</span> : formatPrice(quote.cost)}</span> : undefined}
              >
                <div className="grid gap-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <label>
                      <span className="st-label">Provincia</span>
                      <select value={province} onChange={(e) => { setProvince(e.target.value); setQuote(null) }} required className="st-input">
                        <option value="">Elegí</option>
                        {ARGENTINA_PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="st-label">Código postal</span>
                      <input value={postalCode} onChange={(e) => { setPostalCode(e.target.value); setQuote(null) }} required inputMode="numeric" autoComplete="postal-code" className="st-input" />
                    </label>
                  </div>
                  {quote && (
                    <p className="flex items-center gap-2 rounded-[10px] px-3.5 py-2.5 text-[14px]" style={{ backgroundColor: 'var(--st-ok-soft)', color: 'var(--st-ok)' }}>
                      <Check className="h-4 w-4 flex-shrink-0" />
                      {quote.isFree ? (
                        <span>
                          ¡Tu envío es gratis! <s style={{ color: 'var(--st-mut)' }}>{formatPrice(quote.originalCost)}</s>
                        </span>
                      ) : (
                        <span>
                          Envío a {province}: {formatPrice(quote.cost)}
                          {freeFrom != null && freeFrom > subtotal && ` · te faltan ${formatPrice(freeFrom - subtotal)} para que sea gratis`}
                        </span>
                      )}
                    </p>
                  )}
                  {quoting && <p className="text-[13px]" style={{ color: 'var(--st-mut)' }}>Calculando el envío…</p>}
                  {quoteError && <p className="text-[13px]" style={{ color: 'var(--st-bad)' }}>{quoteError}</p>}
                  <div className="grid grid-cols-[1fr_96px] gap-3.5 md:grid-cols-[1fr_120px]">
                    <label>
                      <span className="st-label">Calle</span>
                      <input value={street} onChange={(e) => setStreet(e.target.value)} required autoComplete="address-line1" className="st-input" />
                    </label>
                    <label>
                      <span className="st-label">Número</span>
                      <input value={number} onChange={(e) => setNumber(e.target.value)} required className="st-input" />
                    </label>
                  </div>
                  <div className="grid gap-3.5 md:grid-cols-2">
                    <label>
                      <span className="st-label">Piso / depto (opcional)</span>
                      <input value={floorApartment} onChange={(e) => setFloorApartment(e.target.value)} autoComplete="address-line2" className="st-input" />
                    </label>
                    <label>
                      <span className="st-label">Localidad</span>
                      <input value={city} onChange={(e) => setCity(e.target.value)} required autoComplete="address-level2" className="st-input" />
                    </label>
                  </div>
                </div>
              </Option>
            )}
            <Option
              checked={method === 'pickup'}
              onSelect={() => setMethod('pickup')}
              title="Retiro en el local"
              text={pickupText(store) ?? 'Te avisamos cuando tu pedido esté listo para retirar'}
              right={<span className="text-[15px] font-bold" style={{ color: 'var(--st-ok)' }}>Gratis</span>}
            />
          </div>
        </Section>

        <Section n={3} title="Pago">
          <div className="grid gap-2.5" role="radiogroup" aria-label="Pago">
            {store.mercadopagoAvailable && (
              <Option
                checked={paymentMethod === 'mercadopago'}
                onSelect={() => setPaymentMethod('mercadopago')}
                title="Mercado Pago"
                text="Tarjeta de crédito, débito o dinero en cuenta. Se confirma al instante."
                right={<span className="whitespace-nowrap text-[13px]" style={{ color: 'var(--st-mut)' }}>+{PLATFORM_FEE_PERCENTAGE}% servicio</span>}
              />
            )}
            {store.transferEnabled && (
              <Option
                checked={paymentMethod === 'transfer'}
                onSelect={() => setPaymentMethod('transfer')}
                title="Transferencia bancaria"
                text="Te mostramos el alias al confirmar. Mandás el comprobante y listo."
              />
            )}
          </div>
        </Section>

        <Section n={4} title="Nota para la tienda" aside="Opcional">
          <textarea value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} rows={3} placeholder="Ej: si no estoy, dejalo en portería." className="st-input" />
        </Section>

        {error && (
          <p className="mb-4 rounded-[10px] px-3.5 py-2.5 text-[14px] md:hidden" style={{ backgroundColor: '#fdecec', color: 'var(--st-bad)' }}>
            {error}
          </p>
        )}
      </div>

      {/* Compu: resumen fijo al costado */}
      <aside className="sticky top-6 hidden self-start rounded-[20px] p-6 md:block" style={{ backgroundColor: 'var(--st-sf)' }}>
        <h3 className="mb-1.5 text-[17px] font-bold">Tu pedido</h3>
        {itemList}
        <div className="mt-3.5 border-t pt-2.5" style={{ borderColor: '#e3dfd9' }}>
          {totals}
          <div className="mt-2.5 flex justify-between border-t pt-4 text-[18px] font-bold" style={{ borderColor: '#e3dfd9' }}>
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
        {error && (
          <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[14px]" style={{ backgroundColor: '#fdecec', color: 'var(--st-bad)' }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={paying} className="st-btn st-btn-pri st-btn-lg mt-[18px] w-full">
          {payLabel}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px]" style={{ color: 'var(--st-mut)' }}>
          <Lock className="h-3.5 w-3.5" />
          {paymentMethod === 'transfer' ? 'Al confirmar te mostramos los datos para transferir' : 'Te llevamos a Mercado Pago para pagar seguro'}
        </p>
      </aside>

      {/* Celular: total y botón fijos abajo */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white px-4 pb-3.5 pt-2.5 md:hidden" style={{ borderColor: 'var(--st-line)' }}>
        <div className="mb-2 flex justify-between text-[13px]" style={{ color: 'var(--st-mut)' }}>
          <span>{method === 'shipping' ? 'Total con envío' : 'Total'}</span>
          <b className="text-[16px]" style={{ color: 'var(--st-ink)' }}>
            {formatPrice(total)}
          </b>
        </div>
        <button type="submit" disabled={paying} className="st-btn st-btn-pri st-btn-lg w-full">
          {payLabel}
        </button>
      </div>
    </form>
  )
}
