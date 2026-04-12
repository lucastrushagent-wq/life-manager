import { z } from 'zod'
import type { ResumeFile, PerformanceReview, WorkHistoryEntry, ProfessionalSkill, ProfessionalCert } from './types'
import { CreateReviewSchema, CreateWorkHistorySchema, CreateSkillSchema, CreateCertSchema } from './schema'

const BASE = '/api/professional'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.status === 204 ? (undefined as T) : res.json()
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const professionalService = {
  // Resumes
  getResumes(): Promise<ResumeFile[]> {
    return req<ResumeFile[]>(`${BASE}/resumes`)
  },
  uploadResume(dataUrl: string, originalName: string): Promise<ResumeFile> {
    return req<ResumeFile>(`${BASE}/resumes`, { method: 'POST', ...json({ dataUrl, originalName }) })
  },
  deleteResume(id: string): Promise<void> {
    return req<void>(`${BASE}/resumes/${id}`, { method: 'DELETE' })
  },

  // Reviews
  getReviews(): Promise<PerformanceReview[]> {
    return req<PerformanceReview[]>(`${BASE}/reviews`)
  },
  createReview(input: z.infer<typeof CreateReviewSchema>): Promise<PerformanceReview> {
    return req<PerformanceReview>(`${BASE}/reviews`, { method: 'POST', ...json(input) })
  },
  updateReview(id: string, patch: Partial<Omit<PerformanceReview, 'id' | 'createdAt'>>): Promise<PerformanceReview> {
    return req<PerformanceReview>(`${BASE}/reviews/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteReview(id: string): Promise<void> {
    return req<void>(`${BASE}/reviews/${id}`, { method: 'DELETE' })
  },

  // Work history
  getWork(): Promise<WorkHistoryEntry[]> {
    return req<WorkHistoryEntry[]>(`${BASE}/work`)
  },
  createWork(input: z.infer<typeof CreateWorkHistorySchema>): Promise<WorkHistoryEntry> {
    return req<WorkHistoryEntry>(`${BASE}/work`, { method: 'POST', ...json(input) })
  },
  updateWork(id: string, patch: Partial<Omit<WorkHistoryEntry, 'id' | 'createdAt'>>): Promise<WorkHistoryEntry> {
    return req<WorkHistoryEntry>(`${BASE}/work/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteWork(id: string): Promise<void> {
    return req<void>(`${BASE}/work/${id}`, { method: 'DELETE' })
  },

  // Skills
  getSkills(): Promise<ProfessionalSkill[]> {
    return req<ProfessionalSkill[]>(`${BASE}/skills`)
  },
  createSkill(input: z.infer<typeof CreateSkillSchema>): Promise<ProfessionalSkill> {
    return req<ProfessionalSkill>(`${BASE}/skills`, { method: 'POST', ...json(input) })
  },
  updateSkill(id: string, patch: Partial<Omit<ProfessionalSkill, 'id' | 'createdAt'>>): Promise<ProfessionalSkill> {
    return req<ProfessionalSkill>(`${BASE}/skills/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteSkill(id: string): Promise<void> {
    return req<void>(`${BASE}/skills/${id}`, { method: 'DELETE' })
  },

  // Certifications
  getCerts(): Promise<ProfessionalCert[]> {
    return req<ProfessionalCert[]>(`${BASE}/certs`)
  },
  createCert(input: z.infer<typeof CreateCertSchema>): Promise<ProfessionalCert> {
    return req<ProfessionalCert>(`${BASE}/certs`, { method: 'POST', ...json(input) })
  },
  updateCert(id: string, patch: Partial<Omit<ProfessionalCert, 'id' | 'createdAt'>>): Promise<ProfessionalCert> {
    return req<ProfessionalCert>(`${BASE}/certs/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteCert(id: string): Promise<void> {
    return req<void>(`${BASE}/certs/${id}`, { method: 'DELETE' })
  },
}
