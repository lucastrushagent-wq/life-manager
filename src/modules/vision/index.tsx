import { useEffect } from 'react'
import { Target } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { VisionModule } from './components/VisionModule'
import { useVisionStore } from './store'

function VisionTab() {
  const load = useVisionStore(s => s.load)
  useEffect(() => { load() }, [load])
  return <VisionModule />
}

export const visionTab: TabConfig = {
  id: 'vision',
  label: 'Vision',
  icon: Target,
  component: VisionTab,
}
