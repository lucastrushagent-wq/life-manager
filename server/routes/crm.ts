import { Router } from 'express'
import { db } from '../db.js'

const router = Router()
type Row = Record<string, unknown>

function toContact(row: Row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
    relationship: JSON.parse(row.relationship as string),
    followUpDays: row.followUpDays ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    lastContactedAt: row.lastContactedAt ?? undefined,
  }
}

function toInteraction(row: Row) {
  return {
    id: row.id,
    contactId: row.contactId,
    date: row.date,
    notes: row.notes,
    createdAt: row.createdAt,
  }
}

function toKeyDate(row: Row) {
  return {
    id: row.id,
    contactId: row.contactId,
    label: row.label,
    month: row.month,
    day: row.day,
  }
}

// Contacts
router.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT c.*,
      (SELECT MAX(i.date) FROM interactions i WHERE i.contactId = c.id) as lastContactedAt
    FROM contacts c
    ORDER BY c.name ASC
  `).all() as Row[]
  res.json(rows.map(toContact))
})

router.post('/', (req, res) => {
  const { id, name, email, phone, company, relationship, followUpDays, notes, createdAt } = req.body
  db.prepare(`
    INSERT INTO contacts (id, name, email, phone, company, relationship, followUpDays, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, email ?? null, phone ?? null, company ?? null, JSON.stringify(relationship ?? []), followUpDays ?? null, notes ?? null, createdAt)
  const row = db.prepare(`
    SELECT c.*, (SELECT MAX(i.date) FROM interactions i WHERE i.contactId = c.id) as lastContactedAt
    FROM contacts c WHERE c.id = ?
  `).get(id) as Row
  res.status(201).json(toContact(row))
})

router.patch('/:id', (req, res) => {
  const { id } = req.params
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Row | undefined
  if (!row) return res.status(404).json({ error: 'Contact not found' })

  const p = req.body
  db.prepare(`
    UPDATE contacts SET name = ?, email = ?, phone = ?, company = ?, relationship = ?, followUpDays = ?, notes = ?
    WHERE id = ?
  `).run(
    p.name ?? row.name,
    p.email ?? row.email ?? null,
    p.phone ?? row.phone ?? null,
    p.company ?? row.company ?? null,
    JSON.stringify(p.relationship ?? JSON.parse(row.relationship as string)),
    p.followUpDays !== undefined ? p.followUpDays : (row.followUpDays ?? null),
    p.notes !== undefined ? p.notes : (row.notes ?? null),
    id,
  )
  const updated = db.prepare(`
    SELECT c.*, (SELECT MAX(i.date) FROM interactions i WHERE i.contactId = c.id) as lastContactedAt
    FROM contacts c WHERE c.id = ?
  `).get(id) as Row
  res.json(toContact(updated))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

// Interactions
router.get('/:id/interactions', (req, res) => {
  const rows = db.prepare('SELECT * FROM interactions WHERE contactId = ? ORDER BY date DESC').all(req.params.id) as Row[]
  res.json(rows.map(toInteraction))
})

router.post('/:id/interactions', (req, res) => {
  const { id: contactId } = req.params
  const { id, date, notes, createdAt } = req.body
  db.prepare('INSERT INTO interactions (id, contactId, date, notes, createdAt) VALUES (?, ?, ?, ?, ?)').run(id, contactId, date, notes, createdAt)
  const row = db.prepare('SELECT * FROM interactions WHERE id = ?').get(id) as Row
  res.status(201).json(toInteraction(row))
})

router.delete('/:id/interactions/:interactionId', (req, res) => {
  db.prepare('DELETE FROM interactions WHERE id = ? AND contactId = ?').run(req.params.interactionId, req.params.id)
  res.status(204).send()
})

// Key dates
router.get('/:id/key-dates', (req, res) => {
  const rows = db.prepare('SELECT * FROM keyDates WHERE contactId = ? ORDER BY month ASC, day ASC').all(req.params.id) as Row[]
  res.json(rows.map(toKeyDate))
})

router.post('/:id/key-dates', (req, res) => {
  const { id: contactId } = req.params
  const { id, label, month, day } = req.body
  db.prepare('INSERT INTO keyDates (id, contactId, label, month, day) VALUES (?, ?, ?, ?, ?)').run(id, contactId, label, month, day)
  const row = db.prepare('SELECT * FROM keyDates WHERE id = ?').get(id) as Row
  res.status(201).json(toKeyDate(row))
})

router.delete('/:id/key-dates/:keyDateId', (req, res) => {
  db.prepare('DELETE FROM keyDates WHERE id = ? AND contactId = ?').run(req.params.keyDateId, req.params.id)
  res.status(204).send()
})

export default router
