import type { Holding } from './types'

const API = '/api/investments'

export const investmentsService = {
  async getHoldings(): Promise<Holding[]> {
    const r = await fetch(`${API}/holdings`)
    if (!r.ok) throw new Error('Failed to fetch holdings')
    return r.json()
  },
  async addHolding(data: Omit<Holding, 'id' | 'createdAt'>): Promise<Holding> {
    const r = await fetch(`${API}/holdings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!r.ok) throw new Error('Failed to add holding')
    return r.json()
  },
  async updateHolding(id: string, data: Partial<Omit<Holding, 'id' | 'createdAt'>>): Promise<Holding> {
    const r = await fetch(`${API}/holdings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!r.ok) throw new Error('Failed to update holding')
    return r.json()
  },
  async deleteHolding(id: string): Promise<void> {
    const r = await fetch(`${API}/holdings/${id}`, { method: 'DELETE' })
    if (!r.ok) throw new Error('Failed to delete holding')
  },
}
