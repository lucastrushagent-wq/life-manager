import { useEffect, useMemo } from 'react'
import { useTweedStore } from '../store'
import type { TweedMedicalRecord } from '../types'

/** Whole years and months since a date of birth, for display. */
export function formatAge(dateOfBirth?: string): string | null {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth + 'T00:00:00')
  if (isNaN(dob.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  let months = now.getMonth() - dob.getMonth()
  if (now.getDate() < dob.getDate()) months--
  if (months < 0) { years--; months += 12 }
  if (years < 0) return null
  if (years === 0) return `${months}mo`
  return months === 0 ? `${years}y` : `${years}y ${months}mo`
}

export function daysUntil(date?: string): number | null {
  if (!date) return null
  const today = new Date().toISOString().slice(0, 10)
  return Math.round(
    (new Date(date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000
  )
}

export function useTweed() {
  const store = useTweedStore()
  const { medical, load } = store

  useEffect(() => { load() }, [load])

  /** Costs that could be claimed but have not been submitted yet. */
  const unsubmittedClaims = useMemo(
    () => medical.filter(m => m.claimStatus === 'not_submitted' && (m.cost ?? 0) > 0),
    [medical],
  )

  /** Follow-ups due within 30 days, or already overdue. */
  const upcomingFollowUps = useMemo(
    () => medical
      .map(record => ({ record, days: daysUntil(record.followUpDate) }))
      .filter((x): x is { record: TweedMedicalRecord; days: number } =>
        x.days !== null && x.days <= 30)
      .sort((a, b) => a.days - b.days),
    [medical],
  )

  return { ...store, unsubmittedClaims, upcomingFollowUps }
}
