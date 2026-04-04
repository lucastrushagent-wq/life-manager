import { useEffect } from 'react'
import { Activity } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { HealthModule } from './components/HealthModule'
import { useHealthStore } from './store'

function HealthTab() {
  const load = useHealthStore(s => s.load)
  useEffect(() => { load() }, [load])
  return <HealthModule />
}

export const healthTab: TabConfig = {
  id: 'health',
  label: 'Health',
  icon: Activity,
  component: HealthTab,
}
