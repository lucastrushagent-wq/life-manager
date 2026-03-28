export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  amount: number
  description: string
  category: string
  type: TransactionType
  date: string
  createdAt: string
}
