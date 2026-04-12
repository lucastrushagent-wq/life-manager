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
import { startCronJobs } from './cron.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT ?? 3001
const isProd = process.env.NODE_ENV === 'production'

const app = express()

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

if (isProd) {
  const distDir = path.join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  startCronJobs()
})
