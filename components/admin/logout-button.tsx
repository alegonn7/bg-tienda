'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { signOut } from '@/components/admin/admin-nav'

export function LogoutButton({ withLabel = true }: { withLabel?: boolean }) {
  const router = useRouter()
  return (
    <button type="button" onClick={() => signOut(router)} className="adm-btn adm-btn-sm" aria-label="Cerrar sesión">
      <LogOut />
      {withLabel && 'Salir'}
    </button>
  )
}
