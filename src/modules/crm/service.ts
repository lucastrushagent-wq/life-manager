import { z } from 'zod'
import type { Contact, Interaction, KeyDate } from './types'
import { CreateContactSchema, CreateInteractionSchema, CreateKeyDateSchema } from './schema'

const BASE = '/api/contacts'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.status === 204 ? (undefined as T) : res.json()
}

export const crmService = {
  // Contacts
  getAll(): Promise<Contact[]> {
    return request<Contact[]>(BASE)
  },
  create(input: z.infer<typeof CreateContactSchema>): Promise<Contact> {
    const contact = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    return request<Contact>(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    })
  },
  update(id: string, patch: Partial<Omit<Contact, 'id' | 'createdAt' | 'lastContactedAt'>>): Promise<Contact> {
    return request<Contact>(`${BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  },
  delete(id: string): Promise<void> {
    return request<void>(`${BASE}/${id}`, { method: 'DELETE' })
  },

  // Interactions
  getInteractions(contactId: string): Promise<Interaction[]> {
    return request<Interaction[]>(`${BASE}/${contactId}/interactions`)
  },
  addInteraction(contactId: string, input: z.infer<typeof CreateInteractionSchema>): Promise<Interaction> {
    const interaction = { ...input, id: crypto.randomUUID(), contactId, createdAt: new Date().toISOString() }
    return request<Interaction>(`${BASE}/${contactId}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interaction),
    })
  },
  deleteInteraction(contactId: string, interactionId: string): Promise<void> {
    return request<void>(`${BASE}/${contactId}/interactions/${interactionId}`, { method: 'DELETE' })
  },

  // Key dates
  getKeyDates(contactId: string): Promise<KeyDate[]> {
    return request<KeyDate[]>(`${BASE}/${contactId}/key-dates`)
  },
  addKeyDate(contactId: string, input: z.infer<typeof CreateKeyDateSchema>): Promise<KeyDate> {
    const keyDate = { ...input, id: crypto.randomUUID(), contactId }
    return request<KeyDate>(`${BASE}/${contactId}/key-dates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keyDate),
    })
  },
  deleteKeyDate(contactId: string, keyDateId: string): Promise<void> {
    return request<void>(`${BASE}/${contactId}/key-dates/${keyDateId}`, { method: 'DELETE' })
  },
}
