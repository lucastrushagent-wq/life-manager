import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// ── Row types ────────────────────────────────────────────────────

interface ProductRow {
  id: string; name: string; brand: string | null; category: string
  status: string; rating: number | null; notes: string | null
  url: string | null; createdAt: string
}

interface RoutineRow {
  id: string; name: string; timeOfDay: string; steps: string
  notes: string | null; createdAt: string; updatedAt: string
}

interface ScheduleRow {
  id: string; name: string; frequencyDays: number
  lastDoneAt: string | null; notes: string | null; createdAt: string
}

interface WardrobeRow {
  id: string; name: string; category: string; color: string | null
  brand: string | null; status: string; notes: string | null
  imageUrl: string | null; createdAt: string
}

interface OutfitRow {
  id: string; name: string; description: string | null
  occasion: string | null; season: string; notes: string | null; createdAt: string
}

interface InspirationRow {
  id: string; title: string; imageUrl: string | null
  sourceUrl: string | null; category: string; notes: string | null; createdAt: string
}

// ── Serializers ──────────────────────────────────────────────────

function toProduct(r: ProductRow) {
  return {
    id: r.id, name: r.name, brand: r.brand ?? undefined,
    category: r.category, status: r.status,
    rating: r.rating ?? undefined, notes: r.notes ?? undefined,
    url: r.url ?? undefined, createdAt: r.createdAt,
  }
}

function toRoutine(r: RoutineRow) {
  return {
    id: r.id, name: r.name, timeOfDay: r.timeOfDay,
    steps: JSON.parse(r.steps) as string[],
    notes: r.notes ?? undefined, createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

function toSchedule(r: ScheduleRow) {
  return {
    id: r.id, name: r.name, frequencyDays: r.frequencyDays,
    lastDoneAt: r.lastDoneAt ?? undefined,
    notes: r.notes ?? undefined, createdAt: r.createdAt,
  }
}

function toWardrobe(r: WardrobeRow) {
  return {
    id: r.id, name: r.name, category: r.category,
    color: r.color ?? undefined, brand: r.brand ?? undefined,
    status: r.status, notes: r.notes ?? undefined,
    imageUrl: r.imageUrl ?? undefined, createdAt: r.createdAt,
  }
}

function toOutfit(r: OutfitRow) {
  return {
    id: r.id, name: r.name, description: r.description ?? undefined,
    occasion: r.occasion ?? undefined, season: r.season,
    notes: r.notes ?? undefined, createdAt: r.createdAt,
  }
}

function toInspiration(r: InspirationRow) {
  return {
    id: r.id, title: r.title, imageUrl: r.imageUrl ?? undefined,
    sourceUrl: r.sourceUrl ?? undefined, category: r.category,
    notes: r.notes ?? undefined, createdAt: r.createdAt,
  }
}

// ── Products ─────────────────────────────────────────────────────

router.get('/products', (_req, res) => {
  const rows = db.prepare('SELECT * FROM aestheticProducts ORDER BY category, name').all() as ProductRow[]
  res.json(rows.map(toProduct))
})

router.post('/products', (req, res) => {
  const { name, brand, category, status, rating, notes, url } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO aestheticProducts (id, name, brand, category, status, rating, notes, url, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), brand?.trim() || null, category || 'other', status || 'active',
    rating ?? null, notes?.trim() || null, url?.trim() || null, new Date().toISOString())
  res.status(201).json(toProduct(db.prepare('SELECT * FROM aestheticProducts WHERE id=?').get(id) as ProductRow))
})

router.patch('/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM aestheticProducts WHERE id=?').get(req.params.id) as ProductRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, brand, category, status, rating, notes, url } = req.body
  db.prepare(
    'UPDATE aestheticProducts SET name=?, brand=?, category=?, status=?, rating=?, notes=?, url=? WHERE id=?'
  ).run(
    name ?? row.name,
    brand !== undefined ? (brand?.trim() || null) : row.brand,
    category ?? row.category,
    status ?? row.status,
    rating !== undefined ? (rating ?? null) : row.rating,
    notes !== undefined ? (notes?.trim() || null) : row.notes,
    url !== undefined ? (url?.trim() || null) : row.url,
    req.params.id
  )
  res.json(toProduct(db.prepare('SELECT * FROM aestheticProducts WHERE id=?').get(req.params.id) as ProductRow))
})

router.delete('/products/:id', (req, res) => {
  db.prepare('DELETE FROM aestheticProducts WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Routines ─────────────────────────────────────────────────────

router.get('/routines', (_req, res) => {
  const rows = db.prepare('SELECT * FROM groomingRoutines ORDER BY timeOfDay, name').all() as RoutineRow[]
  res.json(rows.map(toRoutine))
})

router.post('/routines', (req, res) => {
  const { name, timeOfDay, steps, notes } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO groomingRoutines (id, name, timeOfDay, steps, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), timeOfDay || 'morning', JSON.stringify(steps || []), notes?.trim() || null, now, now)
  res.status(201).json(toRoutine(db.prepare('SELECT * FROM groomingRoutines WHERE id=?').get(id) as RoutineRow))
})

router.patch('/routines/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM groomingRoutines WHERE id=?').get(req.params.id) as RoutineRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, timeOfDay, steps, notes } = req.body
  const now = new Date().toISOString()
  db.prepare(
    'UPDATE groomingRoutines SET name=?, timeOfDay=?, steps=?, notes=?, updatedAt=? WHERE id=?'
  ).run(
    name ?? row.name,
    timeOfDay ?? row.timeOfDay,
    steps !== undefined ? JSON.stringify(steps) : row.steps,
    notes !== undefined ? (notes?.trim() || null) : row.notes,
    now, req.params.id
  )
  res.json(toRoutine(db.prepare('SELECT * FROM groomingRoutines WHERE id=?').get(req.params.id) as RoutineRow))
})

router.delete('/routines/:id', (req, res) => {
  db.prepare('DELETE FROM groomingRoutines WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Schedules ────────────────────────────────────────────────────

router.get('/schedules', (_req, res) => {
  const rows = db.prepare('SELECT * FROM groomingSchedules ORDER BY name').all() as ScheduleRow[]
  res.json(rows.map(toSchedule))
})

router.post('/schedules', (req, res) => {
  const { name, frequencyDays, lastDoneAt, notes } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  if (!frequencyDays || frequencyDays < 1) return res.status(400).json({ error: 'frequencyDays must be >= 1' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO groomingSchedules (id, name, frequencyDays, lastDoneAt, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), frequencyDays, lastDoneAt || null, notes?.trim() || null, new Date().toISOString())
  res.status(201).json(toSchedule(db.prepare('SELECT * FROM groomingSchedules WHERE id=?').get(id) as ScheduleRow))
})

router.patch('/schedules/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM groomingSchedules WHERE id=?').get(req.params.id) as ScheduleRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, frequencyDays, lastDoneAt, notes } = req.body
  db.prepare(
    'UPDATE groomingSchedules SET name=?, frequencyDays=?, lastDoneAt=?, notes=? WHERE id=?'
  ).run(
    name ?? row.name,
    frequencyDays ?? row.frequencyDays,
    lastDoneAt !== undefined ? (lastDoneAt || null) : row.lastDoneAt,
    notes !== undefined ? (notes?.trim() || null) : row.notes,
    req.params.id
  )
  res.json(toSchedule(db.prepare('SELECT * FROM groomingSchedules WHERE id=?').get(req.params.id) as ScheduleRow))
})

router.delete('/schedules/:id', (req, res) => {
  db.prepare('DELETE FROM groomingSchedules WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Wardrobe ─────────────────────────────────────────────────────

router.get('/wardrobe', (_req, res) => {
  const rows = db.prepare('SELECT * FROM wardrobeItems ORDER BY category, name').all() as WardrobeRow[]
  res.json(rows.map(toWardrobe))
})

router.post('/wardrobe', (req, res) => {
  const { name, category, color, brand, status, notes, imageUrl } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO wardrobeItems (id, name, category, color, brand, status, notes, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), category || 'other', color?.trim() || null, brand?.trim() || null,
    status || 'owned', notes?.trim() || null, imageUrl?.trim() || null, new Date().toISOString())
  res.status(201).json(toWardrobe(db.prepare('SELECT * FROM wardrobeItems WHERE id=?').get(id) as WardrobeRow))
})

router.patch('/wardrobe/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM wardrobeItems WHERE id=?').get(req.params.id) as WardrobeRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, category, color, brand, status, notes, imageUrl } = req.body
  db.prepare(
    'UPDATE wardrobeItems SET name=?, category=?, color=?, brand=?, status=?, notes=?, imageUrl=? WHERE id=?'
  ).run(
    name ?? row.name,
    category ?? row.category,
    color !== undefined ? (color?.trim() || null) : row.color,
    brand !== undefined ? (brand?.trim() || null) : row.brand,
    status ?? row.status,
    notes !== undefined ? (notes?.trim() || null) : row.notes,
    imageUrl !== undefined ? (imageUrl?.trim() || null) : row.imageUrl,
    req.params.id
  )
  res.json(toWardrobe(db.prepare('SELECT * FROM wardrobeItems WHERE id=?').get(req.params.id) as WardrobeRow))
})

router.delete('/wardrobe/:id', (req, res) => {
  db.prepare('DELETE FROM wardrobeItems WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Outfits ──────────────────────────────────────────────────────

router.get('/outfits', (_req, res) => {
  const rows = db.prepare('SELECT * FROM outfitIdeas ORDER BY name').all() as OutfitRow[]
  res.json(rows.map(toOutfit))
})

router.post('/outfits', (req, res) => {
  const { name, description, occasion, season, notes } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO outfitIdeas (id, name, description, occasion, season, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), description?.trim() || null, occasion?.trim() || null,
    season || 'all', notes?.trim() || null, new Date().toISOString())
  res.status(201).json(toOutfit(db.prepare('SELECT * FROM outfitIdeas WHERE id=?').get(id) as OutfitRow))
})

router.patch('/outfits/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM outfitIdeas WHERE id=?').get(req.params.id) as OutfitRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, description, occasion, season, notes } = req.body
  db.prepare(
    'UPDATE outfitIdeas SET name=?, description=?, occasion=?, season=?, notes=? WHERE id=?'
  ).run(
    name ?? row.name,
    description !== undefined ? (description?.trim() || null) : row.description,
    occasion !== undefined ? (occasion?.trim() || null) : row.occasion,
    season ?? row.season,
    notes !== undefined ? (notes?.trim() || null) : row.notes,
    req.params.id
  )
  res.json(toOutfit(db.prepare('SELECT * FROM outfitIdeas WHERE id=?').get(req.params.id) as OutfitRow))
})

router.delete('/outfits/:id', (req, res) => {
  db.prepare('DELETE FROM outfitIdeas WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Inspiration ──────────────────────────────────────────────────

router.get('/inspiration', (_req, res) => {
  const rows = db.prepare('SELECT * FROM inspirationItems ORDER BY createdAt DESC').all() as InspirationRow[]
  res.json(rows.map(toInspiration))
})

router.post('/inspiration', (req, res) => {
  const { title, imageUrl, sourceUrl, category, notes } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO inspirationItems (id, title, imageUrl, sourceUrl, category, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, title.trim(), imageUrl?.trim() || null, sourceUrl?.trim() || null,
    category || 'general', notes?.trim() || null, new Date().toISOString())
  res.status(201).json(toInspiration(db.prepare('SELECT * FROM inspirationItems WHERE id=?').get(id) as InspirationRow))
})

router.patch('/inspiration/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM inspirationItems WHERE id=?').get(req.params.id) as InspirationRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { title, imageUrl, sourceUrl, category, notes } = req.body
  db.prepare(
    'UPDATE inspirationItems SET title=?, imageUrl=?, sourceUrl=?, category=?, notes=? WHERE id=?'
  ).run(
    title ?? row.title,
    imageUrl !== undefined ? (imageUrl?.trim() || null) : row.imageUrl,
    sourceUrl !== undefined ? (sourceUrl?.trim() || null) : row.sourceUrl,
    category ?? row.category,
    notes !== undefined ? (notes?.trim() || null) : row.notes,
    req.params.id
  )
  res.json(toInspiration(db.prepare('SELECT * FROM inspirationItems WHERE id=?').get(req.params.id) as InspirationRow))
})

router.delete('/inspiration/:id', (req, res) => {
  db.prepare('DELETE FROM inspirationItems WHERE id=?').run(req.params.id)
  res.status(204).end()
})

export default router
