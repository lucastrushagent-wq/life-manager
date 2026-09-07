import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// ── Devices ───────────────────────────────────────────────────────────────────

interface DeviceRow {
  id: string
  name: string
  category: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  purchaseDate: string | null
  purchasePrice: number | null
  warrantyExpiry: string | null
  status: string
  assignedTo: string | null
  location: string | null
  url: string | null
  notes: string | null
  createdAt: string
}

function toDevice(r: DeviceRow) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    brand: r.brand ?? undefined,
    model: r.model ?? undefined,
    serialNumber: r.serialNumber ?? undefined,
    purchaseDate: r.purchaseDate ?? undefined,
    purchasePrice: r.purchasePrice ?? undefined,
    warrantyExpiry: r.warrantyExpiry ?? undefined,
    status: r.status,
    assignedTo: r.assignedTo ?? undefined,
    location: r.location ?? undefined,
    url: r.url ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.createdAt,
  }
}

router.get('/devices', (req, res) => {
  const { category, status, q } = req.query as Record<string, string>
  let sql = 'SELECT * FROM techDevices WHERE 1=1'
  const params: string[] = []
  if (category) { sql += ' AND category = ?'; params.push(category) }
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (q) {
    sql += " AND (LOWER(name) LIKE ? OR LOWER(COALESCE(brand,'')) LIKE ? OR LOWER(COALESCE(model,'')) LIKE ?)"
    const like = `%${q.toLowerCase()}%`
    params.push(like, like, like)
  }
  sql += ' ORDER BY category, name'
  res.json((db.prepare(sql).all(...params) as DeviceRow[]).map(toDevice))
})

router.post('/devices', (req, res) => {
  const b = req.body
  if (!b.name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = crypto.randomUUID()
  db.prepare(`INSERT INTO techDevices
    (id, name, category, brand, model, serialNumber, purchaseDate, purchasePrice,
     warrantyExpiry, status, assignedTo, location, url, notes, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(
      id, b.name.trim(), b.category ?? 'other', b.brand?.trim() || null, b.model?.trim() || null,
      b.serialNumber?.trim() || null, b.purchaseDate || null,
      b.purchasePrice != null && b.purchasePrice !== '' ? Number(b.purchasePrice) : null,
      b.warrantyExpiry || null, b.status ?? 'active',
      b.assignedTo?.trim() || null, b.location?.trim() || null,
      b.url?.trim() || null, b.notes?.trim() || null, new Date().toISOString(),
    )
  res.status(201).json(toDevice(db.prepare('SELECT * FROM techDevices WHERE id=?').get(id) as DeviceRow))
})

router.patch('/devices/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM techDevices WHERE id=?').get(req.params.id) as DeviceRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const b = req.body
  const text = (k: keyof DeviceRow, v: unknown) =>
    v !== undefined ? (typeof v === 'string' && v.trim() ? v.trim() : null) : row[k]
  db.prepare(`UPDATE techDevices SET
    name=?, category=?, brand=?, model=?, serialNumber=?, purchaseDate=?, purchasePrice=?,
    warrantyExpiry=?, status=?, assignedTo=?, location=?, url=?, notes=? WHERE id=?`)
    .run(
      b.name?.trim() || row.name,
      b.category ?? row.category,
      text('brand', b.brand), text('model', b.model), text('serialNumber', b.serialNumber),
      text('purchaseDate', b.purchaseDate),
      b.purchasePrice !== undefined ? (b.purchasePrice === null || b.purchasePrice === '' ? null : Number(b.purchasePrice)) : row.purchasePrice,
      text('warrantyExpiry', b.warrantyExpiry),
      b.status ?? row.status,
      text('assignedTo', b.assignedTo), text('location', b.location),
      text('url', b.url), text('notes', b.notes),
      req.params.id,
    )
  res.json(toDevice(db.prepare('SELECT * FROM techDevices WHERE id=?').get(req.params.id) as DeviceRow))
})

router.delete('/devices/:id', (req, res) => {
  db.prepare('DELETE FROM techDevices WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Subscriptions ─────────────────────────────────────────────────────────────

interface SubRow {
  id: string
  name: string
  provider: string | null
  category: string
  cost: number | null
  billingCycle: string
  renewalDate: string | null
  status: string
  url: string | null
  notes: string | null
  createdAt: string
}

function toSub(r: SubRow) {
  return {
    id: r.id,
    name: r.name,
    provider: r.provider ?? undefined,
    category: r.category,
    cost: r.cost ?? undefined,
    billingCycle: r.billingCycle,
    renewalDate: r.renewalDate ?? undefined,
    status: r.status,
    url: r.url ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.createdAt,
  }
}

router.get('/subscriptions', (req, res) => {
  const { status } = req.query as Record<string, string>
  let sql = 'SELECT * FROM techSubscriptions'
  const params: string[] = []
  if (status) { sql += ' WHERE status = ?'; params.push(status) }
  sql += ' ORDER BY renewalDate IS NULL, renewalDate ASC, name'
  res.json((db.prepare(sql).all(...params) as SubRow[]).map(toSub))
})

router.post('/subscriptions', (req, res) => {
  const b = req.body
  if (!b.name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = crypto.randomUUID()
  db.prepare(`INSERT INTO techSubscriptions
    (id, name, provider, category, cost, billingCycle, renewalDate, status, url, notes, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(
      id, b.name.trim(), b.provider?.trim() || null, b.category ?? 'other',
      b.cost != null && b.cost !== '' ? Number(b.cost) : null,
      b.billingCycle ?? 'monthly', b.renewalDate || null, b.status ?? 'active',
      b.url?.trim() || null, b.notes?.trim() || null, new Date().toISOString(),
    )
  res.status(201).json(toSub(db.prepare('SELECT * FROM techSubscriptions WHERE id=?').get(id) as SubRow))
})

router.patch('/subscriptions/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM techSubscriptions WHERE id=?').get(req.params.id) as SubRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const b = req.body
  const text = (k: keyof SubRow, v: unknown) =>
    v !== undefined ? (typeof v === 'string' && v.trim() ? v.trim() : null) : row[k]
  db.prepare(`UPDATE techSubscriptions SET
    name=?, provider=?, category=?, cost=?, billingCycle=?, renewalDate=?, status=?, url=?, notes=?
    WHERE id=?`)
    .run(
      b.name?.trim() || row.name,
      text('provider', b.provider),
      b.category ?? row.category,
      b.cost !== undefined ? (b.cost === null || b.cost === '' ? null : Number(b.cost)) : row.cost,
      b.billingCycle ?? row.billingCycle,
      text('renewalDate', b.renewalDate),
      b.status ?? row.status,
      text('url', b.url), text('notes', b.notes),
      req.params.id,
    )
  res.json(toSub(db.prepare('SELECT * FROM techSubscriptions WHERE id=?').get(req.params.id) as SubRow))
})

router.delete('/subscriptions/:id', (req, res) => {
  db.prepare('DELETE FROM techSubscriptions WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Expiring soon (agent-facing) ──────────────────────────────────────────────

// GET /api/technology/expiring?days=N — warranties lapsing and subscriptions
// renewing within N days. Already-lapsed warranties are excluded; a renewal that
// has passed means the sub has rolled over and the date needs updating.
router.get('/expiring', (req, res) => {
  const days = Number((req.query as Record<string, string>).days ?? 60)
  const today = new Date().toISOString().slice(0, 10)
  const horizon = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

  const warranties = (db.prepare(`
    SELECT * FROM techDevices
    WHERE warrantyExpiry IS NOT NULL AND warrantyExpiry <= ? AND warrantyExpiry >= ?
      AND status NOT IN ('sold', 'retired')
    ORDER BY warrantyExpiry ASC
  `).all(horizon, today) as DeviceRow[]).map(toDevice)

  const renewals = (db.prepare(`
    SELECT * FROM techSubscriptions
    WHERE renewalDate IS NOT NULL AND renewalDate <= ? AND status = 'active'
    ORDER BY renewalDate ASC
  `).all(horizon) as SubRow[]).map(toSub)

  res.json({ warranties, renewals })
})

export default router
