import { PawPrint } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'

function TweedModule() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Tweed</h1>
      <p className="text-sm text-gray-400">Coming soon.</p>
    </div>
  )
}

export const tweedTab: TabConfig = {
  id: 'tweed',
  label: 'Tweed',
  icon: PawPrint,
  component: TweedModule,
}
