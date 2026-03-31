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
    role: row.role ?? undefined,
    linkedinUrl: row.linkedinUrl ?? undefined,
    archived: row.archived === 1,
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

// CSV parser — handles RFC 4180 quoted fields
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const fields: string[] = []
    let inQuotes = false
    let current = ''
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())
    rows.push(fields)
  }
  return rows
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
  const { id, name, email, phone, company, role, linkedinUrl, relationship, followUpDays, notes, createdAt } = req.body
  db.prepare(`
    INSERT INTO contacts (id, name, email, phone, company, role, linkedinUrl, archived, relationship, followUpDays, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
  `).run(id, name, email ?? null, phone ?? null, company ?? null, role ?? null, linkedinUrl ?? null, JSON.stringify(relationship ?? []), followUpDays ?? null, notes ?? null, createdAt)
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
    UPDATE contacts SET name = ?, email = ?, phone = ?, company = ?, role = ?, linkedinUrl = ?, archived = ?, relationship = ?, followUpDays = ?, notes = ?
    WHERE id = ?
  `).run(
    p.name ?? row.name,
    p.email !== undefined ? (p.email || null) : (row.email ?? null),
    p.phone !== undefined ? (p.phone || null) : (row.phone ?? null),
    p.company !== undefined ? (p.company || null) : (row.company ?? null),
    p.role !== undefined ? (p.role || null) : (row.role ?? null),
    p.linkedinUrl !== undefined ? (p.linkedinUrl || null) : (row.linkedinUrl ?? null),
    p.archived !== undefined ? (p.archived ? 1 : 0) : (row.archived ?? 0),
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

// LinkedIn CSV import
router.post('/import-linkedin', (req, res) => {
  const { csv } = req.body as { csv: string }
  if (!csv) return res.status(400).json({ error: 'No CSV provided' })

  const rows = parseCsv(csv)
  const headerIdx = rows.findIndex(r => r[0]?.toLowerCase() === 'first name')
  if (headerIdx === -1) return res.status(400).json({ error: 'Could not find header row' })

  const data = rows.slice(headerIdx + 1)
  let created = 0, updated = 0, skipped = 0

  const findStmt = db.prepare('SELECT * FROM contacts WHERE LOWER(TRIM(name)) = ?')

  for (const row of data) {
    const [firstName, lastName, url, email, company, position, connectedOn] = row
    const name = [firstName, lastName].filter(Boolean).join(' ').trim()
    if (!name) { skipped++; continue }

    const existing = findStmt.get(name.toLowerCase()) as Row | undefined

    if (existing) {
      // Always update company/role; only fill email/linkedinUrl if currently empty
      db.prepare(`
        UPDATE contacts SET
          company    = ?,
          role       = ?,
          email      = CASE WHEN (email IS NULL OR email = '') AND ? != '' THEN ? ELSE email END,
          linkedinUrl = CASE WHEN (linkedinUrl IS NULL OR linkedinUrl = '') AND ? != '' THEN ? ELSE linkedinUrl END
        WHERE id = ?
      `).run(
        company || existing.company || null,
        position || existing.role || null,
        email ?? '', email ?? '',
        url ?? '', url ?? '',
        existing.id,
      )
      updated++
    } else {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const notes = connectedOn ? `Connected on LinkedIn: ${connectedOn}` : null
      db.prepare(`
        INSERT INTO contacts (id, name, email, phone, company, role, linkedinUrl, archived, relationship, followUpDays, notes, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
      `).run(
        id, name,
        email || null,
        null,
        company || null,
        position || null,
        url || null,
        JSON.stringify(['linkedin']),
        null,
        notes,
        now,
      )
      created++
    }
  }

  res.json({ created, updated, skipped })
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
