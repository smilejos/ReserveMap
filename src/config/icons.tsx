import {
  BedDouble,
  Building2,
  CakeSlice,
  CupSoda,
  Camera,
  Coffee,
  House,
  Hotel,
  MapPin,
  Palmtree,
  ShoppingBag,
  Soup,
  Squirrel,
  Store,
  Ticket,
  TreeDeciduous,
  University,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  restaurant: UtensilsCrossed,
  soup: Soup,
  'cup-soda': CupSoda,
  'cake-slice': CakeSlice,
  coffee: Coffee,
  camera: Camera,
  'tree-deciduous': TreeDeciduous,
  squirrel: Squirrel,
  ticket: Ticket,
  museum: University,
  'building-2': Building2,
  'shopping-bag': ShoppingBag,
  store: Store,
  hotel: Hotel,
  'bed-double': BedDouble,
  house: House,
  'palm-tree': Palmtree,
  'map-pin': MapPin,
}

export function CategoryIcon({
  iconKey,
  size = 18,
  strokeWidth = 2,
}: {
  iconKey: string
  size?: number
  strokeWidth?: number
}) {
  const Icon = icons[iconKey] ?? MapPin
  return <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} />
}
