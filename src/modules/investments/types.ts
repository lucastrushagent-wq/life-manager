export type AssetClass =
  | 'us_stocks'
  | 'intl_stocks'
  | 'etf'
  | 'bonds'
  | 'crypto'
  | 'real_estate'
  | 'cash'
  | 'other'

export interface Holding {
  id: string
  ticker: string
  name: string
  assetClass: AssetClass
  account: string
  shares: number
  avgCost: number       // per share/unit
  currentPrice: number  // per share/unit
  lastUpdated: string
  notes?: string
  createdAt: string
}
