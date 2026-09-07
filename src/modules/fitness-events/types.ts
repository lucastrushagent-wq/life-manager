export type FitnessEventType = 'upcoming' | 'goal'

/** `registered` and `completed` both remove a race from the registration alert list. */
export type FitnessEventStatus = 'registered' | 'interested' | 'sold_out' | 'completed' | 'alert_set'

export type FitnessEventCategory =
  | 'running' | 'trail' | 'cycling' | 'swimming' | 'triathlon'
  | 'obstacle' | 'hyrox' | 'strength' | 'team_sport' | 'other'

export interface FitnessEvent {
  id: string
  name: string
  type: FitnessEventType
  date?: string        // ISO date (YYYY-MM-DD)
  endDate?: string     // for multi-day events (stage races, etc.)
  venue?: string
  location?: string    // city / country
  category: FitnessEventCategory
  status: FitnessEventStatus
  url?: string         // registration / info URL
  price?: number       // entry fee
  /** Free text so any format works: "42.2km", "70.3", "5k", "100 miles" */
  distance?: string
  /** Target finish, e.g. "3:30:00" */
  goalTime?: string
  /** Actual finish once completed */
  resultTime?: string
  alertEnabled: boolean
  /** Recurs every year — the date is this year's edition */
  annual: boolean
  /** ISO date registration opens — drives the registration alert */
  registrationOpensDate?: string
  /** ISO date registration closes */
  registrationClosesDate?: string
  notes?: string
  createdAt: string
}
