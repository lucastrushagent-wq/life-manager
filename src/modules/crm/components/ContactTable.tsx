import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { Contact } from '../types'
import type { CrmSortDir, CrmSortField } from '../hooks/useCrm'

interface Props {
  contacts: Contact[]
  sortField: CrmSortField
  sortDir: CrmSortDir
  onToggleSort: (field: CrmSortField) => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  getNextFollowUp: (contact: Contact) => Date | null
}

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

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export function ContactTable({ contacts, sortField, sortDir, onToggleSort, onSelect, onDelete, getNextFollowUp }: Props) {
  if (contacts.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-16">No contacts yet. Add one above.</p>
  }

  const today = new Date()

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
              <SortHeader label="Last Contact" field="lastContactedAt" sortField={sortField} sortDir={sortDir} onToggleSort={onToggleSort} />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Next Follow-up" field="nextFollowUp" sortField={sortField} sortDir={sortDir} onToggleSort={onToggleSort} />
            </th>
            <th className="px-4 py-3 w-24" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contacts.map(contact => {
            const nextFollowUp = getNextFollowUp(contact)
            const isOverdue = nextFollowUp ? nextFollowUp < today : false
            return (
              <tr key={contact.id} className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelect(contact.id)}>
                <td className="px-4 py-3 font-medium text-gray-800">{contact.name}</td>
                <td className="px-4 py-3 text-gray-500">{contact.company ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {contact.relationship.map(r => (
                      <span key={r} className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {contact.lastContactedAt
                    ? <span>{new Date(contact.lastContactedAt).toLocaleDateString()} · {daysAgo(contact.lastContactedAt)}</span>
                    : <span className="text-gray-300">Never</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {nextFollowUp ? (
                    <span className={isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}>
                      {isOverdue ? '⚠ ' : ''}{nextFollowUp.toLocaleDateString()}
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                  <button onClick={() => onSelect(contact.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 mr-3">View</button>
                  <button onClick={() => onDelete(contact.id)}
                    className="text-xs text-gray-300 hover:text-red-400">Delete</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
