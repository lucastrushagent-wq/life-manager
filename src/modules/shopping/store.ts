import { create } from 'zustand'
import type { ShoppingStore, ShoppingItem } from './types'
import { shoppingService } from './service'

interface ShoppingState {
  stores: ShoppingStore[]
  items: Record<string, ShoppingItem[]>  // keyed by storeId
  activeStoreId: string | null
  loadStores: () => Promise<void>
  loadItems: (storeId: string) => Promise<void>
  setActiveStore: (id: string) => void
  createStore: (name: string) => Promise<void>
  deleteStore: (id: string) => Promise<void>
  addItem: (storeId: string, data: { name: string; quantity?: string; notes?: string }) => Promise<void>
  toggleItem: (storeId: string, item: ShoppingItem) => Promise<void>
  deleteItem: (storeId: string, itemId: string) => Promise<void>
  clearChecked: (storeId: string) => Promise<void>
}

export const useShoppingStore = create<ShoppingState>((set, get) => ({
  stores: [],
  items: {},
  activeStoreId: null,

  loadStores: async () => {
    const stores = await shoppingService.getStores()
    set(s => ({
      stores,
      activeStoreId: s.activeStoreId ?? (stores[0]?.id ?? null),
    }))
  },

  loadItems: async (storeId) => {
    const items = await shoppingService.getItems(storeId)
    set(s => ({ items: { ...s.items, [storeId]: items } }))
  },

  setActiveStore: (id) => set({ activeStoreId: id }),

  createStore: async (name) => {
    await shoppingService.createStore(name)
    const stores = await shoppingService.getStores()
    set({ stores })
  },

  deleteStore: async (id) => {
    await shoppingService.deleteStore(id)
    const stores = await shoppingService.getStores()
    set(s => {
      const items = { ...s.items }
      delete items[id]
      const activeStoreId = s.activeStoreId === id ? (stores[0]?.id ?? null) : s.activeStoreId
      return { stores, items, activeStoreId }
    })
  },

  addItem: async (storeId, data) => {
    const item = await shoppingService.addItem(storeId, data)
    set(s => ({ items: { ...s.items, [storeId]: [...(s.items[storeId] ?? []), item] } }))
  },

  toggleItem: async (storeId, item) => {
    const updated = await shoppingService.updateItem(item.id, { checked: !item.checked })
    set(s => ({
      items: {
        ...s.items,
        [storeId]: (s.items[storeId] ?? []).map(i => i.id === item.id ? updated : i),
      },
    }))
  },

  deleteItem: async (storeId, itemId) => {
    await shoppingService.deleteItem(itemId)
    set(s => ({
      items: {
        ...s.items,
        [storeId]: (s.items[storeId] ?? []).filter(i => i.id !== itemId),
      },
    }))
  },

  clearChecked: async (storeId) => {
    await shoppingService.clearChecked(storeId)
    set(s => ({
      items: {
        ...s.items,
        [storeId]: (s.items[storeId] ?? []).filter(i => !i.checked),
      },
    }))
  },
}))
