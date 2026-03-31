import { Star } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'

function LucieModule() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Lucie</h1>
      <p className="text-sm text-gray-400">Coming soon.</p>
    </div>
  )
}

export const lucieTab: TabConfig = {
  id: 'lucie',
  label: 'Lucie',
  icon: Star,
  component: LucieModule,
}
