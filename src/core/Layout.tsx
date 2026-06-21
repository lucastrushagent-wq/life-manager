import { useState } from 'react'
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react'
import { tabs, TAB_GROUPS } from './tabs'
import type { TabConfig } from './tabs'
import { useNavigationStore } from './navigationStore'

function SidebarItem({ tab, active, onClick }: { tab: TabConfig; active: boolean; onClick: () => void }) {
  const Icon = tab.icon
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
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

function SidebarContents({ activeId, setActiveId, collapsed, toggleGroup }: {
  activeId: string
  setActiveId: (id: string) => void
  collapsed: Set<string>
  toggleGroup: (g: string) => void
}) {
  const standalone = tabs.filter(t => !t.group)
  const grouped = Object.fromEntries(
    TAB_GROUPS.map(g => [g, tabs.filter(t => t.group === g)])
  )

  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
      {standalone.map(tab => (
        <SidebarItem key={tab.id} tab={tab} active={activeId === tab.id} onClick={() => setActiveId(tab.id)} />
      ))}
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
              {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {!isCollapsed && (
              <div className="mt-0.5 space-y-0.5">
                {groupTabs.map(tab => (
                  <SidebarItem key={tab.id} tab={tab} active={activeId === tab.id} onClick={() => setActiveId(tab.id)} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export function Layout() {
  const activeId = useNavigationStore(s => s.activeTabId)
  const setActiveId = useNavigationStore(s => s.setActiveTabId)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(TAB_GROUPS))
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleGroup(group: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(group) ? next.delete(group) : next.add(group)
      return next
    })
  }

  function navigate(id: string) {
    setActiveId(id)
    setMobileOpen(false)
  }

  const activeTab = tabs.find(t => t.id === activeId) ?? tabs[0]
  const ActiveComponent = activeTab.component

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden lg:flex w-52 shrink-0 bg-gray-900 flex-col h-screen">
        <div className="px-4 py-5 border-b border-white/10 shrink-0">
          <span className="text-white font-semibold text-sm tracking-wide">Life Manager</span>
        </div>
        <SidebarContents activeId={activeId} setActiveId={navigate} collapsed={collapsed} toggleGroup={toggleGroup} />
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          {/* Drawer */}
          <aside className="relative z-50 w-64 bg-gray-900 flex flex-col h-full">
            <div
              className="px-4 border-b border-white/10 flex items-center justify-between shrink-0"
              style={{ paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: '20px' }}
            >
              <span className="text-white font-semibold text-sm tracking-wide">Life Manager</span>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContents activeId={activeId} setActiveId={navigate} collapsed={collapsed} toggleGroup={toggleGroup} />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Mobile top bar — padded for iOS safe area */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 bg-gray-900 border-b border-white/10 shrink-0"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}
        >
          <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white p-1 -ml-1">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-sm">{activeTab.label}</span>
        </header>

        <main className="flex-1 overflow-auto">
          <ActiveComponent />
        </main>
      </div>

    </div>
  )
}
