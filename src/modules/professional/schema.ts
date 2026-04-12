import { z } from 'zod'
import type { PerformanceReview, WorkHistoryEntry, ProfessionalSkill, ProfessionalCert } from './types'

export const PerformanceReviewSchema = z.object({
  id: z.string(),
  date: z.string().min(1),
  period: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  rating: z.string().optional(),
  summary: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<PerformanceReview>

export const CreateReviewSchema = PerformanceReviewSchema.omit({ id: true, createdAt: true })

export const WorkHistorySchema = z.object({
  id: z.string(),
  company: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<WorkHistoryEntry>

export const CreateWorkHistorySchema = WorkHistorySchema.omit({ id: true, createdAt: true })

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.enum(['technical', 'soft', 'language', 'other']),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<ProfessionalSkill>

export const CreateSkillSchema = SkillSchema.omit({ id: true, createdAt: true })

export const CertSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  issuer: z.string().optional(),
  dateEarned: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<ProfessionalCert>

export const CreateCertSchema = CertSchema.omit({ id: true, createdAt: true })
