import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { Contact } from '../types'
import type { CrmSortDir, CrmSortField } from '../hooks/useCrm'

interface Props {
  contacts: Contact[]
  sortField: CrmSortField
  sortDir: CrmSortDir
  onToggleSort: (field: CrmSortField) => void
  onSelect: (id: string) => void
  onArchive: (id: string, archived: boolean) => void
  onDelete: (id: string) => void
  getNextFollowUp: (contact: Contact) => Date | null
  showArchived?: boolean
}

type ConfirmAction = 'archive' | 'unarchive' | 'delete'

function SortIcon({ field, sortField, sortDir }: { field: CrmSortField; sortField: CrmSortField; sortDir: CrmSortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />
  return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
}

function SortHeader({ label, field, sortField, sortDir, onToggleSort }: {
  label: string; field: CrmSortField; sortField: CrmSortField; sortDir: CrmSortDir; onToggleSort: (f: CrmSortField) => void
}) {
  return (
    <button onClick={() => onToggleSort(field)} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
      {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </button>
  )
}

function formatFrequency(days: number | undefined): string {
  if (!days) return '—'
  if (days === 1) return 'Daily'
  if (days === 7) return 'Weekly'
  if (days === 14) return 'Fortnightly'
  if (days === 30) return 'Monthly'
  if (days === 90) return 'Quarterly'
  if (days === 182) return 'Half-yearly'
  if (days === 365) return 'Yearly'
  return `Every ${days}d`
}

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export function ContactTable({ contacts, sortField, sortDir, onToggleSort, onSelect, onArchive, onDelete, getNextFollowUp, showArchived }: Props) {
  const [confirm, setConfirm] = useState<{ id: string; action: ConfirmAction } | null>(null)

  if (contacts.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-16">{showArchived ? 'No archived contacts.' : 'No contacts yet. Add one above.'}</p>
  }

  const today = new Date()

  function handleConfirm(id: string, action: ConfirmAction) {
    if (action === 'delete') onDelete(id)
    else if (action === 'archive') onArchive(id, true)
    else if (action === 'unarchive') onArchive(id, false)
    setConfirm(null)
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left">
              <SortHeader label="Name" field="name" sortField={sortField} sortDir={sortDir} onToggleSort={onToggleSort} />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Company" field="company" sortField={sortField} sortDir={sortDir} onToggleSort={onToggleSort} />
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Relationship</th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Reminder" field="followUpDays" sortField={sortField} sortDir={sortDir} onToggleSort={onToggleSort} />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Last Contact" field="lastContactedAt" sortField={sortField} sortDir={sortDir} onToggleSort={onToggleSort} />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Next Follow-up" field="nextFollowUp" sortField={sortField} sortDir={sortDir} onToggleSort={onToggleSort} />
            </th>
            <th className="px-4 py-3 text-right font-medium text-gray-600 w-48">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contacts.map(contact => {
            const nextFollowUp = getNextFollowUp(contact)
            const isOverdue = nextFollowUp ? nextFollowUp < today : false
            const isConfirming = confirm?.id === contact.id

            return (
              <tr key={contact.id} className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => !isConfirming && onSelect(contact.id)}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{contact.name}</div>
                  {contact.role && <div className="text-xs text-gray-400">{contact.role}</div>}
                </td>
                <td className="px-4 py-3 text-gray-500">{contact.company ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {contact.relationship.map(r => (
                      <span key={r} className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={contact.followUpDays
                    ? contact.followUpDays <= 7 ? 'text-purple-600 font-medium'
                    : contact.followUpDays <= 30 ? 'text-blue-600'
                    : 'text-gray-500'
                    : 'text-gray-300'}>
                    {formatFrequency(contact.followUpDays)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {contact.lastContactedAt
                    ? <span>{new Date(contact.lastContactedAt).toLocaleDateString()} · {daysAgo(contact.lastContactedAt)}</span>
                    : <span className="text-gray-300">Never</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {nextFollowUp ? (
                    <span className={isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}>
                      {isOverdue
                        ? contact.lastContactedAt
                          ? `⚠ ${nextFollowUp.toLocaleDateString()}`
                          : '⚠ Never contacted'
                        : nextFollowUp.toLocaleDateString()}
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                  {isConfirming ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="text-xs text-gray-500">Are you sure?</span>
                      <button
                        onClick={() => handleConfirm(contact.id, confirm.action)}
                        className="text-xs px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600"
                      >Yes</button>
                      <button
                        onClick={() => setConfirm(null)}
                        className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >No</button>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-3">
                      <button
                        onClick={() => onSelect(contact.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >View</button>
                      <button
                        onClick={() => setConfirm({ id: contact.id, action: showArchived ? 'unarchive' : 'archive' })}
                        className="text-xs text-amber-600 hover:text-amber-800"
                      >{showArchived ? 'Unarchive' : 'Archive'}</button>
                      <button
                        onClick={() => setConfirm({ id: contact.id, action: 'delete' })}
                        className="text-xs text-red-400 hover:text-red-600"
                      >Delete</button>
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
