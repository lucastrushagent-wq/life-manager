import { ShoppingCart } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { ShoppingModule } from './components/ShoppingModule'

export const shoppingTab: TabConfig = {
  id: 'shopping',
  label: 'Shopping',
  icon: ShoppingCart,
  component: ShoppingModule,
}
