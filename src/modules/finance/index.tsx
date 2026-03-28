import { DollarSign } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { FinanceModule } from './components/FinanceModule'

export const financeTab: TabConfig = {
  id: 'finance',
  label: 'Finance',
  icon: DollarSign,
  component: FinanceModule,
}
