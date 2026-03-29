import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import todosRouter from './routes/todos.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT ?? 3001
const isProd = process.env.NODE_ENV === 'production'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/todos', todosRouter)

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
