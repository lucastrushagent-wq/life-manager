import { create } from 'zustand'
import type { VisionStatement, MissionStatement, CoreValue, Goal, Manifesto, VisionImage } from './types'
import { visionService } from './service'

interface VisionStore {
  vision: VisionStatement | null
  mission: MissionStatement | null
  values: CoreValue[]
  goals: Goal[]
  manifesto: Manifesto | null
  image: VisionImage
  loaded: boolean
  load: () => Promise<void>
  saveVision: (content: string) => Promise<void>
  saveMission: (content: string) => Promise<void>
  addValue: (data: Pick<CoreValue, 'name' | 'description'>) => Promise<void>
  updateValue: (id: string, patch: Partial<Pick<CoreValue, 'name' | 'description' | 'sortOrder'>>) => Promise<void>
  deleteValue: (id: string) => Promise<void>
  addGoal: (data: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  saveManifesto: (content: string) => Promise<void>
  uploadImage: (dataUrl: string) => Promise<void>
  deleteImage: () => Promise<void>
}

export const useVisionStore = create<VisionStore>((set) => ({
  vision: null,
  mission: null,
  values: [],
  goals: [],
  manifesto: null,
  image: { exists: false },
  loaded: false,

  load: async () => {
    const [vision, mission, values, goals, manifesto, image] = await Promise.all([
      visionService.getVision(),
      visionService.getMission(),
      visionService.getValues(),
      visionService.getGoals(),
      visionService.getManifesto(),
      visionService.getImage(),
    ])
    set({ vision, mission, values, goals, manifesto, image, loaded: true })
  },

  saveVision: async (content) => {
    const vision = await visionService.saveVision(content)
    set({ vision })
  },
  saveMission: async (content) => {
    const mission = await visionService.saveMission(content)
    set({ mission })
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

  uploadImage: async (dataUrl) => {
    const image = await visionService.uploadImage(dataUrl)
    set({ image })
  },
  deleteImage: async () => {
    await visionService.deleteImage()
    set({ image: { exists: false } })
  },
}))
