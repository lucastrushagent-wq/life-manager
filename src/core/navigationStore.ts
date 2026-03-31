import { create } from 'zustand'
import { tabs } from './tabs'

interface NavigationStore {
  activeTabId: string
  setActiveTabId: (id: string) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeTabId: tabs[0].id,
  setActiveTabId: (id) => set({ activeTabId: id }),
}))
