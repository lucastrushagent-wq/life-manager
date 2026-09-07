import { useEffect, useMemo, useState } from 'react'
import { useTechnologyStore } from '../store'
import type { Device, DeviceCategory, TechSubscription } from '../types'

/** Days until an ISO date, negative once past. Null when no date. */
export function daysUntil(date?: string): number | null {
  if (!date) return null
  const today = new Date().toISOString().slice(0, 10)
  return Math.round(
    (new Date(date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000
  )
}

/** Normalise any billing cycle to an annual figure so subscriptions are comparable. */
export function annualCost(sub: TechSubscription): number {
  if (sub.cost == null) return 0
  switch (sub.billingCycle) {
    case 'monthly': return sub.cost * 12
    case 'quarterly': return sub.cost * 4
    case 'annual': return sub.cost
  }
}

export function useTechnology() {
  const {
    devices, subscriptions, loading, load,
    createDevice, updateDevice, removeDevice,
    createSubscription, updateSubscription, removeSubscription,
  } = useTechnologyStore()

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<DeviceCategory | 'all'>('all')
  const [showRetired, setShowRetired] = useState(false)

  useEffect(() => { load() }, [load])

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase()
    return devices.filter(d => {
      if (!showRetired && (d.status === 'sold' || d.status === 'retired')) return false
      if (filterCategory !== 'all' && d.category !== filterCategory) return false
      if (!q) return true
      return [d.name, d.brand, d.model, d.assignedTo, d.location, d.notes]
        .some(f => f?.toLowerCase().includes(q))
    })
  }, [devices, search, filterCategory, showRetired])

  const groupedDevices = useMemo(() => {
    const map = new Map<DeviceCategory, Device[]>()
    for (const d of filteredDevices) {
      const list = map.get(d.category) ?? []
      list.push(d)
      map.set(d.category, list)
    }
    return map
  }, [filteredDevices])

  const activeSubscriptions = useMemo(
    () => subscriptions.filter(s => s.status !== 'cancelled'),
    [subscriptions],
  )

  /** Total annual spend across active subscriptions. */
  const totalAnnualCost = useMemo(
    () => activeSubscriptions.reduce((sum, s) => sum + annualCost(s), 0),
    [activeSubscriptions],
  )

  /** Warranties lapsing within 60 days (not already lapsed), soonest first. */
  const warrantiesExpiring = useMemo(
    () => devices
      .filter(d => d.status !== 'sold' && d.status !== 'retired')
      .map(device => ({ device, days: daysUntil(device.warrantyExpiry) }))
      .filter((x): x is { device: Device; days: number } =>
        x.days !== null && x.days >= 0 && x.days <= 60)
      .sort((a, b) => a.days - b.days),
    [devices],
  )

  /** Active subscriptions renewing within 30 days, or overdue for a date update. */
  const renewalsSoon = useMemo(
    () => subscriptions
      .filter(s => s.status === 'active')
      .map(sub => ({ sub, days: daysUntil(sub.renewalDate) }))
      .filter((x): x is { sub: TechSubscription; days: number } =>
        x.days !== null && x.days <= 30)
      .sort((a, b) => a.days - b.days),
    [subscriptions],
  )

  return {
    devices, filteredDevices, groupedDevices, subscriptions, activeSubscriptions,
    totalAnnualCost, warrantiesExpiring, renewalsSoon, loading,
    search, setSearch,
    filterCategory, setFilterCategory,
    showRetired, setShowRetired,
    createDevice, updateDevice, removeDevice,
    createSubscription, updateSubscription, removeSubscription,
  }
}
