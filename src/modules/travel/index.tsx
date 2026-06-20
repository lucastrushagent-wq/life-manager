import { Plane } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { PhilosophyBox } from '../../core/PhilosophyBox'

function TravelModule() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Travel</h1>
      <PhilosophyBox moduleId="travel" />
      <p className="text-sm text-gray-400">Coming soon.</p>
    </div>
  )
}

export const travelTab: TabConfig = {
  id: 'travel',
  label: 'Travel',
  icon: Plane,
  component: TravelModule,
}
