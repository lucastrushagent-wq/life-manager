import { ComponentType } from 'react'
import { todoTab } from '../modules/todo'
import { crmTab } from '../modules/crm'
import { financeTab } from '../modules/finance'

export interface TabConfig {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  component: ComponentType
}

export const tabs: TabConfig[] = [todoTab, crmTab, financeTab]
