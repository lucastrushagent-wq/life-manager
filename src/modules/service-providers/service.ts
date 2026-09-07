import { z } from 'zod'
import type { ServiceProvider } from './types'
import { CreateServiceProviderSchema } from './schema'

const BASE = 'http://localhost:3001/api/service-providers'

export type CreateProviderData = z.infer<typeof CreateServiceProviderSchema>

export interface ProviderQuery {
  category?: string
  q?: string
  archived?: boolean
}

export const serviceProviderService = {
  async getAll(query: ProviderQuery = {}): Promise<ServiceProvider[]> {
    const params = new URLSearchParams()
    if (query.category) params.set('category', query.category)
    if (query.q) params.set('q', query.q)
    if (query.archived) params.set('archived', 'true')
    const qs = params.toString()
    const res = await fetch(qs ? `${BASE}?${qs}` : BASE)
    if (!res.ok) throw new Error('Failed to fetch service providers')
    return res.json()
  },

  async getById(id: string): Promise<ServiceProvider> {
    const res = await fetch(`${BASE}/${id}`)
    if (!res.ok) throw new Error('Failed to fetch service provider')
    return res.json()
  },

  async create(input: CreateProviderData): Promise<ServiceProvider> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error('Failed to create service provider')
    return res.json()
  },

  async update(id: string, patch: Partial<Omit<ServiceProvider, 'id' | 'createdAt'>>): Promise<ServiceProvider> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error('Failed to update service provider')
    return res.json()
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete service provider')
  },

  async logVisit(id: string, date?: string): Promise<ServiceProvider> {
    const res = await fetch(`${BASE}/${id}/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    })
    if (!res.ok) throw new Error('Failed to log visit')
    return res.json()
  },
}
