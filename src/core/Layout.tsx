import { tabs } from './tabs'
import { useNavigationStore } from './navigationStore'

export function Layout() {
  const activeId = useNavigationStore(s => s.activeTabId)
  const setActiveId = useNavigationStore(s => s.setActiveTabId)
  const activeTab = tabs.find(t => t.id === activeId) ?? tabs[0]
  const ActiveComponent = activeTab.component

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <nav className="flex border-b border-gray-200 bg-white shadow-sm">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = tab.id === activeId
          return (
            <button
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </nav>
      <main className="flex-1 overflow-auto">
        <ActiveComponent />
      </main>
    </div>
  )
}
