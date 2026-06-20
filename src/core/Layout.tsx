import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { tabs, TAB_GROUPS } from './tabs'
import type { TabConfig } from './tabs'
import { useNavigationStore } from './navigationStore'

const COLLAPSE_KEY = 'sidebar-collapsed-groups'

function loadCollapsed(): Set<string> {
  try {
    const stored = localStorage.getItem(COLLAPSE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function saveCollapsed(s: Set<string>) {
  localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...s]))
}

function SidebarItem({ tab, active, onClick }: { tab: TabConfig; active: boolean; onClick: () => void }) {
  const Icon = tab.icon
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
        active
          ? 'bg-white/15 text-white font-medium'
          : 'text-gray-400 hover:text-white hover:bg-white/8'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{tab.label}</span>
    </button>
  )
}

export function Layout() {
  const activeId = useNavigationStore(s => s.activeTabId)
  const setActiveId = useNavigationStore(s => s.setActiveTabId)
  const [collapsed, setCollapsed] = useState<Set<string>>(loadCollapsed)

  useEffect(() => { saveCollapsed(collapsed) }, [collapsed])

  function toggleGroup(group: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(group) ? next.delete(group) : next.add(group)
      return next
    })
  }

  const activeTab = tabs.find(t => t.id === activeId) ?? tabs[0]
  const ActiveComponent = activeTab.component

  const standalone = tabs.filter(t => !t.group)
  const grouped = Object.fromEntries(
    TAB_GROUPS.map(g => [g, tabs.filter(t => t.group === g)])
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-gray-900 flex flex-col h-screen overflow-y-auto">
        <div className="px-4 py-5 border-b border-white/10">
          <span className="text-white font-semibold text-sm tracking-wide">Life Manager</span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {/* Standalone tabs */}
          {standalone.map(tab => (
            <SidebarItem
              key={tab.id}
              tab={tab}
              active={activeId === tab.id}
              onClick={() => setActiveId(tab.id)}
            />
          ))}

          {/* Grouped tabs */}
          {TAB_GROUPS.map(group => {
            const groupTabs = grouped[group] ?? []
            if (groupTabs.length === 0) return null
            const isCollapsed = collapsed.has(group)

            return (
              <div key={group} className="pt-3">
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
                >
                  <span>{group}</span>
                  {isCollapsed
                    ? <ChevronRight className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />
                  }
                </button>
                {!isCollapsed && (
                  <div className="mt-0.5 space-y-0.5">
                    {groupTabs.map(tab => (
                      <SidebarItem
                        key={tab.id}
                        tab={tab}
                        active={activeId === tab.id}
                        onClick={() => setActiveId(tab.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <ActiveComponent />
      </main>
    </div>
  )
}
