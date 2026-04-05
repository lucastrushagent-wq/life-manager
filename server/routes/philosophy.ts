import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

interface PhilosophyRow {
  moduleId: string
  content: string
  updatedAt: string
}

router.get('/:moduleId', (req, res) => {
  const row = db.prepare('SELECT * FROM philosophies WHERE moduleId=?').get(req.params.moduleId) as PhilosophyRow | undefined
  res.json({ moduleId: req.params.moduleId, content: row?.content ?? '', updatedAt: row?.updatedAt ?? null })
})

router.put('/:moduleId', (req, res) => {
  const { content } = req.body
  if (typeof content !== 'string') return res.status(400).json({ error: 'content must be a string' })
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO philosophies (moduleId, content, updatedAt) VALUES (?, ?, ?) ON CONFLICT(moduleId) DO UPDATE SET content=excluded.content, updatedAt=excluded.updatedAt'
  ).run(req.params.moduleId, content, now)
  res.json({ moduleId: req.params.moduleId, content, updatedAt: now })
})

export default router
