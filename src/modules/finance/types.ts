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

export type ExpenseCategory =
  | 'food_dining'
  | 'groceries'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health_fitness'
  | 'utilities'
  | 'travel'
  | 'subscriptions'
  | 'other'

export interface Expense {
  id: string
  date: string
  description: string
  amount: number
  category: ExpenseCategory
  source: string
  notes?: string
  importedAt: string
}

export interface NetWorthSnapshot {
  id: string
  date: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  createdAt: string
}

export interface NetWorthTarget {
  id: string
  label: string
  targetAmount: number
  targetDate?: string
  notes?: string
  createdAt: string
}
