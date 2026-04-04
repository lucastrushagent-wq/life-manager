import { create } from 'zustand'
import type { VisionStatement, CoreValue, Goal, Manifesto } from './types'
import { visionService } from './service'

interface VisionStore {
  vision: VisionStatement | null
  values: CoreValue[]
  goals: Goal[]
  manifesto: Manifesto | null
  loaded: boolean
  load: () => Promise<void>
  saveVision: (content: string) => Promise<void>
  addValue: (data: Pick<CoreValue, 'name' | 'description'>) => Promise<void>
  updateValue: (id: string, patch: Partial<Pick<CoreValue, 'name' | 'description' | 'sortOrder'>>) => Promise<void>
  deleteValue: (id: string) => Promise<void>
  addGoal: (data: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  saveManifesto: (content: string) => Promise<void>
}

export const useVisionStore = create<VisionStore>((set) => ({
  vision: null,
  values: [],
  goals: [],
  manifesto: null,
  loaded: false,

  load: async () => {
    const [vision, values, goals, manifesto] = await Promise.all([
      visionService.getVision(),
      visionService.getValues(),
      visionService.getGoals(),
      visionService.getManifesto(),
    ])
    set({ vision, values, goals, manifesto, loaded: true })
  },

  saveVision: async (content) => {
    const vision = await visionService.saveVision(content)
    set({ vision })
  },

  addValue: async (data) => {
    const v = await visionService.addValue(data)
    set(s => ({ values: [...s.values, v] }))
  },
  updateValue: async (id, patch) => {
    const v = await visionService.updateValue(id, patch)
    set(s => ({ values: s.values.map(val => val.id === id ? v : val) }))
  },
  deleteValue: async (id) => {
    await visionService.deleteValue(id)
    set(s => ({ values: s.values.filter(v => v.id !== id) }))
  },

  addGoal: async (data) => {
    const g = await visionService.addGoal(data)
    set(s => ({ goals: [...s.goals, g] }))
  },
  updateGoal: async (id, patch) => {
    const g = await visionService.updateGoal(id, patch)
    set(s => ({ goals: s.goals.map(goal => goal.id === id ? g : goal) }))
  },
  deleteGoal: async (id) => {
    await visionService.deleteGoal(id)
    set(s => ({ goals: s.goals.filter(g => g.id !== id) }))
  },

  saveManifesto: async (content) => {
    const manifesto = await visionService.saveManifesto(content)
    set({ manifesto })
  },
}))
