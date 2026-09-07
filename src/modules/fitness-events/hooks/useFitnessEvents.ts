import { useEffect, useMemo, useState } from 'react'
import { useFitnessEventsStore } from '../store'
import type { FitnessEvent, FitnessEventCategory } from '../types'

/**
 * Registration state for a race, or null when no opening date is set.
 * `days` is negative once registration has opened.
 */
export function registrationInfo(event: FitnessEvent): { days: number; openNow: boolean; closed: boolean } | null {
  if (!event.registrationOpensDate) return null
  const today = new Date().toISOString().slice(0, 10)
  const days = Math.round(
    (new Date(event.registrationOpensDate + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000
  )
  const closed = event.registrationClosesDate != null && event.registrationClosesDate < today
  return { days, openNow: days <= 0 && !closed, closed }
}

export function registrationLabel(days: number, closed: boolean): string {
  if (closed) return 'Registration closed'
  if (days < 0) return 'Registration open'
  if (days === 0) return 'Registration opens today'
  if (days === 1) return 'Registration opens tomorrow'
  return `Registration opens in ${days}d`
}

export function daysUntil(date?: string): string {
  if (!date) return ''
  const today = new Date().toISOString().slice(0, 10)
  const diff = Math.floor(
    (new Date(date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000
  )
  if (diff < 0) return `${Math.abs(diff)}d ago`
  if (diff === 0) return 'Today!'
  if (diff === 1) return 'Tomorrow'
  return `In ${diff}d`
}

export function useFitnessEvents() {
  const { events, load, create, update, remove } = useFitnessEventsStore()
  const [filterCategory, setFilterCategory] = useState<FitnessEventCategory | ''>('')

  useEffect(() => { load() }, [load])

  const upcoming = useMemo(
    () => events
      .filter(e => e.type === 'upcoming')
      .sort((a, b) => (a.date ?? 'z') < (b.date ?? 'z') ? -1 : 1),
    [events],
  )

  const goals = useMemo(
    () => events
      .filter(e => e.type === 'goal')
      .filter(e => !filterCategory || e.category === filterCategory)
      .sort((a, b) => {
        if (a.alertEnabled !== b.alertEnabled) return a.alertEnabled ? -1 : 1
        return a.name.localeCompare(b.name)
      }),
    [events, filterCategory],
  )

  const alertCount = useMemo(
    () => events.filter(e => e.type === 'goal' && e.alertEnabled).length,
    [events],
  )

  /** Registration open now, or opening within 30 days, and not yet entered. */
  const registrationSoon = useMemo(
    () => events
      .filter(e => e.status !== 'registered' && e.status !== 'completed')
      .map(event => ({ event, reg: registrationInfo(event) }))
      .filter((x): x is { event: FitnessEvent; reg: NonNullable<ReturnType<typeof registrationInfo>> } =>
        x.reg !== null && !x.reg.closed && x.reg.days <= 30)
      .sort((a, b) => a.reg.days - b.reg.days)
      .map(({ event, reg }) => ({ event, days: reg.days, openNow: reg.openNow })),
    [events],
  )

  /** Completed races with a recorded time — the results log. */
  const results = useMemo(
    () => events
      .filter(e => e.status === 'completed' && e.resultTime)
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
    [events],
  )

  return {
    events, upcoming, goals, alertCount, registrationSoon, results,
    filterCategory, setFilterCategory,
    create, update, remove,
  }
}
