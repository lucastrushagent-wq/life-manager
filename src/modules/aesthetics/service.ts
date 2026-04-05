import { z } from 'zod'
import type {
  AestheticProduct, GroomingRoutine, GroomingSchedule,
  WardrobeItem, OutfitIdea, InspirationItem,
} from './types'
import {
  CreateProductSchema, CreateRoutineSchema, CreateScheduleSchema,
  CreateWardrobeItemSchema, CreateOutfitIdeaSchema, CreateInspirationItemSchema,
} from './schema'

const BASE = '/api/aesthetics'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.status === 204 ? (undefined as T) : res.json()
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const aestheticsService = {
  // Products
  getProducts(): Promise<AestheticProduct[]> {
    return request<AestheticProduct[]>(`${BASE}/products`)
  },
  createProduct(input: z.infer<typeof CreateProductSchema>): Promise<AestheticProduct> {
    return request<AestheticProduct>(`${BASE}/products`, { method: 'POST', ...json(input) })
  },
  updateProduct(id: string, patch: Partial<Omit<AestheticProduct, 'id' | 'createdAt'>>): Promise<AestheticProduct> {
    return request<AestheticProduct>(`${BASE}/products/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteProduct(id: string): Promise<void> {
    return request<void>(`${BASE}/products/${id}`, { method: 'DELETE' })
  },

  // Routines
  getRoutines(): Promise<GroomingRoutine[]> {
    return request<GroomingRoutine[]>(`${BASE}/routines`)
  },
  createRoutine(input: z.infer<typeof CreateRoutineSchema>): Promise<GroomingRoutine> {
    return request<GroomingRoutine>(`${BASE}/routines`, { method: 'POST', ...json(input) })
  },
  updateRoutine(id: string, patch: Partial<Omit<GroomingRoutine, 'id' | 'createdAt' | 'updatedAt'>>): Promise<GroomingRoutine> {
    return request<GroomingRoutine>(`${BASE}/routines/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteRoutine(id: string): Promise<void> {
    return request<void>(`${BASE}/routines/${id}`, { method: 'DELETE' })
  },

  // Schedules
  getSchedules(): Promise<GroomingSchedule[]> {
    return request<GroomingSchedule[]>(`${BASE}/schedules`)
  },
  createSchedule(input: z.infer<typeof CreateScheduleSchema>): Promise<GroomingSchedule> {
    return request<GroomingSchedule>(`${BASE}/schedules`, { method: 'POST', ...json(input) })
  },
  updateSchedule(id: string, patch: Partial<Omit<GroomingSchedule, 'id' | 'createdAt'>>): Promise<GroomingSchedule> {
    return request<GroomingSchedule>(`${BASE}/schedules/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteSchedule(id: string): Promise<void> {
    return request<void>(`${BASE}/schedules/${id}`, { method: 'DELETE' })
  },

  // Wardrobe
  getWardrobe(): Promise<WardrobeItem[]> {
    return request<WardrobeItem[]>(`${BASE}/wardrobe`)
  },
  createWardrobeItem(input: z.infer<typeof CreateWardrobeItemSchema>): Promise<WardrobeItem> {
    return request<WardrobeItem>(`${BASE}/wardrobe`, { method: 'POST', ...json(input) })
  },
  updateWardrobeItem(id: string, patch: Partial<Omit<WardrobeItem, 'id' | 'createdAt'>>): Promise<WardrobeItem> {
    return request<WardrobeItem>(`${BASE}/wardrobe/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteWardrobeItem(id: string): Promise<void> {
    return request<void>(`${BASE}/wardrobe/${id}`, { method: 'DELETE' })
  },

  // Outfits
  getOutfits(): Promise<OutfitIdea[]> {
    return request<OutfitIdea[]>(`${BASE}/outfits`)
  },
  createOutfit(input: z.infer<typeof CreateOutfitIdeaSchema>): Promise<OutfitIdea> {
    return request<OutfitIdea>(`${BASE}/outfits`, { method: 'POST', ...json(input) })
  },
  updateOutfit(id: string, patch: Partial<Omit<OutfitIdea, 'id' | 'createdAt'>>): Promise<OutfitIdea> {
    return request<OutfitIdea>(`${BASE}/outfits/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteOutfit(id: string): Promise<void> {
    return request<void>(`${BASE}/outfits/${id}`, { method: 'DELETE' })
  },

  // Inspiration
  getInspiration(): Promise<InspirationItem[]> {
    return request<InspirationItem[]>(`${BASE}/inspiration`)
  },
  createInspirationItem(input: z.infer<typeof CreateInspirationItemSchema>): Promise<InspirationItem> {
    return request<InspirationItem>(`${BASE}/inspiration`, { method: 'POST', ...json(input) })
  },
  updateInspirationItem(id: string, patch: Partial<Omit<InspirationItem, 'id' | 'createdAt'>>): Promise<InspirationItem> {
    return request<InspirationItem>(`${BASE}/inspiration/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteInspirationItem(id: string): Promise<void> {
    return request<void>(`${BASE}/inspiration/${id}`, { method: 'DELETE' })
  },
}
