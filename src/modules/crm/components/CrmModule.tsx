import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useCrm } from '../hooks/useCrm'
import { AddContactForm } from './AddContactForm'
import { ContactTable } from './ContactTable'
import { ContactDetail } from './ContactDetail'

export function CrmModule() {
  const { contacts, create, remove, sortField, sortDir, toggleSort, filterTag, setFilterTag, search, setSearch, getNextFollowUp } = useCrm()
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (selectedId) {
    return <ContactDetail contactId={selectedId} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">CRM</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add contact
          </button>
        )}
      </div>

      {showForm && (
        <AddContactForm
          onAdd={async input => { await create(input); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Search by name, company, email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-64" />
        <input type="text" placeholder="Filter by relationship tag..."
          value={filterTag} onChange={e => setFilterTag(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-52" />
      </div>

      <ContactTable
        contacts={contacts}
        sortField={sortField}
        sortDir={sortDir}
        onToggleSort={toggleSort}
        onSelect={setSelectedId}
        onDelete={remove}
        getNextFollowUp={getNextFollowUp}
      />
    </div>
  )
}
