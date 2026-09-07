import type { ShoppingStore, ShoppingItem } from './types'

const BASE = 'http://localhost:3001/api/shopping'

export type CreateItemData = Omit<ShoppingItem, 'id' | 'storeId' | 'checked' | 'createdAt'>

/** A preference item annotated with the store it belongs to. */
export type PreferenceItem = ShoppingItem & { store?: string }

export const shoppingService = {
  async getStores(): Promise<ShoppingStore[]> {
    const res = await fetch(`${BASE}/stores`)
    if (!res.ok) throw new Error('Failed to fetch stores')
    return res.json()
  },

  async createStore(name: string): Promise<ShoppingStore> {
    const res = await fetch(`${BASE}/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error('Failed to create store')
    return res.json()
  },

  async deleteStore(id: string): Promise<void> {
    const res = await fetch(`${BASE}/stores/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete store')
  },

  async getItems(storeId: string): Promise<ShoppingItem[]> {
    const res = await fetch(`${BASE}/stores/${storeId}/items`)
    if (!res.ok) throw new Error('Failed to fetch items')
    return res.json()
  },

  async addItem(storeId: string, data: CreateItemData): Promise<ShoppingItem> {
    const res = await fetch(`${BASE}/stores/${storeId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to add item')
    return res.json()
  },

  async updateItem(id: string, patch: Partial<Omit<ShoppingItem, 'id' | 'storeId' | 'createdAt'>>): Promise<ShoppingItem> {
    const res = await fetch(`${BASE}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error('Failed to update item')
    return res.json()
  },

  async deleteItem(id: string): Promise<void> {
    const res = await fetch(`${BASE}/items/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete item')
  },

  async clearChecked(storeId: string): Promise<void> {
    const res = await fetch(`${BASE}/stores/${storeId}/checked`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to clear checked items')
  },

  /** Look up standing preferences across all stores, optionally filtered by name. */
  async getPreferences(query?: string): Promise<PreferenceItem[]> {
    const qs = query ? `?q=${encodeURIComponent(query)}` : ''
    const res = await fetch(`${BASE}/preferences${qs}`)
    if (!res.ok) throw new Error('Failed to fetch preferences')
    return res.json()
  },
}
