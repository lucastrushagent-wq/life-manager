import { useRef, useState } from 'react'
import { Plus, Upload } from 'lucide-react'
import { PhilosophyBox } from '../../../core/PhilosophyBox'
import { useCrm } from '../hooks/useCrm'
import { crmService } from '../service'
import { AddContactForm } from './AddContactForm'
import { ContactTable } from './ContactTable'
import { ContactDetail } from './ContactDetail'

interface ImportResult {
  created: number
  updated: number
  skipped: number
}

type CrmView = 'active' | 'archived'

export function CrmModule() {
  const { contacts, create, archive, remove, sortField, sortDir, toggleSort, filterTag, setFilterTag, search, setSearch, getNextFollowUp, load } = useCrm()
  const [view, setView] = useState<CrmView>('active')
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (selectedId) {
    return <ContactDetail contactId={selectedId} onBack={() => setSelectedId(null)} />
  }

  const activeContacts = contacts.filter(c => !c.archived)
  const archivedContacts = contacts.filter(c => c.archived)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    setImportResult(null)
    try {
      const csv = await file.text()
      const result = await crmService.importLinkedin(csv)
      setImportResult(result)
      load()
    } catch {
      setImportResult({ created: -1, updated: 0, skipped: 0 })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">CRM</h1>
          <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => { setView('active'); setShowForm(false) }}
              className={`px-3 py-1.5 flex items-center gap-1.5 ${view === 'active' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Active
              {activeContacts.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${view === 'active' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {activeContacts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setView('archived'); setShowForm(false) }}
              className={`px-3 py-1.5 border-l border-gray-200 flex items-center gap-1.5 ${view === 'archived' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Archived
              {archivedContacts.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${view === 'archived' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {archivedContacts.length}
                </span>
              )}
            </button>
          </div>
        </div>
        {!showForm && view === 'active' && (
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import LinkedIn'}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add contact
            </button>
          </div>
        )}
      </div>

      <PhilosophyBox moduleId="crm" />

      {importResult && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center justify-between ${importResult.created === -1 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {importResult.created === -1
            ? 'Import failed — make sure you uploaded the LinkedIn Connections.csv file.'
            : `Import complete: ${importResult.created} new contact${importResult.created !== 1 ? 's' : ''}, ${importResult.updated} updated.`
          }
          <button onClick={() => setImportResult(null)} className="ml-4 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

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
        contacts={view === 'active' ? activeContacts : archivedContacts}
        sortField={sortField}
        sortDir={sortDir}
        onToggleSort={toggleSort}
        onSelect={setSelectedId}
        onArchive={archive}
        onDelete={remove}
        getNextFollowUp={getNextFollowUp}
        showArchived={view === 'archived'}
      />
    </div>
  )
}
