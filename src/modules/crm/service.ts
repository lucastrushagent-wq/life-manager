import { z } from 'zod'
import type { Contact } from './types'
import { CreateContactSchema } from './schema'

const KEY = 'life-manager:contacts'

function load(): Contact[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(contacts: Contact[]): void {
  localStorage.setItem(KEY, JSON.stringify(contacts))
}

export const crmService = {
  getAll(): Contact[] {
    return load()
  },
  create(input: z.infer<typeof CreateContactSchema>): Contact {
    const contact: Contact = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    save([...load(), contact])
    return contact
  },
  update(id: string, patch: Partial<Omit<Contact, 'id' | 'createdAt'>>): Contact {
    const contacts = load()
    const idx = contacts.findIndex(c => c.id === id)
    if (idx === -1) throw new Error(`Contact ${id} not found`)
    contacts[idx] = { ...contacts[idx], ...patch }
    save(contacts)
    return contacts[idx]
  },
  delete(id: string): void {
    save(load().filter(c => c.id !== id))
  },
}
