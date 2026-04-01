import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'life-manager.db')

fs.mkdirSync(dataDir, { recursive: true })

export const db = new Database(dbPath)

// Create tables first
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id               TEXT PRIMARY KEY,
    title            TEXT NOT NULL,
    description      TEXT,
    completed        INTEGER NOT NULL DEFAULT 0,
    dueDate          TEXT,
    priority         TEXT NOT NULL DEFAULT 'medium',
    tags             TEXT NOT NULL DEFAULT '[]',
    createdAt        TEXT NOT NULL,
    recurringTodoId  TEXT
  );

  CREATE TABLE IF NOT EXISTS recurringTodos (
    id             TEXT PRIMARY KEY,
    title          TEXT NOT NULL,
    description    TEXT,
    priority       TEXT NOT NULL DEFAULT 'medium',
    tags           TEXT NOT NULL DEFAULT '[]',
    frequencyValue INTEGER NOT NULL,
    frequencyUnit  TEXT NOT NULL DEFAULT 'weeks',
    lastGeneratedAt TEXT,
    createdAt      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    email        TEXT,
    phone        TEXT,
    company      TEXT,
    role         TEXT,
    relationship TEXT NOT NULL DEFAULT '[]',
    followUpDays INTEGER,
    notes        TEXT,
    createdAt    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS interactions (
    id          TEXT PRIMARY KEY,
    contactId   TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,
    notes       TEXT NOT NULL,
    createdAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS keyDates (
    id          TEXT PRIMARY KEY,
    contactId   TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    month       INTEGER NOT NULL,
    day         INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS financeAccounts (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    type        TEXT NOT NULL,
    value       REAL NOT NULL DEFAULT 0,
    lastUpdated TEXT NOT NULL,
    notes       TEXT,
    createdAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS netWorthSnapshots (
    id              TEXT PRIMARY KEY,
    date            TEXT NOT NULL UNIQUE,
    totalAssets     REAL NOT NULL,
    totalLiabilities REAL NOT NULL,
    netWorth        REAL NOT NULL,
    createdAt       TEXT NOT NULL
  );
`)

// Migrations — safe to run on existing databases (must run after CREATE TABLE)
const contactCols = (db.prepare("PRAGMA table_info(contacts)").all() as { name: string }[]).map(c => c.name)
if (!contactCols.includes('role')) db.exec("ALTER TABLE contacts ADD COLUMN role TEXT")
if (!contactCols.includes('linkedinUrl')) db.exec("ALTER TABLE contacts ADD COLUMN linkedinUrl TEXT")
if (!contactCols.includes('archived')) db.exec("ALTER TABLE contacts ADD COLUMN archived INTEGER NOT NULL DEFAULT 0")

const todoCols = (db.prepare("PRAGMA table_info(todos)").all() as { name: string }[]).map(c => c.name)
if (!todoCols.includes('recurringTodoId')) db.exec("ALTER TABLE todos ADD COLUMN recurringTodoId TEXT")
