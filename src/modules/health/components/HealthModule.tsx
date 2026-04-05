import { useState } from 'react'
import { PhilosophyBox } from '../../../core/PhilosophyBox'
import { MetricsTab } from './MetricsTab'
import { BloodWorkTab } from './BloodWorkTab'
import { MedicationsTab } from './MedicationsTab'
import { MedicalHistoryTab } from './MedicalHistoryTab'
import { GarminSyncButton } from './GarminSyncButton'
import { useHealthStore } from '../store'

type InnerTab = 'body' | 'bloodwork' | 'medications' | 'history'

const TABS: { id: InnerTab; label: string }[] = [
  { id: 'body', label: 'Body' },
  { id: 'bloodwork', label: 'Blood Work' },
  { id: 'medications', label: 'Medications' },
  { id: 'history', label: 'Medical History' },
]

export function HealthModule() {
  const [activeTab, setActiveTab] = useState<InnerTab>('body')
  const { loaded, load } = useHealthStore()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Health</h1>
        <GarminSyncButton onSyncComplete={load} />
      </div>

      <PhilosophyBox moduleId="health" />

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
          {activeTab === 'body' && <MetricsTab category="body" />}
          {activeTab === 'bloodwork' && <BloodWorkTab />}
          {activeTab === 'medications' && <MedicationsTab />}
          {activeTab === 'history' && <MedicalHistoryTab />}
        </div>
      )}
    </div>
  )
}
