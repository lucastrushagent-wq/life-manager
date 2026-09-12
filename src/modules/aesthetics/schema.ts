import { z } from 'zod'
import type {
  AestheticProduct, GroomingRoutine, GroomingSchedule,
  WardrobeItem, OutfitIdea, InspirationItem,
} from './types'

// ── Products ─────────────────────────────────────────────────────

export const AestheticProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  brand: z.string().optional(),
  category: z.enum(['skincare', 'haircare', 'grooming', 'fragrance', 'other']),
  status: z.enum(['active', 'finished', 'wishlist']),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  url: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<AestheticProduct>

export const CreateProductSchema = AestheticProductSchema.omit({ id: true, createdAt: true })

// ── Routines ─────────────────────────────────────────────────────

export const GroomingRoutineSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  timeOfDay: z.enum(['morning', 'evening', 'weekly', 'other']),
  steps: z.array(z.string()),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<GroomingRoutine>

export const CreateRoutineSchema = GroomingRoutineSchema.omit({ id: true, createdAt: true, updatedAt: true })

// ── Schedules ────────────────────────────────────────────────────

export const GroomingScheduleSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  frequencyDays: z.number().int().min(1),
  lastDoneAt: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<GroomingSchedule>

export const CreateScheduleSchema = GroomingScheduleSchema.omit({ id: true, createdAt: true })

// ── Wardrobe ─────────────────────────────────────────────────────

export const WardrobeItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['tops', 'bottoms', 'outerwear', 'shoes', 'accessories', 'formal', 'other']),
  color: z.string().optional(),
  brand: z.string().optional(),
  status: z.enum(['owned', 'wishlist']),
  notes: z.string().optional(),
  productUrl: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<WardrobeItem>

export const CreateWardrobeItemSchema = WardrobeItemSchema.omit({ id: true, createdAt: true })

// ── Outfits ──────────────────────────────────────────────────────

export const OutfitIdeaSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  occasion: z.string().optional(),
  season: z.enum(['spring', 'summer', 'fall', 'winter', 'all']),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<OutfitIdea>

export const CreateOutfitIdeaSchema = OutfitIdeaSchema.omit({ id: true, createdAt: true })

// ── Inspiration ──────────────────────────────────────────────────

export const InspirationItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  imageUrl: z.string().optional(),
  sourceUrl: z.string().optional(),
  category: z.enum(['outfit', 'grooming', 'hair', 'general']),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<InspirationItem>

export const CreateInspirationItemSchema = InspirationItemSchema.omit({ id: true, createdAt: true })
