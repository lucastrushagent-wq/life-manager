import { Stethoscope } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { ServiceProvidersModule } from './components/ServiceProvidersModule'

export const serviceProvidersTab: TabConfig = {
  id: 'service-providers',
  label: 'Service Providers',
  icon: Stethoscope,
  component: ServiceProvidersModule,
}
