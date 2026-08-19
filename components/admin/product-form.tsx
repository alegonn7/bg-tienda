'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/products'
import { createProduct, updateProduct } from '@/app/admin/actions'

type Item = { id: string; name: string }

type Props = {
  product?: Product
  categories: Item[]
  sizes: Item[]
  organizationId: string
}

export function ProductForm({ product, categories, sizes: availableSizes, organizationId }: Props) {
  const isEdit = !!product
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? [])
  const [active, setActive] = useState(product?.active ?? true)
  const [price, setPrice] = useState(product?.price?.toString() ?? '0')
  const [stock, setStock] = useState(product?.stock?.toString() ?? '0')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleSize(name: string) {
    setSizes((prev) => (prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    setError('')

    const urls: string[] = []

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const filename = `${organizationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('store-product-images')
        .upload(filename, file)

      if (uploadError) {
        setError(`Error subiendo imagen: ${uploadError.message}`)
        setUploading(false)
        return
      }

      const { data } = supabase.storage.from('store-product-images').getPublicUrl(filename)
      urls.push(data.publicUrl)
    }

    setImages((prev) => [...prev, ...urls])
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const data = {
        name,
        categoryId,
        description,
        images,
        sizes,
        active,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
      }
      if (isEdit && product?.productBranchId) {
        await updateProduct(product.id, product.productBranchId, data)
      } else {
        await createProduct(data)
      }
      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando producto')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Nombre */}
      <div>
        <label className="block text-[12px] uppercase" style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}>
          Nombre *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Chapita redonda 25mm"
          className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
          style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff', color: '#111111' }}
        />
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-[12px] uppercase" style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}>
          Categoría *
        </label>
        {categories.length === 0 ? (
          <p className="mt-2 text-[13px]" style={{ color: '#d81b8a' }}>
            No hay categorías creadas. Andá a{' '}
            <a href="/admin/categorias" style={{ textDecoration: 'underline' }}>
              Categorías
            </a>{' '}
            y agregá algunas primero.
          </p>
        ) : (
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
            style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff', color: '#111111' }}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-[12px] uppercase" style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}>
          Descripción
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Descripción del producto..."
          className="mt-2 w-full resize-none px-4 py-3 text-[15px] outline-none"
          style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff', color: '#111111' }}
        />
      </div>

      {/* Precio y stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] uppercase" style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}>
            Precio
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
            style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff', color: '#111111' }}
          />
        </div>
        <div>
          <label className="block text-[12px] uppercase" style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}>
            Stock
          </label>
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
            style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff', color: '#111111' }}
          />
        </div>
      </div>

      {/* Tamaños: se eligen de la lista de la organización (/admin/tamanos), no texto libre —
          así el mismo tamaño se llama siempre igual y el filtro de la tienda funciona. */}
      <div>
        <label className="block text-[12px] uppercase" style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}>
          Tamaños disponibles
        </label>
        {availableSizes.length === 0 ? (
          <p className="mt-2 text-[13px]" style={{ color: '#d81b8a' }}>
            No hay tamaños creados. Andá a{' '}
            <a href="/admin/tamanos" style={{ textDecoration: 'underline' }}>
              Tamaños
            </a>{' '}
            y agregá algunos primero.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const isSelected = sizes.includes(size.name)
              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => toggleSize(size.name)}
                  className="px-4 py-2 text-[13px]"
                  style={{
                    border: `1px solid ${isSelected ? '#111111' : '#e5e5e5'}`,
                    backgroundColor: isSelected ? '#111111' : '#fff',
                    color: isSelected ? '#fff' : '#6b6b6b',
                  }}
                >
                  {size.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Imágenes */}
      <div>
        <label className="block text-[12px] uppercase" style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}>
          Imágenes
        </label>

        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={url} className="relative">
                {i === 0 && (
                  <span
                    className="absolute left-1 top-1 z-10 px-1.5 py-0.5 text-[10px] uppercase"
                    style={{ backgroundColor: '#111111', color: '#fff', letterSpacing: '0.04em' }}
                  >
                    Principal
                  </span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Imagen ${i + 1}`}
                  className="h-20 w-20 object-cover"
                  style={{ border: '1px solid #e5e5e5' }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center text-[11px]"
                  style={{ backgroundColor: '#d81b8a', color: '#fff', borderRadius: '50%' }}
                  aria-label="Quitar imagen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-[13px]"
            style={{
              border: '1px solid #e5e5e5',
              color: uploading ? '#6b6b6b' : '#111111',
              backgroundColor: '#fff',
            }}
          >
            {uploading ? 'Subiendo...' : '+ Agregar imágenes'}
          </label>
          <p className="mt-2 text-[12px]" style={{ color: '#6b6b6b' }}>
            La primera imagen será la principal. Podés subir varias a la vez.
          </p>
        </div>
      </div>

      {/* Activo */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4"
          style={{ accentColor: '#d81b8a' }}
        />
        <label htmlFor="active" className="text-[14px]" style={{ color: '#111111' }}>
          Producto activo (visible en la tienda)
        </label>
      </div>

      {error && (
        <p className="text-[13px]" style={{ color: '#d81b8a' }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-4 pt-4" style={{ borderTop: '1px solid #e5e5e5' }}>
        <button
          type="submit"
          disabled={saving || uploading}
          className="pc-btn px-6 py-3 text-[14px] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios →' : 'Crear producto →'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[13px]"
          style={{ color: '#6b6b6b' }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
