import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { professionalService } from './service'
import { CreateReviewSchema, CreateWorkHistorySchema, CreateSkillSchema, CreateCertSchema } from './schema'

export const professionalTools: McpTool[] = [
  {
    name: 'professional_resumes_list',
    description: 'List all uploaded resume files',
    inputSchema: z.object({}),
    handler: async () => professionalService.getResumes(),
  },
  {
    name: 'professional_reviews_list',
    description: 'List all performance reviews',
    inputSchema: z.object({}),
    handler: async () => professionalService.getReviews(),
  },
  {
    name: 'professional_review_create',
    description: 'Create a performance review entry',
    inputSchema: CreateReviewSchema,
    handler: async (input) => professionalService.createReview(input as z.infer<typeof CreateReviewSchema>),
  },
  {
    name: 'professional_work_list',
    description: 'List full work history',
    inputSchema: z.object({}),
    handler: async () => professionalService.getWork(),
  },
  {
    name: 'professional_work_create',
    description: 'Add a work history entry',
    inputSchema: CreateWorkHistorySchema,
    handler: async (input) => professionalService.createWork(input as z.infer<typeof CreateWorkHistorySchema>),
  },
  {
    name: 'professional_skills_list',
    description: 'List all professional skills',
    inputSchema: z.object({}),
    handler: async () => professionalService.getSkills(),
  },
  {
    name: 'professional_skill_create',
    description: 'Add a professional skill',
    inputSchema: CreateSkillSchema,
    handler: async (input) => professionalService.createSkill(input as z.infer<typeof CreateSkillSchema>),
  },
  {
    name: 'professional_certs_list',
    description: 'List all certifications',
    inputSchema: z.object({}),
    handler: async () => professionalService.getCerts(),
  },
  {
    name: 'professional_cert_create',
    description: 'Add a certification',
    inputSchema: CreateCertSchema,
    handler: async (input) => professionalService.createCert(input as z.infer<typeof CreateCertSchema>),
  },
]
