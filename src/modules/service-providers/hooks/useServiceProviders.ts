import { useEffect, useMemo, useState } from 'react'
import { useServiceProviderStore } from '../store'
import type { ProviderCategory, ServiceProvider } from '../types'

/** Days until this provider is next due, or null when no cadence is set. */
export function daysUntilDue(provider: ServiceProvider): number | null {
  if (!provider.frequencyDays) return null
  if (!provider.lastVisit) return 0 // never visited but has a cadence — treat as due now
  const last = new Date(provider.lastVisit + 'T00:00:00').getTime()
  const due = last + provider.frequencyDays * 86_400_000
  return Math.round((due - Date.now()) / 86_400_000)
}

export function useServiceProviders() {
  const { providers, loading, showArchived, load, setShowArchived, create, update, remove, logVisit } =
    useServiceProviderStore()

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<ProviderCategory | 'all'>('all')

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return providers.filter(p => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false
      if (!q) return true
      return [p.name, p.specialty, p.preferences, p.notes, p.address]
        .some(field => field?.toLowerCase().includes(q))
    })
  }, [providers, search, filterCategory])

  const grouped = useMemo(() => {
    const map = new Map<ProviderCategory, ServiceProvider[]>()
    for (const p of filtered) {
      const list = map.get(p.category) ?? []
      list.push(p)
      map.set(p.category, list)
    }
    return map
  }, [filtered])

  const dueSoon = useMemo(
    () => providers
      .map(p => ({ provider: p, days: daysUntilDue(p) }))
      .filter((x): x is { provider: ServiceProvider; days: number } => x.days !== null && x.days <= 14)
      .sort((a, b) => a.days - b.days),
    [providers],
  )

  return {
    providers, filtered, grouped, dueSoon, loading,
    search, setSearch,
    filterCategory, setFilterCategory,
    showArchived, setShowArchived,
    create, update, remove, logVisit,
  }
}
