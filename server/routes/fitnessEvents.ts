import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

interface FitnessEventRow {
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
  distance: string | null
  goalTime: string | null
  resultTime: string | null
  alertEnabled: number
  annual: number
  registrationOpensDate: string | null
  registrationClosesDate: string | null
  notes: string | null
  createdAt: string
}

function toEvent(r: FitnessEventRow) {
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
    distance: r.distance ?? undefined,
    goalTime: r.goalTime ?? undefined,
    resultTime: r.resultTime ?? undefined,
    alertEnabled: r.alertEnabled === 1,
    annual: r.annual === 1,
    registrationOpensDate: r.registrationOpensDate ?? undefined,
    registrationClosesDate: r.registrationClosesDate ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.createdAt,
  }
}

// GET /api/fitness-events
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM fitnessEvents ORDER BY date ASC, createdAt ASC').all() as FitnessEventRow[]
  res.json(rows.map(toEvent))
})

// GET /api/fitness-events/alerts — goal races being monitored for registration
router.get('/alerts', (_req, res) => {
  const rows = db.prepare(
    "SELECT * FROM fitnessEvents WHERE type='goal' AND alertEnabled=1 ORDER BY createdAt ASC"
  ).all() as FitnessEventRow[]
  res.json(rows.map(toEvent))
})

// GET /api/fitness-events/open?days=N — races whose registration is open now, or
// opens within N days, and which have not been entered yet. The list an agent acts on.
router.get('/open', (req, res) => {
  const days = Number((req.query as Record<string, string>).days ?? 30)
  const today = new Date().toISOString().slice(0, 10)
  const horizon = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
  const rows = db.prepare(`
    SELECT * FROM fitnessEvents
    WHERE registrationOpensDate IS NOT NULL
      AND registrationOpensDate <= ?
      AND status NOT IN ('registered', 'completed')
    ORDER BY registrationOpensDate ASC
  `).all(horizon) as FitnessEventRow[]
  res.json(rows.map(r => {
    const opensDate = r.registrationOpensDate as string
    const closed = r.registrationClosesDate != null && r.registrationClosesDate < today
    return {
      ...toEvent(r),
      // 'open_now' means registration has opened and has not closed — act on these first
      registrationStatus: closed ? 'closed' : opensDate <= today ? 'open_now' : 'upcoming',
    }
  }))
})

// POST /api/fitness-events
router.post('/', (req, res) => {
  const {
    name, type, date, endDate, venue, location, category, status, url, price,
    distance, goalTime, resultTime, alertEnabled, annual,
    registrationOpensDate, registrationClosesDate, notes,
  } = req.body
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.prepare(`INSERT INTO fitnessEvents
    (id, name, type, date, endDate, venue, location, category, status, url, price,
     distance, goalTime, resultTime, alertEnabled, annual,
     registrationOpensDate, registrationClosesDate, notes, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(
      id, name, type ?? 'upcoming', date ?? null, endDate ?? null, venue ?? null, location ?? null,
      category ?? 'other', status ?? 'interested', url ?? null, price ?? null,
      distance ?? null, goalTime ?? null, resultTime ?? null,
      alertEnabled ? 1 : 0, annual ? 1 : 0,
      registrationOpensDate ?? null, registrationClosesDate ?? null, notes ?? null, now,
    )
  const row = db.prepare('SELECT * FROM fitnessEvents WHERE id=?').get(id) as FitnessEventRow
  res.status(201).json(toEvent(row))
})

// PATCH /api/fitness-events/:id
router.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM fitnessEvents WHERE id=?').get(req.params.id) as FitnessEventRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const b = req.body
  db.prepare(`UPDATE fitnessEvents SET
    name=?, type=?, date=?, endDate=?, venue=?, location=?, category=?, status=?, url=?, price=?,
    distance=?, goalTime=?, resultTime=?, alertEnabled=?, annual=?,
    registrationOpensDate=?, registrationClosesDate=?, notes=?
    WHERE id=?`)
    .run(
      b.name ?? row.name,
      b.type ?? row.type,
      b.date !== undefined ? (b.date || null) : row.date,
      b.endDate !== undefined ? (b.endDate || null) : row.endDate,
      b.venue !== undefined ? (b.venue || null) : row.venue,
      b.location !== undefined ? (b.location || null) : row.location,
      b.category ?? row.category,
      b.status ?? row.status,
      b.url !== undefined ? (b.url || null) : row.url,
      b.price !== undefined ? (b.price ?? null) : row.price,
      b.distance !== undefined ? (b.distance || null) : row.distance,
      b.goalTime !== undefined ? (b.goalTime || null) : row.goalTime,
      b.resultTime !== undefined ? (b.resultTime || null) : row.resultTime,
      b.alertEnabled !== undefined ? (b.alertEnabled ? 1 : 0) : row.alertEnabled,
      b.annual !== undefined ? (b.annual ? 1 : 0) : row.annual,
      b.registrationOpensDate !== undefined ? (b.registrationOpensDate || null) : row.registrationOpensDate,
      b.registrationClosesDate !== undefined ? (b.registrationClosesDate || null) : row.registrationClosesDate,
      b.notes !== undefined ? (b.notes || null) : row.notes,
      req.params.id,
    )
  const updated = db.prepare('SELECT * FROM fitnessEvents WHERE id=?').get(req.params.id) as FitnessEventRow
  res.json(toEvent(updated))
})

// DELETE /api/fitness-events/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM fitnessEvents WHERE id=?').run(req.params.id)
  res.status(204).end()
})

export default router
