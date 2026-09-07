import { z } from 'zod'
import type { TweedScheduleItem, TweedMedicalRecord } from './types'

export const SCHEDULE_ACTIVITIES = [
  'meal', 'walk', 'medication', 'play', 'toilet', 'grooming', 'bedtime', 'other',
] as const

export const MEDICAL_TYPES = [
  'checkup', 'vaccination', 'illness', 'injury', 'surgery',
  'dental', 'medication', 'parasite', 'grooming', 'other',
] as const

export const CLAIM_STATUSES = [
  'not_claimable', 'not_submitted', 'submitted', 'paid', 'rejected',
] as const

export const TweedProfileSchema = z.object({
  breed: z.string().optional(),
  dateOfBirth: z.string().optional(),
  weightKg: z.number().optional(),
  colour: z.string().optional(),
  microchipNumber: z.string().optional(),
  desexed: z.boolean().optional(),
  foodBrand: z.string().optional(),
  foodAmount: z.string().optional(),
  foodLocation: z.string().optional(),
  feedingNotes: z.string().optional(),
  treats: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  toys: z.string().optional(),
  walkRoutine: z.string().optional(),
  toiletRoutine: z.string().optional(),
  sleepRoutine: z.string().optional(),
  behaviourNotes: z.string().optional(),
  commands: z.string().optional(),
  houseRules: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  vetName: z.string().optional(),
  vetPhone: z.string().optional(),
  vetAddress: z.string().optional(),
  afterHoursVetName: z.string().optional(),
  afterHoursVetPhone: z.string().optional(),
})

export const TweedScheduleItemSchema = z.object({
  id: z.string(),
  time: z.string().min(1),
  activity: z.enum(SCHEDULE_ACTIVITIES),
  title: z.string().min(1),
  details: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<TweedScheduleItem>

export const CreateScheduleItemSchema = TweedScheduleItemSchema.omit({ id: true, createdAt: true })
export const UpdateScheduleItemSchema = CreateScheduleItemSchema.partial()

export const TweedMedicalRecordSchema = z.object({
  id: z.string(),
  date: z.string().min(1),
  type: z.enum(MEDICAL_TYPES),
  title: z.string().min(1),
  description: z.string().optional(),
  vet: z.string().optional(),
  cost: z.number().optional(),
  followUpDate: z.string().optional(),
  claimStatus: z.enum(CLAIM_STATUSES),
  amountClaimed: z.number().optional(),
  amountReimbursed: z.number().optional(),
  claimSubmittedDate: z.string().optional(),
  claimNotes: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<TweedMedicalRecord>

export const CreateMedicalRecordSchema = TweedMedicalRecordSchema.omit({ id: true, createdAt: true })
export const UpdateMedicalRecordSchema = CreateMedicalRecordSchema.partial()

export const TweedInsuranceSchema = z.object({
  provider: z.string().optional(),
  policyNumber: z.string().optional(),
  annualPremium: z.number().optional(),
  excess: z.number().optional(),
  reimbursementRate: z.number().optional(),
  annualLimit: z.number().optional(),
  renewalDate: z.string().optional(),
  contactPhone: z.string().optional(),
  portalUrl: z.string().optional(),
  coverageNotes: z.string().optional(),
})
