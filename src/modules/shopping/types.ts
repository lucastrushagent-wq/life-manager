export interface ShoppingStore {
  id: string
  name: string
  sortOrder: number
  createdAt: string
}

export interface ShoppingItem {
  id: string
  storeId: string
  name: string
  quantity?: string
  notes?: string
  checked: boolean
  createdAt: string
}
