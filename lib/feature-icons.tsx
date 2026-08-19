import {
  Pencil,
  MapPin,
  Truck,
  CheckCircle,
  Star,
  Heart,
  Clock,
  ShoppingBag,
  Tag,
  Gift,
  MessageCircle,
  Phone,
  type LucideIcon,
} from 'lucide-react'

// Set fijo de íconos para la franja de destacados del inicio — el dueño de la tienda elige uno
// por punto desde Mi Tienda. Se guarda solo la key (string) en store_settings.features, nunca el
// SVG en sí, así no hay riesgo de guardar un ícono roto.
export const FEATURE_ICONS: Record<string, LucideIcon> = {
  pencil: Pencil,
  pin: MapPin,
  truck: Truck,
  check: CheckCircle,
  star: Star,
  heart: Heart,
  clock: Clock,
  bag: ShoppingBag,
  tag: Tag,
  gift: Gift,
  chat: MessageCircle,
  phone: Phone,
}

export type FeatureIconKey = keyof typeof FEATURE_ICONS

export const FEATURE_ICON_KEYS = Object.keys(FEATURE_ICONS) as FeatureIconKey[]
