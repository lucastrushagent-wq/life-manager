import { useEffect } from 'react'
import { Dumbbell } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { FitnessModule } from './components/FitnessModule'
import { useFitnessStore } from './store'

function FitnessTab() {
  const load = useFitnessStore(s => s.load)
  useEffect(() => { load() }, [load])
  return <FitnessModule />
}

export const fitnessTab: TabConfig = {
  id: 'fitness',
  label: 'Fitness',
  icon: Dumbbell,
  component: FitnessTab,
}
