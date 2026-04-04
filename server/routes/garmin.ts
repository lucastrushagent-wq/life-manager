import { Router } from 'express'
import { db } from '../db.js'
import { syncGarminData } from '../garmin.js'

const router = Router()

router.get('/status', (_req, res) => {
  const last = db.prepare('SELECT * FROM garminSyncLog ORDER BY syncedAt DESC LIMIT 5').all()
  const configured = !!(process.env.GARMIN_EMAIL && process.env.GARMIN_PASSWORD)
  res.json({ configured, logs: last })
})

router.post('/sync', async (req, res) => {
  const configured = !!(process.env.GARMIN_EMAIL && process.env.GARMIN_PASSWORD)
  if (!configured) return res.status(400).json({ error: 'GARMIN_EMAIL and GARMIN_PASSWORD not set in .env' })
  try {
    const daysBack = Number(req.body?.daysBack) || 30
    const result = await syncGarminData(daysBack)
    res.json({ ok: true, ...result })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

export default router
