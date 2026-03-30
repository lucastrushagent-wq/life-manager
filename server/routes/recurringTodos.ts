import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'

const router = Router()
type Row = Record<string, unknown>

function toRecurring(row: Row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority,
    tags: JSON.parse(row.tags as string),
    frequencyValue: row.frequencyValue,
    frequencyUnit: row.frequencyUnit,
    lastGeneratedAt: row.lastGeneratedAt ?? undefined,
    createdAt: row.createdAt,
  }
}

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
    recurringTodoId: row.recurringTodoId ?? undefined,
  }
}

function getNextDueAt(lastGeneratedAt: string | null, frequencyValue: number, frequencyUnit: string): Date {
  if (!lastGeneratedAt) return new Date(0) // never generated — due immediately
  const next = new Date(lastGeneratedAt)
  if (frequencyUnit === 'weeks') {
    next.setDate(next.getDate() + frequencyValue * 7)
  } else {
    next.setMonth(next.getMonth() + frequencyValue)
  }
  return next
}

// CRUD
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM recurringTodos ORDER BY createdAt ASC').all() as Row[]
  res.json(rows.map(toRecurring))
})

router.post('/', (req, res) => {
  const { id, title, description, priority, tags, frequencyValue, frequencyUnit, createdAt } = req.body
  db.prepare(`
    INSERT INTO recurringTodos (id, title, description, priority, tags, frequencyValue, frequencyUnit, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description ?? null, priority, JSON.stringify(tags ?? []), frequencyValue, frequencyUnit, createdAt)
  const row = db.prepare('SELECT * FROM recurringTodos WHERE id = ?').get(id) as Row
  res.status(201).json(toRecurring(row))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM recurringTodos WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

// Generation — called on app load
router.post('/generate', (_req, res) => {
  const recurring = db.prepare('SELECT * FROM recurringTodos').all() as Row[]
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const generated = []

  for (const r of recurring) {
    const nextDue = getNextDueAt(
      r.lastGeneratedAt as string | null,
      r.frequencyValue as number,
      r.frequencyUnit as string,
    )
    if (nextDue > today) continue

    // Skip if an incomplete todo already exists for this recurring template
    const existing = db.prepare(
      'SELECT id FROM todos WHERE recurringTodoId = ? AND completed = 0'
    ).get(r.id)
    if (existing) continue

    const todoId = randomUUID()
    const now = new Date().toISOString()
    db.prepare(`
      INSERT INTO todos (id, title, description, completed, priority, tags, createdAt, recurringTodoId)
      VALUES (?, ?, ?, 0, ?, ?, ?, ?)
    `).run(todoId, r.title, r.description ?? null, r.priority, r.tags, now, r.id)
    db.prepare('UPDATE recurringTodos SET lastGeneratedAt = ? WHERE id = ?').run(now, r.id)

    const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(todoId) as Row
    generated.push(toTodo(row))
  }

  res.json(generated)
})

export default router
