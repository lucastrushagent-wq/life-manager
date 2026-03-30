export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  role?: string
  relationship: string[]
  followUpDays?: number
  notes?: string
  createdAt: string
  lastContactedAt?: string
}

export interface Interaction {
  id: string
  contactId: string
  date: string
  notes: string
  createdAt: string
}

export interface KeyDate {
  id: string
  contactId: string
  label: string
  month: number
  day: number
}
