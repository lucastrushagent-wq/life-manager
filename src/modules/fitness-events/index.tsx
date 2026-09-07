import { Medal } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { FitnessEventsModule } from './components/FitnessEventsModule'

export const fitnessEventsTab: TabConfig = {
  id: 'fitness-events',
  label: 'Fitness Events',
  icon: Medal,
  component: FitnessEventsModule,
}
