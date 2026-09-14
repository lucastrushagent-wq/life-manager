#!/usr/bin/env node
/** Manual backup: `npm run backup`. The nightly job in cron.ts calls runBackup directly. */
import { runBackup, listBackups, BACKUP_DIR, RETAIN_DAYS } from './backup.js'

const mb = (b: number) => `${(b / 1024 / 1024).toFixed(2)} MB`

if (process.argv.includes('--list')) {
  const all = listBackups()
  console.log(`${all.length} backup(s) in ${BACKUP_DIR} (retaining ${RETAIN_DAYS} days)`)
  for (const b of all) console.log(`  ${b.date}  ${mb(b.bytes).padStart(9)}  ${b.file}`)
  process.exit(0)
}

try {
  const r = await runBackup()
  console.log(`Backed up to ${r.file}`)
  console.log(`  ${mb(r.bytes)}, ${r.tables} tables, integrity_check=${r.integrity}, ${r.durationMs}ms`)
  if (r.pruned.length) console.log(`  pruned ${r.pruned.length} older than ${RETAIN_DAYS} days`)
} catch (e) {
  console.error(`Backup FAILED: ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
}
