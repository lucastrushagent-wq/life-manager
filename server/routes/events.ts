import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

interface EventRow {
  id: string
  name: string
  type: string
  date: string | null
  endDate: string | null
  venue: string | null
  location: string | null
  category: string
  status: string
  url: string | null
  price: number | null
  alertEnabled: number
  annual: number
  ticketsOnSaleDate: string | null
  notes: string | null
  createdAt: string
}

function toEvent(r: EventRow) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    date: r.date ?? undefined,
    endDate: r.endDate ?? undefined,
    venue: r.venue ?? undefined,
    location: r.location ?? undefined,
    category: r.category,
    status: r.status,
    url: r.url ?? undefined,
    price: r.price ?? undefined,
    alertEnabled: r.alertEnabled === 1,
    annual: r.annual === 1,
    ticketsOnSaleDate: r.ticketsOnSaleDate ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.createdAt,
  }
}

// GET /api/events
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM calendarEvents ORDER BY date ASC, createdAt ASC').all() as EventRow[]
  res.json(rows.map(toEvent))
})

// GET /api/events/alerts — goal events with alertEnabled for agent use
router.get('/alerts', (_req, res) => {
  const rows = db.prepare("SELECT * FROM calendarEvents WHERE type='goal' AND alertEnabled=1 ORDER BY createdAt ASC").all() as EventRow[]
  res.json(rows.map(toEvent))
})

// GET /api/events/on-sale — events whose tickets go on sale within `days` (default 30),
// or are already on sale but not yet bought. The list an agent acts on.
router.get('/on-sale', (req, res) => {
  const days = Number((req.query as Record<string, string>).days ?? 30)
  const today = new Date().toISOString().slice(0, 10)
  const horizon = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
  const rows = db.prepare(`
    SELECT * FROM calendarEvents
    WHERE ticketsOnSaleDate IS NOT NULL
      AND ticketsOnSaleDate <= ?
      AND status != 'confirmed'
    ORDER BY ticketsOnSaleDate ASC
  `).all(horizon) as EventRow[]
  res.json(rows.map(r => ({
    ...toEvent(r),
    // 'on_sale_now' means the date has passed and it still is not confirmed — act on these first
    onSaleStatus: (r.ticketsOnSaleDate as string) <= today ? 'on_sale_now' : 'upcoming',
  })))
})

// POST /api/events
router.post('/', (req, res) => {
  const { name, type, date, endDate, venue, location, category, status, url, price, alertEnabled, annual, ticketsOnSaleDate, notes } = req.body
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.prepare(`INSERT INTO calendarEvents
    (id, name, type, date, endDate, venue, location, category, status, url, price, alertEnabled, annual, ticketsOnSaleDate, notes, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, name, type ?? 'upcoming', date ?? null, endDate ?? null, venue ?? null, location ?? null,
      category ?? 'other', status ?? 'interested', url ?? null, price ?? null,
      alertEnabled ? 1 : 0, annual ? 1 : 0, ticketsOnSaleDate ?? null, notes ?? null, now)
  const row = db.prepare('SELECT * FROM calendarEvents WHERE id=?').get(id) as EventRow
  res.status(201).json(toEvent(row))
})

// PATCH /api/events/:id
router.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM calendarEvents WHERE id=?').get(req.params.id) as EventRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, type, date, endDate, venue, location, category, status, url, price, alertEnabled, annual, ticketsOnSaleDate, notes } = req.body
  db.prepare(`UPDATE calendarEvents SET
    name=?, type=?, date=?, endDate=?, venue=?, location=?, category=?, status=?, url=?, price=?, alertEnabled=?, annual=?, ticketsOnSaleDate=?, notes=?
    WHERE id=?`)
    .run(
      name ?? row.name, type ?? row.type,
      date !== undefined ? (date || null) : row.date,
      endDate !== undefined ? (endDate || null) : row.endDate,
      venue !== undefined ? (venue || null) : row.venue,
      location !== undefined ? (location || null) : row.location,
      category ?? row.category, status ?? row.status,
      url !== undefined ? (url || null) : row.url,
      price !== undefined ? (price ?? null) : row.price,
      alertEnabled !== undefined ? (alertEnabled ? 1 : 0) : row.alertEnabled,
      annual !== undefined ? (annual ? 1 : 0) : row.annual,
      ticketsOnSaleDate !== undefined ? (ticketsOnSaleDate || null) : row.ticketsOnSaleDate,
      notes !== undefined ? (notes || null) : row.notes,
      req.params.id,
    )
  const updated = db.prepare('SELECT * FROM calendarEvents WHERE id=?').get(req.params.id) as EventRow
  res.json(toEvent(updated))
})

// DELETE /api/events/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM calendarEvents WHERE id=?').run(req.params.id)
  res.status(204).end()
})

export default router
