import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// ── Health Metrics (body + activity) ────────────────────────────
router.get('/metrics', (req, res) => {
  const { category, metric, limit } = req.query
  let sql = 'SELECT * FROM healthMetrics WHERE 1=1'
  const params: unknown[] = []
  if (category) { sql += ' AND category=?'; params.push(category) }
  if (metric) { sql += ' AND metric=?'; params.push(metric) }
  sql += ' ORDER BY date DESC, createdAt DESC'
  if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)) }
  res.json(db.prepare(sql).all(...params))
})

router.post('/metrics', (req, res) => {
  const { date, category, metric, value, unit, notes } = req.body
  if (!date || !category || !metric || value === undefined || !unit) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO healthMetrics (id, date, category, metric, value, unit, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, date, category, metric, value, unit, notes ?? null, new Date().toISOString())
  res.status(201).json(db.prepare('SELECT * FROM healthMetrics WHERE id=?').get(id))
})

router.delete('/metrics/:id', (req, res) => {
  db.prepare('DELETE FROM healthMetrics WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Blood Work ───────────────────────────────────────────────────
router.get('/blood-work', (_req, res) => {
  res.json(db.prepare('SELECT * FROM bloodWork ORDER BY testDate DESC, marker ASC').all())
})

router.post('/blood-work', (req, res) => {
  const { testDate, marker, value, unit, referenceMin, referenceMax, notes } = req.body
  if (!testDate || !marker || value === undefined || !unit) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO bloodWork (id, testDate, marker, value, unit, referenceMin, referenceMax, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, testDate, marker, value, unit, referenceMin ?? null, referenceMax ?? null, notes ?? null, new Date().toISOString())
  res.status(201).json(db.prepare('SELECT * FROM bloodWork WHERE id=?').get(id))
})

router.put('/blood-work/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM bloodWork WHERE id=?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { testDate, marker, value, unit, referenceMin, referenceMax, notes } = req.body
  db.prepare(
    'UPDATE bloodWork SET testDate=?, marker=?, value=?, unit=?, referenceMin=?, referenceMax=?, notes=? WHERE id=?'
  ).run(
    testDate ?? row.testDate, marker ?? row.marker, value ?? row.value, unit ?? row.unit,
    referenceMin !== undefined ? (referenceMin ?? null) : row.referenceMin,
    referenceMax !== undefined ? (referenceMax ?? null) : row.referenceMax,
    notes !== undefined ? (notes ?? null) : row.notes,
    req.params.id
  )
  res.json(db.prepare('SELECT * FROM bloodWork WHERE id=?').get(req.params.id))
})

router.delete('/blood-work/:id', (req, res) => {
  db.prepare('DELETE FROM bloodWork WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Medications ──────────────────────────────────────────────────
router.get('/medications', (_req, res) => {
  res.json(db.prepare('SELECT * FROM medications ORDER BY active DESC, name ASC').all())
})

router.post('/medications', (req, res) => {
  const { name, dose, frequency, purpose, startDate, refillDate, notes } = req.body
  if (!name || !dose || !frequency) return res.status(400).json({ error: 'Missing required fields' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO medications (id, name, dose, frequency, purpose, startDate, refillDate, active, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)'
  ).run(id, name, dose, frequency, purpose ?? null, startDate ?? null, refillDate ?? null, notes ?? null, new Date().toISOString())
  res.status(201).json(db.prepare('SELECT * FROM medications WHERE id=?').get(id))
})

router.put('/medications/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM medications WHERE id=?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, dose, frequency, purpose, startDate, refillDate, active, notes } = req.body
  db.prepare(
    'UPDATE medications SET name=?, dose=?, frequency=?, purpose=?, startDate=?, refillDate=?, active=?, notes=? WHERE id=?'
  ).run(
    name ?? row.name, dose ?? row.dose, frequency ?? row.frequency,
    purpose !== undefined ? (purpose ?? null) : row.purpose,
    startDate !== undefined ? (startDate ?? null) : row.startDate,
    refillDate !== undefined ? (refillDate ?? null) : row.refillDate,
    active !== undefined ? (active ? 1 : 0) : row.active,
    notes !== undefined ? (notes ?? null) : row.notes,
    req.params.id
  )
  res.json(db.prepare('SELECT * FROM medications WHERE id=?').get(req.params.id))
})

router.delete('/medications/:id', (req, res) => {
  db.prepare('DELETE FROM medications WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Medical History ──────────────────────────────────────────────
router.get('/history', (_req, res) => {
  res.json(db.prepare('SELECT * FROM medicalHistory ORDER BY category, date DESC, createdAt DESC').all())
})

router.post('/history', (req, res) => {
  const { category, title, date, notes, severity, status } = req.body
  if (!category || !title) return res.status(400).json({ error: 'Missing required fields' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO medicalHistory (id, category, title, date, notes, severity, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, category, title, date ?? null, notes ?? null, severity ?? null, status ?? null, new Date().toISOString())
  res.status(201).json(db.prepare('SELECT * FROM medicalHistory WHERE id=?').get(id))
})

router.put('/history/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM medicalHistory WHERE id=?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { category, title, date, notes, severity, status } = req.body
  db.prepare(
    'UPDATE medicalHistory SET category=?, title=?, date=?, notes=?, severity=?, status=? WHERE id=?'
  ).run(
    category ?? row.category, title ?? row.title,
    date !== undefined ? (date ?? null) : row.date,
    notes !== undefined ? (notes ?? null) : row.notes,
    severity !== undefined ? (severity ?? null) : row.severity,
    status !== undefined ? (status ?? null) : row.status,
    req.params.id
  )
  res.json(db.prepare('SELECT * FROM medicalHistory WHERE id=?').get(req.params.id))
})

router.delete('/history/:id', (req, res) => {
  db.prepare('DELETE FROM medicalHistory WHERE id=?').run(req.params.id)
  res.status(204).end()
})

export default router
