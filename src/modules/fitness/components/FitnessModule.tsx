import { useState } from 'react'
import { SessionsTab } from './SessionsTab'
import { StrengthTab } from './StrengthTab'
import { RecordsTab } from './RecordsTab'
import { GarminSyncButton } from '../../health/components/GarminSyncButton'
import { MetricsTab } from '../../health/components/MetricsTab'
import { useFitnessStore } from '../store'

type InnerTab = 'sessions' | 'activity' | 'strength' | 'records'

const TABS: { id: InnerTab; label: string }[] = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'activity', label: 'Activity' },
  { id: 'strength', label: 'Strength' },
  { id: 'records', label: 'Personal Records' },
]

export function FitnessModule() {
  const [activeTab, setActiveTab] = useState<InnerTab>('sessions')
  const { loaded, load } = useFitnessStore()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Fitness</h1>
        <GarminSyncButton onSyncComplete={load} />
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!loaded ? (
        <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
      ) : (
        <div>
          {activeTab === 'sessions' && <SessionsTab />}
          {activeTab === 'activity' && <MetricsTab category="activity" />}
          {activeTab === 'strength' && <StrengthTab />}
          {activeTab === 'records' && <RecordsTab />}
        </div>
      )}
    </div>
  )
}
