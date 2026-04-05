import { useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { InvestmentsModule } from './components/InvestmentsModule'
import { useInvestmentsStore } from './store'

function InvestmentsTab() {
  const load = useInvestmentsStore(s => s.load)
  useEffect(() => { load() }, [load])
  return <InvestmentsModule />
}

export const investmentsTab: TabConfig = {
  id: 'investments',
  label: 'Investments',
  icon: TrendingUp,
  component: InvestmentsTab,
}
