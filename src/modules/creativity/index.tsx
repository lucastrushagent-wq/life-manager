import { Palette } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { PhilosophyBox } from '../../core/PhilosophyBox'

function CreativityModule() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Creativity</h1>
      <PhilosophyBox moduleId="creativity" />
      <p className="text-sm text-gray-400">Coming soon.</p>
    </div>
  )
}

export const creativityTab: TabConfig = {
  id: 'creativity',
  label: 'Creativity',
  icon: Palette,
  component: CreativityModule,
}
