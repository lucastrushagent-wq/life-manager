import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

interface ProviderRow {
  id: string
  name: string
  category: string
  specialty: string | null
  phone: string | null
  email: string | null
  website: string | null
  bookingUrl: string | null
  address: string | null
  preferences: string | null
  lastVisit: string | null
  frequencyDays: number | null
  typicalCost: number | null
  rating: number | null
  notes: string | null
  archived: number
  createdAt: string
}

function toProvider(r: ProviderRow) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    specialty: r.specialty ?? undefined,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    website: r.website ?? undefined,
    bookingUrl: r.bookingUrl ?? undefined,
    address: r.address ?? undefined,
    preferences: r.preferences ?? undefined,
    lastVisit: r.lastVisit ?? undefined,
    frequencyDays: r.frequencyDays ?? undefined,
    typicalCost: r.typicalCost ?? undefined,
    rating: r.rating ?? undefined,
    notes: r.notes ?? undefined,
    archived: r.archived === 1,
    createdAt: r.createdAt,
  }
}

// List — optional filters: category, q (name/specialty search), archived
router.get('/', (req, res) => {
  const { category, q, archived } = req.query as Record<string, string>
  let sql = 'SELECT * FROM serviceProviders WHERE 1=1'
  const params: (string | number)[] = []
  if (category) { sql += ' AND category = ?'; params.push(category) }
  if (q) {
    sql += " AND (LOWER(name) LIKE ? OR LOWER(COALESCE(specialty, '')) LIKE ? OR LOWER(COALESCE(category, '')) LIKE ?)"
    const like = `%${q.toLowerCase()}%`
    params.push(like, like, like)
  }
  sql += archived === 'true' ? ' AND archived = 1' : ' AND archived = 0'
  sql += ' ORDER BY category, name'
  const rows = db.prepare(sql).all(...params) as ProviderRow[]
  res.json(rows.map(toProvider))
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM serviceProviders WHERE id = ?').get(req.params.id) as ProviderRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(toProvider(row))
})

router.post('/', (req, res) => {
  const {
    name, category, specialty, phone, email, website, bookingUrl,
    address, preferences, lastVisit, frequencyDays, typicalCost, rating, notes,
  } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = crypto.randomUUID()
  db.prepare(`
    INSERT INTO serviceProviders (
      id, name, category, specialty, phone, email, website, bookingUrl,
      address, preferences, lastVisit, frequencyDays, typicalCost, rating, notes, archived, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    id, name.trim(), category?.trim() || 'other', specialty?.trim() || null,
    phone?.trim() || null, email?.trim() || null, website?.trim() || null, bookingUrl?.trim() || null,
    address?.trim() || null, preferences?.trim() || null, lastVisit?.trim() || null,
    frequencyDays != null ? Number(frequencyDays) : null,
    typicalCost != null && typicalCost !== '' ? Number(typicalCost) : null,
    rating != null && rating !== '' ? Number(rating) : null,
    notes?.trim() || null, new Date().toISOString()
  )
  res.status(201).json(toProvider(db.prepare('SELECT * FROM serviceProviders WHERE id=?').get(id) as ProviderRow))
})

router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM serviceProviders WHERE id = ?').get(req.params.id) as ProviderRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const b = req.body
  const text = (key: keyof ProviderRow, val: unknown) =>
    val !== undefined ? (typeof val === 'string' && val.trim() ? val.trim() : null) : row[key]
  const num = (key: keyof ProviderRow, val: unknown) =>
    val !== undefined ? (val === null || val === '' ? null : Number(val)) : row[key]

  db.prepare(`
    UPDATE serviceProviders SET
      name=?, category=?, specialty=?, phone=?, email=?, website=?, bookingUrl=?,
      address=?, preferences=?, lastVisit=?, frequencyDays=?, typicalCost=?, rating=?, notes=?, archived=?
    WHERE id=?
  `).run(
    b.name?.trim() || row.name,
    b.category?.trim() || row.category,
    text('specialty', b.specialty),
    text('phone', b.phone),
    text('email', b.email),
    text('website', b.website),
    text('bookingUrl', b.bookingUrl),
    text('address', b.address),
    text('preferences', b.preferences),
    text('lastVisit', b.lastVisit),
    num('frequencyDays', b.frequencyDays),
    num('typicalCost', b.typicalCost),
    num('rating', b.rating),
    text('notes', b.notes),
    b.archived !== undefined ? (b.archived ? 1 : 0) : row.archived,
    req.params.id
  )
  res.json(toProvider(db.prepare('SELECT * FROM serviceProviders WHERE id=?').get(req.params.id) as ProviderRow))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM serviceProviders WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

// Mark a visit as happened today (or on a given date)
router.post('/:id/visit', (req, res) => {
  const row = db.prepare('SELECT * FROM serviceProviders WHERE id = ?').get(req.params.id) as ProviderRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const date = (req.body?.date as string)?.trim() || new Date().toISOString().split('T')[0]
  db.prepare('UPDATE serviceProviders SET lastVisit = ? WHERE id = ?').run(date, req.params.id)
  res.json(toProvider(db.prepare('SELECT * FROM serviceProviders WHERE id=?').get(req.params.id) as ProviderRow))
})

export default router
