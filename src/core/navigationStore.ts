import { create } from 'zustand'

interface NavigationStore {
  activeTabId: string
  setActiveTabId: (id: string) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeTabId: 'vision',
  setActiveTabId: (id) => set({ activeTabId: id }),
}))
