import { Home } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { PhilosophyBox } from '../../core/PhilosophyBox'

function HomeModule() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Home</h1>
      <PhilosophyBox moduleId="home" />
      <p className="text-sm text-gray-400">Coming soon.</p>
    </div>
  )
}

export const homeTab: TabConfig = {
  id: 'home',
  label: 'Home',
  icon: Home,
  component: HomeModule,
}
