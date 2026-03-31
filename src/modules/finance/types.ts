export type AccountCategory = '401k' | 'stocks' | 'property' | 'misc_asset' | 'credit_card' | 'personal_loan'
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
