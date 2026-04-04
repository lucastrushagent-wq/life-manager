export type GoalCategory =
  | 'health'
  | 'fitness'
  | 'career'
  | 'financial'
  | 'relationships'
  | 'family'
  | 'personal_growth'
  | 'learning'
  | 'mental_wellbeing'
  | 'creativity'
  | 'hobbies'
  | 'travel'
  | 'community'
  | 'spirituality'
  | 'home'
  | 'adventure'
  | 'other'

export type GoalStatus = 'active' | 'achieved' | 'paused' | 'abandoned'
export type GoalTimeframe = 'short' | 'medium' | 'long' | 'lifetime'

export interface VisionStatement {
  content: string
  updatedAt: string
}

export interface MissionStatement {
  content: string
  updatedAt: string
}

export interface CoreValue {
  id: string
  name: string
  description?: string
  sortOrder: number
  createdAt: string
}

export interface Goal {
  id: string
  category: GoalCategory
  title: string
  description?: string
  timeframe: GoalTimeframe
  targetDate?: string
  status: GoalStatus
  createdAt: string
}

export interface Manifesto {
  content: string
  updatedAt: string
}

export interface VisionImage {
  exists: boolean
  url?: string
}
