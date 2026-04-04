import { db } from './db.js'

interface TodoRow {
  id: string
  title: string
  description: string | null
  completed: number
  dueDate: string | null
  priority: string
  tags: string
}

interface ContactRow {
  id: string
  name: string
  company: string | null
  followUpDays: number | null
  lastContactedAt: string | null
  archived: number
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function todayMidnight(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function formatTodoText(todo: TodoRow): string {
  const check = '[ ]'
  let line = `${check} ${todo.title}`
  if (todo.dueDate) {
    const due = parseLocalDate(todo.dueDate)
    due.setHours(0, 0, 0, 0)
    const today = todayMidnight()
    const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
    const daysLabel = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'due today' : `${days}d left`
    line += ` — Due: ${due.toLocaleDateString()} (${daysLabel})`
  }
  line += ` — Priority: ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}`
  const tags: string[] = JSON.parse(todo.tags || '[]')
  if (tags.length > 0) line += ` — Tags: ${tags.join(', ')}`
  if (todo.description) line += `\n    ${todo.description}`
  return line
}


interface OverdueCrmItem {
  name: string
  company?: string
  daysOverdue: number | null
}

function getOverdueCrmContacts(): OverdueCrmItem[] {
  const contacts = db.prepare(`
    SELECT c.id, c.name, c.company, c.followUpDays,
      (SELECT MAX(i.date) FROM interactions i WHERE i.contactId = c.id) as lastContactedAt
    FROM contacts c
    WHERE c.archived=0 AND c.followUpDays IS NOT NULL
  `).all() as ContactRow[]

  const today = todayMidnight()
  const overdue: OverdueCrmItem[] = []

  for (const c of contacts) {
    if (!c.followUpDays) continue
    if (!c.lastContactedAt) {
      overdue.push({ name: c.name, company: c.company ?? undefined, daysOverdue: null })
      continue
    }
    const next = new Date(c.lastContactedAt)
    next.setDate(next.getDate() + c.followUpDays)
    next.setHours(0, 0, 0, 0)
    if (next <= today) {
      const days = Math.ceil((today.getTime() - next.getTime()) / 86_400_000)
      overdue.push({ name: c.name, company: c.company ?? undefined, daysOverdue: days })
    }
  }

  return overdue.sort((a, b) => {
    if (a.daysOverdue === null) return -1
    if (b.daysOverdue === null) return 1
    return b.daysOverdue - a.daysOverdue
  })
}

export function generateDailyEmail(): { subject: string; text: string } {
  const today = new Date()
  const dateLabel = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`

  const allTodos = db.prepare(
    'SELECT * FROM todos WHERE completed=0 ORDER BY priority, dueDate'
  ).all() as TodoRow[]

  const crmOverdue = getOverdueCrmContacts()

  const lines: string[] = [
    dateLabel,
    '',
  ]

  if (allTodos.length > 0) {
    lines.push('Tasks:', '')
    allTodos.forEach(t => lines.push(formatTodoText(t)))
    lines.push('')
  } else {
    lines.push('No tasks.', '')
  }

  if (crmOverdue.length > 0) {
    lines.push('CRM Follow-ups Overdue', '----------------------', '')
    for (const c of crmOverdue) {
      const status = c.daysOverdue === null ? 'Never contacted' : `${c.daysOverdue}d overdue`
      const company = c.company ? ` (${c.company})` : ''
      lines.push(`• ${c.name}${company} — ${status}`)
    }
  }

  return {
    subject: dateLabel,
    text: lines.join('\n'),
  }
}
