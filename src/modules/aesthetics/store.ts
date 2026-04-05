import { create } from 'zustand'
import { z } from 'zod'
import type {
  AestheticProduct, GroomingRoutine, GroomingSchedule,
  WardrobeItem, OutfitIdea, InspirationItem,
} from './types'
import { aestheticsService } from './service'
import {
  CreateProductSchema, CreateRoutineSchema, CreateScheduleSchema,
  CreateWardrobeItemSchema, CreateOutfitIdeaSchema, CreateInspirationItemSchema,
} from './schema'

interface AestheticsStore {
  products: AestheticProduct[]
  routines: GroomingRoutine[]
  schedules: GroomingSchedule[]
  wardrobe: WardrobeItem[]
  outfits: OutfitIdea[]
  inspiration: InspirationItem[]

  load: () => Promise<void>

  createProduct: (input: z.infer<typeof CreateProductSchema>) => Promise<void>
  updateProduct: (id: string, patch: Partial<Omit<AestheticProduct, 'id' | 'createdAt'>>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>

  createRoutine: (input: z.infer<typeof CreateRoutineSchema>) => Promise<void>
  updateRoutine: (id: string, patch: Partial<Omit<GroomingRoutine, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteRoutine: (id: string) => Promise<void>

  createSchedule: (input: z.infer<typeof CreateScheduleSchema>) => Promise<void>
  updateSchedule: (id: string, patch: Partial<Omit<GroomingSchedule, 'id' | 'createdAt'>>) => Promise<void>
  markScheduleDone: (id: string) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>

  createWardrobeItem: (input: z.infer<typeof CreateWardrobeItemSchema>) => Promise<void>
  updateWardrobeItem: (id: string, patch: Partial<Omit<WardrobeItem, 'id' | 'createdAt'>>) => Promise<void>
  deleteWardrobeItem: (id: string) => Promise<void>

  createOutfit: (input: z.infer<typeof CreateOutfitIdeaSchema>) => Promise<void>
  updateOutfit: (id: string, patch: Partial<Omit<OutfitIdea, 'id' | 'createdAt'>>) => Promise<void>
  deleteOutfit: (id: string) => Promise<void>

  createInspirationItem: (input: z.infer<typeof CreateInspirationItemSchema>) => Promise<void>
  updateInspirationItem: (id: string, patch: Partial<Omit<InspirationItem, 'id' | 'createdAt'>>) => Promise<void>
  deleteInspirationItem: (id: string) => Promise<void>
}

export const useAestheticsStore = create<AestheticsStore>((set) => ({
  products: [],
  routines: [],
  schedules: [],
  wardrobe: [],
  outfits: [],
  inspiration: [],

  load: async () => {
    const [products, routines, schedules, wardrobe, outfits, inspiration] = await Promise.all([
      aestheticsService.getProducts(),
      aestheticsService.getRoutines(),
      aestheticsService.getSchedules(),
      aestheticsService.getWardrobe(),
      aestheticsService.getOutfits(),
      aestheticsService.getInspiration(),
    ])
    set({ products, routines, schedules, wardrobe, outfits, inspiration })
  },

  // Products
  createProduct: async (input) => {
    const product = await aestheticsService.createProduct(input)
    set(s => ({ products: [...s.products, product] }))
  },
  updateProduct: async (id, patch) => {
    const updated = await aestheticsService.updateProduct(id, patch)
    set(s => ({ products: s.products.map(p => p.id === id ? updated : p) }))
  },
  deleteProduct: async (id) => {
    await aestheticsService.deleteProduct(id)
    set(s => ({ products: s.products.filter(p => p.id !== id) }))
  },

  // Routines
  createRoutine: async (input) => {
    const routine = await aestheticsService.createRoutine(input)
    set(s => ({ routines: [...s.routines, routine] }))
  },
  updateRoutine: async (id, patch) => {
    const updated = await aestheticsService.updateRoutine(id, patch)
    set(s => ({ routines: s.routines.map(r => r.id === id ? updated : r) }))
  },
  deleteRoutine: async (id) => {
    await aestheticsService.deleteRoutine(id)
    set(s => ({ routines: s.routines.filter(r => r.id !== id) }))
  },

  // Schedules
  createSchedule: async (input) => {
    const schedule = await aestheticsService.createSchedule(input)
    set(s => ({ schedules: [...s.schedules, schedule] }))
  },
  updateSchedule: async (id, patch) => {
    const updated = await aestheticsService.updateSchedule(id, patch)
    set(s => ({ schedules: s.schedules.map(sc => sc.id === id ? updated : sc) }))
  },
  markScheduleDone: async (id) => {
    const updated = await aestheticsService.updateSchedule(id, { lastDoneAt: new Date().toISOString() })
    set(s => ({ schedules: s.schedules.map(sc => sc.id === id ? updated : sc) }))
  },
  deleteSchedule: async (id) => {
    await aestheticsService.deleteSchedule(id)
    set(s => ({ schedules: s.schedules.filter(sc => sc.id !== id) }))
  },

  // Wardrobe
  createWardrobeItem: async (input) => {
    const item = await aestheticsService.createWardrobeItem(input)
    set(s => ({ wardrobe: [...s.wardrobe, item] }))
  },
  updateWardrobeItem: async (id, patch) => {
    const updated = await aestheticsService.updateWardrobeItem(id, patch)
    set(s => ({ wardrobe: s.wardrobe.map(w => w.id === id ? updated : w) }))
  },
  deleteWardrobeItem: async (id) => {
    await aestheticsService.deleteWardrobeItem(id)
    set(s => ({ wardrobe: s.wardrobe.filter(w => w.id !== id) }))
  },

  // Outfits
  createOutfit: async (input) => {
    const outfit = await aestheticsService.createOutfit(input)
    set(s => ({ outfits: [...s.outfits, outfit] }))
  },
  updateOutfit: async (id, patch) => {
    const updated = await aestheticsService.updateOutfit(id, patch)
    set(s => ({ outfits: s.outfits.map(o => o.id === id ? updated : o) }))
  },
  deleteOutfit: async (id) => {
    await aestheticsService.deleteOutfit(id)
    set(s => ({ outfits: s.outfits.filter(o => o.id !== id) }))
  },

  // Inspiration
  createInspirationItem: async (input) => {
    const item = await aestheticsService.createInspirationItem(input)
    set(s => ({ inspiration: [...s.inspiration, item] }))
  },
  updateInspirationItem: async (id, patch) => {
    const updated = await aestheticsService.updateInspirationItem(id, patch)
    set(s => ({ inspiration: s.inspiration.map(i => i.id === id ? updated : i) }))
  },
  deleteInspirationItem: async (id) => {
    await aestheticsService.deleteInspirationItem(id)
    set(s => ({ inspiration: s.inspiration.filter(i => i.id !== id) }))
  },
}))
