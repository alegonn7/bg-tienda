'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { signOut } from '@/components/admin/admin-nav'

export function MasLogout() {
  const router = useRouter()
  return (
    <button type="button" onClick={() => signOut(router)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
      <span className="grid h-9 w-9 place-items-center rounded-[10px]" style={{ backgroundColor: 'var(--adm-bg)' }}>
        <LogOut className="h-[18px] w-[18px]" />
      </span>
      <b className="font-medium">Cerrar sesión</b>
    </button>
  )
}
