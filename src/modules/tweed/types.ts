/** Everything a dog-sitter needs to know. Single record. */
export interface TweedProfile {
  breed?: string
  dateOfBirth?: string      // ISO date
  weightKg?: number
  colour?: string
  microchipNumber?: string
  desexed: boolean

  // Food
  foodBrand?: string
  foodAmount?: string       // e.g. "1 cup, twice daily"
  foodLocation?: string     // where the food is kept
  feedingNotes?: string
  treats?: string           // what's allowed, and how many

  // Safety — surfaced prominently in the UI
  allergies?: string
  currentMedications?: string

  // Day-to-day care
  toys?: string             // favourites, and which are safe unsupervised
  walkRoutine?: string
  toiletRoutine?: string
  sleepRoutine?: string
  behaviourNotes?: string   // fears, triggers, quirks
  commands?: string         // what he responds to
  houseRules?: string       // allowed on the couch, etc.

  // Contacts
  emergencyContactName?: string
  emergencyContactPhone?: string
  vetName?: string
  vetPhone?: string
  vetAddress?: string
  afterHoursVetName?: string
  afterHoursVetPhone?: string

  updatedAt?: string
}

export type ScheduleActivity =
  | 'meal' | 'walk' | 'medication' | 'play' | 'toilet' | 'grooming' | 'bedtime' | 'other'

export interface TweedScheduleItem {
  id: string
  time: string              // HH:MM, 24h
  activity: ScheduleActivity
  title: string
  details?: string
  createdAt: string
}

export type MedicalType =
  | 'checkup' | 'vaccination' | 'illness' | 'injury' | 'surgery'
  | 'dental' | 'medication' | 'parasite' | 'grooming' | 'other'

/**
 * `not_claimable` covers routine costs the policy does not cover, so they stay
 * out of the claim totals without being deleted.
 */
export type ClaimStatus = 'not_claimable' | 'not_submitted' | 'submitted' | 'paid' | 'rejected'

export interface TweedMedicalRecord {
  id: string
  date: string              // ISO date
  type: MedicalType
  title: string
  description?: string
  vet?: string
  cost?: number
  followUpDate?: string
  claimStatus: ClaimStatus
  amountClaimed?: number
  amountReimbursed?: number
  claimSubmittedDate?: string
  claimNotes?: string
  notes?: string
  createdAt: string
}

/** Single record. */
export interface TweedInsurance {
  provider?: string
  policyNumber?: string
  annualPremium?: number
  excess?: number
  reimbursementRate?: number   // percent, e.g. 80
  annualLimit?: number
  renewalDate?: string
  contactPhone?: string
  portalUrl?: string
  coverageNotes?: string
  updatedAt?: string
}

export interface ClaimSummary {
  totalCost: number
  totalReimbursed: number
  /** Submitted but not yet paid */
  outstanding: number
  /** Claimable spend that has not been submitted yet */
  unclaimed: number
  netCost: number
  claimCount: number
}
