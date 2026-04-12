import { create } from 'zustand'
import { z } from 'zod'
import type { ResumeFile, PerformanceReview, WorkHistoryEntry, ProfessionalSkill, ProfessionalCert } from './types'
import { professionalService } from './service'
import { CreateReviewSchema, CreateWorkHistorySchema, CreateSkillSchema, CreateCertSchema } from './schema'

interface ProfessionalStore {
  resumes: ResumeFile[]
  reviews: PerformanceReview[]
  work: WorkHistoryEntry[]
  skills: ProfessionalSkill[]
  certs: ProfessionalCert[]
  uploading: boolean

  load: () => Promise<void>

  uploadResume: (dataUrl: string, originalName: string) => Promise<void>
  deleteResume: (id: string) => Promise<void>

  createReview: (input: z.infer<typeof CreateReviewSchema>) => Promise<void>
  updateReview: (id: string, patch: Partial<Omit<PerformanceReview, 'id' | 'createdAt'>>) => Promise<void>
  deleteReview: (id: string) => Promise<void>

  createWork: (input: z.infer<typeof CreateWorkHistorySchema>) => Promise<void>
  updateWork: (id: string, patch: Partial<Omit<WorkHistoryEntry, 'id' | 'createdAt'>>) => Promise<void>
  deleteWork: (id: string) => Promise<void>

  createSkill: (input: z.infer<typeof CreateSkillSchema>) => Promise<void>
  updateSkill: (id: string, patch: Partial<Omit<ProfessionalSkill, 'id' | 'createdAt'>>) => Promise<void>
  deleteSkill: (id: string) => Promise<void>

  createCert: (input: z.infer<typeof CreateCertSchema>) => Promise<void>
  updateCert: (id: string, patch: Partial<Omit<ProfessionalCert, 'id' | 'createdAt'>>) => Promise<void>
  deleteCert: (id: string) => Promise<void>
}

export const useProfessionalStore = create<ProfessionalStore>((set) => ({
  resumes: [], reviews: [], work: [], skills: [], certs: [], uploading: false,

  load: async () => {
    const [resumes, reviews, work, skills, certs] = await Promise.all([
      professionalService.getResumes(),
      professionalService.getReviews(),
      professionalService.getWork(),
      professionalService.getSkills(),
      professionalService.getCerts(),
    ])
    set({ resumes, reviews, work, skills, certs })
  },

  uploadResume: async (dataUrl, originalName) => {
    set({ uploading: true })
    try {
      const file = await professionalService.uploadResume(dataUrl, originalName)
      set(s => ({ resumes: [file, ...s.resumes] }))
    } finally {
      set({ uploading: false })
    }
  },
  deleteResume: async (id) => {
    await professionalService.deleteResume(id)
    set(s => ({ resumes: s.resumes.filter(r => r.id !== id) }))
  },

  createReview: async (input) => {
    const r = await professionalService.createReview(input)
    set(s => ({ reviews: [r, ...s.reviews] }))
  },
  updateReview: async (id, patch) => {
    const r = await professionalService.updateReview(id, patch)
    set(s => ({ reviews: s.reviews.map(x => x.id === id ? r : x) }))
  },
  deleteReview: async (id) => {
    await professionalService.deleteReview(id)
    set(s => ({ reviews: s.reviews.filter(x => x.id !== id) }))
  },

  createWork: async (input) => {
    const w = await professionalService.createWork(input)
    set(s => ({ work: [w, ...s.work] }))
  },
  updateWork: async (id, patch) => {
    const w = await professionalService.updateWork(id, patch)
    set(s => ({ work: s.work.map(x => x.id === id ? w : x) }))
  },
  deleteWork: async (id) => {
    await professionalService.deleteWork(id)
    set(s => ({ work: s.work.filter(x => x.id !== id) }))
  },

  createSkill: async (input) => {
    const sk = await professionalService.createSkill(input)
    set(s => ({ skills: [...s.skills, sk] }))
  },
  updateSkill: async (id, patch) => {
    const sk = await professionalService.updateSkill(id, patch)
    set(s => ({ skills: s.skills.map(x => x.id === id ? sk : x) }))
  },
  deleteSkill: async (id) => {
    await professionalService.deleteSkill(id)
    set(s => ({ skills: s.skills.filter(x => x.id !== id) }))
  },

  createCert: async (input) => {
    const c = await professionalService.createCert(input)
    set(s => ({ certs: [...s.certs, c] }))
  },
  updateCert: async (id, patch) => {
    const c = await professionalService.updateCert(id, patch)
    set(s => ({ certs: s.certs.map(x => x.id === id ? c : x) }))
  },
  deleteCert: async (id) => {
    await professionalService.deleteCert(id)
    set(s => ({ certs: s.certs.filter(x => x.id !== id) }))
  },
}))
