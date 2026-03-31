import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import todosRouter from './routes/todos.js'
import crmRouter from './routes/crm.js'
import recurringTodosRouter from './routes/recurringTodos.js'
import financeRouter from './routes/finance.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT ?? 3001
const isProd = process.env.NODE_ENV === 'production'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/todos', todosRouter)
app.use('/api/contacts', crmRouter)
app.use('/api/recurring-todos', recurringTodosRouter)
app.use('/api/finance/accounts', financeRouter)

if (isProd) {
  const distDir = path.join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
