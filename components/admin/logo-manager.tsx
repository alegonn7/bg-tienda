'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateStoreLogo } from '@/app/admin/actions'

export function LogoManager({ current, organizationId }: { current: string | null; organizationId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(current)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const filename = `${organizationId}/logo.${ext}`

    await supabase.storage.from('store-product-images').remove([filename])

    const { error: uploadError } = await supabase.storage
      .from('store-product-images')
      .upload(filename, file, { upsert: true })

    if (uploadError) {
      setError(`Error subiendo el logo: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('store-product-images').getPublicUrl(filename)
    const url = `${data.publicUrl}?t=${Date.now()}`

    try {
      await updateStoreLogo(data.publicUrl)
      setPreview(url)
      if (fileRef.current) fileRef.current.value = ''
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando el logo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-start gap-8">
      <div
        className="flex h-24 w-24 flex-shrink-0 items-center justify-center"
        style={{ border: '1px solid #e5e5e5', backgroundColor: '#fafaf9' }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Logo actual" className="h-16 w-16 object-contain" />
        ) : (
          <span className="text-[12px]" style={{ color: '#6b6b6b' }}>Sin logo</span>
        )}
      </div>

      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg"
          onChange={handleUpload}
          className="hidden"
          id="logo-upload"
        />
        <label
          htmlFor="logo-upload"
          className="inline-flex cursor-pointer items-center px-4 py-2.5 text-[13px]"
          style={{ border: '1px solid #e5e5e5', color: uploading ? '#6b6b6b' : '#111111', backgroundColor: '#fff' }}
        >
          {uploading ? 'Subiendo...' : 'Cambiar logo'}
        </label>
        <p className="mt-2 text-[12px]" style={{ color: '#6b6b6b' }}>
          PNG o SVG, idealmente cuadrado. Se usa en la tienda online y en bg-gestion.
        </p>
        {error && <p className="mt-2 text-[13px]" style={{ color: '#d81b8a' }}>{error}</p>}
      </div>
    </div>
  )
}
