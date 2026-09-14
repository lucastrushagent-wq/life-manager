import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

type Row = Record<string, unknown>

function toTodo(row: Row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    completed: row.completed === 1,
    dueDate: row.dueDate ?? undefined,
    priority: row.priority,
    tags: JSON.parse(row.tags as string),
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
    deletedAt: row.deletedAt ?? undefined,
    scheduledAt: row.scheduledAt ?? undefined,
    scheduledEndAt: row.scheduledEndAt ?? undefined,
    calendarEventId: row.calendarEventId ?? undefined,
  }
}

router.get('/archive', (_req, res) => {
  const rows = db.prepare(`
    SELECT * FROM todos
    WHERE deletedAt IS NOT NULL OR completed = 1
    ORDER BY COALESCE(deletedAt, completedAt, createdAt) DESC
  `).all() as Row[]
  res.json(rows.map(toTodo))
})

// ?scheduled=false returns the work list for time-boxing: open items with no
// calendar slot yet. ?scheduled=true returns those already blocked out.
router.get('/', (req, res) => {
  const { scheduled } = req.query as Record<string, string>
  let sql = 'SELECT * FROM todos WHERE deletedAt IS NULL'
  if (scheduled === 'false') sql += ' AND scheduledAt IS NULL AND completed = 0'
  if (scheduled === 'true') sql += ' AND scheduledAt IS NOT NULL'
  sql += ' ORDER BY createdAt DESC'
  const rows = db.prepare(sql).all() as Row[]
  res.json(rows.map(toTodo))
})

router.post('/', (req, res) => {
  const { id, title, description, completed, dueDate, priority, tags, createdAt } = req.body
  db.prepare(`
    INSERT INTO todos (id, title, description, completed, dueDate, priority, tags, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description ?? null, completed ? 1 : 0, dueDate ?? null, priority, JSON.stringify(tags ?? []), createdAt)
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Row
  res.status(201).json(toTodo(row))
})

router.patch('/:id', (req, res) => {
  const { id } = req.params
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Row | undefined
  if (!row) return res.status(404).json({ error: 'Todo not found' })

  const patch = req.body
  const nowCompleting = patch.completed === true && row.completed === 0
  const updated = {
    title:       patch.title       ?? row.title,
    description: patch.description ?? row.description ?? null,
    completed:   patch.completed !== undefined ? (patch.completed ? 1 : 0) : row.completed,
    dueDate:     patch.dueDate     ?? row.dueDate ?? null,
    priority:    patch.priority    ?? row.priority,
    tags:        JSON.stringify(patch.tags ?? JSON.parse(row.tags as string)),
    completedAt: nowCompleting ? new Date().toISOString() : (row.completedAt ?? null),
    // null is meaningful here — it is how the agent un-schedules an item — so
    // these use `in patch` rather than ?? , which would treat null as absent.
    scheduledAt: 'scheduledAt' in patch ? (patch.scheduledAt ?? null) : (row.scheduledAt ?? null),
    scheduledEndAt: 'scheduledEndAt' in patch ? (patch.scheduledEndAt ?? null) : (row.scheduledEndAt ?? null),
    calendarEventId: 'calendarEventId' in patch ? (patch.calendarEventId ?? null) : (row.calendarEventId ?? null),
  }

  db.prepare(`
    UPDATE todos SET title = ?, description = ?, completed = ?, dueDate = ?, priority = ?, tags = ?, completedAt = ?,
      scheduledAt = ?, scheduledEndAt = ?, calendarEventId = ?
    WHERE id = ?
  `).run(updated.title, updated.description, updated.completed, updated.dueDate, updated.priority, updated.tags, updated.completedAt,
    updated.scheduledAt, updated.scheduledEndAt, updated.calendarEventId, id)

  const result = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Row
  res.json(toTodo(result))
})

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE todos SET deletedAt = ? WHERE id = ?').run(new Date().toISOString(), req.params.id)
  res.status(204).send()
})

export default router
