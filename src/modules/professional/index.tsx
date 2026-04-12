import { Briefcase } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { ProfessionalModule } from './components/ProfessionalModule'

export const professionalTab: TabConfig = {
  id: 'professional',
  label: 'Professional',
  icon: Briefcase,
  component: ProfessionalModule,
}
