'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveShippingCredentials,
  disconnectShippingCarrier,
  saveShippingOriginAddress,
  updateShippingSettings,
  updateFixedShippingZones,
  updatePickupInfo,
} from '@/app/admin/actions'
import { ARGENTINA_PROVINCES } from '@/lib/argentina-provinces'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Field, Toggle } from '@/components/admin/ui'
import { Plus, Store, Trash2, Truck } from 'lucide-react'

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
  // Dirección de la sucursal: es la que se muestra si la tienda no carga otra.
  branchAddress: string | null
  pickupAddress: string
  pickupHours: string
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
  branchAddress,
  pickupAddress,
  pickupHours,
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
  const [cliente, setCliente] = useState('')

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
  const [freeOn, setFreeOn] = useState(freeShippingThreshold != null)

  const [pickupAddr, setPickupAddr] = useState(pickupAddress)
  const [pickupHrs, setPickupHrs] = useState(pickupHours)
  const [savingPickup, setSavingPickup] = useState(false)

  const [savingCredentials, setSavingCredentials] = useState(false)
  const [savingOrigin, setSavingOrigin] = useState(false)
  const [savingEnabled, setSavingEnabled] = useState(false)
  const [savingThreshold, setSavingThreshold] = useState(false)
  const [savingMode, setSavingMode] = useState(false)
  const [savingZones, setSavingZones] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const hasOrigin = !!postalCode
  const canEnable = mode === 'carrier' ? connected && hasOrigin : defaultCost.trim() !== ''

  async function handleSavePickup(e: React.FormEvent) {
    e.preventDefault()
    setSavingPickup(true)
    setError('')
    setSaved('')
    try {
      await updatePickupInfo({ address: pickupAddr, hours: pickupHrs })
      setSaved('Datos de retiro guardados.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando los datos de retiro')
    } finally {
      setSavingPickup(false)
    }
  }

  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault()
    setSavingCredentials(true)
    setError('')
    setSaved('')
    try {
      const fields =
        selectedCarrier === 'correo_argentino'
          ? { userToken, passwordToken, customerId }
          : { username, password, contrato, cliente }

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

  function handleDisconnectClick() {
    if (!carrier) return
    setConfirmingDisconnect(true)
  }

  async function handleDisconnect() {
    if (!carrier) return
    setConfirmingDisconnect(false)
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

  async function handleFreeToggle(next: boolean) {
    if (next) {
      setFreeOn(true)
      return
    }
    setFreeOn(false)
    setThreshold('')
    setSavingThreshold(true)
    setError('')
    try {
      await updateShippingSettings({ enabled, freeShippingThreshold: null, pricingMode: mode })
      router.refresh()
    } catch (err) {
      setFreeOn(true)
      setError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setSavingThreshold(false)
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

  const usedProvinces = new Set(zones.map((z) => z.province))

  return (
    <div className="grid gap-3">
      <ConfirmDialog
        open={confirmingDisconnect}
        title="Desconectar transportista"
        message="El envío calculado se apaga hasta que conectes uno nuevo."
        confirmText="Desconectar"
        danger
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmingDisconnect(false)}
      />
      {error && (
        <div className="adm-alert" style={{ backgroundColor: 'var(--adm-bad-soft)', color: 'var(--adm-bad)' }}>
          {error}
        </div>
      )}
      {saved && !error && (
        <div className="adm-alert" style={{ backgroundColor: 'var(--adm-ok-soft)', color: 'var(--adm-ok)' }}>
          {saved}
        </div>
      )}

      {/* Retiro: siempre disponible, no se apaga. */}
      <section className="adm-card">
        <div className="flex items-center gap-3 px-4 pt-4 md:px-5">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[11px]" style={{ backgroundColor: '#f1f1ee' }}>
            <Store className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold">Retiro en el local</h3>
            <p className="text-[13px]" style={{ color: 'var(--adm-muted)' }}>
              Siempre disponible. Tus clientes ven esta dirección y horario en la tienda.
            </p>
          </div>
          <span className="adm-badge adm-b-ok">Activo</span>
        </div>
        <form onSubmit={handleSavePickup} className="grid gap-3 px-4 pb-4 pt-3 md:grid-cols-[1fr_1fr_auto] md:items-end md:px-5">
          <Field label="Dirección">
            <input
              value={pickupAddr}
              onChange={(e) => setPickupAddr(e.target.value)}
              placeholder={branchAddress ?? 'Ej: Av. Corrientes 1234, CABA'}
              className="adm-input"
            />
          </Field>
          <Field label="Horario (opcional)">
            <input value={pickupHrs} onChange={(e) => setPickupHrs(e.target.value)} placeholder="Ej: Lun a vie de 10 a 19 h" className="adm-input" />
          </Field>
          <button type="submit" disabled={savingPickup} className="adm-btn adm-btn-pri w-fit">
            {savingPickup ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
        {branchAddress && !pickupAddr.trim() && (
          <p className="px-4 pb-4 text-[12px] md:px-5" style={{ color: 'var(--adm-muted)' }}>
            Si la dejás vacía se muestra la de tu sucursal: {branchAddress}.
          </p>
        )}
      </section>

      {/* Envío a domicilio */}
      <section className="adm-card">
        <div className="flex items-start gap-3 px-4 pt-4 md:px-5">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[11px]" style={{ backgroundColor: 'var(--adm-info-soft)', color: 'var(--adm-info)' }}>
            <Truck className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold">Envío a domicilio</h3>
            <p className="text-[13px]" style={{ color: 'var(--adm-muted)' }}>Elegí cómo se calcula lo que paga el cliente.</p>
          </div>
          <Toggle checked={enabled} disabled={(!canEnable && !enabled) || savingEnabled} onChange={handleToggleEnabled} label="Envío a domicilio" />
        </div>
        {!canEnable && !enabled && (
          <p className="px-4 pt-2 text-[12px] md:px-5" style={{ color: 'var(--adm-warn)' }}>
            {mode === 'carrier'
              ? 'Para activarlo, conectá un transportista y guardá la dirección de origen.'
              : 'Para activarlo, cargá y guardá el costo para el resto del país.'}
          </p>
        )}

        <div className="grid gap-4 p-4 md:p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['fixed_zones', 'Precio fijo por provincia', 'Vos ponés cuánto cuesta. No hace falta cuenta en el correo.'],
                ['carrier', 'Lo calcula el correo', 'Correo Argentino o Andreani cotizan según peso y destino.'],
              ] as const
            ).map(([m, title, desc]) => (
              <button
                key={m}
                type="button"
                onClick={() => mode !== m && handleModeChange(m)}
                disabled={savingMode}
                className="flex items-start gap-3 rounded-[12px] p-3.5 text-left disabled:opacity-60"
                style={{ border: mode === m ? '1.5px solid var(--adm-ink)' : '1px solid var(--adm-line)' }}
              >
                <span
                  className="mt-0.5 grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-full"
                  style={{ border: mode === m ? '5px solid var(--adm-ink)' : '1.5px solid #c9c9c4' }}
                />
                <span>
                  <span className="block text-[14px] font-medium">{title}</span>
                  <span className="block text-[12.5px] leading-snug" style={{ color: 'var(--adm-muted)' }}>{desc}</span>
                </span>
              </button>
            ))}
          </div>

          {mode === 'fixed_zones' && (
            <form onSubmit={handleSaveZones} className="grid gap-3">
              <div className="overflow-hidden rounded-[12px]" style={{ border: '1px solid var(--adm-line)' }}>
                <div className="grid grid-cols-[minmax(0,1fr)_100px_32px] gap-2 px-3 py-2 text-[12px] sm:grid-cols-[minmax(0,1fr)_160px_36px]" style={{ backgroundColor: '#fafaf8', color: 'var(--adm-muted)' }}>
                  <span>Provincia</span>
                  <span>Costo</span>
                  <span />
                </div>
                {zones.map((z, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,1fr)_100px_32px] items-center gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_160px_36px]" style={{ borderTop: '1px solid var(--adm-line2)' }}>
                    <select value={z.province} onChange={(e) => updateZoneField(i, 'province', e.target.value)} className="adm-input min-w-0 !py-2">
                      <option value="">Elegir provincia</option>
                      {ARGENTINA_PROVINCES.filter((p) => p === z.province || !usedProvinces.has(p)).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <MoneyField value={z.cost} onChange={(v) => updateZoneField(i, 'cost', v)} />
                    <button type="button" onClick={() => removeZone(i)} className="adm-btn adm-btn-ghost adm-btn-sm !px-2" aria-label="Quitar provincia">
                      <Trash2 />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-[minmax(0,1fr)_100px_32px] items-center gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_160px_36px]" style={{ borderTop: '1px solid var(--adm-line2)' }}>
                  <span className="text-[14px]" style={{ color: 'var(--adm-muted)' }}>
                    Resto del país
                  </span>
                  <MoneyField value={defaultCost} onChange={setDefaultCost} required />
                  <span />
                </div>
                <button type="button" onClick={addZone} className="flex w-full items-center gap-2 px-3 py-3 text-[13px] font-medium" style={{ borderTop: '1px solid var(--adm-line2)' }}>
                  <Plus className="h-4 w-4" />
                  Agregar provincia con otro precio
                </button>
              </div>
              <button type="submit" disabled={savingZones} className="adm-btn adm-btn-pri w-fit">
                {savingZones ? 'Guardando…' : 'Guardar precios'}
              </button>
            </form>
          )}

          {mode === 'carrier' && (
            <div className="grid gap-4">
              <div className="rounded-[12px] p-3.5" style={{ border: '1px solid var(--adm-line)' }}>
                <p className="adm-label">Transportista</p>
                {connected ? (
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium">
                        {carrier === 'andreani' ? 'Andreani' : 'Correo Argentino'}
                        {environment === 'test' && <span className="adm-badge adm-b-warn ml-2">Prueba</span>}
                      </p>
                      {displayLabel && <p className="text-[12px]" style={{ color: 'var(--adm-muted)' }}>{displayLabel}</p>}
                    </div>
                    <button type="button" onClick={handleDisconnectClick} disabled={disconnecting} className="adm-btn adm-btn-sm">
                      {disconnecting ? 'Desconectando…' : 'Desconectar'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveCredentials} className="grid gap-3">
                    <div className="flex gap-2">
                      {(['correo_argentino', 'andreani'] as const).map((c) => (
                        <button key={c} type="button" onClick={() => setSelectedCarrier(c)} className="adm-chip" data-on={selectedCarrier === c}>
                          {c === 'andreani' ? 'Andreani' : 'Correo Argentino'}
                        </button>
                      ))}
                    </div>
                    <div className="rounded-[10px] p-3 text-[13px]" style={{ backgroundColor: '#f6f6f4' }}>
                      <p className="font-medium">¿No tenés estos datos todavía?</p>
                      {selectedCarrier === 'correo_argentino' ? (
                        <p className="mt-1" style={{ color: 'var(--adm-muted)' }}>
                          Pedí el alta como cliente con contrato en{' '}
                          <a href="https://integracion.correoargentino.com.ar" target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--adm-ink)' }}>
                            integracion.correoargentino.com.ar
                          </a>{' '}
                          (o en cualquier sucursal comercial). Te dan User Token, Password Token y Customer ID: los tres campos de abajo.
                        </p>
                      ) : (
                        <p className="mt-1" style={{ color: 'var(--adm-muted)' }}>
                          No salen de la sección Integraciones de andreani.com (esa solo ofrece WooCommerce y Tiendanube). Pedíselos a tu ejecutivo comercial de Andreani: acceso a la API con usuario y contraseña, código de contrato de envío a domicilio y número de cliente. Si te dan primero los de prueba (QA), cargalos y marcá la casilla.
                        </p>
                      )}
                    </div>
                    {selectedCarrier === 'correo_argentino' ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input value={userToken} onChange={(e) => setUserToken(e.target.value)} placeholder="User Token" required className="adm-input" />
                        <input type="password" value={passwordToken} onChange={(e) => setPasswordToken(e.target.value)} placeholder="Password Token" required className="adm-input" />
                        <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer ID" required className="adm-input sm:col-span-2" />
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuario" required className="adm-input" />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required className="adm-input" />
                        <input value={contrato} onChange={(e) => setContrato(e.target.value)} placeholder="Código de contrato" required className="adm-input" />
                        <input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Número de cliente (ej. CL0001234)" className="adm-input" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--adm-muted)' }}>
                      <input
                        type="checkbox"
                        checked={selectedEnvironment === 'test'}
                        onChange={(e) => setSelectedEnvironment(e.target.checked ? 'test' : 'production')}
                        className="adm-check"
                      />
                      Son credenciales de prueba
                    </label>
                    <button type="submit" disabled={savingCredentials} className="adm-btn adm-btn-pri w-fit">
                      {savingCredentials ? 'Conectando…' : 'Conectar transportista'}
                    </button>
                  </form>
                )}
              </div>

              <form onSubmit={handleSaveOrigin} className="grid gap-3 rounded-[12px] p-3.5" style={{ border: '1px solid var(--adm-line)' }}>
                <div>
                  <p className="adm-label !mb-0">Desde dónde despachás</p>
                  <p className="text-[12px]" style={{ color: 'var(--adm-muted)' }}>El correo cotiza desde esta dirección.</p>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3 sm:grid-cols-[minmax(0,1fr)_120px_160px]">
                  <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Calle" required className="adm-input" />
                  <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Número" required className="adm-input" />
                  <input value={floorApartment} onChange={(e) => setFloorApartment(e.target.value)} placeholder="Piso / depto" className="adm-input col-span-2 sm:col-span-1" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Localidad" required className="adm-input" />
                  <select value={province} onChange={(e) => setProvince(e.target.value)} required className="adm-input">
                    <option value="">Provincia</option>
                    {ARGENTINA_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Código postal" required className="adm-input" />
                </div>
                <button type="submit" disabled={savingOrigin} className="adm-btn w-fit">
                  {savingOrigin ? 'Guardando…' : 'Guardar dirección'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Envío gratis */}
      <section className="adm-card">
        <div className="flex items-start gap-3 px-4 py-4 md:px-5">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold">Envío gratis</h3>
            <p className="text-[13px]" style={{ color: 'var(--adm-muted)' }}>Para compras desde cierto monto. El envío lo absorbés vos y ayuda a que compren más.</p>
          </div>
          <Toggle checked={freeOn} disabled={savingThreshold} onChange={handleFreeToggle} label="Envío gratis" />
        </div>
        {freeOn && (
          <form onSubmit={handleSaveThreshold} className="flex flex-wrap items-end gap-3 px-4 pb-4 md:px-5">
            <Field label="Gratis desde" className="w-[200px]">
              <MoneyField value={threshold} onChange={setThreshold} required />
            </Field>
            <button type="submit" disabled={savingThreshold} className="adm-btn adm-btn-pri">
              {savingThreshold ? 'Guardando…' : 'Guardar'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}

function MoneyField({ value, onChange, required }: { value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="relative min-w-0">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: 'var(--adm-soft)' }}>
        $
      </span>
      <input
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder="0"
        className="adm-input !py-2 !pl-6"
      />
    </div>
  )
}
