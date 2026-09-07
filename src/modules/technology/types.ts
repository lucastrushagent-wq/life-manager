export type DeviceCategory =
  | 'computer' | 'phone' | 'tablet' | 'wearable' | 'display' | 'audio'
  | 'camera' | 'gaming' | 'network' | 'smart_home' | 'peripheral' | 'storage' | 'other'

export type DeviceStatus = 'active' | 'backup' | 'storage' | 'sold' | 'retired' | 'broken'

export interface Device {
  id: string
  name: string
  category: DeviceCategory
  brand?: string
  model?: string
  /** Kept for warranty claims and insurance — not a credential */
  serialNumber?: string
  purchaseDate?: string    // ISO date
  purchasePrice?: number
  /** ISO date — drives the warranty-expiring alert */
  warrantyExpiry?: string
  status: DeviceStatus
  /** Who uses it */
  assignedTo?: string
  /** Which room / where it lives */
  location?: string
  url?: string
  notes?: string
  createdAt: string
}

export type SubscriptionCategory =
  | 'cloud_storage' | 'software' | 'streaming' | 'security'
  | 'domain_hosting' | 'ai' | 'connectivity' | 'other'

export type BillingCycle = 'monthly' | 'quarterly' | 'annual'

export type SubscriptionStatus = 'active' | 'trial' | 'cancelled'

export interface TechSubscription {
  id: string
  name: string
  provider?: string
  category: SubscriptionCategory
  cost?: number
  billingCycle: BillingCycle
  /** ISO date of the next charge — drives the renewal alert */
  renewalDate?: string
  status: SubscriptionStatus
  url?: string
  notes?: string
  createdAt: string
}
