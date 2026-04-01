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
  createdAt: string
}
