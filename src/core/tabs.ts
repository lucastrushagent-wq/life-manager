import { ComponentType } from 'react'
import { todoTab } from '../modules/todo'
import { crmTab } from '../modules/crm'
import { financeTab } from '../modules/finance'
import { tweedTab } from '../modules/tweed'
import { lucieTab } from '../modules/lucie'
import { shoppingTab } from '../modules/shopping'
import { healthTab } from '../modules/health'
import { fitnessTab } from '../modules/fitness'
import { visionTab } from '../modules/vision'
import { investmentsTab } from '../modules/investments'
import { aestheticsTab } from '../modules/aesthetics'
import { homeTab } from '../modules/home'

export interface TabConfig {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  component: ComponentType
}

export const tabs: TabConfig[] = [visionTab, todoTab, crmTab, financeTab, investmentsTab, healthTab, fitnessTab, shoppingTab, aestheticsTab, homeTab, lucieTab, tweedTab]
