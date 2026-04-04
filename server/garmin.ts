import { GarminConnect } from 'garmin-connect'
import { db } from './db.js'

function dateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function mapActivityType(typeKey: string): string {
  const map: Record<string, string> = {
    running: 'running', trail_running: 'running', treadmill_running: 'running',
    cycling: 'cycling', road_biking: 'cycling', mountain_biking: 'cycling', virtual_ride: 'cycling', indoor_cycling: 'cycling',
    swimming: 'swimming', lap_swimming: 'swimming', open_water_swimming: 'swimming',
    walking: 'walking', hiking: 'walking',
    strength_training: 'strength', gym_and_fitness_equipment: 'strength',
    hiit: 'hiit', cardio: 'hiit',
    yoga: 'yoga',
    rowing: 'rowing', indoor_rowing: 'rowing',
    pilates: 'pilates',
    crossfit: 'crossfit',
  }
  return map[typeKey?.toLowerCase()] ?? 'other'
}

export interface GarminSyncResult {
  activitiesAdded: number
  metricsAdded: number
  errors: string[]
}

export async function syncGarminData(daysBack = 30): Promise<GarminSyncResult> {
  const email = process.env.GARMIN_EMAIL
  const password = process.env.GARMIN_PASSWORD
  if (!email || !password) throw new Error('GARMIN_EMAIL and GARMIN_PASSWORD must be set in .env')

  const client = new GarminConnect({ username: email, password })
  await client.login()

  const result: GarminSyncResult = { activitiesAdded: 0, metricsAdded: 0, errors: [] }
  const startDate = daysAgo(daysBack)
  const endDateStr = dateStr(new Date())
  const startDateStr = dateStr(startDate)

  // ── Activities → fitnessSessions ───────────────────────────────────────────
  try {
    const activities = await client.getActivities(0, Math.min(daysBack * 3, 100)) as any[]
    for (const a of activities) {
      try {
        const actDate = new Date(a.startTimeLocal ?? a.startTimeGMT)
        if (actDate < startDate) continue
        const garminId = String(a.activityId)
        const existing = db.prepare('SELECT id FROM fitnessSessions WHERE garminId = ?').get(garminId)
        if (existing) continue

        const typeKey = a.activityType?.typeKey ?? a.activityType ?? 'other'
        db.prepare(`
          INSERT INTO fitnessSessions (id, date, type, durationMins, distanceKm, calories, avgHr, maxHr, notes, garminId, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          crypto.randomUUID(),
          dateStr(actDate),
          mapActivityType(typeKey),
          Math.round((a.duration ?? 0) / 60),
          a.distance ? Math.round((a.distance / 1000) * 100) / 100 : null,
          a.calories ?? null,
          a.averageHR ?? null,
          a.maxHR ?? null,
          a.activityName ?? null,
          garminId,
          new Date().toISOString()
        )
        result.activitiesAdded++

        // VO2 max from activity
        if (a.vO2MaxValue) {
          upsertMetric(dateStr(actDate), 'activity', 'vo2_max', a.vO2MaxValue, 'ml/kg/min', `garmin-vo2-${dateStr(actDate)}`)
          result.metricsAdded++
        }
      } catch (e: any) {
        result.errors.push(`Activity ${a.activityId}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(`Activities sync: ${e.message}`)
  }

  // ── Body composition (scale) ───────────────────────────────────────────────
  try {
    const bodyComp = await (client as any).getBodyComposition(startDateStr, endDateStr)
    const entries = bodyComp?.allMetrics?.metricsForDates ?? bodyComp?.dateWeightList ?? []
    for (const entry of entries) {
      try {
        const date = entry.calendarDate ?? entry.date ?? (entry.dateTime ? dateStr(new Date(entry.dateTime)) : null)
        if (!date) continue
        const metrics = entry.metrics ?? entry
        const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10
        const gToLbs = (g: number) => Math.round(g * 0.00220462 * 10) / 10

        if (metrics.weight || entry.weight) {
          const weightG = metrics.weight ?? entry.weight
          upsertMetric(date, 'body', 'weight', kgToLbs(weightG / 1000), 'lbs', `garmin-weight-${date}`)
          result.metricsAdded++
        }
        if (metrics.bmi ?? entry.bmi) {
          upsertMetric(date, 'body', 'bmi', metrics.bmi ?? entry.bmi, '', `garmin-bmi-${date}`)
          result.metricsAdded++
        }
        if (metrics.bodyFatPercentage ?? entry.bodyFatPercentage) {
          upsertMetric(date, 'body', 'body_fat', metrics.bodyFatPercentage ?? entry.bodyFatPercentage, '%', `garmin-bodyfat-${date}`)
          result.metricsAdded++
        }
        if (metrics.muscleMass ?? entry.muscleMass) {
          const massG = metrics.muscleMass ?? entry.muscleMass
          upsertMetric(date, 'body', 'muscle_mass', gToLbs(massG), 'lbs', `garmin-muscle-${date}`)
          result.metricsAdded++
        }
        if (metrics.boneMass ?? entry.boneMass) {
          const massG = metrics.boneMass ?? entry.boneMass
          upsertMetric(date, 'body', 'bone_mass', gToLbs(massG), 'lbs', `garmin-bone-${date}`)
          result.metricsAdded++
        }
        if (metrics.hydrationPercentage ?? entry.hydrationPercentage) {
          upsertMetric(date, 'body', 'hydration', metrics.hydrationPercentage ?? entry.hydrationPercentage, '%', `garmin-hydration-${date}`)
          result.metricsAdded++
        }
      } catch (e: any) { result.errors.push(`Body comp entry: ${e.message}`) }
    }
  } catch (e: any) {
    result.errors.push(`Body composition: ${e.message}`)
  }

  // ── Daily health stats (iterate each day) ─────────────────────────────────
  for (let i = 0; i < daysBack; i++) {
    const d = daysAgo(i)
    const ds = dateStr(d)

    // Heart rate
    try {
      const hr = await (client as any).getHeartRate(d) as any
      if (hr?.restingHeartRate) {
        upsertMetric(ds, 'activity', 'resting_hr', hr.restingHeartRate, 'bpm', `garmin-rhr-${ds}`)
        result.metricsAdded++
      }
    } catch (_) {}

    // Sleep
    try {
      const sleep = await (client as any).getSleep(d) as any
      const dto = sleep?.dailySleepDTO ?? sleep
      if (dto?.sleepTimeSeconds) {
        upsertMetric(ds, 'activity', 'sleep_hours', Math.round(dto.sleepTimeSeconds / 360) / 10, 'hrs', `garmin-sleep-${ds}`)
        result.metricsAdded++
      }
      if (dto?.deepSleepSeconds) {
        upsertMetric(ds, 'activity', 'sleep_deep_hours', Math.round(dto.deepSleepSeconds / 360) / 10, 'hrs', `garmin-sleep-deep-${ds}`)
        result.metricsAdded++
      }
      if (dto?.lightSleepSeconds) {
        upsertMetric(ds, 'activity', 'sleep_light_hours', Math.round(dto.lightSleepSeconds / 360) / 10, 'hrs', `garmin-sleep-light-${ds}`)
        result.metricsAdded++
      }
      if (dto?.remSleepSeconds) {
        upsertMetric(ds, 'activity', 'sleep_rem_hours', Math.round(dto.remSleepSeconds / 360) / 10, 'hrs', `garmin-sleep-rem-${ds}`)
        result.metricsAdded++
      }
      if (dto?.averageRespirationValue ?? dto?.avgSleepRespirationValue) {
        upsertMetric(ds, 'activity', 'sleep_respiration', dto.averageRespirationValue ?? dto.avgSleepRespirationValue, 'brpm', `garmin-respiration-${ds}`)
        result.metricsAdded++
      }
    } catch (_) {}

    // Stress
    try {
      const stress = await (client as any).getStress(d) as any
      const avgStress = stress?.avgStressLevel ?? stress?.overallStressLevel
      if (avgStress && avgStress > 0) {
        upsertMetric(ds, 'activity', 'stress', avgStress, '', `garmin-stress-${ds}`)
        result.metricsAdded++
      }
    } catch (_) {}
  }

  // Steps — use range query if available
  try {
    const stepsData = await (client as any).getDailySteps(startDate, new Date()) as any[]
    if (Array.isArray(stepsData)) {
      for (const day of stepsData) {
        const ds = day.calendarDate ?? day.date
        const steps = day.totalSteps ?? day.steps
        if (ds && steps) {
          upsertMetric(ds, 'activity', 'steps', steps, 'steps', `garmin-steps-${ds}`)
          result.metricsAdded++
        }
      }
    }
  } catch (_) {}

  // Log result
  db.prepare(`
    INSERT INTO garminSyncLog (id, syncedAt, daysBack, activitiesAdded, metricsAdded, error)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    new Date().toISOString(),
    daysBack,
    result.activitiesAdded,
    result.metricsAdded,
    result.errors.length > 0 ? result.errors.slice(0, 5).join('; ') : null
  )

  return result
}

function upsertMetric(date: string, category: string, metric: string, value: number, unit: string, garminId: string) {
  // Delete existing Garmin entry for this date+metric, then insert fresh
  db.prepare("DELETE FROM healthMetrics WHERE garminId = ?").run(garminId)
  db.prepare(`
    INSERT INTO healthMetrics (id, date, category, metric, value, unit, source, garminId, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, 'garmin', ?, ?)
  `).run(crypto.randomUUID(), date, category, metric, value, unit, garminId, new Date().toISOString())
}
