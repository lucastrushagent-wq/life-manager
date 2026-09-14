export type InviteStatus = 'draft' | 'sent' | 'updated' | 'cancelled' | 'failed'

export interface CalendarInvite {
  id: string
  /** Stable iCalendar identifier — updates reuse it so clients amend rather than duplicate. */
  uid: string
  /** Incremented on every change; clients ignore an amendment that does not raise it. */
  sequence: number
  summary: string
  description?: string
  location?: string
  startsAt: string
  endsAt: string
  allDay: boolean
  attendee: string
  organizer: string
  status: InviteStatus
  error?: string
  createdAt: string
  updatedAt: string
}

export interface CalendarStatus {
  configured: boolean
  organizer: string | null
  defaultAttendee: string | null
}
