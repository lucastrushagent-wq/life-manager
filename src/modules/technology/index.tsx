import { Laptop } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { TechnologyModule } from './components/TechnologyModule'

export const technologyTab: TabConfig = {
  id: 'technology',
  label: 'Technology',
  icon: Laptop,
  component: TechnologyModule,
}
