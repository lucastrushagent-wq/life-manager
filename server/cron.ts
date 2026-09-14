import cron from 'node-cron'
import { sendMorningEmail } from './emailService.js'
import { syncGarminData } from './garmin.js'
import { syncYnab } from './ynab.js'
import { runBackup } from './backup.js'
import { generateSourcedTodos } from './generatedTodos.js'

export function startCronJobs() {
  // Default: 6:00am daily. Override with EMAIL_SEND_TIME env var (cron syntax, e.g. "0 7 * * *" for 7am)
  const schedule = process.env.EMAIL_SEND_TIME ?? '0 6 * * *'

  if (!cron.validate(schedule)) {
    console.error(`[cron] Invalid EMAIL_SEND_TIME schedule: "${schedule}". Falling back to 6am.`)
    cron.schedule('0 6 * * *', runMorningEmail)
    return
  }

  cron.schedule(schedule, runMorningEmail, { timezone: process.env.TZ ?? 'America/New_York' })
  console.log(`[cron] Morning email scheduled: ${schedule}`)

  cron.schedule('0 20 * * *', async () => {
    if (!process.env.GARMIN_EMAIL || !process.env.GARMIN_PASSWORD) return
    console.log('[cron] Syncing Garmin...')
    try {
      const result = await syncGarminData(3)  // last 3 days for daily catch-up
      console.log(`[cron] Garmin sync done: ${result.activitiesAdded} activities, ${result.metricsAdded} metrics`)
    } catch (e: any) {
      console.error('[cron] Garmin sync failed:', e.message)
    }
  }, { timezone: process.env.TZ ?? 'America/New_York' })
  console.log('[cron] Garmin sync scheduled: 0 20 * * *')

  // Nightly YNAB sync at 2am — balances + last 90 days of transactions
  cron.schedule('0 2 * * *', async () => {
    if (!process.env.YNAB_API_KEY) return
    console.log('[cron] Syncing YNAB...')
    try {
      const result = await syncYnab()
      console.log(`[cron] YNAB sync done: ${result.accountsCreated} created, ${result.accountsUpdated} updated, ${result.transactionsAdded} new transactions`)
    } catch (e: any) {
      console.error('[cron] YNAB sync failed:', e.message)
    }
  }, { timezone: process.env.TZ ?? 'America/New_York' })
  console.log('[cron] YNAB sync scheduled: 0 2 * * *')

  // Nightly backup at 3am — after the YNAB sync at 2am, so the snapshot includes
  // the night's imports. Unlike the sync jobs this is not opt-in: it needs no
  // credentials and losing this database is unrecoverable (data/ is gitignored).
  if (process.env.BACKUP_ENABLED !== 'false') {
    cron.schedule('0 3 * * *', async () => {
      try {
        const r = await runBackup()
        const mb = (r.bytes / 1024 / 1024).toFixed(2)
        console.log(
          `[cron] Backup done: ${r.file} (${mb} MB, ${r.tables} tables, ${r.durationMs}ms)` +
          (r.pruned.length ? `, pruned ${r.pruned.length}` : '')
        )
      } catch (e: any) {
        console.error('[cron] Backup FAILED:', e.message)
      }
    }, { timezone: process.env.TZ ?? 'America/New_York' })
    console.log('[cron] Backup scheduled: 0 3 * * *')
  }

  // Materialise due items just before the 6am briefing, so the day starts with a
  // complete list. Idempotent, so a missed run simply catches up the next day.
  cron.schedule('30 5 * * *', () => {
    try {
      const created = generateSourcedTodos()
      if (created.length) {
        console.log(`[cron] Generated ${created.length} todo(s): ${created.map(c => c.title).join(', ')}`)
      }
    } catch (e: any) {
      console.error('[cron] Sourced todo generation failed:', e.message)
    }
  }, { timezone: process.env.TZ ?? 'America/New_York' })
  console.log('[cron] Sourced todo generation scheduled: 30 5 * * *')
}

async function runMorningEmail() {
  console.log('[cron] Sending morning email...')
  const result = await sendMorningEmail()
  if (result.ok) {
    console.log('[cron] Morning email sent.')
  } else {
    console.error('[cron] Morning email failed:', result.error)
  }
}
