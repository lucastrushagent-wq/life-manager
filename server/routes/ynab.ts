import { Router } from 'express'
import { syncYnab, getLastYnabSync } from '../ynab.js'

const router = Router()

// GET /api/ynab/status
router.get('/status', (_req, res) => {
  const configured = !!process.env.YNAB_API_KEY
  const lastSync = getLastYnabSync()
  res.json({ configured, lastSync: lastSync ?? null })
})

// POST /api/ynab/sync
router.post('/sync', async (_req, res) => {
  if (!process.env.YNAB_API_KEY) {
    return res.status(400).json({ error: 'YNAB_API_KEY not set in .env' })
  }
  try {
    const result = await syncYnab()
    res.json({ ok: true, ...result })
  } catch (e: any) {
    console.error('[ynab] Manual sync failed:', e.message)
    res.status(500).json({ error: e.message })
  }
})

export default router
