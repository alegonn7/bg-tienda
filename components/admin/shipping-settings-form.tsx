'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveShippingCredentials,
  disconnectShippingCarrier,
  saveShippingOriginAddress,
  updateShippingSettings,
} from '@/app/admin/actions'
import { ARGENTINA_PROVINCES } from '@/lib/argentina-provinces'

const inputStyle = {
  border: '1px solid #e5e5e5',
  backgroundColor: '#fff',
  color: '#111111',
} as const

const labelStyle = { letterSpacing: '0.06em', color: '#6b6b6b' } as const

type Carrier = 'correo_argentino' | 'andreani'

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
}

export function ShippingSettingsForm({ connected, carrier, displayLabel, environment, origin, shippingEnabled }: Props) {
  const router = useRouter()

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

  const [enabled, setEnabled] = useState(shippingEnabled)

  const [savingCredentials, setSavingCredentials] = useState(false)
  const [savingOrigin, setSavingOrigin] = useState(false)
  const [savingEnabled, setSavingEnabled] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const hasOrigin = !!postalCode

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
      await updateShippingSettings({ enabled: next })
      router.refresh()
    } catch (err) {
      setEnabled(!next)
      setError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setSavingEnabled(false)
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
              <div className="grid grid-cols-2 gap-3">
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
                  className="col-span-2 px-4 py-3 text-[14px] outline-none"
                  style={inputStyle}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
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
                  className="col-span-2 px-4 py-3 text-[14px] outline-none"
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

      {/* Habilitar */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="shipping_enabled"
          checked={enabled}
          disabled={!connected || !hasOrigin || savingEnabled}
          onChange={(e) => handleToggleEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        <label
          htmlFor="shipping_enabled"
          className="text-[14px]"
          style={{ color: connected && hasOrigin ? '#111111' : '#6b6b6b' }}
        >
          Habilitar envío calculado en la tienda
        </label>
      </div>
      {(!connected || !hasOrigin) && (
        <p className="text-[12px]" style={{ color: '#6b6b6b' }}>
          Para habilitar esto primero conectá un transportista y guardá la dirección de origen (con código postal).
        </p>
      )}
    </div>
  )
}
