'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/cart-context'
import { productImage } from '@/lib/products'
import { formatPrice } from '@/lib/format'
import type { Store } from '@/lib/tenant'
import { createMercadoPagoCheckout, createTransferOrder, quoteShipping } from '@/app/[slug]/actions'
import { ARGENTINA_PROVINCES } from '@/lib/argentina-provinces'

const inputStyle = {
  border: '1px solid #e5e5e5',
  backgroundColor: '#fff',
  color: '#111111',
} as const

const labelStyle = { letterSpacing: '0.06em', color: '#6b6b6b' } as const

// Comisión fija de la plataforma, la paga el cliente (ver mercadopago-checkout en bg-gestion,
// que es quien la cobra de verdad vía marketplace_fee -- esto acá es solo para mostrarla antes
// de llegar a Mercado Pago). Si algún día cambia el % de MP_PLATFORM_FEE_PERCENTAGE, actualizar
// también acá.
const PLATFORM_FEE_PERCENTAGE = 1

type DeliveryMethod = 'pickup' | 'shipping'
type PaymentMethod = 'mercadopago' | 'transfer'
type Step = 'form' | 'review'

export function CheckoutForm({ store }: { store: Store }) {
  const router = useRouter()
  const { items } = useCart()

  const [step, setStep] = useState<Step>('form')

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    store.mercadopagoAvailable ? 'mercadopago' : 'transfer',
  )
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

  const [continueError, setContinueError] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const subtotal = items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
  // La comisión de plataforma solo existe para Mercado Pago -- transferencia no tiene forma de
  // cobrarla, la plata va directo banco a banco.
  const feeAmount = paymentMethod === 'mercadopago' ? Math.round(subtotal * PLATFORM_FEE_PERCENTAGE) / 100 : 0
  const shippingCost = method === 'shipping' ? quote?.cost ?? 0 : 0
  const total = subtotal + feeAmount + shippingCost

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

  // Sin llamada al servidor -- solo valida lo que el form ya requiere y pasa a la revisión.
  // El pedido recién se crea (y se cobra) cuando se confirma ahí, en handlePay.
  function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    setContinueError('')
    if (method === 'shipping' && !quote) {
      setContinueError('Calculá el costo de envío antes de continuar.')
      return
    }
    setStep('review')
  }

  async function handlePay() {
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

  // A diferencia de Mercado Pago, acá no hay ningún checkout externo -- el pedido queda
  // "pending" esperando que el dueño confirme el pago a mano al recibir el comprobante.
  async function handleConfirmTransfer() {
    setPaying(true)
    setError('')
    try {
      if (method === 'shipping' && !quote) {
        throw new Error('Calculá el costo de envío antes de confirmar.')
      }

      const { orderId } = await createTransferOrder(
        store.organizationId,
        store.branchId,
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
      router.push(`/${store.slug}/pedido/${orderId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el pedido')
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

  if (step === 'review') {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <button
            type="button"
            onClick={() => setStep('form')}
            className="text-[13px]"
            style={{ color: '#6b6b6b' }}
          >
            ← Volver a editar
          </button>
          <h1 className="mt-3 text-[22px] font-medium" style={{ color: '#111111' }}>
            Revisá tu pedido
          </h1>
        </div>

        <div className="flex flex-col gap-3" style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '1.5rem' }}>
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <p className="text-[14px]" style={{ color: '#111111' }}>
                {item.quantity}× {item.product.name}
                {item.size ? ` — ${item.size}` : ''}
              </p>
              {store.showPrices && (
                <span className="text-[14px]" style={{ color: '#111111' }}>
                  {formatPrice((item.product.price ?? 0) * item.quantity)}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="text-[13px]" style={{ color: '#6b6b6b' }}>
          <p className="mb-1 text-[12px] uppercase" style={{ letterSpacing: '0.06em' }}>
            Contacto
          </p>
          <p style={{ color: '#111111' }}>
            {customerName} — {customerPhone}
          </p>
          <p>{customerEmail}</p>
        </div>

        <div className="text-[13px]" style={{ color: '#6b6b6b' }}>
          <p className="mb-1 text-[12px] uppercase" style={{ letterSpacing: '0.06em' }}>
            Entrega
          </p>
          {method === 'shipping' ? (
            <p style={{ color: '#111111' }}>
              {street} {number}
              {floorApartment ? `, ${floorApartment}` : ''}, {city}, {province} (CP {postalCode})
            </p>
          ) : (
            <p style={{ color: '#111111' }}>Retira en el local</p>
          )}
          {customerNote && <p className="mt-1">Nota: {customerNote}</p>}
        </div>

        {store.showPrices && (
          <div className="flex flex-col gap-2" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1rem' }}>
            <div className="flex items-center justify-between text-[13px]" style={{ color: '#6b6b6b' }}>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {feeAmount > 0 && (
              <div className="flex items-center justify-between text-[13px]" style={{ color: '#6b6b6b' }}>
                <span>Comisión de servicio ({PLATFORM_FEE_PERCENTAGE}%)</span>
                <span>{formatPrice(feeAmount)}</span>
              </div>
            )}
            {method === 'shipping' && (
              <div className="flex items-center justify-between text-[13px]" style={{ color: '#6b6b6b' }}>
                <span>Envío</span>
                <span>
                  {quote?.isFree ? (
                    <>
                      <span style={{ color: '#16a34a' }}>Gratis</span>{' '}
                      <span style={{ textDecoration: 'line-through' }}>{formatPrice(quote.originalCost)}</span>
                    </>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between" style={{ paddingTop: '0.5rem', borderTop: '1px solid #f0f0ee' }}>
              <span className="text-[14px]" style={{ color: '#6b6b6b' }}>
                Total
              </span>
              <span className="text-[18px] font-medium" style={{ color: '#111111' }}>
                {formatPrice(total)}
              </span>
            </div>
          </div>
        )}

        {paymentMethod === 'transfer' && (
          <div className="p-4 text-[13px]" style={{ backgroundColor: '#f5f5f3', color: '#111111' }}>
            <p className="font-medium">Pagás por transferencia</p>
            <p className="mt-2" style={{ color: '#6b6b6b' }}>
              Al confirmar te mostramos el CBU/alias y a qué email mandar el comprobante. El
              pedido queda a la espera de que confirmemos que nos llegó el pago.
            </p>
          </div>
        )}

        {error && (
          <p className="text-[13px]" style={{ color: '#d81b8a' }}>
            {error}
          </p>
        )}

        {paymentMethod === 'transfer' ? (
          <button
            type="button"
            onClick={handleConfirmTransfer}
            disabled={paying}
            className="pc-btn w-full px-4 py-3 text-[14px] disabled:opacity-60"
          >
            {paying ? 'Confirmando...' : 'Confirmar pedido →'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePay}
            disabled={paying}
            className="pc-btn w-full px-4 py-3 text-[14px] disabled:opacity-60"
          >
            {paying ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago →'}
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleContinue} className="flex flex-col gap-8">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div className="sm:col-span-2">
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

      {/* Método de pago */}
      {store.mercadopagoAvailable && store.transferEnabled && (
        <div>
          <label className="block text-[12px] uppercase" style={labelStyle}>
            Cómo pagás
          </label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('mercadopago')}
              className="px-4 py-2 text-[13px]"
              style={{
                border: `1px solid ${paymentMethod === 'mercadopago' ? '#111111' : '#e5e5e5'}`,
                backgroundColor: paymentMethod === 'mercadopago' ? '#111111' : '#fff',
                color: paymentMethod === 'mercadopago' ? '#fff' : '#6b6b6b',
              }}
            >
              Mercado Pago
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className="px-4 py-2 text-[13px]"
              style={{
                border: `1px solid ${paymentMethod === 'transfer' ? '#111111' : '#e5e5e5'}`,
                backgroundColor: paymentMethod === 'transfer' ? '#111111' : '#fff',
                color: paymentMethod === 'transfer' ? '#fff' : '#6b6b6b',
              }}
            >
              Transferencia
            </button>
          </div>
        </div>
      )}

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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Calle"
              required
              className="px-4 py-3 text-[14px] outline-none sm:col-span-2"
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        <div className="flex flex-col gap-2" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1rem' }}>
          <div className="flex items-center justify-between text-[13px]" style={{ color: '#6b6b6b' }}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {feeAmount > 0 && (
            <div className="flex items-center justify-between text-[13px]" style={{ color: '#6b6b6b' }}>
              <span>Comisión de servicio ({PLATFORM_FEE_PERCENTAGE}%)</span>
              <span>{formatPrice(feeAmount)}</span>
            </div>
          )}
          {method === 'shipping' && quote && (
            <div className="flex items-center justify-between text-[13px]" style={{ color: '#6b6b6b' }}>
              <span>Envío</span>
              <span>{quote.isFree ? 'Gratis' : formatPrice(shippingCost)}</span>
            </div>
          )}
          <div className="flex items-center justify-between" style={{ paddingTop: '0.5rem', borderTop: '1px solid #f0f0ee' }}>
            <span className="text-[14px]" style={{ color: '#6b6b6b' }}>
              Total
            </span>
            <span className="text-[16px] font-medium" style={{ color: '#111111' }}>
              {formatPrice(total)}
            </span>
          </div>
        </div>
      )}

      {continueError && (
        <p className="text-[13px]" style={{ color: '#d81b8a' }}>
          {continueError}
        </p>
      )}

      <button
        type="submit"
        disabled={method === 'shipping' && !quote}
        className="pc-btn w-full px-4 py-3 text-[14px] disabled:opacity-60"
      >
        Confirmar →
      </button>
    </form>
  )
}
