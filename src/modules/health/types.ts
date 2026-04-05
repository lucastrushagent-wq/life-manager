export type MetricCategory = 'body' | 'activity'
export type BodyMetric = 'weight' | 'body_fat' | 'bmi' | 'muscle_mass' | 'hydration' | 'bone_mass' | 'visceral_fat' | 'metabolic_age'
export type ActivityMetric = 'steps' | 'resting_hr' | 'sleep_hours' | 'active_minutes' | 'vo2_max' | 'stress' | 'sleep_deep_hours' | 'sleep_light_hours' | 'sleep_rem_hours' | 'sleep_respiration' | 'body_battery' | 'spo2' | 'sleep_score' | 'sleep_awake_mins' | 'sleep_avg_hr' | 'hrv_7day'
export type HealthMetric = BodyMetric | ActivityMetric

export interface HealthMetricEntry {
  id: string
  date: string
  category: MetricCategory
  metric: HealthMetric
  value: number
  unit: string
  notes?: string
  createdAt: string
}

export interface BloodWorkEntry {
  id: string
  testDate: string
  marker: string
  value: number
  unit: string
  referenceMin?: number
  referenceMax?: number
  notes?: string
  createdAt: string
}

export type MedHistoryCategory = 'condition' | 'surgery' | 'allergy' | 'family_history' | 'immunization' | 'other'
export type Severity = 'mild' | 'moderate' | 'severe'
export type ConditionStatus = 'active' | 'resolved' | 'managed'

export interface MedicalHistoryEntry {
  id: string
  category: MedHistoryCategory
  title: string
  date?: string
  notes?: string
  severity?: Severity
  status?: ConditionStatus
  createdAt: string
}

export interface Medication {
  id: string
  name: string
  dose: string
  frequency: string
  purpose?: string
  startDate?: string
  refillDate?: string
  active: boolean
  notes?: string
  createdAt: string
}
