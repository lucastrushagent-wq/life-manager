import { Eye } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'

function VisionModule() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Vision</h1>
      <p className="text-sm text-gray-400">Coming soon.</p>
    </div>
  )
}

export const visionTab: TabConfig = {
  id: 'vision',
  label: 'Vision',
  icon: Eye,
  component: VisionModule,
}
