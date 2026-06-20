import { Users } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { PhilosophyBox } from '../../core/PhilosophyBox'

function SocialModule() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Social & Community</h1>
      <PhilosophyBox moduleId="social" />
      <p className="text-sm text-gray-400">Coming soon.</p>
    </div>
  )
}

export const socialTab: TabConfig = {
  id: 'social',
  label: 'Social',
  icon: Users,
  component: SocialModule,
}
