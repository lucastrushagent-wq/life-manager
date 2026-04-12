export type SkillCategory = 'technical' | 'soft' | 'language' | 'other'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface ResumeFile {
  id: string
  originalName: string
  storedName: string
  mimeType: string
  uploadedAt: string
}

export interface PerformanceReview {
  id: string
  date: string
  period?: string
  company?: string
  role?: string
  rating?: string
  summary?: string
  strengths?: string
  improvements?: string
  notes?: string
  createdAt: string
}

export interface WorkHistoryEntry {
  id: string
  company: string
  title: string
  startDate: string
  endDate?: string
  location?: string
  description?: string
  createdAt: string
}

export interface ProfessionalSkill {
  id: string
  name: string
  category: SkillCategory
  level?: SkillLevel
  notes?: string
  createdAt: string
}

export interface ProfessionalCert {
  id: string
  name: string
  issuer?: string
  dateEarned?: string
  expiryDate?: string
  notes?: string
  createdAt: string
}
