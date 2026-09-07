import { PawPrint } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { TweedModule } from './components/TweedModule'

export const tweedTab: TabConfig = {
  id: 'tweed',
  label: 'Tweed',
  icon: PawPrint,
  component: TweedModule,
}
