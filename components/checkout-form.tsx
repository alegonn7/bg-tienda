'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/cart-context'
import { productImage } from '@/lib/products'
import { formatPrice } from '@/lib/format'
import type { Store } from '@/lib/tenant'
import { createMercadoPagoCheckout, quoteShipping } from '@/app/[slug]/actions'
import { ARGENTINA_PROVINCES } from '@/lib/argentina-provinces'

const inputStyle = {
  border: '1px solid #e5e5e5',
  backgroundColor: '#fff',
  color: '#111111',
} as const

const labelStyle = { letterSpacing: '0.06em', color: '#6b6b6b' } as const

type DeliveryMethod = 'pickup' | 'shipping'

export function CheckoutForm({ store }: { store: Store }) {
  const { items } = useCart()

  const [method, setMethod] = useState<DeliveryMethod>('pickup')
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
  const [quote, setQuote] = useState<{ cost: number; originalCost: number; isFree: boolean; estimatedDays: number | null } | null>(
    null,
  )
  const [quoteError, setQuoteError] = useState('')

  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const subtotal = items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
  const total = subtotal + (method === 'shipping' ? quote?.cost ?? 0 : 0)

  function handleMethodChange(next: DeliveryMethod) {
    setMethod(next)
    setQuote(null)
    setQuoteError('')
  }

  async function handleQuote() {
    if (!postalCode) return
    setQuoting(true)
    setQuoteError('')
    setQuote(null)
    try {
      const result = await quoteShipping(
        store.organizationId,
        postalCode,
        province,
        items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      )
      setQuote({ cost: result.cost, originalCost: result.originalCost, isFree: result.isFree, estimatedDays: result.estimatedDays })
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'No se pudo calcular el envío')
    } finally {
      setQuoting(false)
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    setPaying(true)
    setError('')
    try {
      if (method === 'shipping' && !quote) {
        throw new Error('Calculá el costo de envío antes de pagar.')
      }

      const { checkoutUrl } = await createMercadoPagoCheckout(
        store.organizationId,
        store.branchId,
        store.slug,
        items.map((item) => ({ productId: item.product.id, size: item.size, quantity: item.quantity })),
        {
          method,
          customerName,
          customerPhone,
          customerEmail,
          customerNote: customerNote || undefined,
          address:
            method === 'shipping'
              ? { street, number, floorApartment: floorApartment || undefined, city, province, postalCode }
              : undefined,
        },
      )
      window.location.href = checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el pago')
      setPaying(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[14px]" style={{ color: '#6b6b6b' }}>
          Tu carrito está vacío.
        </p>
        <Link href={`/${store.slug}`} className="mt-4 inline-block text-[13px]" style={{ color: '#111111', textDecoration: 'underline' }}>
          ← Volver a la tienda
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handlePay} className="flex flex-col gap-8">
      <h1 className="text-[22px] font-medium" style={{ color: '#111111' }}>
        Finalizar compra
      </h1>

      {/* Resumen del carrito */}
      <div className="flex flex-col gap-3" style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '1.5rem' }}>
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImage(item.product) || '/placeholder.jpg'}
              alt={item.product.name}
              className="h-12 w-12 object-cover"
              style={{ border: '1px solid #e5e5e5' }}
            />
            <div className="flex-1">
              <p className="text-[14px]" style={{ color: '#111111' }}>
                {item.product.name}
                {item.size ? ` — ${item.size}` : ''}
              </p>
              <p className="text-[12px]" style={{ color: '#6b6b6b' }}>
                x{item.quantity}
              </p>
            </div>
            {store.showPrices && (
              <span className="text-[14px]" style={{ color: '#111111' }}>
                {formatPrice((item.product.price ?? 0) * item.quantity)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Datos de contacto */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] uppercase" style={labelStyle}>
            Nombre *
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-[12px] uppercase" style={labelStyle}>
            Teléfono *
          </label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
            className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
            style={inputStyle}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[12px] uppercase" style={labelStyle}>
            Email *
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
            style={inputStyle}
          />
          <p className="mt-1 text-[12px]" style={{ color: '#6b6b6b' }}>
            Te mandamos ahí el detalle de tu compra.
          </p>
        </div>
      </div>

      {/* Método de entrega */}
      <div>
        <label className="block text-[12px] uppercase" style={labelStyle}>
          Entrega
        </label>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => handleMethodChange('pickup')}
            className="px-4 py-2 text-[13px]"
            style={{
              border: `1px solid ${method === 'pickup' ? '#111111' : '#e5e5e5'}`,
              backgroundColor: method === 'pickup' ? '#111111' : '#fff',
              color: method === 'pickup' ? '#fff' : '#6b6b6b',
            }}
          >
            Retirar en el local — Gratis
          </button>
          {store.shippingEnabled && (
            <button
              type="button"
              onClick={() => handleMethodChange('shipping')}
              className="px-4 py-2 text-[13px]"
              style={{
                border: `1px solid ${method === 'shipping' ? '#111111' : '#e5e5e5'}`,
                backgroundColor: method === 'shipping' ? '#111111' : '#fff',
                color: method === 'shipping' ? '#fff' : '#6b6b6b',
              }}
            >
              Envío a domicilio
            </button>
          )}
        </div>
      </div>

      {method === 'shipping' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Calle"
              required
              className="col-span-2 px-4 py-3 text-[14px] outline-none"
              style={inputStyle}
            />
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Número"
              required
              className="px-4 py-3 text-[14px] outline-none"
              style={inputStyle}
            />
          </div>
          <input
            type="text"
            value={floorApartment}
            onChange={(e) => setFloorApartment(e.target.value)}
            placeholder="Piso / depto (opcional)"
            className="px-4 py-3 text-[14px] outline-none"
            style={inputStyle}
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Localidad"
              required
              className="px-4 py-3 text-[14px] outline-none"
              style={inputStyle}
            />
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              required
              className="px-4 py-3 text-[14px] outline-none"
              style={inputStyle}
            >
              <option value="">Provincia</option>
              {ARGENTINA_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value)
                setQuote(null)
              }}
              placeholder="Código postal"
              required
              className="px-4 py-3 text-[14px] outline-none"
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            onClick={handleQuote}
            disabled={quoting || !postalCode}
            className="w-fit px-4 py-2.5 text-[13px] disabled:opacity-60"
            style={{ border: '1px solid #111111', color: '#111111', backgroundColor: '#fff' }}
          >
            {quoting ? 'Calculando...' : 'Calcular envío'}
          </button>

          {quoteError && (
            <p className="text-[12px]" style={{ color: '#d81b8a' }}>
              {quoteError}
            </p>
          )}
          {quote && (
            <p className="text-[13px]" style={{ color: '#16a34a' }}>
              Envío:{' '}
              {quote.isFree ? (
                <>
                  Gratis{' '}
                  <span style={{ color: '#6b6b6b', textDecoration: 'line-through' }}>
                    {formatPrice(quote.originalCost)}
                  </span>
                </>
              ) : (
                formatPrice(quote.cost)
              )}
              {quote.estimatedDays ? ` — llega en ${quote.estimatedDays} días aprox.` : ''}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-[12px] uppercase" style={labelStyle}>
          Nota (opcional)
        </label>
        <textarea
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          rows={2}
          className="mt-2 w-full resize-none px-4 py-3 text-[15px] outline-none"
          style={inputStyle}
        />
      </div>

      {store.showPrices && (
        <div className="flex items-center justify-between" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1rem' }}>
          <span className="text-[14px]" style={{ color: '#6b6b6b' }}>
            Total
          </span>
          <span className="text-[16px] font-medium" style={{ color: '#111111' }}>
            {formatPrice(total)}
          </span>
        </div>
      )}

      {error && (
        <p className="text-[13px]" style={{ color: '#d81b8a' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={paying || (method === 'shipping' && !quote)}
        className="pc-btn w-full px-4 py-3 text-[14px] disabled:opacity-60"
      >
        {paying ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago →'}
      </button>
    </form>
  )
}
