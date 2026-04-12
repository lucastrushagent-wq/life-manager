import { Star } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { PhilosophyBox } from '../../core/PhilosophyBox'

function LucieModule() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Lucie</h1>
      <PhilosophyBox moduleId="lucie" />
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
