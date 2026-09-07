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
import { professionalTab } from '../modules/professional'
import { eventsTab } from '../modules/events'
import { spiritualityTab } from '../modules/spirituality'
import { learningTab } from '../modules/learning'
import { travelTab } from '../modules/travel'
import { socialTab } from '../modules/social'
import { mentalHealthTab } from '../modules/mental-health'
import { creativityTab } from '../modules/creativity'
import { serviceProvidersTab } from '../modules/service-providers'
import { fitnessEventsTab } from '../modules/fitness-events'
import { technologyTab } from '../modules/technology'

export interface TabConfig {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  component: ComponentType
  group?: string
}

export const TAB_GROUPS = ['Money', 'Relationships', 'Health & Body', 'Career', 'Life', 'Household'] as const
export type TabGroup = typeof TAB_GROUPS[number]

export const tabs: TabConfig[] = [
  // Standalone
  { ...visionTab },
  { ...todoTab },
  // Money
  { ...financeTab,      group: 'Money' },
  { ...investmentsTab,  group: 'Money' },
  // Relationships
  { ...crmTab,          group: 'Relationships' },
  { ...lucieTab,        group: 'Relationships' },
  { ...tweedTab,        group: 'Relationships' },
  // Health & Body
  { ...healthTab,       group: 'Health & Body' },
  { ...fitnessTab,      group: 'Health & Body' },
  { ...mentalHealthTab, group: 'Health & Body' },
  { ...aestheticsTab,   group: 'Health & Body' },
  { ...fitnessEventsTab, group: 'Health & Body' },
  // Career
  { ...professionalTab, group: 'Career' },
  { ...learningTab,     group: 'Career' },
  // Life
  { ...spiritualityTab, group: 'Life' },
  { ...creativityTab,   group: 'Life' },
  { ...socialTab,       group: 'Life' },
  { ...eventsTab,       group: 'Life' },
  { ...travelTab,       group: 'Life' },
  // Household
  { ...shoppingTab,        group: 'Household' },
  { ...homeTab,            group: 'Household' },
  { ...technologyTab,      group: 'Household' },
  { ...serviceProvidersTab, group: 'Household' },
]
