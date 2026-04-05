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

  CREATE TABLE IF NOT EXISTS shoppingStores (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL UNIQUE,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS shoppingItems (
    id        TEXT PRIMARY KEY,
    storeId   TEXT NOT NULL REFERENCES shoppingStores(id) ON DELETE CASCADE,
    name      TEXT NOT NULL,
    quantity  TEXT,
    notes     TEXT,
    checked   INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
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

  CREATE TABLE IF NOT EXISTS healthMetrics (
    id        TEXT PRIMARY KEY,
    date      TEXT NOT NULL,
    category  TEXT NOT NULL,
    metric    TEXT NOT NULL,
    value     REAL NOT NULL,
    unit      TEXT NOT NULL,
    notes     TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bloodWork (
    id           TEXT PRIMARY KEY,
    testDate     TEXT NOT NULL,
    marker       TEXT NOT NULL,
    value        REAL NOT NULL,
    unit         TEXT NOT NULL,
    referenceMin REAL,
    referenceMax REAL,
    notes        TEXT,
    createdAt    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS medications (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    dose       TEXT NOT NULL,
    frequency  TEXT NOT NULL,
    purpose    TEXT,
    startDate  TEXT,
    refillDate TEXT,
    active     INTEGER NOT NULL DEFAULT 1,
    notes      TEXT,
    createdAt  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS medicalHistory (
    id        TEXT PRIMARY KEY,
    category  TEXT NOT NULL,
    title     TEXT NOT NULL,
    date      TEXT,
    notes     TEXT,
    severity  TEXT,
    status    TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS emailLog (
    id        TEXT PRIMARY KEY,
    sentDate  TEXT NOT NULL UNIQUE,
    sentAt    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visionStatement (
    id        TEXT PRIMARY KEY,
    content   TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visionMission (
    id        TEXT PRIMARY KEY,
    content   TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visionValues (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    sortOrder   INTEGER NOT NULL DEFAULT 0,
    createdAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visionGoals (
    id          TEXT PRIMARY KEY,
    category    TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    timeframe   TEXT NOT NULL,
    targetDate  TEXT,
    status      TEXT NOT NULL DEFAULT 'active',
    createdAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visionManifesto (
    id        TEXT PRIMARY KEY,
    content   TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visionImage (
    id        TEXT PRIMARY KEY,
    filename  TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fitnessSessions (
    id          TEXT PRIMARY KEY,
    date        TEXT NOT NULL,
    type        TEXT NOT NULL,
    durationMins INTEGER NOT NULL,
    distanceKm  REAL,
    calories    REAL,
    avgHr       REAL,
    maxHr       REAL,
    notes       TEXT,
    createdAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fitnessSets (
    id        TEXT PRIMARY KEY,
    date      TEXT NOT NULL,
    exercise  TEXT NOT NULL,
    sets      INTEGER NOT NULL,
    reps      INTEGER NOT NULL,
    weightKg  REAL,
    notes     TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fitnessRecords (
    id        TEXT PRIMARY KEY,
    category  TEXT NOT NULL,
    name      TEXT NOT NULL,
    value     REAL NOT NULL,
    unit      TEXT NOT NULL,
    date      TEXT NOT NULL,
    notes     TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS netWorthSnapshots (
    id              TEXT PRIMARY KEY,
    date            TEXT NOT NULL UNIQUE,
    totalAssets     REAL NOT NULL,
    totalLiabilities REAL NOT NULL,
    netWorth        REAL NOT NULL,
    createdAt       TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS garminSyncLog (
    id               TEXT PRIMARY KEY,
    syncedAt         TEXT NOT NULL,
    daysBack         INTEGER NOT NULL,
    activitiesAdded  INTEGER NOT NULL DEFAULT 0,
    metricsAdded     INTEGER NOT NULL DEFAULT 0,
    error            TEXT
  );

  CREATE TABLE IF NOT EXISTS investmentHoldings (
    id           TEXT PRIMARY KEY,
    ticker       TEXT NOT NULL,
    name         TEXT NOT NULL,
    assetClass   TEXT NOT NULL DEFAULT 'other',
    account      TEXT NOT NULL DEFAULT '',
    shares       REAL NOT NULL,
    avgCost      REAL NOT NULL,
    currentPrice REAL NOT NULL,
    lastUpdated  TEXT NOT NULL,
    notes        TEXT,
    createdAt    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id          TEXT PRIMARY KEY,
    date        TEXT NOT NULL,
    description TEXT NOT NULL,
    amount      REAL NOT NULL,
    category    TEXT NOT NULL DEFAULT 'other',
    source      TEXT NOT NULL,
    notes       TEXT,
    importedAt  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS aestheticProducts (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    brand     TEXT,
    category  TEXT NOT NULL DEFAULT 'other',
    status    TEXT NOT NULL DEFAULT 'active',
    rating    INTEGER,
    notes     TEXT,
    url       TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groomingRoutines (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    timeOfDay  TEXT NOT NULL DEFAULT 'morning',
    steps      TEXT NOT NULL DEFAULT '[]',
    notes      TEXT,
    createdAt  TEXT NOT NULL,
    updatedAt  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groomingSchedules (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    frequencyDays INTEGER NOT NULL,
    lastDoneAt    TEXT,
    notes         TEXT,
    createdAt     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wardrobeItems (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    category  TEXT NOT NULL DEFAULT 'other',
    color     TEXT,
    brand     TEXT,
    status    TEXT NOT NULL DEFAULT 'owned',
    notes     TEXT,
    imageUrl  TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS outfitIdeas (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    occasion    TEXT,
    season      TEXT NOT NULL DEFAULT 'all',
    notes       TEXT,
    createdAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inspirationItems (
    id        TEXT PRIMARY KEY,
    title     TEXT NOT NULL,
    imageUrl  TEXT,
    sourceUrl TEXT,
    category  TEXT NOT NULL DEFAULT 'general',
    notes     TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS philosophies (
    moduleId  TEXT PRIMARY KEY,
    content   TEXT NOT NULL DEFAULT '',
    updatedAt TEXT NOT NULL
  );
`)

// Migrations — safe to run on existing databases (must run after CREATE TABLE)
const contactCols = (db.prepare("PRAGMA table_info(contacts)").all() as { name: string }[]).map(c => c.name)
if (!contactCols.includes('role')) db.exec("ALTER TABLE contacts ADD COLUMN role TEXT")
if (!contactCols.includes('linkedinUrl')) db.exec("ALTER TABLE contacts ADD COLUMN linkedinUrl TEXT")
if (!contactCols.includes('archived')) db.exec("ALTER TABLE contacts ADD COLUMN archived INTEGER NOT NULL DEFAULT 0")
if (!contactCols.includes('lastContactedAt')) db.exec("ALTER TABLE contacts ADD COLUMN lastContactedAt TEXT")

const todoCols = (db.prepare("PRAGMA table_info(todos)").all() as { name: string }[]).map(c => c.name)
if (!todoCols.includes('recurringTodoId')) db.exec("ALTER TABLE todos ADD COLUMN recurringTodoId TEXT")
if (!todoCols.includes('completedAt')) db.exec("ALTER TABLE todos ADD COLUMN completedAt TEXT")
if (!todoCols.includes('deletedAt')) db.exec("ALTER TABLE todos ADD COLUMN deletedAt TEXT")

// Shopping item migrations
const shoppingItemCols = (db.prepare("PRAGMA table_info(shoppingItems)").all() as { name: string }[]).map(c => c.name)
if (!shoppingItemCols.includes('recurring')) db.exec("ALTER TABLE shoppingItems ADD COLUMN recurring INTEGER NOT NULL DEFAULT 0")
if (!shoppingItemCols.includes('frequency')) db.exec("ALTER TABLE shoppingItems ADD COLUMN frequency TEXT")
if (!shoppingItemCols.includes('storeCode')) db.exec("ALTER TABLE shoppingItems ADD COLUMN storeCode TEXT")
if (!shoppingItemCols.includes('url')) db.exec("ALTER TABLE shoppingItems ADD COLUMN url TEXT")

// Garmin sync migrations
const healthMetricCols = (db.prepare("PRAGMA table_info(healthMetrics)").all() as { name: string }[]).map(c => c.name)
if (!healthMetricCols.includes('source')) db.exec("ALTER TABLE healthMetrics ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'")
if (!healthMetricCols.includes('garminId')) db.exec("ALTER TABLE healthMetrics ADD COLUMN garminId TEXT")

const sessionCols = (db.prepare("PRAGMA table_info(fitnessSessions)").all() as { name: string }[]).map(c => c.name)
if (!sessionCols.includes('garminId'))               db.exec("ALTER TABLE fitnessSessions ADD COLUMN garminId TEXT")
if (!sessionCols.includes('elevationGain'))          db.exec("ALTER TABLE fitnessSessions ADD COLUMN elevationGain REAL")
if (!sessionCols.includes('avgSpeedKmh'))            db.exec("ALTER TABLE fitnessSessions ADD COLUMN avgSpeedKmh REAL")
if (!sessionCols.includes('avgCadence'))             db.exec("ALTER TABLE fitnessSessions ADD COLUMN avgCadence REAL")
if (!sessionCols.includes('aerobicEffect'))          db.exec("ALTER TABLE fitnessSessions ADD COLUMN aerobicEffect REAL")
if (!sessionCols.includes('anaerobicEffect'))        db.exec("ALTER TABLE fitnessSessions ADD COLUMN anaerobicEffect REAL")
if (!sessionCols.includes('trainingLoad'))           db.exec("ALTER TABLE fitnessSessions ADD COLUMN trainingLoad REAL")
if (!sessionCols.includes('avgRespirationRate'))     db.exec("ALTER TABLE fitnessSessions ADD COLUMN avgRespirationRate REAL")
if (!sessionCols.includes('lactateThresholdHr'))     db.exec("ALTER TABLE fitnessSessions ADD COLUMN lactateThresholdHr REAL")
if (!sessionCols.includes('avgVerticalOscillation')) db.exec("ALTER TABLE fitnessSessions ADD COLUMN avgVerticalOscillation REAL")
if (!sessionCols.includes('avgGroundContactMs'))     db.exec("ALTER TABLE fitnessSessions ADD COLUMN avgGroundContactMs REAL")
if (!sessionCols.includes('avgStrideLength'))        db.exec("ALTER TABLE fitnessSessions ADD COLUMN avgStrideLength REAL")

// Seed default shopping stores if none exist
const storeCount = (db.prepare("SELECT COUNT(*) as n FROM shoppingStores").get() as { n: number }).n
if (storeCount === 0) {
  const now = new Date().toISOString()
  const insert = db.prepare("INSERT INTO shoppingStores (id, name, sortOrder, createdAt) VALUES (?, ?, ?, ?)")
  insert.run(crypto.randomUUID(), 'Costco', 0, now)
  insert.run(crypto.randomUUID(), 'Amazon', 1, now)
  insert.run(crypto.randomUUID(), 'Walmart', 2, now)
}
