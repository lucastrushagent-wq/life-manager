export type ProviderCategory =
  | 'medical'
  | 'dental'
  | 'vision'
  | 'mental_health'
  | 'hair'
  | 'massage'
  | 'fitness'
  | 'beauty'
  | 'home'
  | 'auto'
  | 'financial'
  | 'legal'
  | 'pet'
  | 'other'

export interface ServiceProvider {
  id: string
  name: string
  category: ProviderCategory
  /** e.g. "Dr. Sarah Chen — GP", "Deep tissue", "Men's cut" */
  specialty?: string
  phone?: string
  email?: string
  website?: string
  /** Direct booking link — what an agent uses to make an appointment */
  bookingUrl?: string
  address?: string
  /**
   * Freeform standing preferences an agent reads before booking, e.g.
   * "60min deep tissue with Maria, firm pressure, arrive 10 min early".
   */
  preferences?: string
  /** ISO date (YYYY-MM-DD) of the most recent visit */
  lastVisit?: string
  /** How often this service is due, in days — drives the "due" indicator */
  frequencyDays?: number
  typicalCost?: number
  rating?: number
  notes?: string
  archived: boolean
  createdAt: string
}
