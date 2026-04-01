export type AccountCategory =
  // Assets
  | '401k'
  | 'stocks'
  | 'property'
  | 'savings_account'
  | 'debit_account'
  | 'cash'
  | 'crypto'
  | 'vehicle'
  | 'bonds'
  | 'business'
  | 'misc_asset'
  // Liabilities
  | 'credit_card'
  | 'personal_loan'
  | 'mortgage'
  | 'hecs_debt'
  | 'student_loan'
  | 'other_debt'

export type AccountType = 'asset' | 'liability'

export interface FinanceAccount {
  id: string
  name: string
  category: AccountCategory
  type: AccountType
  value: number
  lastUpdated: string
  notes?: string
  createdAt: string
}

export interface NetWorthSnapshot {
  id: string
  date: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  createdAt: string
}
