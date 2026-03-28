import { Users } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { CrmModule } from './components/CrmModule'

export const crmTab: TabConfig = {
  id: 'crm',
  label: 'CRM',
  icon: Users,
  component: CrmModule,
}
