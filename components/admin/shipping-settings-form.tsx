'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveShippingCredentials,
  disconnectShippingCarrier,
  saveShippingOriginAddress,
  updateShippingSettings,
  updateFixedShippingZones,
} from '@/app/admin/actions'
import { ARGENTINA_PROVINCES } from '@/lib/argentina-provinces'

const inputStyle = {
  border: '1px solid #e5e5e5',
  backgroundColor: '#fff',
  color: '#111111',
} as const

const labelStyle = { letterSpacing: '0.06em', color: '#6b6b6b' } as const

function parseThreshold(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

type Carrier = 'correo_argentino' | 'andreani'
type PricingMode = 'carrier' | 'fixed_zones'

type OriginAddress = {
  shipping_origin_street: string | null
  shipping_origin_number: string | null
  shipping_origin_floor_apartment: string | null
  shipping_origin_city: string | null
  shipping_origin_province: string | null
  shipping_origin_postal_code: string | null
}

type Props = {
  connected: boolean
  carrier: Carrier | null
  displayLabel: string | null
  environment: 'test' | 'production' | null
  origin: OriginAddress | null
  shippingEnabled: boolean
  freeShippingThreshold: number | null
  pricingMode: PricingMode
  fixedShippingDefaultCost: number | null
  fixedShippingZones: { province: string; cost: number }[]
}

export function ShippingSettingsForm({
  connected,
  carrier,
  displayLabel,
  environment,
  origin,
  shippingEnabled,
  freeShippingThreshold,
  pricingMode,
  fixedShippingDefaultCost,
  fixedShippingZones,
}: Props) {
  const router = useRouter()

  const [mode, setMode] = useState<PricingMode>(pricingMode)

  const [selectedCarrier, setSelectedCarrier] = useState<Carrier>(carrier ?? 'correo_argentino')
  const [selectedEnvironment, setSelectedEnvironment] = useState<'test' | 'production'>(environment ?? 'production')
  const [label, setLabel] = useState(displayLabel ?? '')

  // Correo Argentino
  const [userToken, setUserToken] = useState('')
  const [passwordToken, setPasswordToken] = useState('')
  const [customerId, setCustomerId] = useState('')

  // Andreani
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [contrato, setContrato] = useState('')

  const [street, setStreet] = useState(origin?.shipping_origin_street ?? '')
  const [number, setNumber] = useState(origin?.shipping_origin_number ?? '')
  const [floorApartment, setFloorApartment] = useState(origin?.shipping_origin_floor_apartment ?? '')
  const [city, setCity] = useState(origin?.shipping_origin_city ?? '')
  const [province, setProvince] = useState(origin?.shipping_origin_province ?? '')
  const [postalCode, setPostalCode] = useState(origin?.shipping_origin_postal_code ?? '')

  // Montos fijos por zona
  const [defaultCost, setDefaultCost] = useState(fixedShippingDefaultCost != null ? String(fixedShippingDefaultCost) : '')
  const [zones, setZones] = useState<{ province: string; cost: string }[]>(
    fixedShippingZones.map((z) => ({ province: z.province, cost: String(z.cost) })),
  )

  const [enabled, setEnabled] = useState(shippingEnabled)
  const [threshold, setThreshold] = useState(freeShippingThreshold != null ? String(freeShippingThreshold) : '')

  const [savingCredentials, setSavingCredentials] = useState(false)
  const [savingOrigin, setSavingOrigin] = useState(false)
  const [savingEnabled, setSavingEnabled] = useState(false)
  const [savingThreshold, setSavingThreshold] = useState(false)
  const [savingMode, setSavingMode] = useState(false)
  const [savingZones, setSavingZones] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const hasOrigin = !!postalCode
  const canEnable = mode === 'carrier' ? connected && hasOrigin : defaultCost.trim() !== ''

  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault()
    setSavingCredentials(true)
    setError('')
    setSaved('')
    try {
      const fields =
        selectedCarrier === 'correo_argentino'
          ? { userToken, passwordToken, customerId }
          : { username, password, contrato }

      await saveShippingCredentials({
        carrier: selectedCarrier,
        environment: selectedEnvironment,
        displayLabel: label || undefined,
        ...fields,
      })
      setSaved('Transportista conectado.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error conectando el transportista')
    } finally {
      setSavingCredentials(false)
    }
  }

  async function handleDisconnect() {
    if (!carrier) return
    if (!confirm('¿Desconectar este transportista? El envío calculado se apaga hasta que conectes uno nuevo.')) return
    setDisconnecting(true)
    setError('')
    try {
      await disconnectShippingCarrier(carrier)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desconectar')
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleSaveOrigin(e: React.FormEvent) {
    e.preventDefault()
    setSavingOrigin(true)
    setError('')
    setSaved('')
    try {
      await saveShippingOriginAddress({ street, number, floorApartment, city, province, postalCode })
      setSaved('Dirección de origen guardada.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando la dirección')
    } finally {
      setSavingOrigin(false)
    }
  }

  async function handleToggleEnabled(next: boolean) {
    setEnabled(next)
    setSavingEnabled(true)
    setError('')
    try {
      await updateShippingSettings({ enabled: next, freeShippingThreshold: parseThreshold(threshold), pricingMode: mode })
      router.refresh()
    } catch (err) {
      setEnabled(!next)
      setError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setSavingEnabled(false)
    }
  }

  async function handleSaveThreshold(e: React.FormEvent) {
    e.preventDefault()
    setSavingThreshold(true)
    setError('')
    setSaved('')
    try {
      const parsed = parseThreshold(threshold)
      if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) {
        throw new Error('Tiene que ser un número positivo.')
      }
      await updateShippingSettings({ enabled, freeShippingThreshold: parsed, pricingMode: mode })
      setSaved('Guardado.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setSavingThreshold(false)
    }
  }

  async function handleModeChange(next: PricingMode) {
    const prev = mode
    setMode(next)
    setSavingMode(true)
    setError('')
    try {
      await updateShippingSettings({ enabled, freeShippingThreshold: parseThreshold(threshold), pricingMode: next })
      router.refresh()
    } catch (err) {
      setMode(prev)
      setError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setSavingMode(false)
    }
  }

  function addZone() {
    setZones((prev) => [...prev, { province: '', cost: '' }])
  }

  function removeZone(index: number) {
    setZones((prev) => prev.filter((_, i) => i !== index))
  }

  function updateZoneField(index: number, field: 'province' | 'cost', value: string) {
    setZones((prev) => prev.map((z, i) => (i === index ? { ...z, [field]: value } : z)))
  }

  async function handleSaveZones(e: React.FormEvent) {
    e.preventDefault()
    setSavingZones(true)
    setError('')
    setSaved('')
    try {
      const parsedDefault = defaultCost.trim() === '' ? null : Number(defaultCost)
      if (parsedDefault != null && (Number.isNaN(parsedDefault) || parsedDefault < 0)) {
        throw new Error('El costo por defecto tiene que ser un número positivo.')
      }

      const validZones = zones
        .filter((z) => z.province.trim())
        .map((z) => {
          const cost = Number(z.cost)
          if (Number.isNaN(cost) || cost < 0) {
            throw new Error(`El costo para ${z.province} tiene que ser un número positivo.`)
          }
          return { province: z.province, cost }
        })

      await updateFixedShippingZones({ defaultCost: parsedDefault, zones: validZones })
      setSaved('Guardado.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setSavingZones(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <p className="text-[13px]" style={{ color: '#d81b8a' }}>
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-[13px]" style={{ color: '#16a34a' }}>
          {saved}
        </p>
      )}

      {/* Modo de cálculo */}
      <div>
        <label className="block text-[12px] uppercase" style={labelStyle}>
          Cómo calculás el costo de envío
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['carrier', 'fixed_zones'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              disabled={savingMode}
              className="px-4 py-2 text-[13px] disabled:opacity-60"
              style={{
                border: `1px solid ${mode === m ? '#111111' : '#e5e5e5'}`,
                backgroundColor: mode === m ? '#111111' : '#fff',
                color: mode === m ? '#fff' : '#6b6b6b',
              }}
            >
              {m === 'carrier' ? 'Automático (Correo Argentino / Andreani)' : 'Montos fijos por provincia'}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px]" style={{ color: '#6b6b6b' }}>
          {mode === 'carrier'
            ? 'Cotiza en tiempo real contra el transportista que conectes — necesita credenciales propias de tu cuenta con ellos.'
            : 'Vos definís cuánto cobrar según la provincia de destino, sin conectar ningún transportista.'}
        </p>
      </div>

      {mode === 'carrier' && (
        <>
          {/* Transportista */}
          <div>
            <label className="block text-[12px] uppercase" style={labelStyle}>
              Transportista
            </label>

            {connected ? (
              <div className="mt-3 flex items-center justify-between p-4" style={{ border: '1px solid #e5e5e5' }}>
                <div>
                  <p className="text-[14px]" style={{ color: '#111111' }}>
                    {carrier === 'andreani' ? 'Andreani' : 'Correo Argentino'}
                    {environment === 'test' && ' (prueba)'}
                  </p>
                  {displayLabel && (
                    <p className="text-[12px]" style={{ color: '#6b6b6b' }}>
                      {displayLabel}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-[13px] disabled:opacity-60"
                  style={{ color: '#6b6b6b' }}
                >
                  {disconnecting ? 'Desconectando...' : 'Desconectar'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveCredentials} className="mt-3 flex flex-col gap-4">
                <div className="flex gap-2">
                  {(['correo_argentino', 'andreani'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCarrier(c)}
                      className="px-4 py-2 text-[13px]"
                      style={{
                        border: `1px solid ${selectedCarrier === c ? '#111111' : '#e5e5e5'}`,
                        backgroundColor: selectedCarrier === c ? '#111111' : '#fff',
                        color: selectedCarrier === c ? '#fff' : '#6b6b6b',
                      }}
                    >
                      {c === 'andreani' ? 'Andreani' : 'Correo Argentino'}
                    </button>
                  ))}
                </div>

                <div className="p-4 text-[13px]" style={{ backgroundColor: '#f5f5f3', color: '#111111' }}>
                  {selectedCarrier === 'correo_argentino' ? (
                    <>
                      <p className="font-medium">¿No tenés estos datos todavía?</p>
                      <p className="mt-1" style={{ color: '#6b6b6b' }}>
                        Pedí el alta como cliente con contrato en{' '}
                        <a
                          href="https://integracion.correoargentino.com.ar"
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#111111', textDecoration: 'underline' }}
                        >
                          integracion.correoargentino.com.ar
                        </a>{' '}
                        (o en cualquier sucursal comercial). Te van a dar tres datos — User Token,
                        Password Token y Customer ID — que son exactamente los tres campos de abajo.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">¿No tenés estos datos todavía?</p>
                      <p className="mt-1" style={{ color: '#6b6b6b' }}>
                        Date de alta como Andreani PyME con acceso a la API en{' '}
                        <a
                          href="https://pymes.andreani.com/integraciones"
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#111111', textDecoration: 'underline' }}
                        >
                          pymes.andreani.com/integraciones
                        </a>
                        . Te van a dar Usuario, Contraseña y un Código de contrato — los tres campos
                        de abajo.
                      </p>
                    </>
                  )}
                </div>

                {selectedCarrier === 'correo_argentino' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={userToken}
                      onChange={(e) => setUserToken(e.target.value)}
                      placeholder="User Token"
                      required
                      className="px-4 py-3 text-[14px] outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="password"
                      value={passwordToken}
                      onChange={(e) => setPasswordToken(e.target.value)}
                      placeholder="Password Token"
                      required
                      className="px-4 py-3 text-[14px] outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      placeholder="Customer ID"
                      required
                      className="px-4 py-3 text-[14px] outline-none sm:col-span-2"
                      style={inputStyle}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Usuario"
                      required
                      className="px-4 py-3 text-[14px] outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Contraseña"
                      required
                      className="px-4 py-3 text-[14px] outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      value={contrato}
                      onChange={(e) => setContrato(e.target.value)}
                      placeholder="Código de contrato"
                      required
                      className="px-4 py-3 text-[14px] outline-none sm:col-span-2"
                      style={inputStyle}
                    />
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <label className="text-[13px]" style={{ color: '#6b6b6b' }}>
                    <input
                      type="checkbox"
                      checked={selectedEnvironment === 'test'}
                      onChange={(e) => setSelectedEnvironment(e.target.checked ? 'test' : 'production')}
                      className="mr-2 h-4 w-4"
                    />
                    Son credenciales de prueba
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={savingCredentials}
                  className="pc-btn w-fit px-6 py-3 text-[14px] disabled:opacity-60"
                >
                  {savingCredentials ? 'Conectando...' : 'Conectar transportista →'}
                </button>
              </form>
            )}
          </div>

          {/* Dirección de origen */}
          <div>
            <label className="block text-[12px] uppercase" style={labelStyle}>
              Dirección de origen (desde dónde se despacha)
            </label>
            <form onSubmit={handleSaveOrigin} className="mt-3 flex flex-col gap-3">
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
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Código postal"
                  required
                  className="px-4 py-3 text-[14px] outline-none"
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={savingOrigin}
                className="w-fit px-6 py-3 text-[14px] disabled:opacity-60"
                style={{ border: '1px solid #111111', color: '#111111', backgroundColor: '#fff' }}
              >
                {savingOrigin ? 'Guardando...' : 'Guardar dirección →'}
              </button>
            </form>
          </div>
        </>
      )}

      {mode === 'fixed_zones' && (
        <div>
          <label className="block text-[12px] uppercase" style={labelStyle}>
            Montos fijos de envío
          </label>
          <form onSubmit={handleSaveZones} className="mt-3 flex flex-col gap-4">
            <div>
              <p className="text-[13px]" style={{ color: '#111111' }}>
                Costo por defecto
              </p>
              <input
                type="number"
                min={0}
                step="0.01"
                value={defaultCost}
                onChange={(e) => setDefaultCost(e.target.value)}
                placeholder="Ej: 3000"
                required
                className="mt-2 max-w-[220px] px-4 py-3 text-[15px] outline-none"
                style={inputStyle}
              />
              <p className="mt-1 text-[12px]" style={{ color: '#6b6b6b' }}>
                Se cobra para cualquier provincia que no tenga un monto propio abajo.
              </p>
            </div>

            {zones.length > 0 && (
              <div className="flex flex-col gap-2">
                {zones.map((z, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <select
                      value={z.province}
                      onChange={(e) => updateZoneField(i, 'province', e.target.value)}
                      className="min-w-[160px] flex-1 px-4 py-2.5 text-[14px] outline-none"
                      style={inputStyle}
                    >
                      <option value="">Elegir provincia</option>
                      {ARGENTINA_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={z.cost}
                      onChange={(e) => updateZoneField(i, 'cost', e.target.value)}
                      placeholder="Costo"
                      className="w-[140px] px-4 py-2.5 text-[14px] outline-none"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => removeZone(i)}
                      className="text-[13px]"
                      style={{ color: '#6b6b6b' }}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addZone}
              className="w-fit text-[13px]"
              style={{ color: '#111111', textDecoration: 'underline' }}
            >
              + Agregar provincia con costo distinto
            </button>

            <button
              type="submit"
              disabled={savingZones}
              className="w-fit px-6 py-3 text-[14px] disabled:opacity-60"
              style={{ border: '1px solid #111111', color: '#111111', backgroundColor: '#fff' }}
            >
              {savingZones ? 'Guardando...' : 'Guardar montos →'}
            </button>
          </form>
        </div>
      )}

      {/* Envío gratis a partir de un monto */}
      <div>
        <label className="block text-[12px] uppercase" style={labelStyle}>
          Envío gratis a partir de (opcional)
        </label>
        <form onSubmit={handleSaveThreshold} className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            step="0.01"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="Dejalo vacío para nunca absorber el envío"
            className="max-w-[320px] flex-1 px-4 py-3 text-[15px] outline-none"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={savingThreshold}
            className="px-4 py-3 text-[13px] disabled:opacity-60"
            style={{ border: '1px solid #111111', color: '#111111', backgroundColor: '#fff' }}
          >
            {savingThreshold ? 'Guardando...' : 'Guardar →'}
          </button>
        </form>
        <p className="mt-1 text-[12px]" style={{ color: '#6b6b6b' }}>
          Si el subtotal del carrito llega a este monto, el envío le sale gratis al cliente y lo
          absorbés vos. Vacío = el cliente siempre paga el envío calculado.
        </p>
      </div>

      {/* Habilitar */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="shipping_enabled"
          checked={enabled}
          disabled={!canEnable || savingEnabled}
          onChange={(e) => handleToggleEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        <label
          htmlFor="shipping_enabled"
          className="text-[14px]"
          style={{ color: canEnable ? '#111111' : '#6b6b6b' }}
        >
          Habilitar envío calculado en la tienda
        </label>
      </div>
      {!canEnable && (
        <p className="text-[12px]" style={{ color: '#6b6b6b' }}>
          {mode === 'carrier'
            ? 'Para habilitar esto primero conectá un transportista y guardá la dirección de origen (con código postal).'
            : 'Para habilitar esto primero cargá y guardá un costo de envío por defecto.'}
        </p>
      )}
    </div>
  )
}
