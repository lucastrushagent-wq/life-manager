import { useEffect } from 'react'
import { useCrmStore } from '../../crm/store'

export interface OverdueFollowUp {
  id: string
  name: string
  company?: string
  daysOverdue: number | null // null = never contacted
}

export function useCrmFollowUps(): OverdueFollowUp[] {
  const contacts = useCrmStore(s => s.contacts)
  const load = useCrmStore(s => s.load)

  useEffect(() => {
    if (contacts.length === 0) load()
  }, [contacts.length, load])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return contacts
    .filter(c => !c.archived && c.followUpDays)
    .reduce<OverdueFollowUp[]>((acc, c) => {
      if (!c.lastContactedAt) {
        acc.push({ id: c.id, name: c.name, company: c.company, daysOverdue: null })
        return acc
      }
      const next = new Date(c.lastContactedAt)
      next.setDate(next.getDate() + c.followUpDays!)
      next.setHours(0, 0, 0, 0)
      if (next <= today) {
        const days = Math.floor((today.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
        acc.push({ id: c.id, name: c.name, company: c.company, daysOverdue: days })
      }
      return acc
    }, [])
    .sort((a, b) => {
      // never contacted sorts first, then most overdue
      if (a.daysOverdue === null && b.daysOverdue === null) return a.name.localeCompare(b.name)
      if (a.daysOverdue === null) return -1
      if (b.daysOverdue === null) return 1
      return b.daysOverdue - a.daysOverdue
    })
}
