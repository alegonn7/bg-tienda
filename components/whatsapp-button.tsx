import { whatsappUrl } from '@/lib/store-info'
import { WhatsAppIcon } from '@/components/store/icons'
import type { Store } from '@/lib/tenant'

export function WhatsAppButton({ store, hideOnMobile = false }: { store: Store; hideOnMobile?: boolean }) {
  const url = whatsappUrl(store)
  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
      className={`fixed bottom-4 right-4 z-30 h-14 w-14 place-items-center rounded-full text-white transition-transform hover:scale-105 md:bottom-6 md:right-6 md:h-[58px] md:w-[58px] ${hideOnMobile ? 'hidden md:grid' : 'grid'}`}
      style={{ backgroundColor: 'var(--st-wa)', boxShadow: '0 8px 24px rgba(31,170,83,.35)' }}
    >
      <WhatsAppIcon size={28} />
    </a>
  )
}
