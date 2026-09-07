export interface ShoppingStore {
  id: string
  name: string
  sortOrder: number
  createdAt: string
}

export type ShoppingFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly'

export interface ShoppingItem {
  id: string
  storeId: string
  name: string
  quantity?: string
  notes?: string
  checked: boolean
  recurring: boolean
  frequency?: ShoppingFrequency
  storeCode?: string
  url?: string
  /** The brand/variant always bought for this item, e.g. "Kirkland Signature 30-roll" */
  preferredBrand?: string
  /** Standing preference — survives "clear checked" so the brand is never lost */
  isPreference: boolean
  createdAt: string
}
