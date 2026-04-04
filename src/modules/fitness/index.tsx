import { useEffect } from 'react'
import { Dumbbell } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { FitnessModule } from './components/FitnessModule'
import { useFitnessStore } from './store'
import { useHealthStore } from '../health/store'

function FitnessTab() {
  const loadFitness = useFitnessStore(s => s.load)
  const loadHealth = useHealthStore(s => s.load)
  useEffect(() => { loadFitness(); loadHealth() }, [loadFitness, loadHealth])
  return <FitnessModule />
}

export const fitnessTab: TabConfig = {
  id: 'fitness',
  label: 'Fitness',
  icon: Dumbbell,
  component: FitnessTab,
}
