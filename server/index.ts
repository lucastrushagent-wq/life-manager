import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import visionRouter from './routes/vision.js'
import todosRouter from './routes/todos.js'
import crmRouter from './routes/crm.js'
import recurringTodosRouter from './routes/recurringTodos.js'
import financeRouter from './routes/finance.js'
import shoppingRouter from './routes/shopping.js'
import healthRouter from './routes/health.js'
import fitnessRouter from './routes/fitness.js'
import emailRouter from './routes/email.js'
import garminRouter from './routes/garmin.js'
import expensesRouter from './routes/expenses.js'
import investmentsRouter from './routes/investments.js'
import aestheticsRouter from './routes/aesthetics.js'
import philosophyRouter from './routes/philosophy.js'
import professionalRouter from './routes/professional.js'
import eventsRouter from './routes/events.js'
import ynabRouter from './routes/ynab.js'
import serviceProvidersRouter from './routes/serviceProviders.js'
import fitnessEventsRouter from './routes/fitnessEvents.js'
import technologyRouter from './routes/technology.js'
import tweedRouter from './routes/tweed.js'
import calendarRouter from './routes/calendar.js'
import { startCronJobs } from './cron.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 3001)
const isProd = process.env.NODE_ENV === 'production'

// Loopback-only port for agents running on this machine. Set AGENT_PORT=0 to disable.
const AGENT_PORT = Number(process.env.AGENT_PORT ?? 3002)

const app = express()

// Basic auth — active when BASIC_AUTH_USER and BASIC_AUTH_PASS are set in .env
const AUTH_USER = process.env.BASIC_AUTH_USER
const AUTH_PASS = process.env.BASIC_AUTH_PASS
if (AUTH_USER && AUTH_PASS) {
  app.use((req, res, next) => {
    // Requests accepted on the loopback-only agent port skip auth. The binding is
    // the security boundary: AGENT_PORT is bound to 127.0.0.1/::1 only, so it is
    // unreachable from off this machine, and any process already here can read
    // data/life-manager.db directly anyway — auth would add nothing against it.
    //
    // This keys on localPort, NOT on the remote address, and that distinction is
    // load-bearing: cloudflared forwards public traffic to PORT over loopback, so
    // every tunnel request also appears to come from 127.0.0.1. localPort is a
    // property of the accepting socket and cannot be forged by a client.
    if (req.socket.localPort === AGENT_PORT) return next()

    const header = req.headers.authorization
    if (header?.startsWith('Basic ')) {
      const [user, pass] = Buffer.from(header.slice(6), 'base64').toString().split(':', 2)
      if (user === AUTH_USER && pass === AUTH_PASS) return next()
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Life Manager"')
    res.status(401).send('Unauthorised')
  })
}

app.use(cors())
app.use(express.json({ limit: '20mb' }))

// Serve uploaded files (vision image, etc.)
const dataDir = path.join(__dirname, '..', 'data', 'uploads')
app.use('/uploads', express.static(dataDir))

app.use('/api/vision', visionRouter)
app.use('/api/todos', todosRouter)
app.use('/api/contacts', crmRouter)
app.use('/api/recurring-todos', recurringTodosRouter)
app.use('/api/finance/accounts', financeRouter)
app.use('/api/shopping', shoppingRouter)
app.use('/api/health', healthRouter)
app.use('/api/fitness', fitnessRouter)
app.use('/api/email', emailRouter)
app.use('/api/garmin', garminRouter)
app.use('/api/expenses', expensesRouter)
app.use('/api/investments', investmentsRouter)
app.use('/api/aesthetics', aestheticsRouter)
app.use('/api/philosophy', philosophyRouter)
app.use('/api/professional', professionalRouter)
app.use('/api/events', eventsRouter)
app.use('/api/ynab', ynabRouter)
app.use('/api/service-providers', serviceProvidersRouter)
app.use('/api/fitness-events', fitnessEventsRouter)
app.use('/api/technology', technologyRouter)
app.use('/api/tweed', tweedRouter)
app.use('/api/calendar', calendarRouter)

if (isProd) {
  const distDir = path.join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

// Loopback-only listener for local agents — no Basic Auth (see the middleware above).
// Bound to both IPv4 and IPv6 loopback because on macOS `localhost` frequently
// resolves to ::1 first, and a v4-only bind would look like connection refused.
if (AGENT_PORT > 0 && AGENT_PORT !== PORT) {
  for (const host of ['127.0.0.1', '::1']) {
    const server = app.listen(AGENT_PORT, host)
    server.on('listening', () => {
      // Node emits 'listening' before it surfaces a bind failure, and address()
      // is null in that case — so report the socket's real state rather than the
      // host we asked for, or the log claims listeners that never came up.
      const addr = server.address()
      if (!addr || typeof addr === 'string') return
      const display = addr.family === 'IPv6' ? `[${addr.address}]` : addr.address
      console.log(`Agent API (no auth, loopback only) on http://${display}:${addr.port}`)
    })
    server.on('error', (e: NodeJS.ErrnoException) => {
      // One stack being unavailable is fine — the other binding still serves.
      if (e.code === 'EAFNOSUPPORT' || e.code === 'EADDRNOTAVAIL') return
      console.error(`[agent-api] could not bind ${host}:${AGENT_PORT}:`, e.message)
    })
  }
} else if (AGENT_PORT === PORT) {
  console.error(`[agent-api] AGENT_PORT must differ from PORT (${PORT}) — agent listener disabled`)
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  startCronJobs()
})
