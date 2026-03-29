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
  }
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM todos ORDER BY createdAt DESC').all() as Row[]
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
  const updated = {
    title:       patch.title       ?? row.title,
    description: patch.description ?? row.description ?? null,
    completed:   patch.completed !== undefined ? (patch.completed ? 1 : 0) : row.completed,
    dueDate:     patch.dueDate     ?? row.dueDate ?? null,
    priority:    patch.priority    ?? row.priority,
    tags:        JSON.stringify(patch.tags ?? JSON.parse(row.tags as string)),
  }

  db.prepare(`
    UPDATE todos SET title = ?, description = ?, completed = ?, dueDate = ?, priority = ?, tags = ?
    WHERE id = ?
  `).run(updated.title, updated.description, updated.completed, updated.dueDate, updated.priority, updated.tags, id)

  const result = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Row
  res.json(toTodo(result))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

export default router
