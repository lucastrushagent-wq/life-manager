export type ProductCategory = 'skincare' | 'haircare' | 'grooming' | 'fragrance' | 'other'
export type ProductStatus = 'active' | 'finished' | 'wishlist'

export type RoutineTimeOfDay = 'morning' | 'evening' | 'weekly' | 'other'

export type WardrobeCategory = 'tops' | 'bottoms' | 'outerwear' | 'shoes' | 'accessories' | 'formal' | 'other'
export type WardrobeStatus = 'owned' | 'wishlist'

export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all'

export type InspirationCategory = 'outfit' | 'grooming' | 'hair' | 'general'

export interface AestheticProduct {
  id: string
  name: string
  brand?: string
  category: ProductCategory
  status: ProductStatus
  rating?: number
  notes?: string
  url?: string
  createdAt: string
}

export interface GroomingRoutine {
  id: string
  name: string
  timeOfDay: RoutineTimeOfDay
  steps: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface GroomingSchedule {
  id: string
  name: string
  frequencyDays: number
  lastDoneAt?: string
  notes?: string
  createdAt: string
}

export interface WardrobeItem {
  id: string
  name: string
  category: WardrobeCategory
  color?: string
  brand?: string
  status: WardrobeStatus
  notes?: string
  /** Link to the product page this item was (or would be) bought from */
  productUrl?: string
  createdAt: string
}

export interface OutfitIdea {
  id: string
  name: string
  description?: string
  occasion?: string
  season: Season
  notes?: string
  createdAt: string
}

export interface InspirationItem {
  id: string
  title: string
  imageUrl?: string
  sourceUrl?: string
  category: InspirationCategory
  notes?: string
  createdAt: string
}
