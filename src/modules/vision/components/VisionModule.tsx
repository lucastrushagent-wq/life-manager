import { useState } from 'react'
import { VisionStatementTab } from './VisionStatementTab'
import { CoreValuesTab } from './CoreValuesTab'
import { GoalsTab } from './GoalsTab'
import { ManifestoTab } from './ManifestoTab'
import { useVisionStore } from '../store'

type InnerTab = 'statement' | 'values' | 'goals' | 'manifesto'

const TABS: { id: InnerTab; label: string }[] = [
  { id: 'statement', label: 'Vision Statement' },
  { id: 'values', label: 'Core Values' },
  { id: 'goals', label: 'Goals' },
  { id: 'manifesto', label: 'Manifesto' },
]

export function VisionModule() {
  const [activeTab, setActiveTab] = useState<InnerTab>('statement')
  const { loaded } = useVisionStore()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Vision</h1>

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
          {activeTab === 'statement' && <VisionStatementTab />}
          {activeTab === 'values' && <CoreValuesTab />}
          {activeTab === 'goals' && <GoalsTab />}
          {activeTab === 'manifesto' && <ManifestoTab />}
        </div>
      )}
    </div>
  )
}
