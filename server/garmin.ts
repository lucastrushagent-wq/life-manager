// garmin-connect ships CommonJS with no `exports` map, so Node's ESM loader cannot
// detect its named exports — `import { GarminConnect }` throws at load time and takes
// the whole server down with it. Import the default and destructure instead.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — no type declarations for garmin-connect
import garminConnect from 'garmin-connect'
import { db } from './db.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { GarminConnect } = garminConnect as any

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
        const ds = dateStr(actDate)
        const typeKey = a.activityType?.typeKey ?? a.activityType ?? 'other'

        // Convert speed from m/s to km/h
        const avgSpeedKmh = a.averageSpeed
          ? Math.round(a.averageSpeed * 3.6 * 100) / 100
          : null

        const existing = db.prepare('SELECT id FROM fitnessSessions WHERE garminId = ?').get(garminId) as { id: string } | undefined

        if (existing) {
          // Update with any new fields we now collect
          db.prepare(`
            UPDATE fitnessSessions SET
              elevationGain = ?, avgSpeedKmh = ?, avgCadence = ?,
              aerobicEffect = ?, anaerobicEffect = ?, trainingLoad = ?,
              avgRespirationRate = ?, lactateThresholdHr = ?,
              avgVerticalOscillation = ?, avgGroundContactMs = ?, avgStrideLength = ?
            WHERE garminId = ?
          `).run(
            a.elevationGain ?? null,
            avgSpeedKmh,
            a.averageBikingCadenceInRevPerMinute ?? a.averageRunningCadenceInStepsPerMinute ?? null,
            a.aerobicTrainingEffect ?? null,
            a.anaerobicTrainingEffect ?? null,
            a.activityTrainingLoad ?? null,
            a.avgRespirationRate ?? null,
            a.lactateThresholdBpm ?? null,
            a.avgVerticalOscillation ?? null,
            a.avgGroundContactTime ?? null,
            a.avgStrideLength ?? null,
            garminId
          )
        } else {
          db.prepare(`
            INSERT INTO fitnessSessions (
              id, date, type, durationMins, distanceKm, calories, avgHr, maxHr, notes, garminId,
              elevationGain, avgSpeedKmh, avgCadence, aerobicEffect, anaerobicEffect, trainingLoad,
              avgRespirationRate, lactateThresholdHr, avgVerticalOscillation, avgGroundContactMs, avgStrideLength,
              createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            crypto.randomUUID(),
            ds,
            mapActivityType(typeKey),
            Math.round((a.duration ?? 0) / 60),
            a.distance ? Math.round((a.distance / 1000) * 100) / 100 : null,
            a.calories ?? null,
            a.averageHR ?? null,
            a.maxHR ?? null,
            a.activityName ?? null,
            garminId,
            a.elevationGain ?? null,
            avgSpeedKmh,
            a.averageBikingCadenceInRevPerMinute ?? a.averageRunningCadenceInStepsPerMinute ?? null,
            a.aerobicTrainingEffect ?? null,
            a.anaerobicTrainingEffect ?? null,
            a.activityTrainingLoad ?? null,
            a.avgRespirationRate ?? null,
            a.lactateThresholdBpm ?? null,
            a.avgVerticalOscillation ?? null,
            a.avgGroundContactTime ?? null,
            a.avgStrideLength ?? null,
            new Date().toISOString()
          )
          result.activitiesAdded++
        }

        // VO2 max from activity
        if (a.vO2MaxValue) {
          upsertMetric(ds, 'activity', 'vo2_max', a.vO2MaxValue, 'ml/kg/min', `garmin-vo2-${ds}`)
          result.metricsAdded++
        }
      } catch (e: any) {
        result.errors.push(`Activity ${a.activityId}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(`Activities sync: ${e.message}`)
  }

  // ── Body composition (scale) — try known method names defensively ──────────
  try {
    const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10
    const gToLbs  = (g: number)  => Math.round(g * 0.00220462 * 10) / 10

    // Probe which method this version of garmin-connect exposes
    const fetchBodyData: (() => Promise<any>) | null =
      typeof (client as any).getDailyWeightData === 'function'
        ? () => (client as any).getDailyWeightData(startDateStr, endDateStr)
      : typeof (client as any).getBodyComposition === 'function'
        ? () => (client as any).getBodyComposition(startDateStr, endDateStr)
      : typeof (client as any).getBodyCompositionData === 'function'
        ? () => (client as any).getBodyCompositionData(startDateStr, endDateStr)
      : null

    if (!fetchBodyData) {
      result.errors.push('Body composition: no compatible method found in this garmin-connect version (skipped)')
    } else {
      const data = await fetchBodyData()
      const entries: any[] =
        data?.dateWeightList ??
        data?.allMetrics?.metricsForDates ??
        (Array.isArray(data) ? data : [])

      for (const entry of entries) {
        try {
          const date = entry.calendarDate ?? entry.date ?? (entry.dateTime ? dateStr(new Date(entry.dateTime)) : null)
          if (!date) continue
          const m = entry.metrics ?? entry   // some versions nest under .metrics

          if (m.weight ?? entry.weight) {
            upsertMetric(date, 'body', 'weight', kgToLbs((m.weight ?? entry.weight) / 1000), 'lbs', `garmin-weight-${date}`)
            result.metricsAdded++
          }
          if (m.bmi ?? entry.bmi) {
            upsertMetric(date, 'body', 'bmi', m.bmi ?? entry.bmi, '', `garmin-bmi-${date}`)
            result.metricsAdded++
          }
          if (m.bodyFatPercentage ?? entry.bodyFatPercentage) {
            upsertMetric(date, 'body', 'body_fat', m.bodyFatPercentage ?? entry.bodyFatPercentage, '%', `garmin-bodyfat-${date}`)
            result.metricsAdded++
          }
          if (m.muscleMass ?? entry.muscleMass) {
            upsertMetric(date, 'body', 'muscle_mass', gToLbs(m.muscleMass ?? entry.muscleMass), 'lbs', `garmin-muscle-${date}`)
            result.metricsAdded++
          }
          if (m.boneMass ?? entry.boneMass) {
            upsertMetric(date, 'body', 'bone_mass', gToLbs(m.boneMass ?? entry.boneMass), 'lbs', `garmin-bone-${date}`)
            result.metricsAdded++
          }
          if (m.bodyWater ?? entry.bodyWater) {
            upsertMetric(date, 'body', 'hydration', m.bodyWater ?? entry.bodyWater, '%', `garmin-hydration-${date}`)
            result.metricsAdded++
          }
          if (m.visceralFat ?? entry.visceralFat) {
            upsertMetric(date, 'body', 'visceral_fat', m.visceralFat ?? entry.visceralFat, '', `garmin-visceralfat-${date}`)
            result.metricsAdded++
          }
          if (m.metabolicAge ?? entry.metabolicAge) {
            upsertMetric(date, 'body', 'metabolic_age', m.metabolicAge ?? entry.metabolicAge, 'yrs', `garmin-metabolicage-${date}`)
            result.metricsAdded++
          }
        } catch (e: any) { result.errors.push(`Body comp entry: ${e.message}`) }
      }
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

    // Sleep — use getSleepData for full detail including HRV, score, body battery
    try {
      const sleep = await (client as any).getSleepData(ds) as any
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
      if (dto?.awakeSleepSeconds) {
        upsertMetric(ds, 'activity', 'sleep_awake_mins', Math.round(dto.awakeSleepSeconds / 60), 'min', `garmin-sleep-awake-${ds}`)
        result.metricsAdded++
      }
      const avgResp = dto?.averageRespirationValue ?? dto?.avgSleepRespirationValue
      if (avgResp) {
        upsertMetric(ds, 'activity', 'sleep_respiration', avgResp, 'brpm', `garmin-respiration-${ds}`)
        result.metricsAdded++
      }
      // Sleep score
      const sleepScore = dto?.sleepScores?.overall?.value ?? dto?.sleepScore
      if (sleepScore) {
        upsertMetric(ds, 'activity', 'sleep_score', sleepScore, '', `garmin-sleep-score-${ds}`)
        result.metricsAdded++
      }
      // Sleep avg HR
      if (dto?.avgSleepHR ?? dto?.averageHeartRate) {
        upsertMetric(ds, 'activity', 'sleep_avg_hr', dto.avgSleepHR ?? dto.averageHeartRate, 'bpm', `garmin-sleep-hr-${ds}`)
        result.metricsAdded++
      }
      // HRV 7-day average
      const hrv7 = sleep?.hrvSummary?.lastNight5MinHigh ?? sleep?.hrvSummary?.weeklyAvg
      if (hrv7) {
        upsertMetric(ds, 'activity', 'hrv_7day', hrv7, 'ms', `garmin-hrv-${ds}`)
        result.metricsAdded++
      }
      // Body battery from sleep data
      const bbHigh = sleep?.bodyBatteryChange?.highestBodyBattery ?? sleep?.highestBodyBattery
      if (bbHigh) {
        upsertMetric(ds, 'activity', 'body_battery', bbHigh, '', `garmin-bb-${ds}`)
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

    // SpO2
    try {
      const spo2 = await (client as any).getSpO2Data(d) as any
      const avgSpo2 = spo2?.averageSpO2 ?? spo2?.spO2SleepSummary?.averageSpO2
      if (avgSpo2 && avgSpo2 > 0) {
        upsertMetric(ds, 'activity', 'spo2', avgSpo2, '%', `garmin-spo2-${ds}`)
        result.metricsAdded++
      }
    } catch (_) {}
  }

  // Steps — use range query
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
        // Active minutes from steps data
        const activeMins = day.activeMinutes ?? day.moderateIntensityMinutes
        if (ds && activeMins) {
          upsertMetric(ds, 'activity', 'active_minutes', activeMins, 'min', `garmin-active-${ds}`)
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
  db.prepare("DELETE FROM healthMetrics WHERE garminId = ?").run(garminId)
  db.prepare(`
    INSERT INTO healthMetrics (id, date, category, metric, value, unit, source, garminId, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, 'garmin', ?, ?)
  `).run(crypto.randomUUID(), date, category, metric, value, unit, garminId, new Date().toISOString())
}
