import { create } from 'zustand'
import type { z } from 'zod'
import type { Device, TechSubscription } from './types'
import type {
  CreateDeviceSchema, UpdateDeviceSchema,
  CreateSubscriptionSchema, UpdateSubscriptionSchema,
} from './schema'
import { technologyService } from './service'

interface TechnologyState {
  devices: Device[]
  subscriptions: TechSubscription[]
  loading: boolean
  load: () => Promise<void>

  createDevice: (input: z.infer<typeof CreateDeviceSchema>) => Promise<void>
  updateDevice: (id: string, patch: z.infer<typeof UpdateDeviceSchema>) => Promise<void>
  removeDevice: (id: string) => Promise<void>

  createSubscription: (input: z.infer<typeof CreateSubscriptionSchema>) => Promise<void>
  updateSubscription: (id: string, patch: z.infer<typeof UpdateSubscriptionSchema>) => Promise<void>
  removeSubscription: (id: string) => Promise<void>
}

export const useTechnologyStore = create<TechnologyState>((set) => ({
  devices: [],
  subscriptions: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const [devices, subscriptions] = await Promise.all([
        technologyService.getDevices(),
        technologyService.getSubscriptions(),
      ])
      set({ devices, subscriptions, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createDevice: async (input) => {
    const d = await technologyService.createDevice(input)
    set(s => ({ devices: [...s.devices, d] }))
  },
  updateDevice: async (id, patch) => {
    const d = await technologyService.updateDevice(id, patch)
    set(s => ({ devices: s.devices.map(x => x.id === id ? d : x) }))
  },
  removeDevice: async (id) => {
    await technologyService.deleteDevice(id)
    set(s => ({ devices: s.devices.filter(x => x.id !== id) }))
  },

  createSubscription: async (input) => {
    const sub = await technologyService.createSubscription(input)
    set(s => ({ subscriptions: [...s.subscriptions, sub] }))
  },
  updateSubscription: async (id, patch) => {
    const sub = await technologyService.updateSubscription(id, patch)
    set(s => ({ subscriptions: s.subscriptions.map(x => x.id === id ? sub : x) }))
  },
  removeSubscription: async (id) => {
    await technologyService.deleteSubscription(id)
    set(s => ({ subscriptions: s.subscriptions.filter(x => x.id !== id) }))
  },
}))
