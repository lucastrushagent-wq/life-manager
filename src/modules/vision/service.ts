import type { VisionStatement, CoreValue, Goal, Manifesto } from './types'

const API = '/api/vision'

export const visionService = {
  // Vision statement
  async getVision(): Promise<VisionStatement | null> {
    const r = await fetch(`${API}/statement`)
    if (!r.ok) throw new Error('Failed to fetch vision')
    return r.json()
  },
  async saveVision(content: string): Promise<VisionStatement> {
    const r = await fetch(`${API}/statement`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) })
    if (!r.ok) throw new Error('Failed to save vision')
    return r.json()
  },

  // Core values
  async getValues(): Promise<CoreValue[]> {
    const r = await fetch(`${API}/values`)
    if (!r.ok) throw new Error('Failed to fetch values')
    return r.json()
  },
  async addValue(data: Pick<CoreValue, 'name' | 'description'>): Promise<CoreValue> {
    const r = await fetch(`${API}/values`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!r.ok) throw new Error('Failed to add value')
    return r.json()
  },
  async updateValue(id: string, patch: Partial<Pick<CoreValue, 'name' | 'description' | 'sortOrder'>>): Promise<CoreValue> {
    const r = await fetch(`${API}/values/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    if (!r.ok) throw new Error('Failed to update value')
    return r.json()
  },
  async deleteValue(id: string): Promise<void> {
    const r = await fetch(`${API}/values/${id}`, { method: 'DELETE' })
    if (!r.ok) throw new Error('Failed to delete value')
  },

  // Goals
  async getGoals(): Promise<Goal[]> {
    const r = await fetch(`${API}/goals`)
    if (!r.ok) throw new Error('Failed to fetch goals')
    return r.json()
  },
  async addGoal(data: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    const r = await fetch(`${API}/goals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!r.ok) throw new Error('Failed to add goal')
    return r.json()
  },
  async updateGoal(id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>): Promise<Goal> {
    const r = await fetch(`${API}/goals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    if (!r.ok) throw new Error('Failed to update goal')
    return r.json()
  },
  async deleteGoal(id: string): Promise<void> {
    const r = await fetch(`${API}/goals/${id}`, { method: 'DELETE' })
    if (!r.ok) throw new Error('Failed to delete goal')
  },

  // Manifesto
  async getManifesto(): Promise<Manifesto | null> {
    const r = await fetch(`${API}/manifesto`)
    if (!r.ok) throw new Error('Failed to fetch manifesto')
    return r.json()
  },
  async saveManifesto(content: string): Promise<Manifesto> {
    const r = await fetch(`${API}/manifesto`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) })
    if (!r.ok) throw new Error('Failed to save manifesto')
    return r.json()
  },
}
