import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

interface StoreRow { id: string; name: string; sortOrder: number; createdAt: string }
interface ItemRow {
  id: string; storeId: string; name: string
  quantity: string | null; notes: string | null; checked: number
  recurring: number; frequency: string | null; storeCode: string | null; url: string | null
  preferredBrand: string | null; isPreference: number
  createdAt: string
}

function toStore(r: StoreRow) {
  return { id: r.id, name: r.name, sortOrder: r.sortOrder, createdAt: r.createdAt }
}
function toItem(r: ItemRow) {
  return {
    id: r.id,
    storeId: r.storeId,
    name: r.name,
    quantity: r.quantity ?? undefined,
    notes: r.notes ?? undefined,
    checked: r.checked === 1,
    recurring: r.recurring === 1,
    frequency: r.frequency ?? undefined,
    storeCode: r.storeCode ?? undefined,
    url: r.url ?? undefined,
    preferredBrand: r.preferredBrand ?? undefined,
    isPreference: r.isPreference === 1,
    createdAt: r.createdAt,
  }
}

// ── Stores ──────────────────────────────────────────────────────
router.get('/stores', (_req, res) => {
  const rows = db.prepare('SELECT * FROM shoppingStores ORDER BY sortOrder, name').all() as StoreRow[]
  res.json(rows.map(toStore))
})

router.post('/stores', (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const existing = db.prepare('SELECT id FROM shoppingStores WHERE name=?').get(name.trim())
  if (existing) return res.status(409).json({ error: 'Store already exists' })
  const maxOrder = (db.prepare('SELECT MAX(sortOrder) as m FROM shoppingStores').get() as { m: number | null }).m ?? -1
  const id = crypto.randomUUID()
  db.prepare('INSERT INTO shoppingStores (id, name, sortOrder, createdAt) VALUES (?, ?, ?, ?)')
    .run(id, name.trim(), maxOrder + 1, new Date().toISOString())
  res.status(201).json(toStore(db.prepare('SELECT * FROM shoppingStores WHERE id=?').get(id) as StoreRow))
})

router.delete('/stores/:id', (req, res) => {
  db.prepare('DELETE FROM shoppingStores WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Items ───────────────────────────────────────────────────────
router.get('/stores/:storeId/items', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM shoppingItems WHERE storeId=? ORDER BY checked, createdAt'
  ).all(req.params.storeId) as ItemRow[]
  res.json(rows.map(toItem))
})

router.post('/stores/:storeId/items', (req, res) => {
  const { name, quantity, notes, recurring, frequency, storeCode, url, preferredBrand, isPreference } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO shoppingItems (id, storeId, name, quantity, notes, checked, recurring, frequency, storeCode, url, preferredBrand, isPreference, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id, req.params.storeId, name.trim(),
    quantity?.trim() || null, notes?.trim() || null,
    recurring ? 1 : 0, frequency?.trim() || null,
    storeCode?.trim() || null, url?.trim() || null,
    preferredBrand?.trim() || null, isPreference ? 1 : 0,
    new Date().toISOString()
  )
  res.status(201).json(toItem(db.prepare('SELECT * FROM shoppingItems WHERE id=?').get(id) as ItemRow))
})

router.put('/items/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM shoppingItems WHERE id=?').get(req.params.id) as ItemRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, quantity, notes, checked, recurring, frequency, storeCode, url, preferredBrand, isPreference } = req.body
  db.prepare(
    'UPDATE shoppingItems SET name=?, quantity=?, notes=?, checked=?, recurring=?, frequency=?, storeCode=?, url=?, preferredBrand=?, isPreference=? WHERE id=?'
  ).run(
    name ?? row.name,
    quantity !== undefined ? (quantity?.trim() || null) : row.quantity,
    notes !== undefined ? (notes?.trim() || null) : row.notes,
    checked !== undefined ? (checked ? 1 : 0) : row.checked,
    recurring !== undefined ? (recurring ? 1 : 0) : row.recurring,
    frequency !== undefined ? (frequency?.trim() || null) : row.frequency,
    storeCode !== undefined ? (storeCode?.trim() || null) : row.storeCode,
    url !== undefined ? (url?.trim() || null) : row.url,
    preferredBrand !== undefined ? (preferredBrand?.trim() || null) : row.preferredBrand,
    isPreference !== undefined ? (isPreference ? 1 : 0) : row.isPreference,
    req.params.id
  )
  res.json(toItem(db.prepare('SELECT * FROM shoppingItems WHERE id=?').get(req.params.id) as ItemRow))
})

// Look up a preferred item by name across all stores — the lookup an agent makes
// when told "add toilet paper to the Costco cart".
router.get('/preferences', (req, res) => {
  const { q } = req.query as Record<string, string>
  let sql = `
    SELECT i.*, s.name AS storeName
    FROM shoppingItems i
    LEFT JOIN shoppingStores s ON s.id = i.storeId
    WHERE i.isPreference = 1
  `
  const params: string[] = []
  if (q) { sql += ' AND LOWER(i.name) LIKE ?'; params.push(`%${q.toLowerCase()}%`) }
  sql += ' ORDER BY i.name'
  const rows = db.prepare(sql).all(...params) as (ItemRow & { storeName: string | null })[]
  res.json(rows.map(r => ({ ...toItem(r), store: r.storeName ?? undefined })))
})

router.delete('/items/:id', (req, res) => {
  db.prepare('DELETE FROM shoppingItems WHERE id=?').run(req.params.id)
  res.status(204).end()
})

router.delete('/stores/:storeId/checked', (req, res) => {
  // Preference items are a standing catalogue — clearing the trip unchecks them
  // rather than deleting them, so the brand preference survives.
  db.prepare('UPDATE shoppingItems SET checked=0 WHERE storeId=? AND checked=1 AND isPreference=1')
    .run(req.params.storeId)
  db.prepare('DELETE FROM shoppingItems WHERE storeId=? AND checked=1 AND isPreference=0')
    .run(req.params.storeId)
  res.status(204).end()
})

export default router
