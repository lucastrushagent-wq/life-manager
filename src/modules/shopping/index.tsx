import { ShoppingCart } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'

function ShoppingModule() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Shopping</h1>
      <p className="text-sm text-gray-400">Coming soon.</p>
    </div>
  )
}

export const shoppingTab: TabConfig = {
  id: 'shopping',
  label: 'Shopping',
  icon: ShoppingCart,
  component: ShoppingModule,
}
