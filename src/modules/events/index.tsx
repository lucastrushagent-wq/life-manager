import { CalendarDays } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { EventsModule } from './components/EventsModule'

export const eventsTab: TabConfig = {
  id: 'events',
  label: 'Events',
  icon: CalendarDays,
  component: EventsModule,
}
