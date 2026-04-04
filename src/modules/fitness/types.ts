export type WorkoutType =
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'strength'
  | 'hiit'
  | 'yoga'
  | 'walking'
  | 'rowing'
  | 'pilates'
  | 'crossfit'
  | 'other'

export interface WorkoutSession {
  id: string
  date: string
  type: WorkoutType
  durationMins: number
  distanceKm?: number
  calories?: number
  avgHr?: number
  maxHr?: number
  notes?: string
  createdAt: string
}

export interface StrengthSet {
  id: string
  date: string
  exercise: string
  sets: number
  reps: number
  weightKg?: number
  notes?: string
  createdAt: string
}

export interface PersonalRecord {
  id: string
  category: 'strength' | 'cardio'
  name: string      // e.g. 'Bench Press', '5K Run'
  value: number
  unit: string      // 'kg', 'min', 'km/h', etc.
  date: string
  notes?: string
  createdAt: string
}
