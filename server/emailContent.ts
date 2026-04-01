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

function formatTodo(todo: TodoRow): string {
  const today = todayMidnight()
  let line = `• ${todo.title}`
  if (todo.dueDate) {
    const due = parseLocalDate(todo.dueDate)
    due.setHours(0, 0, 0, 0)
    const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
    const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'due today' : `in ${days}d`
    line += ` (${label})`
  }
  const priority = todo.priority
  if (priority === 'high') line += ' !'
  return line
}

interface OverdueCrmItem {
  name: string
  company?: string
  daysOverdue: number | null
}

function getOverdueCrmContacts(): OverdueCrmItem[] {
  const contacts = db.prepare(
    'SELECT id, name, company, followUpDays, lastContactedAt, archived FROM contacts WHERE archived=0 AND followUpDays IS NOT NULL'
  ).all() as ContactRow[]

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

export function generateMorningEmail(): { subject: string; html: string; text: string } {
  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const allTodos = db.prepare(
    'SELECT * FROM todos WHERE completed=0 ORDER BY priority, dueDate'
  ).all() as TodoRow[]

  const todayStr = today.toISOString().split('T')[0]
  const todayMid = todayMidnight()
  const sevenDays = new Date(todayMid.getTime() + 7 * 86_400_000)

  const overdue = allTodos.filter(t => t.dueDate && parseLocalDate(t.dueDate) < todayMid)
  const dueToday = allTodos.filter(t => t.dueDate === todayStr)
  const upcoming = allTodos.filter(t => {
    if (!t.dueDate) return false
    const d = parseLocalDate(t.dueDate)
    return d > todayMid && d <= sevenDays
  })
  const noDate = allTodos.filter(t => !t.dueDate)

  const crmOverdue = getOverdueCrmContacts()

  // Plain text version
  const lines: string[] = [
    `Good morning! Here's your day — ${dateLabel}`,
    '='.repeat(50),
    '',
  ]

  if (overdue.length > 0) {
    lines.push('OVERDUE', '-------')
    overdue.forEach(t => lines.push(formatTodo(t)))
    lines.push('')
  }

  if (dueToday.length > 0) {
    lines.push('DUE TODAY', '---------')
    dueToday.forEach(t => lines.push(formatTodo(t)))
    lines.push('')
  }

  if (upcoming.length > 0) {
    lines.push('UPCOMING (next 7 days)', '---------------------')
    upcoming.forEach(t => lines.push(formatTodo(t)))
    lines.push('')
  }

  if (noDate.length > 0) {
    lines.push('NO DATE', '-------')
    noDate.forEach(t => lines.push(formatTodo(t)))
    lines.push('')
  }

  if (crmOverdue.length > 0) {
    lines.push('CRM — FOLLOW-UPS OVERDUE', '------------------------')
    for (const c of crmOverdue) {
      const status = c.daysOverdue === null ? 'Never contacted' : `${c.daysOverdue}d overdue`
      const company = c.company ? ` (${c.company})` : ''
      lines.push(`• ${c.name}${company} — ${status}`)
    }
    lines.push('')
  }

  if (allTodos.length === 0 && crmOverdue.length === 0) {
    lines.push('All clear — nothing pending!')
  }

  const text = lines.join('\n')

  // HTML version
  function section(title: string, color: string, items: string[]): string {
    if (items.length === 0) return ''
    return `
      <div style="margin-bottom:24px">
        <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${color};margin-bottom:8px">${title}</div>
        ${items.map(i => `<div style="padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">${i}</div>`).join('')}
      </div>`
  }

  const htmlSections = [
    section('Overdue', '#dc2626', overdue.map(formatTodo)),
    section('Due Today', '#2563eb', dueToday.map(formatTodo)),
    section('Upcoming (next 7 days)', '#d97706', upcoming.map(formatTodo)),
    section('No Date', '#6b7280', noDate.map(formatTodo)),
    section('CRM — Follow-ups Overdue', '#7c3aed', crmOverdue.map(c => {
      const status = c.daysOverdue === null ? 'Never contacted' : `${c.daysOverdue}d overdue`
      const company = c.company ? ` <span style="color:#9ca3af">(${c.company})</span>` : ''
      return `${c.name}${company} — ${status}`
    })),
  ].filter(Boolean).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
      <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
        <div style="background:#1e293b;padding:24px 32px">
          <div style="font-size:20px;font-weight:700;color:#fff">Good morning</div>
          <div style="font-size:13px;color:#94a3b8;margin-top:4px">${dateLabel}</div>
        </div>
        <div style="padding:28px 32px">
          ${htmlSections || '<p style="color:#9ca3af;font-size:14px">All clear — nothing pending!</p>'}
        </div>
      </div>
    </body>
    </html>`

  return {
    subject: `Morning briefing — ${dateLabel}`,
    html,
    text,
  }
}
