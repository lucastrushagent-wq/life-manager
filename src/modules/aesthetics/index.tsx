import { Sparkles } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { AestheticsModule } from './components/AestheticsModule'

export const aestheticsTab: TabConfig = {
  id: 'aesthetics',
  label: 'Aesthetics',
  icon: Sparkles,
  component: AestheticsModule,
}
