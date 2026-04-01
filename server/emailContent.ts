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

function formatTodoHtml(todo: TodoRow): string {
  const today = todayMidnight()
  let dueHtml = ''
  if (todo.dueDate) {
    const due = parseLocalDate(todo.dueDate)
    due.setHours(0, 0, 0, 0)
    const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
    const daysLabel = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'due today' : `${days}d left`
    const labelColor = days < 0 ? '#dc2626' : days === 0 ? '#2563eb' : '#d97706'
    dueHtml = ` <span style="color:#9ca3af">— Due: ${due.toLocaleDateString()}</span> <span style="color:${labelColor};font-size:12px">(${daysLabel})</span>`
  }
  const priorityColor = todo.priority === 'high' ? '#dc2626' : todo.priority === 'medium' ? '#d97706' : '#6b7280'
  const priorityHtml = ` <span style="color:${priorityColor};font-size:12px">— ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}</span>`
  const tags: string[] = JSON.parse(todo.tags || '[]')
  const tagsHtml = tags.length > 0 ? ` <span style="color:#9ca3af;font-size:12px">— ${tags.join(', ')}</span>` : ''
  const descHtml = todo.description ? `<div style="color:#6b7280;font-size:12px;margin-top:2px;padding-left:20px">${todo.description}</div>` : ''
  return `<div style="padding:6px 0;border-bottom:1px solid #f3f4f6">
    <span style="font-family:monospace;color:#9ca3af">[ ]</span>
    <span style="font-size:14px;color:#111827;margin-left:6px">${todo.title}</span>${dueHtml}${priorityHtml}${tagsHtml}
    ${descHtml}
  </div>`
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

  const crmOverdue = getOverdueCrmContacts()

  // ── Plain text ──────────────────────────────────────────────
  const lines: string[] = [
    `Good morning! Here's your day — ${dateLabel}`,
    '='.repeat(50),
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
    lines.push('')
  }

  if (allTodos.length === 0 && crmOverdue.length === 0) {
    lines.push('All clear — nothing pending!')
  }

  const text = lines.join('\n')

  // ── HTML ────────────────────────────────────────────────────
  const todosHtml = allTodos.length > 0
    ? `<div style="margin-bottom:28px">
        <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;margin-bottom:10px">Tasks</div>
        ${allTodos.map(formatTodoHtml).join('')}
      </div>`
    : `<div style="margin-bottom:28px;color:#9ca3af;font-size:14px">No tasks.</div>`

  const crmHtml = crmOverdue.length > 0
    ? `<div>
        <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#7c3aed;margin-bottom:10px">CRM Follow-ups Overdue</div>
        ${crmOverdue.map(c => {
          const status = c.daysOverdue === null ? 'Never contacted' : `${c.daysOverdue}d overdue`
          const company = c.company ? ` <span style="color:#9ca3af">(${c.company})</span>` : ''
          const statusColor = c.daysOverdue === null ? '#dc2626' : '#d97706'
          return `<div style="padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827">
            • ${c.name}${company} <span style="color:${statusColor}">— ${status}</span>
          </div>`
        }).join('')}
      </div>`
    : ''

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#1e293b;padding:24px 32px">
      <div style="font-size:20px;font-weight:700;color:#fff">Good morning</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px">${dateLabel}</div>
    </div>
    <div style="padding:28px 32px">
      ${todosHtml}
      ${crmHtml}
      ${allTodos.length === 0 && crmOverdue.length === 0 ? '<p style="color:#9ca3af;font-size:14px">All clear — nothing pending!</p>' : ''}
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
