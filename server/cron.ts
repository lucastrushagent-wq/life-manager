import cron from 'node-cron'
import { sendMorningEmail } from './emailService.js'
import { syncGarminData } from './garmin.js'

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

  cron.schedule('0 7 * * *', async () => {
    if (!process.env.GARMIN_EMAIL || !process.env.GARMIN_PASSWORD) return
    console.log('[cron] Syncing Garmin...')
    try {
      const result = await syncGarminData(3)  // last 3 days for daily catch-up
      console.log(`[cron] Garmin sync done: ${result.activitiesAdded} activities, ${result.metricsAdded} metrics`)
    } catch (e: any) {
      console.error('[cron] Garmin sync failed:', e.message)
    }
  }, { timezone: process.env.TZ ?? 'America/New_York' })
  console.log('[cron] Garmin sync scheduled: 0 7 * * *')
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
