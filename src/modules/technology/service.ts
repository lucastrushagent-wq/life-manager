import type { z } from 'zod'
import type { Device, TechSubscription } from './types'
import type {
  CreateDeviceSchema, UpdateDeviceSchema,
  CreateSubscriptionSchema, UpdateSubscriptionSchema,
} from './schema'

const BASE = '/api/technology'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.status === 204 ? (undefined as T) : res.json()
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export interface DeviceQuery {
  category?: string
  status?: string
  q?: string
}

export interface ExpiringResult {
  warranties: Device[]
  renewals: TechSubscription[]
}

export const technologyService = {
  // Devices
  getDevices(query: DeviceQuery = {}): Promise<Device[]> {
    const params = new URLSearchParams()
    if (query.category) params.set('category', query.category)
    if (query.status) params.set('status', query.status)
    if (query.q) params.set('q', query.q)
    const qs = params.toString()
    return req<Device[]>(qs ? `${BASE}/devices?${qs}` : `${BASE}/devices`)
  },
  createDevice(input: z.infer<typeof CreateDeviceSchema>): Promise<Device> {
    return req<Device>(`${BASE}/devices`, { method: 'POST', ...json(input) })
  },
  updateDevice(id: string, patch: z.infer<typeof UpdateDeviceSchema>): Promise<Device> {
    return req<Device>(`${BASE}/devices/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteDevice(id: string): Promise<void> {
    return req<void>(`${BASE}/devices/${id}`, { method: 'DELETE' })
  },

  // Subscriptions
  getSubscriptions(status?: string): Promise<TechSubscription[]> {
    return req<TechSubscription[]>(status ? `${BASE}/subscriptions?status=${status}` : `${BASE}/subscriptions`)
  },
  createSubscription(input: z.infer<typeof CreateSubscriptionSchema>): Promise<TechSubscription> {
    return req<TechSubscription>(`${BASE}/subscriptions`, { method: 'POST', ...json(input) })
  },
  updateSubscription(id: string, patch: z.infer<typeof UpdateSubscriptionSchema>): Promise<TechSubscription> {
    return req<TechSubscription>(`${BASE}/subscriptions/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteSubscription(id: string): Promise<void> {
    return req<void>(`${BASE}/subscriptions/${id}`, { method: 'DELETE' })
  },

  /** Warranties lapsing and subscriptions renewing within `days`. */
  getExpiring(days = 60): Promise<ExpiringResult> {
    return req<ExpiringResult>(`${BASE}/expiring?days=${days}`)
  },
}
