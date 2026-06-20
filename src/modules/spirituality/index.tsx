import { Sparkles } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { PhilosophyBox } from '../../core/PhilosophyBox'

function SpiritualityModule() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Spirituality</h1>
      <PhilosophyBox moduleId="spirituality" />
      <p className="text-sm text-gray-400">Coming soon.</p>
    </div>
  )
}

export const spiritualityTab: TabConfig = {
  id: 'spirituality',
  label: 'Spirituality',
  icon: Sparkles,
  component: SpiritualityModule,
}
