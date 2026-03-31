import { useEffect, useMemo, useState } from 'react'
import { useCrmStore } from '../store'
import type { Contact } from '../types'

export type CrmSortField = 'name' | 'company' | 'lastContactedAt' | 'nextFollowUp'
export type CrmSortDir = 'asc' | 'desc'

function getNextFollowUp(contact: Contact): Date | null {
  if (!contact.followUpDays) return null
  if (!contact.lastContactedAt) return new Date(0) // never contacted = immediately overdue
  const next = new Date(contact.lastContactedAt)
  next.setDate(next.getDate() + contact.followUpDays)
  return next
}

function sortContacts(contacts: Contact[], field: CrmSortField, dir: CrmSortDir): Contact[] {
  return [...contacts].sort((a, b) => {
    let result = 0
    if (field === 'name') {
      result = a.name.localeCompare(b.name)
    } else if (field === 'company') {
      result = (a.company ?? '').localeCompare(b.company ?? '')
    } else if (field === 'lastContactedAt') {
      const aDate = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0
      const bDate = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0
      result = aDate - bDate
    } else if (field === 'nextFollowUp') {
      const aNext = getNextFollowUp(a)?.getTime() ?? Infinity
      const bNext = getNextFollowUp(b)?.getTime() ?? Infinity
      result = aNext - bNext
    }
    return dir === 'asc' ? result : -result
  })
}

export function useCrm() {
  const contacts = useCrmStore(s => s.contacts)
  const load = useCrmStore(s => s.load)
  const create = useCrmStore(s => s.create)
  const update = useCrmStore(s => s.update)
  const archive = useCrmStore(s => s.archive)
  const remove = useCrmStore(s => s.remove)

  const [sortField, setSortField] = useState<CrmSortField>('name')
  const [sortDir, setSortDir] = useState<CrmSortDir>('asc')
  const [filterTag, setFilterTag] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [load])

  function toggleSort(field: CrmSortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedContacts = useMemo(() => {
    let filtered = contacts
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      )
    }
    if (filterTag.trim()) {
      filtered = filtered.filter(c => c.relationship.some(r => r.toLowerCase().includes(filterTag.toLowerCase())))
    }
    return sortContacts(filtered, sortField, sortDir)
  }, [contacts, sortField, sortDir, filterTag, search])

  return {
    contacts: sortedContacts,
    load, create, update, archive, remove,
    sortField, sortDir, toggleSort,
    filterTag, setFilterTag,
    search, setSearch,
    getNextFollowUp,
  }
}
