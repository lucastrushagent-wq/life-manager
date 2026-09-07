import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { tweedService } from './service'
import {
  TweedProfileSchema, TweedInsuranceSchema,
  CreateScheduleItemSchema, UpdateScheduleItemSchema,
  CreateMedicalRecordSchema, UpdateMedicalRecordSchema,
} from './schema'

export const tweedTools: McpTool[] = [
  {
    name: 'tweed_handover',
    description:
      'Everything a dog-sitter needs for Tweed in one call: the full care profile (allergies, ' +
      'food and amounts, treats, toys, walk/toilet/sleep routines, behaviour quirks, house rules, ' +
      'vet and emergency contacts) plus his daily schedule. Use this whenever asked what someone ' +
      'looking after Tweed needs to know. Always lead with the allergies.',
    inputSchema: z.object({}),
    handler: async () => tweedService.getHandover(),
  },
  {
    name: 'tweed_profile_get',
    description: 'Get Tweed\'s care profile — allergies, food, routines, behaviour and contacts',
    inputSchema: z.object({}),
    handler: async () => tweedService.getProfile(),
  },
  {
    name: 'tweed_profile_update',
    description: 'Update Tweed\'s care profile. Only the fields provided are changed.',
    inputSchema: TweedProfileSchema,
    handler: async (input) => tweedService.saveProfile(input as z.infer<typeof TweedProfileSchema>),
  },
  {
    name: 'tweed_schedule_list',
    description: 'List Tweed\'s daily schedule — meals, walks, medication and bedtime, in time order',
    inputSchema: z.object({}),
    handler: async () => tweedService.getSchedule(),
  },
  {
    name: 'tweed_schedule_create',
    description: 'Add an item to Tweed\'s daily schedule',
    inputSchema: CreateScheduleItemSchema,
    handler: async (input) => tweedService.createScheduleItem(input as z.infer<typeof CreateScheduleItemSchema>),
  },
  {
    name: 'tweed_schedule_update',
    description: 'Update a schedule item',
    inputSchema: z.object({ id: z.string(), patch: UpdateScheduleItemSchema }),
    handler: async (input) => {
      const { id, patch } = input as { id: string; patch: z.infer<typeof UpdateScheduleItemSchema> }
      return tweedService.updateScheduleItem(id, patch)
    },
  },
  {
    name: 'tweed_schedule_delete',
    description: 'Remove an item from Tweed\'s daily schedule',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => tweedService.deleteScheduleItem((input as { id: string }).id),
  },
  {
    name: 'tweed_medical_list',
    description:
      'List Tweed\'s medical history, newest first. Each record carries its cost and insurance ' +
      'claim state (not_claimable / not_submitted / submitted / paid / rejected).',
    inputSchema: z.object({}),
    handler: async () => tweedService.getMedical(),
  },
  {
    name: 'tweed_medical_create',
    description: 'Record a vet visit, vaccination, illness or other medical event for Tweed',
    inputSchema: CreateMedicalRecordSchema,
    handler: async (input) => tweedService.createMedical(input as z.infer<typeof CreateMedicalRecordSchema>),
  },
  {
    name: 'tweed_medical_update',
    description:
      'Update a medical record — use this to move a claim along, e.g. set claimStatus to ' +
      '"submitted" with amountClaimed, then to "paid" with amountReimbursed once the rebate lands',
    inputSchema: z.object({ id: z.string(), patch: UpdateMedicalRecordSchema }),
    handler: async (input) => {
      const { id, patch } = input as { id: string; patch: z.infer<typeof UpdateMedicalRecordSchema> }
      return tweedService.updateMedical(id, patch)
    },
  },
  {
    name: 'tweed_medical_delete',
    description: 'Delete a medical record',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => tweedService.deleteMedical((input as { id: string }).id),
  },
  {
    name: 'tweed_claims_summary',
    description:
      'Totals for Tweed\'s vet spend and insurance rebates: totalCost, totalReimbursed, ' +
      'outstanding (submitted but unpaid), unclaimed (claimable but not submitted) and netCost. ' +
      'Use this to answer how much has been spent or is still owed back.',
    inputSchema: z.object({}),
    handler: async () => tweedService.getClaimSummary(),
  },
  {
    name: 'tweed_insurance_get',
    description: 'Get Tweed\'s pet insurance policy — provider, policy number, excess, reimbursement rate, limits',
    inputSchema: z.object({}),
    handler: async () => tweedService.getInsurance(),
  },
  {
    name: 'tweed_insurance_update',
    description: 'Update Tweed\'s insurance policy details',
    inputSchema: TweedInsuranceSchema,
    handler: async (input) => tweedService.saveInsurance(input as z.infer<typeof TweedInsuranceSchema>),
  },
]
