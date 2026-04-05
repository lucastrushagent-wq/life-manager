import { useAestheticsStore } from '../store'

export function useAesthetics() {
  return useAestheticsStore()
}

/** Returns days until next due (negative = overdue). Returns null if never done and no baseline. */
export function daysUntilDue(frequencyDays: number, lastDoneAt?: string): number | null {
  if (!lastDoneAt) return null
  const last = new Date(lastDoneAt).getTime()
  const nextDue = last + frequencyDays * 24 * 60 * 60 * 1000
  const now = Date.now()
  return Math.round((nextDue - now) / (24 * 60 * 60 * 1000))
}
