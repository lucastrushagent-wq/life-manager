import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Where snapshots are written. Defaults to data/backups, which is beside the
 * database and therefore on the SAME DISK — that protects against corruption and
 * accidental deletion, but not against the drive failing. Point BACKUP_DIR at
 * iCloud Drive, Dropbox or an external volume to get off-machine copies.
 */
const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(__dirname, '..', 'data', 'backups')
const RETAIN_DAYS = Number(process.env.BACKUP_RETAIN ?? 14)

const FILE_RE = /^life-manager-(\d{4}-\d{2}-\d{2})\.db$/

/** Remove a SQLite file together with any -wal/-shm sidecars it left behind. */
function removeWithSidecars(file: string): void {
  for (const suffix of ['', '-wal', '-shm']) {
    const f = file + suffix
    if (fs.existsSync(f)) fs.unlinkSync(f)
  }
}

export interface BackupResult {
  file: string
  bytes: number
  durationMs: number
  integrity: string
  tables: number
  pruned: string[]
}

/**
 * Take a consistent snapshot of the database.
 *
 * Uses SQLite's online backup API rather than copying the file: in WAL mode the
 * committed state is split across the .db and its -wal sidecar, so `cp` of the
 * .db alone can miss recent transactions or capture a torn page mid-write.
 * db.backup() serialises a coherent snapshot regardless of concurrent writers.
 */
export async function runBackup(): Promise<BackupResult> {
  const started = Date.now()
  fs.mkdirSync(BACKUP_DIR, { recursive: true })

  const stamp = new Date().toISOString().slice(0, 10)
  const dest = path.join(BACKUP_DIR, `life-manager-${stamp}.db`)

  // Write to a temp name first so an interrupted run cannot leave a truncated
  // file sitting where a good backup for today used to be.
  const tmp = `${dest}.partial`
  removeWithSidecars(tmp)

  await db.backup(tmp)

  // A backup that cannot be opened is worse than no backup, because it looks
  // like protection. Verify before it replaces today's copy.
  let integrity = 'unknown'
  let tables = 0
  try {
    // Opened read-write, not readonly, so the WAL can be folded back in below.
    const check = new Database(tmp)
    integrity = check.pragma('integrity_check', { simple: true }) as string
    tables = (check.prepare(
      "SELECT COUNT(*) n FROM sqlite_master WHERE type='table'"
    ).get() as { n: number }).n

    // The snapshot inherits WAL from the source, which would leave it as three
    // files (.db plus -wal/-shm). A backup has to survive being copied to a USB
    // stick or a cloud folder on its own, so fold the WAL back in and switch the
    // copy to a rollback journal. Only the backup is changed; the live database
    // stays in WAL.
    check.pragma('wal_checkpoint(TRUNCATE)')
    check.pragma('journal_mode = DELETE')
    check.close()
  } catch (e) {
    removeWithSidecars(tmp)
    throw new Error(`backup verification failed: ${e instanceof Error ? e.message : String(e)}`)
  }
  if (integrity !== 'ok') {
    removeWithSidecars(tmp)
    throw new Error(`backup failed integrity_check: ${integrity}`)
  }

  removeWithSidecars(dest)
  fs.renameSync(tmp, dest)
  const bytes = fs.statSync(dest).size

  // Prune by filename date rather than mtime — mtime shifts if files are copied
  // or synced, which would silently change what gets kept.
  const cutoff = new Date(Date.now() - RETAIN_DAYS * 86_400_000).toISOString().slice(0, 10)
  const pruned: string[] = []
  for (const name of fs.readdirSync(BACKUP_DIR)) {
    const m = FILE_RE.exec(name)
    if (!m) continue
    if (m[1] < cutoff) {
      removeWithSidecars(path.join(BACKUP_DIR, name))
      pruned.push(name)
    }
  }

  return { file: dest, bytes, durationMs: Date.now() - started, integrity, tables, pruned }
}

export function listBackups(): { file: string; bytes: number; date: string }[] {
  if (!fs.existsSync(BACKUP_DIR)) return []
  return fs.readdirSync(BACKUP_DIR)
    .map(name => ({ name, m: FILE_RE.exec(name) }))
    .filter((x): x is { name: string; m: RegExpExecArray } => x.m !== null)
    .map(({ name, m }) => ({
      file: path.join(BACKUP_DIR, name),
      bytes: fs.statSync(path.join(BACKUP_DIR, name)).size,
      date: m[1],
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export { BACKUP_DIR, RETAIN_DAYS }
