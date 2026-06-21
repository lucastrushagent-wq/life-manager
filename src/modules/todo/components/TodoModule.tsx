import { useState } from 'react'
import { Plus, Share2, Check, Loader2, Users, Mail } from 'lucide-react'
import { useTodos } from '../hooks/useTodos'
import { useGmailShare } from '../hooks/useGmailShare'
import { useRecurringTodos } from '../hooks/useRecurringTodos'
import { useCrmFollowUps } from '../hooks/useCrmFollowUps'
import { useMorningEmail } from '../hooks/useMorningEmail'
import { useNavigationStore } from '../../../core/navigationStore'
import { AddTodoForm } from './AddTodoForm'
import { TodoTable } from './TodoTable'
import { AddRecurringTodoForm } from './AddRecurringTodoForm'
import { RecurringTodoTable } from './RecurringTodoTable'
import { TodoArchive } from './TodoArchive'
import type { Priority, Todo } from '../types'

type TabView = 'tasks' | 'future' | 'recurring' | 'archive'

function isFuture(todo: Todo): boolean {
  if (!todo.dueDate) return false
  const due = new Date(todo.dueDate)
  due.setHours(0, 0, 0, 0)
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() + 7)
  return due > cutoff
}

export function TodoModule() {
  const {
    todos, create, update, toggle, remove,
    sortField, sortDir, toggleSort,
    filterPriority, setFilterPriority,
    filterTag, setFilterTag,
    getEmailContent,
  } = useTodos()
  const { shareToGmail, status } = useGmailShare()
  const { recurringTodos, create: createRecurring, remove: removeRecurring } = useRecurringTodos()
  const followUps = useCrmFollowUps()
  const { status: emailStatus, sendNow } = useMorningEmail()
  const setActiveTab = useNavigationStore(s => s.setActiveTabId)

  const [view, setView] = useState<TabView>('tasks')
  const [showForm, setShowForm] = useState(false)
  const [futureAlert, setFutureAlert] = useState<string | null>(null)

  const activeTodos = todos.filter(t => !isFuture(t))
  const futureTodos = todos.filter(t => isFuture(t))

  function handleShare() {
    const { subject, body } = getEmailContent(followUps)
    shareToGmail(subject, body)
  }

  async function handleCreate(input: Parameters<typeof create>[0]) {
    await create(input)
    if (input.dueDate) {
      const due = new Date(input.dueDate)
      due.setHours(0, 0, 0, 0)
      const cutoff = new Date()
      cutoff.setHours(0, 0, 0, 0)
      cutoff.setDate(cutoff.getDate() + 7)
      if (due > cutoff) {
        const days = Math.ceil((due.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
        setFutureAlert(`Task added to Future — due in ${days} days`)
        setTimeout(() => setFutureAlert(null), 4000)
      }
    }
    setShowForm(false)
  }

  const shareLabel = status === 'sending' ? 'Sending...'
    : status === 'sent' ? 'Sent!'
    : status === 'error' ? 'Failed'
    : 'Share'

  const tabDefs: { id: TabView; label: string; count?: number }[] = [
    { id: 'tasks', label: 'Tasks', count: activeTodos.filter(t => !t.completed).length },
    { id: 'future', label: 'Future', count: futureTodos.filter(t => !t.completed).length },
    { id: 'recurring', label: 'Recurring' },
    { id: 'archive', label: 'Archive' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-8">

      {/* ── Header row: title + action buttons ── */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold text-gray-900">To-do</h1>
        {!showForm && (
          <div className="flex gap-1.5">
            {view === 'tasks' && (
              <>
                <button
                  onClick={handleShare}
                  disabled={status === 'sending'}
                  title="Share via Gmail"
                  className="flex items-center gap-1.5 text-sm px-2 py-2 sm:px-3 sm:py-1.5 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {status === 'sent' && <Check className="w-4 h-4 text-green-500" />}
                  {(status === 'idle' || status === 'error') && <Share2 className="w-4 h-4" />}
                  <span className="hidden sm:inline">{shareLabel}</span>
                </button>
                <button
                  onClick={sendNow}
                  disabled={emailStatus === 'sending' || emailStatus === 'unconfigured'}
                  title={emailStatus === 'unconfigured' ? 'Add EMAIL_USER, EMAIL_PASS, EMAIL_TO to .env to enable' : 'Send morning briefing email now'}
                  className="flex items-center gap-1.5 text-sm px-2 py-2 sm:px-3 sm:py-1.5 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailStatus === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {emailStatus === 'sent' && <Check className="w-4 h-4 text-green-500" />}
                  {(emailStatus === 'idle' || emailStatus === 'error' || emailStatus === 'unconfigured') && <Mail className="w-4 h-4" />}
                  <span className="hidden sm:inline">
                    {emailStatus === 'sending' ? 'Sending...' : emailStatus === 'sent' ? 'Sent!' : emailStatus === 'error' ? 'Failed' : 'Send email'}
                  </span>
                </button>
              </>
            )}
            {view !== 'future' && view !== 'archive' && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 text-sm px-2.5 py-2 sm:px-3 sm:py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{view === 'tasks' ? 'Add task' : 'Add recurring'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Sub-tab bar — full width on mobile ── */}
      <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm mb-4 sm:w-fit">
        {tabDefs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => { setView(tab.id); setShowForm(false) }}
            className={`flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 flex items-center justify-center gap-1.5 ${i > 0 ? 'border-l border-gray-200' : ''} ${view === tab.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${view === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {futureAlert && (
        <div className="mb-4 flex items-center justify-between px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {futureAlert}
          <button onClick={() => setFutureAlert(null)} className="ml-4 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      {view === 'tasks' && (
        <>
          {showForm && (
            <AddTodoForm
              onAdd={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          )}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
              className="text-sm border border-gray-200 rounded px-3 py-2.5 sm:py-1.5 text-gray-600 outline-none focus:border-blue-400 bg-white"
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              type="text"
              placeholder="Filter by tag..."
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              className="text-sm border border-gray-200 rounded px-3 py-2.5 sm:py-1.5 text-gray-600 outline-none focus:border-blue-400 sm:w-40"
            />
          </div>
          <TodoTable
            todos={activeTodos}
            sortField={sortField}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            onToggle={toggle}
            onUpdate={update}
            onDelete={remove}
          />

          {followUps.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-700">CRM Follow-ups overdue</h2>
                <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">{followUps.length}</span>
              </div>
              <div className="rounded-lg border border-orange-100 overflow-hidden">
                {followUps.map((f, i) => (
                  <div key={f.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 px-4 py-3 bg-white text-sm ${i < followUps.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div>
                      <span className="font-medium text-gray-800">{f.name}</span>
                      {f.company && <span className="text-gray-400 ml-2">{f.company}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-orange-500 font-medium">
                        {f.daysOverdue === null ? 'Never contacted' : `${f.daysOverdue}d overdue`}
                      </span>
                      <button
                        onClick={() => setActiveTab('crm')}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Go to CRM →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {view === 'future' && (
        <>
          <p className="text-sm text-gray-400 mb-4">Tasks due more than 7 days from today. They'll move to Tasks automatically when the date approaches.</p>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
              className="text-sm border border-gray-200 rounded px-3 py-2.5 sm:py-1.5 text-gray-600 outline-none focus:border-blue-400 bg-white"
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              type="text"
              placeholder="Filter by tag..."
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              className="text-sm border border-gray-200 rounded px-3 py-2.5 sm:py-1.5 text-gray-600 outline-none focus:border-blue-400 sm:w-40"
            />
          </div>
          <TodoTable
            todos={futureTodos}
            sortField={sortField}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            onToggle={toggle}
            onUpdate={update}
            onDelete={remove}
          />
        </>
      )}

      {view === 'recurring' && (
        <>
          {showForm && (
            <AddRecurringTodoForm
              onAdd={input => { createRecurring(input); setShowForm(false) }}
              onCancel={() => setShowForm(false)}
            />
          )}
          <RecurringTodoTable
            recurringTodos={recurringTodos}
            onDelete={removeRecurring}
          />
        </>
      )}

      {view === 'archive' && <TodoArchive />}
    </div>
  )
}
