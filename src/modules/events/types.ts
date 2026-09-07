export type EventType = 'upcoming' | 'goal'
export type EventStatus = 'confirmed' | 'interested' | 'sold_out' | 'alert_set'
export type EventCategory =
  | 'music' | 'sports' | 'conference' | 'festival'
  | 'theatre' | 'comedy' | 'art' | 'food' | 'film' | 'other'

export interface CalendarEvent {
  id: string
  name: string
  type: EventType
  date?: string        // ISO date (YYYY-MM-DD)
  endDate?: string     // for multi-day events
  venue?: string
  location?: string    // city / country
  category: EventCategory
  status: EventStatus
  url?: string         // ticket / info URL
  price?: number       // expected price
  alertEnabled: boolean
  /** Recurs every year — the date is this year's edition */
  annual: boolean
  /** ISO date (YYYY-MM-DD) tickets go on sale — drives the on-sale alert */
  ticketsOnSaleDate?: string
  notes?: string
  createdAt: string
}
